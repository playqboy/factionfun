"use client";

import { memo } from "react";
import { FaCrown } from "react-icons/fa6";
import type { HolderResponse } from "@/lib/api";
import { truncateWallet } from "@/lib/utils";

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
        <div className="space-y-0.5">
          {holders.map((holder) => {
            const isCurrentUser = currentWallet === holder.walletAddress;
            const isTop3 = holder.rank <= 3;

            return (
              <div
                key={holder.walletAddress}
                className={`flex items-center gap-2 px-2.5 py-2 rounded transition-colors ${
                  isCurrentUser
                    ? "bg-[#00BFFF]/8 border border-[#00BFFF]/15"
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

                {/* Wallet */}
                <span
                  className={`font-mono text-[11px] flex-1 truncate ${
                    isCurrentUser
                      ? "text-[#00BFFF] font-semibold"
                      : "text-foreground/70"
                  }`}
                >
                  {isCurrentUser
                    ? "You"
                    : truncateWallet(holder.walletAddress)}
                </span>

                {/* Bar + percentage */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-12 h-1 rounded-full bg-border/50 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(holder.percentage * 2, 100)}%`,
                        background:
                          "linear-gradient(90deg, #00BFFF, #0066FF)",
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
      )}
    </div>
  );
});
