"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWalletHoldings } from "@/lib/api";

export function useWalletHoldings(walletAddress: string | null) {
  return useQuery({
    queryKey: ["walletHoldings", walletAddress],
    queryFn: () => fetchWalletHoldings(walletAddress!),
    enabled: !!walletAddress,
    refetchInterval: 60_000,
    staleTime: 55_000,
    refetchOnWindowFocus: false,
  });
}
