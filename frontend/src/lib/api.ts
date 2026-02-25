const API_BASE = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) {
    const url = raw.replace(/\/+$/, "");
    return url.endsWith("/api") ? url : `${url}/api`;
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    throw new Error("NEXT_PUBLIC_API_URL must be set in production");
  }
  return "http://localhost:3001/api";
})();

const FETCH_TIMEOUT = 15_000;

function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

export interface HolderResponse {
  walletAddress: string;
  balance: string;
  percentage: number;
  rank: number;
}

export interface UserStatusResponse {
  isInTop10: boolean;
  rank?: number;
  balance?: string;
  percentage?: number;
}

export interface ChatMessageResponse {
  id: number;
  tokenMint: string;
  walletAddress: string;
  content: string;
  signature: string;
  createdAt: string;
}

export interface FeedMessageResponse {
  id: number;
  tokenMint: string;
  walletAddress: string;
  content: string;
  createdAt: string;
  tokenSymbol: string;
}

export interface TokenInfoResponse {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  holders: number;
}

export interface WalletHoldingResponse {
  mint: string;
  name: string;
  symbol: string;
  imageUri: string | null;
  balance: string;
  decimals: number;
  uiAmount: number;
  isTop10: boolean;
  rank: number | null;
  marketCap: number | null;
}

export interface WalletHoldingsResponse {
  wallet: string;
  holdings: WalletHoldingResponse[];
  totalCount: number;
}

export async function fetchWalletHoldings(
  wallet: string
): Promise<WalletHoldingsResponse> {
  const res = await fetchWithTimeout(`${API_BASE}/wallet/${wallet}/holdings`);
  if (!res.ok) throw new Error("Failed to fetch wallet holdings");
  return res.json();
}

export interface WalletRanksResponse {
  wallet: string;
  ranks: Record<string, { isTop10: boolean; rank: number | null }>;
}

export async function fetchWalletRanks(
  wallet: string,
  mints: string[]
): Promise<WalletRanksResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/wallet/${wallet}/holdings/ranks?mints=${mints.join(",")}`
  );
  if (!res.ok) throw new Error("Failed to fetch wallet ranks");
  return res.json();
}

export interface FavoriteResponse {
  id: number;
  walletAddress: string;
  tokenMint: string;
  name: string | null;
  symbol: string | null;
  imageUri: string | null;
  createdAt: string;
}

export async function fetchFavorites(
  authToken: string
): Promise<FavoriteResponse[]> {
  const res = await fetchWithTimeout(`${API_BASE}/favorites`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch favorites");
  return res.json();
}

export async function addFavorite(
  tokenMint: string,
  authToken: string,
  metadata?: { name?: string; symbol?: string; imageUri?: string }
): Promise<FavoriteResponse> {
  const res = await fetchWithTimeout(`${API_BASE}/favorites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      tokenMint,
      name: metadata?.name,
      symbol: metadata?.symbol,
      imageUri: metadata?.imageUri,
    }),
  });
  if (!res.ok) throw new Error("Failed to add favorite");
  return res.json();
}

export async function removeFavorite(
  tokenMint: string,
  authToken: string
): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}/favorites/${tokenMint}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) throw new Error("Failed to remove favorite");
}

export async function fetchTopHolders(
  mint: string
): Promise<HolderResponse[]> {
  const res = await fetchWithTimeout(`${API_BASE}/token/${mint}/top-holders`);
  if (!res.ok) throw new Error("Failed to fetch holders");
  return res.json();
}

export async function fetchUserStatus(
  mint: string,
  wallet: string
): Promise<UserStatusResponse> {
  const res = await fetchWithTimeout(`${API_BASE}/token/${mint}/user/${wallet}`);
  if (!res.ok) throw new Error("Failed to fetch user status");
  return res.json();
}

export async function fetchTokenInfo(
  mint: string
): Promise<TokenInfoResponse> {
  const res = await fetchWithTimeout(`${API_BASE}/token/${mint}/info`);
  if (!res.ok) throw new Error("Failed to fetch token info");
  return res.json();
}

export async function fetchRecentMessages(): Promise<FeedMessageResponse[]> {
  const res = await fetchWithTimeout(`${API_BASE}/chat/recent`);
  if (!res.ok) throw new Error("Failed to fetch recent messages");
  return res.json();
}

export async function fetchMessages(
  mint: string,
  limit = 50,
  offset = 0
): Promise<ChatMessageResponse[]> {
  const res = await fetchWithTimeout(
    `${API_BASE}/chat/${mint}/messages?limit=${limit}&offset=${offset}`
  );
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export async function sendMessage(
  tokenMint: string,
  content: string,
  authToken: string
): Promise<{ messageId: number; status: string }> {
  const res = await fetchWithTimeout(`${API_BASE}/chat/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ tokenMint, content }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}
