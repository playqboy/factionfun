"use client";

import { memo, useState, useCallback } from "react";
import { FaCrown, FaCopy, FaCheck, FaMagnifyingGlass } from "react-icons/fa6";
import type { HolderResponse } from "@/lib/api";
import { truncateWallet } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface LeaderboardProps {
  holders: HolderResponse[];
  currentWallet?: string;
  isLoading?: boolean;
}

const crownColors: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-gray-300",
  3: "text-amber-600",
};

export default memo(function Leaderboard({
  holders,
  currentWallet,
  isLoading,
}: LeaderboardProps) {
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  const copyWallet = useCallback((address: string) => {
    try { navigator.clipboard.writeText(address); } catch { /* */ }
    setCopiedWallet(address);
    setTimeout(() => setCopiedWallet(null), 1500);
  }, []);

  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest mb-2.5">
        Top 10 Holders
      </p>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-9 bg-secondary/30 rounded animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      ) : holders.length === 0 ? (
        <p className="text-muted-foreground text-xs text-center py-4">
          No holder data available
        </p>
      ) : (
        /* Holder list */
        <TooltipProvider>
          <div className="space-y-0.5">
            {holders.map((holder) => {
              const isCurrentUser = currentWallet === holder.walletAddress;
              const isTop3 = holder.rank <= 3;
              const isCopied = copiedWallet === holder.walletAddress;

              return (
                <div
                  key={holder.walletAddress}
                  className={`group flex items-center gap-2 px-2.5 py-2 rounded transition-colors ${
                    isCurrentUser
                      ? "bg-primary/8 border border-primary/15"
                      : "hover:bg-secondary/40"
                  }`}
                >
                  {/* Rank */}
                  <span className="w-5 flex justify-center flex-shrink-0">
                    {isTop3 ? (
                      <FaCrown
                        className={`w-3 h-3 ${crownColors[holder.rank]}`}
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                        {holder.rank}
                      </span>
                    )}
                  </span>

                  {/* Wallet (click to copy) */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => copyWallet(holder.walletAddress)}
                        className={`font-mono text-[11px] flex-1 truncate text-left cursor-pointer transition-colors inline-flex items-center gap-1 ${
                          isCurrentUser
                            ? "text-primary font-semibold hover:text-primary/80"
                            : "text-foreground/70 hover:text-primary"
                        }`}
                      >
                        {isCurrentUser
                          ? "You"
                          : truncateWallet(holder.walletAddress)}
                        {isCopied ? (
                          <FaCheck className="w-2 h-2 text-green-400 flex-shrink-0" />
                        ) : (
                          <FaCopy className="w-2 h-2 opacity-0 group-hover:opacity-40 flex-shrink-0 transition-opacity" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isCopied ? "Copied!" : "Copy wallet address"}
                    </TooltipContent>
                  </Tooltip>

                  {/* Solscan link */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={`https://solscan.io/account/${holder.walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity flex-shrink-0"
                      >
                        <FaMagnifyingGlass className="w-2.5 h-2.5 text-muted-foreground" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>View on Solscan</TooltipContent>
                  </Tooltip>

                  {/* Bar + percentage */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-12 h-1 rounded-full bg-border/50 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(holder.percentage * 2, 100)}%`,
                          background:
                            "linear-gradient(90deg, var(--primary), var(--accent-deep))",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-9 text-right tabular-nums font-medium">
                      {holder.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
});
