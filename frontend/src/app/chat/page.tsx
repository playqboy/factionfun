"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  FaCrown,
  FaSignal,
  FaMessage,
  FaAnglesLeft,
  FaBarsStaggered,
  FaRightFromBracket,
  FaTriangleExclamation,
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

export default function ChatPage() {
  const {
    authToken,
    isAuthenticated,
    authenticate,
    logout,
    walletAddress,
  } = useAuth();
  const [tokenMint, setTokenMint] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: holders, isLoading: holdersLoading, isError: holdersError } =
    useTopHolders(tokenMint);
  const { data: userStatus, isError: userStatusError } = useUserStatus(tokenMint, walletAddress);
  const { data: tokenInfo, isError: tokenInfoError } = useTokenInfo(tokenMint);
  const {
    messages,
    loading: chatLoading,
    sendMessage,
  } = useChat(tokenMint, authToken);

  const hasQueryError = holdersError || userStatusError || tokenInfoError;

  return (
    <div className="h-screen flex bg-background">
      {/* ── Desktop sidebar ── */}
      <aside className="w-[260px] flex-shrink-0 hidden md:flex flex-col border-r border-white/[0.06] bg-background">
        {/* Sidebar header */}
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-white/[0.06] flex-shrink-0">
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
        <div className="flex-1 overflow-y-auto">
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
              <div className="mx-4 border-t border-white/[0.06]" />
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
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <nav className="h-14 border-b border-white/[0.06] flex-shrink-0 flex items-center justify-between px-4 sm:px-5 bg-background/80 backdrop-blur-xl">
          {/* Left */}
          <div className="flex items-center gap-2.5">
            {/* Mobile: logo + sidebar toggle */}
            <Button
              variant="ghost"
              size="icon-sm"
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

            {/* Desktop: token info */}
            {tokenInfo && (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {tokenInfo.symbol}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tokenInfo.name}
                </span>
              </div>
            )}

            {!tokenInfo && (
              <span className="hidden md:block text-sm text-muted-foreground">
                Select a token
              </span>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {userStatus?.isInTop10 && (
              <Badge
                variant="outline"
                className="border-[#00BFFF]/25 bg-[#00BFFF]/8 text-[#00BFFF] gap-1 text-xs"
              >
                <FaCrown className="w-3 h-3" />
                #{userStatus.rank}
              </Badge>
            )}

            {tokenMint && (
              <Badge
                variant="outline"
                className="border-success/25 bg-success/8 text-success gap-1 text-xs hidden sm:flex"
              >
                <FaSignal className="w-2.5 h-2.5" />
                Live
              </Badge>
            )}

            {/* Privy wallet button */}
            {walletAddress ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-muted-foreground hidden sm:block">
                  {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                </span>
                <Button
                  onClick={logout}
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <FaRightFromBracket className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={authenticate}
                size="sm"
                className="bg-gradient-to-r from-[#00BFFF] to-[#0066FF] text-white border-0 hover:opacity-90 text-xs font-semibold"
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
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[260px] bg-background border-r border-white/[0.06] z-40 md:hidden flex flex-col"
            >
              {/* Mobile sidebar header */}
              <div className="h-14 flex items-center justify-between px-5 border-b border-white/[0.06] flex-shrink-0">
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
              <div className="flex-1 overflow-y-auto">
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
                    <div className="mx-4 border-t border-white/[0.06]" />
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
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-0">
          {!tokenMint ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-[#00BFFF]/8 border border-[#00BFFF]/15 mb-6">
                  <FaMessage className="w-7 h-7 text-[#00BFFF]" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Enter a Faction
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto mb-8">
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
              {hasQueryError && (
                <div className="px-5 py-2 flex items-center gap-2 text-yellow-400 bg-yellow-500/5 border-b border-yellow-500/10 flex-shrink-0">
                  <FaTriangleExclamation className="w-3 h-3 flex-shrink-0" />
                  <span className="text-xs">
                    Failed to load some data. Retrying...
                  </span>
                </div>
              )}
              <ChatWindow
                messages={messages}
                onSend={sendMessage}
                currentWallet={walletAddress || ""}
                holders={holders || []}
                isLoading={chatLoading}
                canSend={
                  !!walletAddress &&
                  isAuthenticated &&
                  (userStatus?.isInTop10 || false)
                }
                inputStatus={
                  !walletAddress
                    ? "connect"
                    : !isAuthenticated
                      ? "authenticating"
                      : !userStatus?.isInTop10
                        ? "not-top10"
                        : "ready"
                }
                onConnect={authenticate}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
