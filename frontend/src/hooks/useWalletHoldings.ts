"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWalletHoldings, fetchWalletRanks } from "@/lib/api";

export function useWalletHoldings(walletAddress: string | null) {
  const holdingsQuery = useQuery({
    queryKey: ["walletHoldings", walletAddress],
    queryFn: () => fetchWalletHoldings(walletAddress!),
    enabled: !!walletAddress,
    refetchInterval: 60_000,
    staleTime: 55_000,
    refetchOnWindowFocus: false,
  });

  const mints = useMemo(
    () => holdingsQuery.data?.holdings.map((h) => h.mint) ?? [],
    [holdingsQuery.data],
  );

  const ranksQuery = useQuery({
    queryKey: ["walletRanks", walletAddress, mints],
    queryFn: () => fetchWalletRanks(walletAddress!, mints),
    enabled: !!walletAddress && mints.length > 0,
    refetchInterval: 60_000,
    staleTime: 55_000,
    refetchOnWindowFocus: false,
  });

  // Merge ranks into holdings once available
  const data = useMemo(() => {
    if (!holdingsQuery.data) return undefined;

    const ranks = ranksQuery.data?.ranks;
    if (!ranks) return holdingsQuery.data;

    return {
      ...holdingsQuery.data,
      holdings: holdingsQuery.data.holdings.map((h) => {
        const rankData = ranks[h.mint];
        if (!rankData) return h;
        return { ...h, isTop10: rankData.isTop10, rank: rankData.rank };
      }),
    };
  }, [holdingsQuery.data, ranksQuery.data]);

  return {
    data,
    isLoading: holdingsQuery.isLoading,
    isError: holdingsQuery.isError,
    error: holdingsQuery.error,
  };
}
