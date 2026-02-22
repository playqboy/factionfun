const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

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

export async function fetchTopHolders(
  mint: string
): Promise<HolderResponse[]> {
  const res = await fetch(`${API_BASE}/token/${mint}/top-holders`);
  if (!res.ok) throw new Error("Failed to fetch holders");
  return res.json();
}

export async function fetchUserStatus(
  mint: string,
  wallet: string
): Promise<UserStatusResponse> {
  const res = await fetch(`${API_BASE}/token/${mint}/user/${wallet}`);
  if (!res.ok) throw new Error("Failed to fetch user status");
  return res.json();
}

export async function fetchTokenInfo(
  mint: string
): Promise<TokenInfoResponse> {
  const res = await fetch(`${API_BASE}/token/${mint}/info`);
  if (!res.ok) throw new Error("Failed to fetch token info");
  return res.json();
}

export async function fetchRecentMessages(): Promise<FeedMessageResponse[]> {
  const res = await fetch(`${API_BASE}/chat/recent`);
  if (!res.ok) throw new Error("Failed to fetch recent messages");
  return res.json();
}

export async function fetchMessages(
  mint: string,
  limit = 50,
  offset = 0
): Promise<ChatMessageResponse[]> {
  const res = await fetch(
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
  const res = await fetch(`${API_BASE}/chat/message`, {
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
