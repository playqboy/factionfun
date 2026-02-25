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
const CONCURRENCY_LIMIT = 5;

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

interface DASItem {
  id: string;
  content?: {
    metadata?: { name?: string; symbol?: string };
    links?: { image?: string };
  };
  token_info?: {
    balance?: number;
    decimals?: number;
  };
}

interface DASResponse {
  result?: {
    items?: DASItem[];
    total?: number;
  };
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

  // Fetch all fungible tokens owned by the wallet via Helius DAS
  const response = await fetch(HELIUS_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'search-assets',
      method: 'searchAssets',
      params: {
        ownerAddress: walletAddress,
        tokenType: 'fungible',
        displayOptions: { showZeroBalance: false },
      },
    }),
    signal: AbortSignal.timeout(15000),
  });

  const data = (await response.json()) as DASResponse;
  const items = data.result?.items ?? [];
  const totalCount = data.result?.total ?? items.length;

  // Parse and filter to non-zero balances
  const parsed: {
    mint: string;
    name: string;
    symbol: string;
    imageUri: string | null;
    balance: string;
    decimals: number;
    uiAmount: number;
  }[] = [];

  for (const item of items) {
    const rawBalance = item.token_info?.balance ?? 0;
    if (rawBalance === 0) continue;

    const decimals = item.token_info?.decimals ?? 0;
    const uiAmount = rawBalance / Math.pow(10, decimals);
    const mint = item.id;

    parsed.push({
      mint,
      name: item.content?.metadata?.name || mint.slice(0, 6) + '...',
      symbol: item.content?.metadata?.symbol || '???',
      imageUri: item.content?.links?.image || null,
      balance: String(rawBalance),
      decimals,
      uiAmount,
    });
  }

  // Sort by uiAmount descending, cap at MAX_TOKENS
  parsed.sort((a, b) => b.uiAmount - a.uiAmount);
  const capped = parsed.slice(0, MAX_TOKENS);

  // Enrich with rank data (concurrency-limited) and market caps (batched)
  const holdings: WalletHolding[] = capped.map((t) => ({
    ...t,
    isTop10: false,
    rank: null,
    marketCap: null,
  }));

  // Fetch ranks and market caps in parallel
  const [, mcaps] = await Promise.all([
    withConcurrencyLimit(holdings, CONCURRENCY_LIMIT, async (holding) => {
      try {
        const allHolders = await fetchAllRankedHolders(holding.mint);
        const match = allHolders.find(
          (h) => h.walletAddress === walletAddress,
        );
        if (match) {
          holding.isTop10 = match.rank <= 10;
          holding.rank = match.rank;
        }
      } catch {
        // Rank check failed for this token — leave defaults
      }
    }),
    fetchMarketCaps(holdings.map((h) => h.mint)),
  ]);

  for (const holding of holdings) {
    holding.marketCap = mcaps.get(holding.mint) ?? null;
  }

  const result = { wallet: walletAddress, holdings, totalCount };

  cache.set(cacheKey, JSON.stringify(result), HOLDINGS_CACHE_TTL);
  return result;
}
