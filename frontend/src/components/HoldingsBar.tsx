"use client";

import { memo, useState } from "react";
import { FaCoins, FaCrown } from "react-icons/fa6";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { WalletHoldingResponse } from "@/lib/api";

interface HoldingsBarProps {
  holdings: WalletHoldingResponse[];
  isLoading: boolean;
  currentMint: string | null;
  onSelect: (mint: string) => void;
}

function TokenIcon({
  imageUri,
  symbol,
}: {
  imageUri: string | null;
  symbol: string;
}) {
  const [failed, setFailed] = useState(false);

  if (imageUri && !failed) {
    return (
      <img
        src={imageUri}
        alt={symbol}
        className="w-6 h-6 rounded-sm object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className="text-[10px] font-bold text-foreground/60 uppercase leading-none">
      {symbol.slice(0, 3)}
    </span>
  );
}

export default memo(function HoldingsBar({
  holdings,
  isLoading,
  currentMint,
  onSelect,
}: HoldingsBarProps) {
  return (
    <div className="w-14 flex-shrink-0 hidden md:flex flex-col border-r border-border-subtle bg-background">
      {/* Header */}
      <div className="h-14 flex items-center justify-center border-b border-border-subtle flex-shrink-0">
        <FaCoins className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Token list */}
      <ScrollArea className="flex-1">
        <div className="py-2 flex flex-col items-center gap-1">
          {isLoading &&
            holdings.length === 0 &&
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-sm bg-secondary/30 animate-pulse"
              />
            ))}

          <TooltipProvider>
            {holdings.map((holding) => {
              const isSelected = currentMint === holding.mint;
              const rankLabel =
                holding.rank != null ? `#${holding.rank}` : ">20";

              return (
                <Tooltip key={holding.mint}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSelect(holding.mint)}
                      className={`
                        w-10 h-10 rounded-sm flex items-center justify-center relative
                        cursor-pointer transition-all duration-150
                        ${
                          holding.isTop10
                            ? "bg-primary/10 border border-primary/30 glow-accent"
                            : "bg-bg-subtle border border-border-subtle opacity-50 hover:opacity-70"
                        }
                        ${
                          isSelected
                            ? "ring-2 ring-primary/50 !opacity-100"
                            : ""
                        }
                      `}
                    >
                      <TokenIcon
                        imageUri={holding.imageUri}
                        symbol={holding.symbol}
                      />

                      {/* Top 10 crown indicator */}
                      {holding.isTop10 && (
                        <FaCrown className="absolute -top-1 -right-1 w-2.5 h-2.5 text-primary" />
                      )}

                      {/* Rank badge for non-top-10 */}
                      {!holding.isTop10 && holding.rank != null && (
                        <span className="absolute -bottom-0.5 -right-0.5 text-[7px] font-mono bg-background border border-border-subtle rounded-sm px-0.5 min-w-[14px] text-center text-muted-foreground leading-tight">
                          {holding.rank}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold">
                        {holding.symbol}
                      </span>
                      <span className="text-[10px] opacity-70">
                        {holding.name}
                      </span>
                      <span className="text-[10px] opacity-70">
                        {holding.isTop10
                          ? `Rank ${rankLabel} — Top 10!`
                          : `Rank: ${rankLabel}`}
                      </span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </ScrollArea>
    </div>
  );
});
