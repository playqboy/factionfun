"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTopHolders, fetchUserStatus, fetchTokenInfo } from "@/lib/api";

export function useTopHolders(tokenMint: string | null) {
  return useQuery({
    queryKey: ["topHolders", tokenMint],
    queryFn: () => fetchTopHolders(tokenMint!),
    enabled: !!tokenMint,
    refetchInterval: 30_000,
    staleTime: 30_000,
  });
}

export function useUserStatus(
  tokenMint: string | null,
  walletAddress: string | null
) {
  return useQuery({
    queryKey: ["userStatus", tokenMint, walletAddress],
    queryFn: () => fetchUserStatus(tokenMint!, walletAddress!),
    enabled: !!tokenMint && !!walletAddress,
    refetchInterval: 30_000,
    staleTime: 30_000,
  });
}

export function useTokenInfo(tokenMint: string | null) {
  return useQuery({
    queryKey: ["tokenInfo", tokenMint],
    queryFn: () => fetchTokenInfo(tokenMint!),
    enabled: !!tokenMint,
    refetchInterval: 5 * 60_000,
    staleTime: 4 * 60_000,
    refetchOnWindowFocus: false,
  });
}
