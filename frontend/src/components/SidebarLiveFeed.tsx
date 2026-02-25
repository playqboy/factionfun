"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { FaMessage, FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { fetchRecentMessages, type FeedMessageResponse } from "@/lib/api";
import { createFeedSocket, type WSEvent } from "@/lib/websocket";

interface DisplayMessage {
  id: number;
  tokenMint: string;
  tokenSymbol: string;
  walletAddress: string;
  content: string;
}

function toDisplay(msg: FeedMessageResponse): DisplayMessage {
  return {
    id: msg.id,
    tokenMint: msg.tokenMint,
    tokenSymbol: msg.tokenSymbol || msg.tokenMint.slice(0, 6),
    walletAddress: msg.walletAddress,
    content: msg.content,
  };
}

function shortenAddress(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}..${addr.slice(-4)}`;
}

const MAX_MESSAGES = 50;

export default memo(function SidebarLiveFeed() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScroll = useRef(true);

  // Track if user scrolled up manually
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    autoScroll.current = atBottom;
  }, []);

  // Fetch initial messages
  useEffect(() => {
    let cancelled = false;
    fetchRecentMessages()
      .then((data) => {
        if (cancelled) return;
        // API returns newest first, reverse for chronological order
        setMessages(data.reverse().map(toDisplay));
      })
      .catch(() => {
        // Silently fail — feed will populate from WebSocket
      });
    return () => { cancelled = true; };
  }, []);

  // WebSocket for live messages
  useEffect(() => {
    const socket = createFeedSocket((event: WSEvent) => {
      if (event.type === "message") {
        const raw = event.data as FeedMessageResponse;
        const msg = toDisplay(raw);
        setMessages((prev) => {
          // Dedupe by id
          if (prev.some((m) => m.id === msg.id)) return prev;
          const next = [...prev, msg];
          return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
        });
      }
    });
    return () => socket.close();
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (autoScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Header — clickable to collapse/expand */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="px-4 py-2.5 border-t border-border-subtle flex items-center justify-between flex-shrink-0 w-full hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-primary/10 border border-primary/20">
            <FaMessage className="w-2 h-2 text-primary" />
          </div>
          <span className="text-[10px] font-semibold tracking-wide text-muted-foreground/80 uppercase">
            Global Feed
          </span>
        </div>
        {collapsed ? (
          <FaChevronUp className="w-2.5 h-2.5 text-muted-foreground/50" />
        ) : (
          <FaChevronDown className="w-2.5 h-2.5 text-muted-foreground/50" />
        )}
      </button>

      {/* Messages — hidden when collapsed */}
      {!collapsed && (
        <div className="flex-1 relative overflow-hidden min-h-0">
          {/* Top fade */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto scrollbar-hide px-3 py-1"
          >
            {messages.length === 0 && (
              <p className="text-[10px] text-muted-foreground/40 text-center py-4 font-mono">
                No messages yet
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="py-1.5 px-2 rounded hover:bg-white/[0.03] transition-colors duration-200 animate-fade-in"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-semibold text-primary/90 font-mono">
                    {msg.tokenSymbol.startsWith("$") ? msg.tokenSymbol : `$${msg.tokenSymbol}`}
                  </span>
                  <span className="text-[9px] text-muted-foreground/40 font-mono truncate">
                    {shortenAddress(msg.tokenMint)}
                  </span>
                  <span className="ml-auto text-[9px] text-muted-foreground/50 font-mono flex-shrink-0">
                    {shortenAddress(msg.walletAddress)}
                  </span>
                </div>
                <p className="text-[11px] text-foreground/70 leading-snug truncate">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
