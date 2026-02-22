"use client";

import { useState, useMemo } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 2,
          },
        },
      })
  );

  const solanaConnectors = useMemo(() => toSolanaWalletConnectors(), []);

  if (!privyAppId) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={privyAppId}
        config={{
          loginMethods: ["wallet"],
          appearance: {
            theme: "dark",
            accentColor: "#00BFFF",
            showWalletLoginFirst: true,
            walletChainType: "solana-only",
          },
          externalWallets: {
            solana: {
              connectors: solanaConnectors,
            },
          },
          embeddedWallets: {
            solana: {
              createOnLogin: "off",
            },
          },
        }}
      >
        {children}
      </PrivyProvider>
    </QueryClientProvider>
  );
}
