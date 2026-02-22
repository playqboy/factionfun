"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { FaMessage, FaTowerBroadcast } from "react-icons/fa6";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchRecentMessages, type FeedMessageResponse } from "@/lib/api";
import { createFeedSocket } from "@/lib/websocket";

interface FeedMessage {
  id: number;
  wallet: string;
  content: string;
  ticker: string;
  timestamp: number;
}

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}..${address.slice(-4)}`;
}

function toFeedMessage(msg: FeedMessageResponse): FeedMessage {
  return {
    id: msg.id,
    wallet: truncateAddress(msg.walletAddress),
    content: msg.content,
    ticker: `$${msg.tokenSymbol}`,
    timestamp: new Date(msg.createdAt).getTime(),
  };
}

const MAX_MESSAGES = 15;

export default memo(function LiveChatFeed() {
  const [messages, setMessages] = useState<FeedMessage[]>([]);
  const [connected, setConnected] = useState(false);

  // Fetch initial messages from the API
  useEffect(() => {
    let cancelled = false;

    fetchRecentMessages()
      .then((data) => {
        if (cancelled) return;
        const feed = data.map(toFeedMessage).slice(0, MAX_MESSAGES);
        setMessages(feed);
      })
      .catch(() => {
        // Backend unavailable — feed stays empty
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to real-time messages via WebSocket
  const handleWsMessage = useCallback(
    (event: { type: string; data: unknown }) => {
      if (event.type === "message") {
        const raw = event.data as {
          id: number;
          tokenMint: string;
          walletAddress: string;
          content: string;
          createdAt: string;
          tokenSymbol?: string;
        };
        const msg: FeedMessage = {
          id: raw.id,
          wallet: truncateAddress(raw.walletAddress),
          content: raw.content,
          ticker: `$${raw.tokenSymbol || raw.tokenMint.slice(0, 6)}`,
          timestamp: new Date(raw.createdAt).getTime(),
        };
        setMessages((prev) => [msg, ...prev].slice(0, MAX_MESSAGES));
      }
    },
    []
  );

  useEffect(() => {
    const socket = createFeedSocket(handleWsMessage, {
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
    });

    return () => {
      socket.close();
    };
  }, [handleWsMessage]);

  return (
    <Card className="bg-card/60 border-border/40 backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaMessage className="w-3.5 h-3.5 text-[#00BFFF]" />
          <span className="text-xs font-semibold text-foreground">
            Live Feed
          </span>
        </div>
        <Badge
          variant="outline"
          className={`gap-1 text-[10px] py-0 ${
            connected
              ? "border-success/25 bg-success/8 text-success"
              : "border-yellow-500/25 bg-yellow-500/8 text-yellow-500"
          }`}
        >
          <FaTowerBroadcast className="w-2.5 h-2.5 animate-pulse" />
          {connected ? "Live" : "Connecting"}
        </Badge>
      </div>

      {/* Messages */}
      <CardContent className="p-0">
        <div className="h-[360px] overflow-hidden relative">
          {/* Top fade */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-card/90 to-transparent z-10 pointer-events-none" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card/90 to-transparent z-10 pointer-events-none" />

          <div className="px-3 py-2 space-y-0.5">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-[340px]">
                <p className="text-xs text-muted-foreground">
                  No messages yet — be the first to chat
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2 py-1.5 px-2 rounded-sm hover:bg-secondary/30 transition-colors${i === 0 ? " animate-fade-in" : ""}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-mono text-[#00BFFF]/70 bg-[#00BFFF]/5 px-1.5 py-0.5 rounded-sm border border-[#00BFFF]/10">
                    {msg.ticker}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {msg.wallet}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
