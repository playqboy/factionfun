import { Connection, PublicKey } from '@solana/web3.js';
import { config } from '../utils/config.js';
import { cache } from '../utils/cache.js';
import { serializeHolders, deserializeHolders } from '../utils/serialization.js';
import type { Holder, TokenInfo, UserStatus } from '../types/index.js';

const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;
const connection = new Connection(HELIUS_RPC);

const HOLDER_CACHE_TTL = 30; // seconds
const TOKEN_INFO_CACHE_TTL = 300; // 5 minutes

export async function fetchTopHolders(tokenMint: string): Promise<Holder[]> {
  // Check cache
  const cacheKey = `holders:${tokenMint}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return deserializeHolders(cached);
  }

  const mintPubkey = new PublicKey(tokenMint);

  // 1. Get the 20 largest token accounts for this mint
  const largestAccounts = await connection.getTokenLargestAccounts(mintPubkey);

  if (!largestAccounts.value || largestAccounts.value.length === 0) {
    return [];
  }

  // 2. Resolve each token account to its owner wallet
  const tokenAccountAddresses = largestAccounts.value.map(
    (account) => new PublicKey(account.address)
  );

  // Fetch account infos and total supply in parallel
  const [accountInfos, supplyInfo] = await Promise.all([
    connection.getMultipleParsedAccounts(tokenAccountAddresses),
    connection.getTokenSupply(mintPubkey),
  ]);

  // 3. Aggregate balances by owner wallet (a wallet may have multiple token accounts)
  const ownerBalances = new Map<string, bigint>();

  for (let i = 0; i < largestAccounts.value.length; i++) {
    const accountInfo = accountInfos.value[i];
    if (!accountInfo || !('parsed' in accountInfo.data)) continue;

    const parsed = accountInfo.data.parsed;
    const owner: string = parsed.info.owner;
    const amount = BigInt(parsed.info.tokenAmount.amount);

    const existing = ownerBalances.get(owner) || 0n;
    ownerBalances.set(owner, existing + amount);
  }

  // 4. Get total supply for percentage calculation
  const totalSupply = BigInt(supplyInfo.value.amount);

  // 5. Sort by balance descending, take top 10
  const sorted = Array.from(ownerBalances.entries())
    .sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : 0))
    .slice(0, 10);

  const holders: Holder[] = sorted.map(([walletAddress, balance], index) => ({
    walletAddress,
    balance,
    percentage: totalSupply > 0n
      ? Number((balance * 1_000_000n) / totalSupply) / 10_000
      : 0,
    rank: index + 1,
  }));

  // 6. Cache result
  cache.set(cacheKey, serializeHolders(holders), HOLDER_CACHE_TTL);

  return holders;
}

export async function getUserStatus(
  tokenMint: string,
  walletAddress: string
): Promise<UserStatus> {
  const holders = await fetchTopHolders(tokenMint);
  const match = holders.find((h) => h.walletAddress === walletAddress);

  if (match) {
    return {
      isInTop10: true,
      rank: match.rank,
      balance: match.balance,
      percentage: match.percentage,
    };
  }

  return { isInTop10: false };
}

export async function fetchTokenInfo(tokenMint: string): Promise<TokenInfo> {
  const cacheKey = `tokeninfo:${tokenMint}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    const parsed = JSON.parse(cached);
    parsed.totalSupply = BigInt(parsed.totalSupply);
    return parsed;
  }

  const mintPubkey = new PublicKey(tokenMint);

  const [supplyInfo, accountInfo] = await Promise.all([
    connection.getTokenSupply(mintPubkey),
    connection.getParsedAccountInfo(mintPubkey),
  ]);

  let name = tokenMint.slice(0, 8) + '...';
  let symbol = 'UNKNOWN';
  let decimals = supplyInfo.value.decimals;

  if (accountInfo.value && 'parsed' in accountInfo.value.data) {
    const parsed = accountInfo.value.data.parsed;
    decimals = parsed.info.decimals;
  }

  // Try to fetch metadata from Helius DAS API
  try {
    const response = await fetch(HELIUS_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'get-asset',
        method: 'getAsset',
        params: { id: tokenMint },
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json() as {
      result?: { content?: { metadata?: { name?: string; symbol?: string } } };
    };
    if (data.result?.content?.metadata) {
      name = data.result.content.metadata.name || name;
      symbol = data.result.content.metadata.symbol || symbol;
    }
  } catch {
    // Metadata fetch failed, use defaults
  }

  const info: TokenInfo = {
    mint: tokenMint,
    name,
    symbol,
    decimals,
    totalSupply: BigInt(supplyInfo.value.amount),
    holders: 0, // Would need a separate API call to count all holders
  };

  // Cache (serialize bigint as string)
  cache.set(
    cacheKey,
    JSON.stringify(info, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)),
    TOKEN_INFO_CACHE_TTL
  );

  return info;
}
