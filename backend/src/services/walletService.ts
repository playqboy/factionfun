import { config } from '../utils/config.js';
import { cache } from '../utils/cache.js';
import { fetchAllRankedHolders } from './holderService.js';
import type { WalletHolding } from '../types/index.js';

const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;
const DEXSCREENER_API = 'https://api.dexscreener.com/tokens/v1/solana';
const HOLDINGS_CACHE_TTL = 60; // seconds
const MCAP_CACHE_TTL = 120; // seconds
const MAX_TOKENS = 50;
const DEXSCREENER_BATCH = 30; // max addresses per request
const RANK_CONCURRENCY = 5;

interface DexScreenerPair {
  baseToken?: { address?: string };
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number };
}

/** Fetch market caps from DexScreener for a batch of mints. Uses per-mint cache. */
async function fetchMarketCaps(mints: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const uncached: string[] = [];

  // Check cache first
  for (const mint of mints) {
    const cached = cache.get(`mcap:${mint}`);
    if (cached) {
      result.set(mint, Number(cached));
    } else {
      uncached.push(mint);
    }
  }

  if (uncached.length === 0) return result;

  // Batch into groups of DEXSCREENER_BATCH
  for (let i = 0; i < uncached.length; i += DEXSCREENER_BATCH) {
    const batch = uncached.slice(i, i + DEXSCREENER_BATCH);
    try {
      const res = await fetch(
        `${DEXSCREENER_API}/${batch.join(',')}`,
        { signal: AbortSignal.timeout(10000) },
      );
      if (!res.ok) continue;

      const pairs = (await res.json()) as DexScreenerPair[];
      // Group by base token, pick pair with highest liquidity
      const bestByMint = new Map<string, number>();
      for (const pair of pairs) {
        const addr = pair.baseToken?.address;
        if (!addr) continue;
        const mcap = pair.marketCap ?? pair.fdv ?? 0;
        const liq = pair.liquidity?.usd ?? 0;
        const existing = bestByMint.get(addr);
        if (existing === undefined || liq > (existing ?? 0)) {
          bestByMint.set(addr, mcap);
        }
      }

      for (const [mint, mcap] of bestByMint) {
        result.set(mint, mcap);
        cache.set(`mcap:${mint}`, String(mcap), MCAP_CACHE_TTL);
      }
    } catch {
      // DexScreener fetch failed for this batch — skip
    }
  }

  return result;
}

const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

interface TokenAccountValue {
  account: {
    data: {
      parsed: {
        info: {
          mint: string;
          tokenAmount: {
            amount: string;
            decimals: number;
            uiAmount: number | null;
          };
        };
      };
    };
  };
}

interface GetTokenAccountsResponse {
  result?: {
    value?: TokenAccountValue[];
  };
}

interface AssetInfo {
  id: string;
  content?: {
    metadata?: { name?: string; symbol?: string };
    links?: { image?: string };
  };
}

interface GetAssetBatchResponse {
  result?: AssetInfo[];
}

async function withConcurrencyLimit<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  const workers = Array.from(
    { length: Math.min(limit, queue.length) },
    async () => {
      while (queue.length > 0) {
        const item = queue.shift()!;
        await fn(item);
      }
    },
  );
  await Promise.allSettled(workers);
}

export async function fetchWalletHoldings(
  walletAddress: string,
): Promise<{ wallet: string; holdings: WalletHolding[]; totalCount: number }> {
  const cacheKey = `wallet-holdings:${walletAddress}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      cache.del(cacheKey);
    }
  }

  // Step 1: Fetch all SPL token accounts via standard RPC (reads on-chain, no indexing needed)
  const response = await fetch(HELIUS_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'get-token-accounts',
      method: 'getTokenAccountsByOwner',
      params: [
        walletAddress,
        { programId: TOKEN_PROGRAM_ID },
        { encoding: 'jsonParsed' },
      ],
    }),
    signal: AbortSignal.timeout(15000),
  });

  const data = (await response.json()) as GetTokenAccountsResponse;
  const accounts = data.result?.value ?? [];

  // Parse and filter to non-zero balances
  const parsed: {
    mint: string;
    balance: string;
    decimals: number;
    uiAmount: number;
  }[] = [];

  for (const acct of accounts) {
    const info = acct.account.data.parsed.info;
    const rawBalance = info.tokenAmount.amount;
    if (rawBalance === '0') continue;

    const decimals = info.tokenAmount.decimals;
    const uiAmount = info.tokenAmount.uiAmount ?? Number(rawBalance) / Math.pow(10, decimals);

    parsed.push({
      mint: info.mint,
      balance: rawBalance,
      decimals,
      uiAmount,
    });
  }

  // Sort by uiAmount descending, cap at MAX_TOKENS
  parsed.sort((a, b) => b.uiAmount - a.uiAmount);
  const capped = parsed.slice(0, MAX_TOKENS);

  // Step 2: Fetch metadata (name, symbol, image) via Helius getAssetBatch
  const metadataMap = new Map<string, { name: string; symbol: string; imageUri: string | null }>();
  if (capped.length > 0) {
    try {
      const assetRes = await fetch(HELIUS_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'get-assets',
          method: 'getAssetBatch',
          params: { ids: capped.map((t) => t.mint) },
        }),
        signal: AbortSignal.timeout(15000),
      });

      const assetData = (await assetRes.json()) as GetAssetBatchResponse;
      for (const asset of assetData.result ?? []) {
        metadataMap.set(asset.id, {
          name: asset.content?.metadata?.name || asset.id.slice(0, 6) + '...',
          symbol: asset.content?.metadata?.symbol || '???',
          imageUri: asset.content?.links?.image || null,
        });
      }
    } catch {
      // Metadata fetch failed — we'll fall back to truncated mints
    }
  }

  const totalCount = accounts.length;

  // Enrich with metadata + rank data (concurrency-limited) and market caps (batched)
  const holdings: WalletHolding[] = capped.map((t) => {
    const meta = metadataMap.get(t.mint);
    return {
      ...t,
      name: meta?.name || t.mint.slice(0, 6) + '...',
      symbol: meta?.symbol || '???',
      imageUri: meta?.imageUri || null,
      isTop10: false,
      rank: null,
      marketCap: null,
    };
  });

  // Fetch market caps (batched, fast)
  const mcaps = await fetchMarketCaps(holdings.map((h) => h.mint));

  for (const holding of holdings) {
    holding.marketCap = mcaps.get(holding.mint) ?? null;
  }

  const result = { wallet: walletAddress, holdings, totalCount };

  cache.set(cacheKey, JSON.stringify(result), HOLDINGS_CACHE_TTL);
  return result;
}

/** Fetch rank data for a wallet across specific mints (slow — meant to be called lazily). */
export async function fetchWalletRanks(
  walletAddress: string,
  mints: string[],
): Promise<Record<string, { isTop10: boolean; rank: number | null }>> {
  const result: Record<string, { isTop10: boolean; rank: number | null }> = {};

  await withConcurrencyLimit(mints, RANK_CONCURRENCY, async (mint) => {
    try {
      const allHolders = await fetchAllRankedHolders(mint);
      const match = allHolders.find((h) => h.walletAddress === walletAddress);
      if (match) {
        result[mint] = { isTop10: match.rank <= 10, rank: match.rank };
      } else {
        result[mint] = { isTop10: false, rank: null };
      }
    } catch {
      result[mint] = { isTop10: false, rank: null };
    }
  });

  return result;
}
