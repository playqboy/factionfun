export interface Holder {
  walletAddress: string;
  balance: bigint;
  percentage: number;
  rank: number;
}

export interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  holders: number;
}

export interface RankingSnapshot {
  id: number;
  tokenMint: string;
  rank: number;
  walletAddress: string;
  balance: bigint;
  percentage: number;
  updatedAt: Date;
}

export interface ChatMessage {
  id: number;
  tokenMint: string;
  walletAddress: string;
  content: string;
  signature: string;
  createdAt: Date;
}

export interface MembershipEvent {
  id: number;
  tokenMint: string;
  walletAddress: string;
  eventType: "enter_top10" | "leave_top10";
  rankBefore?: number;
  rankAfter?: number;
  createdAt: Date;
}

export interface User {
  id: number;
  walletAddress: string;
  createdAt: Date;
  lastActive: Date;
}

export interface UserStatus {
  isInTop10: boolean;
  rank?: number;
  balance?: bigint;
  percentage?: number;
}

export interface Favorite {
  id: number;
  walletAddress: string;
  tokenMint: string;
  name: string | null;
  symbol: string | null;
  imageUri: string | null;
  createdAt: Date;
}

export interface WalletHolding {
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