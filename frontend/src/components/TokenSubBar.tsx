"use client";

import { memo, useState } from "react";
import { FaStar, FaWallet, FaCrown } from "react-icons/fa6";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { WalletHoldingResponse, FavoriteResponse } from "@/lib/api";
import { formatMarketCap } from "@/lib/utils";

type Tab = "favorites" | "holdings";

interface TokenSubBarProps {
  favorites: FavoriteResponse[];
  holdings: WalletHoldingResponse[];
  isLoadingFavorites: boolean;
  isLoadingHoldings: boolean;
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
        className="w-5 h-5 rounded-sm object-cover flex-shrink-0"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className="w-5 h-5 flex items-center justify-center text-[8px] font-bold text-foreground/60 uppercase leading-none flex-shrink-0">
      {symbol.slice(0, 3)}
    </span>
  );
}

export default memo(function TokenSubBar({
  favorites,
  holdings,
  isLoadingFavorites,
  isLoadingHoldings,
  currentMint,
  onSelect,
}: TokenSubBarProps) {
  const [activeTab, setActiveTab] = useState<Tab>("holdings");

  const isLoading =
    activeTab === "favorites" ? isLoadingFavorites : isLoadingHoldings;

  const items =
    activeTab === "favorites"
      ? favorites.map((f) => ({
          mint: f.tokenMint,
          symbol: f.symbol || f.tokenMint.slice(0, 4),
          name: f.name || f.tokenMint.slice(0, 8) + "...",
          imageUri: f.imageUri,
          isTop10: false as const,
          rank: null as number | null,
          marketCap: null as number | null,
        }))
      : holdings.map((h) => ({
          mint: h.mint,
          symbol: h.symbol,
          name: h.name,
          imageUri: h.imageUri,
          isTop10: h.isTop10,
          rank: h.rank,
          marketCap: h.marketCap,
        }));

  const emptyText =
    activeTab === "favorites"
      ? "Star a token to save it here"
      : "No holdings found";

  return (
    <div className="h-10 sm:h-11 border-b border-border-subtle flex-shrink-0 flex items-center bg-background/60">
      {/* Tab icons */}
      <div className="flex items-center gap-0.5 px-2 flex-shrink-0">
        <button
          type="button"
          aria-label="Favorites"
          onClick={() => setActiveTab("favorites")}
          className={`w-7 h-7 flex items-center justify-center rounded-sm transition-colors cursor-pointer ${
            activeTab === "favorites"
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground/70"
          }`}
        >
          <FaStar className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          aria-label="Holdings"
          onClick={() => setActiveTab("holdings")}
          className={`w-7 h-7 flex items-center justify-center rounded-sm transition-colors cursor-pointer ${
            activeTab === "holdings"
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground/70"
          }`}
        >
          <FaWallet className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-border-subtle flex-shrink-0" />

      {/* Token list */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-none">
        <div className="flex items-center gap-1 px-2.5 h-full">
          {isLoading && items.length === 0 && (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-24 h-8 rounded-sm bg-secondary/30 animate-pulse flex-shrink-0"
                />
              ))}
            </>
          )}

          {!isLoading && items.length === 0 && (
            <span className="text-[11px] text-muted-foreground/50 whitespace-nowrap px-1">
              {emptyText}
            </span>
          )}

          <TooltipProvider>
            {items.map((item) => {
              const isSelected = currentMint === item.mint;

              return (
                <Tooltip key={item.mint}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSelect(item.mint)}
                      className={`
                        h-8 rounded-sm flex items-center gap-1.5 px-2 relative flex-shrink-0
                        cursor-pointer transition-all duration-150
                        ${
                          item.isTop10
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-bg-subtle border border-border-subtle opacity-60 hover:opacity-80"
                        }
                        ${
                          isSelected
                            ? "ring-2 ring-primary/50 !opacity-100"
                            : ""
                        }
                      `}
                    >
                      <TokenIcon
                        imageUri={item.imageUri}
                        symbol={item.symbol}
                      />
                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-[10px] font-semibold text-foreground/90 leading-none truncate max-w-[60px]">
                          {item.symbol}
                        </span>
                        {item.marketCap != null && item.marketCap > 0 ? (
                          <span className="text-[9px] text-muted-foreground/60 leading-none mt-0.5 tabular-nums">
                            {formatMarketCap(item.marketCap)}
                          </span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground/40 leading-none mt-0.5 truncate max-w-[50px]">
                            {item.name}
                          </span>
                        )}
                      </div>
                      {item.isTop10 && (
                        <FaCrown className="absolute -top-1 -right-1 w-2 h-2 text-primary" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold">{item.symbol}</span>
                      <span className="text-[10px] opacity-70">
                        {item.name}
                      </span>
                      {item.marketCap != null && item.marketCap > 0 && (
                        <span className="text-[10px] opacity-70">
                          MCap: {formatMarketCap(item.marketCap)}
                        </span>
                      )}
                      {item.rank != null && (
                        <span className="text-[10px] opacity-70">
                          {item.isTop10
                            ? `Rank #${item.rank} — Top 10!`
                            : `Rank: #${item.rank}`}
                        </span>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
});
