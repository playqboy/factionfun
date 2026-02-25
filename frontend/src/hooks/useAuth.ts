"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

function useAuthWithPrivy() {
  const {
    ready,
    authenticated,
    login,
    logout: privyLogout,
    getAccessToken,
  } = usePrivy();
  const { wallets } = useWallets();
  const queryClient = useQueryClient();
  const [authToken, setAuthToken] = useState<string | null>(null);

  const walletAddress = wallets[0]?.address ?? null;

  // Fully authenticated = Privy ready + authenticated + wallet connected
  const isFullyAuthenticated = ready && authenticated && !!walletAddress;

  // Auto-logout if Privy says authenticated but no wallet appears after 3s
  useEffect(() => {
    if (!ready || !authenticated || walletAddress) return;

    const timeout = setTimeout(() => {
      privyLogout().catch(() => {});
      setAuthToken(null);
      queryClient.clear();
    }, 3_000);

    return () => clearTimeout(timeout);
  }, [ready, authenticated, walletAddress, privyLogout, queryClient]);

  // Fetch access token only when fully authenticated
  useEffect(() => {
    if (!isFullyAuthenticated) {
      setAuthToken(null);
      return;
    }

    getAccessToken().then(setAuthToken).catch(() => setAuthToken(null));

    const interval = setInterval(() => {
      getAccessToken().then(setAuthToken).catch(() => setAuthToken(null));
    }, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isFullyAuthenticated, getAccessToken]);

  const authenticate = useCallback(() => {
    login();
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await privyLogout();
    } catch {
      // Privy logout can fail if already logged out — ignore
    }
    setAuthToken(null);
    queryClient.clear();
  }, [privyLogout, queryClient]);

  return {
    authToken,
    isAuthenticated: isFullyAuthenticated,
    isAuthenticating: !ready,
    authenticate,
    logout,
    // Only expose wallet address when fully authenticated
    walletAddress: isFullyAuthenticated ? walletAddress : null,
  };
}

const noop = () => {};

function useAuthStub() {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    console.warn('Privy auth is disabled: NEXT_PUBLIC_PRIVY_APP_ID is not set');
  }
  return {
    authToken: null,
    isAuthenticated: false,
    isAuthenticating: false,
    authenticate: noop,
    logout: noop,
    walletAddress: null,
  };
}

export const useAuth = hasPrivy ? useAuthWithPrivy : useAuthStub;
