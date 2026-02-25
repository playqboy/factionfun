"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFavorites,
  addFavorite as apiAddFavorite,
  removeFavorite as apiRemoveFavorite,
  type FavoriteResponse,
} from "@/lib/api";

export function useFavorites(authToken: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["favorites"];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchFavorites(authToken!),
    enabled: !!authToken,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const addMutation = useMutation({
    mutationFn: (vars: {
      tokenMint: string;
      metadata?: { name?: string; symbol?: string; imageUri?: string };
    }) => apiAddFavorite(vars.tokenMint, authToken!, vars.metadata),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FavoriteResponse[]>(queryKey);
      queryClient.setQueryData<FavoriteResponse[]>(queryKey, (old = []) => [
        ...old,
        {
          id: -1,
          walletAddress: "",
          tokenMint: vars.tokenMint,
          name: vars.metadata?.name ?? null,
          symbol: vars.metadata?.symbol ?? null,
          imageUri: vars.metadata?.imageUri ?? null,
          createdAt: new Date().toISOString(),
        },
      ]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const removeMutation = useMutation({
    mutationFn: (tokenMint: string) => apiRemoveFavorite(tokenMint, authToken!),
    onMutate: async (tokenMint) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FavoriteResponse[]>(queryKey);
      queryClient.setQueryData<FavoriteResponse[]>(queryKey, (old = []) =>
        old.filter((f) => f.tokenMint !== tokenMint),
      );
      return { previous };
    },
    onError: (_err, _tokenMint, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const favorites = data ?? [];

  const isFavorited = (tokenMint: string): boolean =>
    favorites.some((f) => f.tokenMint === tokenMint);

  const toggleFavorite = (
    tokenMint: string,
    metadata?: { name?: string; symbol?: string; imageUri?: string },
  ) => {
    if (isFavorited(tokenMint)) {
      removeMutation.mutate(tokenMint);
    } else {
      addMutation.mutate({ tokenMint, metadata });
    }
  };

  return { favorites, isLoading, isFavorited, toggleFavorite };
}
