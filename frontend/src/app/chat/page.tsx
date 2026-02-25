"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  FaCrown,
  FaMessage,
  FaAnglesLeft,
  FaBarsStaggered,
  FaRightFromBracket,
  FaCopy,
  FaCheck,
} from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  useTopHolders,
  useUserStatus,
  useTokenInfo,
} from "@/hooks/useTopHolders";
import { useChat } from "@/hooks/useChat";
import TokenSelector from "@/components/TokenSelector";
import Leaderboard from "@/components/Leaderboard";
import ChatWindow from "@/components/ChatWindow";
import ErrorBoundary from "@/components/ErrorBoundary";
import TokenSubBar from "@/components/TokenSubBar";
import SidebarLiveFeed from "@/components/SidebarLiveFeed";
import { useWalletHoldings } from "@/hooks/useWalletHoldings";
import { useFavorites } from "@/hooks/useFavorites";

export default function ChatPage() {
  const {
    authToken,
    isAuthenticated,
    isAuthenticating,
    authenticate,
    logout,
    walletAddress,
  } = useAuth();
  const [tokenMint, setTokenMint] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: holdingsData, isLoading: holdingsLoading } = useWalletHoldings(walletAddress);
  const { favorites, isLoading: favoritesLoading, isFavorited, toggleFavorite } = useFavorites(authToken);
  const { data: holders, isLoading: holdersLoading } = useTopHolders(tokenMint);
  const { data: userStatus } = useUserStatus(tokenMint, walletAddress);
  const { data: tokenInfo } = useTokenInfo(tokenMint);
  const {
    messages,
    loading: chatLoading,
    loadError: chatLoadError,
    sendMessage,
  } = useChat(tokenMint, authToken);

  // Typing effect for nav header
  const idleText = "Select token to read chat";
  const livePrefix = tokenMint
    ? tokenInfo
      ? `Live chat for ${tokenInfo.name} ${tokenInfo.symbol} `
      : "Live chat for "
    : "";
  const liveText = tokenMint ? livePrefix + tokenMint : "";
  const targetText = liveText || idleText;
  const [copied, setCopied] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const prevTargetRef = useRef("");
  const phaseRef = useRef<"idle" | "deleting" | "typing">("idle");
  const activeTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (targetText === prevTargetRef.current && phaseRef.current === "idle") return;
    // Clear any running timer from a previous run
    clearInterval(activeTimerRef.current);

    const oldText = prevTargetRef.current;
    prevTargetRef.current = targetText;

    // If nothing displayed yet (initial load), just type forward
    if (!oldText) {
      phaseRef.current = "typing";
      let i = 0;
      activeTimerRef.current = setInterval(() => {
        i++;
        setDisplayedText(targetText.slice(0, i));
        if (i >= targetText.length) {
          clearInterval(activeTimerRef.current);
          phaseRef.current = "idle";
        }
      }, 18);
      return () => clearInterval(activeTimerRef.current);
    }

    // Delete old text, then type new text
    phaseRef.current = "deleting";
    let len = oldText.length;
    activeTimerRef.current = setInterval(() => {
      len--;
      setDisplayedText(oldText.slice(0, len));
      if (len <= 0) {
        clearInterval(activeTimerRef.current);
        // Now type new text
        phaseRef.current = "typing";
        let i = 0;
        activeTimerRef.current = setInterval(() => {
          i++;
          setDisplayedText(targetText.slice(0, i));
          if (i >= targetText.length) {
            clearInterval(activeTimerRef.current);
            phaseRef.current = "idle";
          }
        }, 18);
      }
    }, 12);
    return () => clearInterval(activeTimerRef.current);
  }, [targetText]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [sidebarOpen]);

  return (
    <div className="h-dvh flex bg-background">
      {/* ── Desktop sidebar ── */}
      <aside className="w-[260px] flex-shrink-0 hidden md:flex flex-col border-r border-border-subtle bg-background">
        {/* Sidebar header */}
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-border-subtle flex-shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Factions"
              width={24}
              height={24}
              className="rounded-sm"
            />
            <span className="text-sm font-bold text-gradient">
              Factions.fun
            </span>
          </Link>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <TokenSelector
                onSelect={setTokenMint}
                currentMint={tokenMint}
              />
            </motion.div>
          </div>

          {tokenMint && (
            <>
              <div className="mx-4 border-t border-border-subtle" />
              <div className="p-4 flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.05 }}
                >
                  <Leaderboard
                    holders={holders || []}
                    currentWallet={walletAddress ?? undefined}
                    isLoading={holdersLoading}
                  />
                </motion.div>
              </div>
            </>
          )}
        </div>

        {/* Global live feed */}
        <div className="min-h-0 h-[40%] flex-shrink-0">
          <SidebarLiveFeed />
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <nav className="h-14 border-b border-border-subtle flex-shrink-0 flex items-center justify-between px-4 sm:px-5 bg-background/80 backdrop-blur-xl">
          {/* Left */}
          <div className="flex items-center gap-2.5">
            {/* Mobile: logo + sidebar toggle */}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <FaAnglesLeft className="w-4 h-4" />
              ) : (
                <FaBarsStaggered className="w-4 h-4" />
              )}
            </Button>

            <Link
              href="/"
              className="flex items-center gap-2 md:hidden"
            >
              <Image
                src="/logo.png"
                alt="Factions"
                width={22}
                height={22}
                className="rounded-sm"
              />
              <span className="text-sm font-bold text-gradient">
                Factions.fun
              </span>
            </Link>

            {/* Desktop: typing header */}
            <span className="hidden md:flex items-center text-sm text-muted-foreground font-mono truncate max-w-[500px]">
              {tokenMint && displayedText.length > livePrefix.length ? (
                <>
                  {displayedText.slice(0, livePrefix.length)}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(tokenMint);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer ml-1"
                  >
                    {displayedText.slice(livePrefix.length)}
                    {phaseRef.current === "idle" && (
                      copied ? (
                        <FaCheck className="w-2.5 h-2.5 text-success flex-shrink-0" />
                      ) : (
                        <FaCopy className="w-2.5 h-2.5 opacity-40 flex-shrink-0" />
                      )
                    )}
                  </button>
                </>
              ) : (
                displayedText
              )}
              <span className="animate-pulse">|</span>
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {userStatus?.isInTop10 && (
              <Badge
                variant="outline"
                className="border-primary/25 bg-primary/8 text-primary gap-1 text-xs"
              >
                <FaCrown className="w-3 h-3" />
                #{userStatus.rank}
              </Badge>
            )}

            {/* Privy wallet button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                {walletAddress && (
                  <span className="text-xs font-mono text-muted-foreground hidden sm:block">
                    {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                  </span>
                )}
                <Button
                  onClick={logout}
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Logout"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <FaRightFromBracket className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={authenticate}
                size="sm"
                className="btn-gradient text-xs font-semibold"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </nav>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {sidebarOpen && (
            <motion.aside
              key="sidebar"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[calc(100vw-56px)] max-w-[288px] bg-background border-r border-border-subtle z-40 md:hidden flex flex-col"
            >
              {/* Mobile sidebar header */}
              <div className="h-14 flex items-center justify-between px-5 border-b border-border-subtle flex-shrink-0">
                <Link href="/" className="flex items-center gap-2.5">
                  <Image
                    src="/logo.png"
                    alt="Factions"
                    width={24}
                    height={24}
                    className="rounded-sm"
                  />
                  <span className="text-sm font-bold text-gradient">
                    Factions.fun
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setSidebarOpen(false)}
                >
                  <FaAnglesLeft className="w-4 h-4" />
                </Button>
              </div>

              {/* Mobile sidebar content */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4">
                  <TokenSelector
                    onSelect={(mint) => {
                      setTokenMint(mint);
                      setSidebarOpen(false);
                    }}
                    currentMint={tokenMint}
                  />
                </div>
                {tokenMint && (
                  <>
                    <div className="mx-4 border-t border-border-subtle" />
                    <div className="p-4">
                      <Leaderboard
                        holders={holders || []}
                        currentWallet={walletAddress ?? undefined}
                        isLoading={holdersLoading}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Global live feed */}
              <div className="min-h-0 h-[40%] flex-shrink-0">
                <SidebarLiveFeed />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Sub-bar: favorites + holdings tabs */}
        {walletAddress && (
          <TokenSubBar
            favorites={favorites}
            holdings={holdingsData?.holdings ?? []}
            isLoadingFavorites={favoritesLoading}
            isLoadingHoldings={holdingsLoading}
            currentMint={tokenMint}
            onSelect={setTokenMint}
          />
        )}

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-0">
          {!tokenMint ? (
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-sm icon-box mb-4 sm:mb-6">
                  <FaMessage className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                  Enter a Faction
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] sm:max-w-xs mx-auto mb-8">
                  Paste a Pump.fun token mint address to view its leaderboard
                  and join the top-holder chat.
                </p>

                <div className="md:hidden max-w-xs mx-auto">
                  <TokenSelector
                    onSelect={setTokenMint}
                    currentMint={tokenMint}
                  />
                </div>

                <p className="hidden md:block text-xs text-muted-foreground/60">
                  Use the sidebar to enter a token address
                </p>
              </motion.div>
            </div>
          ) : (
            <motion.div
              className="flex-1 flex flex-col min-h-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <ErrorBoundary>
                <ChatWindow
                  messages={messages}
                  onSend={sendMessage}
                  currentWallet={walletAddress || ""}
                  holders={holders || []}
                  isLoading={chatLoading}
                  loadError={chatLoadError}
                  canSend={
                    !!walletAddress &&
                    isAuthenticated &&
                    (userStatus?.isInTop10 || false)
                  }
                  inputStatus={
                    !walletAddress
                      ? "connect"
                      : isAuthenticating
                        ? "authenticating"
                        : !isAuthenticated
                          ? "connect"
                          : !userStatus?.isInTop10
                            ? "not-top10"
                            : "ready"
                  }
                  isFavorited={tokenMint ? isFavorited(tokenMint) : false}
                  onToggleFavorite={
                    tokenMint && isAuthenticated
                      ? () =>
                          toggleFavorite(tokenMint, {
                            name: tokenInfo?.name,
                            symbol: tokenInfo?.symbol,
                          })
                      : undefined
                  }
                  tokenName={tokenInfo?.name}
                  tokenSymbol={tokenInfo?.symbol}
                  tokenMint={tokenMint ?? undefined}
                  marketCap={
                    tokenMint
                      ? holdingsData?.holdings.find((h) => h.mint === tokenMint)?.marketCap ?? null
                      : null
                  }
                />
              </ErrorBoundary>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
