"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useState, useCallback, useEffect } from "react";

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
  const [authToken, setAuthToken] = useState<string | null>(null);

  const walletAddress = wallets[0]?.address ?? null;

  // Fetch access token when authenticated, refresh periodically
  useEffect(() => {
    if (!authenticated) {
      setAuthToken(null);
      return;
    }

    getAccessToken().then(setAuthToken).catch(() => setAuthToken(null));

    // Refresh every 50 minutes (tokens expire ~60 min)
    const interval = setInterval(() => {
      getAccessToken().then(setAuthToken).catch(() => setAuthToken(null));
    }, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authenticated, getAccessToken]);

  const authenticate = useCallback(() => {
    login();
  }, [login]);

  const logout = useCallback(() => {
    privyLogout();
    setAuthToken(null);
  }, [privyLogout]);

  return {
    authToken,
    isAuthenticated: ready && authenticated,
    isAuthenticating: !ready,
    authenticate,
    logout,
    walletAddress,
  };
}

const noop = () => {};

function useAuthStub() {
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
