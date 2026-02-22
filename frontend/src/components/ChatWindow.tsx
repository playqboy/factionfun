"use client";

import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import {
  FaPaperPlane,
  FaMessage,
  FaSpinner,
  FaLock,
  FaWallet,
  FaCopy,
  FaCheck,
  FaTriangleExclamation,
} from "react-icons/fa6";
import type { ChatMessageResponse, HolderResponse } from "@/lib/api";
import { formatTime } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface ChatWindowProps {
  messages: ChatMessageResponse[];
  onSend: (content: string) => Promise<void>;
  currentWallet: string;
  holders?: HolderResponse[];
  isLoading?: boolean;
  canSend?: boolean;
  inputStatus?: "connect" | "not-top10" | "authenticating" | "ready";
  onConnect?: () => void;
}

/* ── Memoized single message row ── */
interface MessageRowProps {
  msg: ChatMessageResponse;
  isOwn: boolean;
  isNew: boolean;
  showHeader: boolean;
  rank: number | undefined;
  msgCount: number;
  copiedWallet: string | null;
  onCopyWallet: (address: string) => void;
}

const MessageRow = memo(function MessageRow({
  msg,
  isOwn,
  isNew,
  showHeader,
  rank,
  msgCount,
  copiedWallet,
  onCopyWallet,
}: MessageRowProps) {
  return (
    <div className={`${showHeader ? "pt-2" : ""} ${isNew ? "animate-message-in" : ""}`}>
      {showHeader && (
        <div
          className={`flex items-center gap-1.5 mb-1.5 ${isOwn ? "justify-end" : ""}`}
        >
          {rank !== undefined && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] font-bold text-[#00BFFF] cursor-default">
                  #{rank}
                </span>
              </TooltipTrigger>
              <TooltipContent>Holder rank</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onCopyWallet(msg.walletAddress)}
                className={`text-[11px] font-mono font-semibold inline-flex items-center gap-1 hover:text-[#00BFFF] transition-colors cursor-pointer ${
                  isOwn ? "text-[#00BFFF]" : "text-foreground/70"
                }`}
              >
                {msg.walletAddress.slice(0, 5)}...
                {copiedWallet === msg.walletAddress ? (
                  <FaCheck className="w-2.5 h-2.5 text-green-400" />
                ) : (
                  <FaCopy className="w-2.5 h-2.5 opacity-40" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {copiedWallet === msg.walletAddress
                ? "Copied!"
                : "Click to copy wallet address"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[10px] text-muted-foreground/50 tabular-nums cursor-default">
                [{msgCount}]
              </span>
            </TooltipTrigger>
            <TooltipContent>Total messages in chat</TooltipContent>
          </Tooltip>
          <span className="text-[10px] text-muted-foreground/50">
            {formatTime(msg.createdAt)}
          </span>
        </div>
      )}
      <div
        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-[70%] px-3.5 py-2 text-[13px] leading-relaxed ${
            isOwn
              ? "bg-gradient-to-br from-[#00BFFF]/10 to-[#0066FF]/10 border border-[#00BFFF]/15 text-foreground rounded-sm rounded-br-none"
              : "bg-white/[0.03] border border-white/[0.06] text-foreground rounded-sm rounded-bl-none"
          }`}
        >
          {msg.content}
        </div>
      </div>
    </div>
  );
});

export default memo(function ChatWindow({
  messages,
  onSend,
  currentWallet,
  holders = [],
  isLoading,
  canSend = true,
  inputStatus = "ready",
  onConnect,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const prevAnimLenRef = useRef(0);
  const isFirstRenderRef = useRef(true);

  // Compute which messages are "new" (appeared since last render) for animation.
  // On initial load or token switch (messages shrink), nothing animates.
  const animateFromIndex =
    isFirstRenderRef.current || messages.length <= prevAnimLenRef.current
      ? messages.length
      : prevAnimLenRef.current;

  // Wallet → holder rank lookup
  const rankByWallet = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of holders) map.set(h.walletAddress, h.rank);
    return map;
  }, [holders]);

  // Wallet → total message count (pure computation)
  const msgCountByWallet = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of messages) {
      map.set(m.walletAddress, (map.get(m.walletAddress) || 0) + 1);
    }
    return map;
  }, [messages]);

  const copyWallet = useCallback((address: string) => {
    try {
      navigator.clipboard.writeText(address);
    } catch { /* clipboard unavailable */ }
    setCopiedWallet(address);
    setTimeout(() => setCopiedWallet(null), 1500);
  }, []);

  // Update animation tracking after render
  useEffect(() => {
    isFirstRenderRef.current = false;
    prevAnimLenRef.current = messages.length;
  }, [messages]);

  // Scroll to bottom — debounced with rAF, avoids forced layout on every message
  useEffect(() => {
    const isInitialLoad = prevMessageCountRef.current === 0 && messages.length > 0;
    prevMessageCountRef.current = messages.length;

    const rafId = requestAnimationFrame(() => {
      const el = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
      const shouldScroll = isInitialLoad || (el
        ? el.scrollHeight - el.scrollTop - el.clientHeight < 120
        : true);

      if (shouldScroll) {
        messagesEndRef.current?.scrollIntoView({
          behavior: isInitialLoad ? "instant" : "smooth",
        });
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setSendError(null);
    try {
      await onSend(trimmed);
      setInput("");
    } catch {
      setSendError("Failed to send message");
      setTimeout(() => setSendError(null), 4000);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  /* ── Gate bar (shown when user can't send) ── */
  function renderGateBar() {
    if (inputStatus === "connect") {
      return (
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <div className="flex items-center justify-center w-7 h-7 rounded-sm bg-muted/50">
              <FaWallet className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium">
              Connect your wallet to chat
            </span>
          </div>
          {onConnect && (
            <Button
              onClick={onConnect}
              size="sm"
              className="bg-gradient-to-r from-[#00BFFF] to-[#0066FF] text-white border-0 hover:opacity-90 h-8 text-xs px-4"
            >
              Connect
            </Button>
          )}
        </div>
      );
    }

    if (inputStatus === "authenticating") {
      return (
        <div className="flex items-center gap-2.5 px-5 py-3.5 text-muted-foreground">
          <div className="flex items-center justify-center w-7 h-7 rounded-sm bg-muted/50">
            <FaSpinner className="w-3.5 h-3.5 animate-spin" />
          </div>
          <span className="text-xs font-medium">
            Verifying wallet...
          </span>
        </div>
      );
    }

    if (inputStatus === "not-top10") {
      return (
        <div className="flex items-center gap-2.5 px-5 py-3.5 text-muted-foreground">
          <div className="flex items-center justify-center w-7 h-7 rounded-sm bg-muted/50">
            <FaLock className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium">
            Only top 10 holders can send messages
          </span>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Chat header ── */}
      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2.5 flex-shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-sm bg-[#00BFFF]/8 border border-[#00BFFF]/15">
          <FaMessage className="w-3.5 h-3.5 text-[#00BFFF]" />
        </div>
        <div>
          <span className="text-sm font-semibold text-foreground leading-none block">
            Faction Chat
          </span>
          <span className="text-[10px] text-muted-foreground leading-none mt-0.5 block tabular-nums">
            {messages.length} {messages.length === 1 ? "message" : "messages"}
          </span>
        </div>
      </div>

      {/* ── Messages ── */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
        <TooltipProvider>
        <div className="px-5 py-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <FaSpinner className="w-6 h-6 text-[#00BFFF] animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground text-xs font-medium">
                  Loading messages...
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-[#00BFFF]/8 border border-[#00BFFF]/15 mb-4 mx-auto">
                  <FaMessage className="w-5 h-5 text-[#00BFFF]/60" />
                </div>
                <p className="text-sm font-medium text-foreground/70 mb-1">
                  No messages yet
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Be the first to speak in this faction
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isOwn = msg.walletAddress === currentWallet;
              const showHeader =
                idx === 0 ||
                messages[idx - 1].walletAddress !== msg.walletAddress;

              return (
                <MessageRow
                  key={msg.id}
                  msg={msg}
                  isOwn={isOwn}
                  isNew={idx >= animateFromIndex}
                  showHeader={showHeader}
                  rank={rankByWallet.get(msg.walletAddress)}
                  msgCount={msgCountByWallet.get(msg.walletAddress) || 0}
                  copiedWallet={copiedWallet}
                  onCopyWallet={copyWallet}
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        </TooltipProvider>
      </ScrollArea>

      {/* ── Input area ── */}
      <div className="border-t border-white/[0.06] flex-shrink-0">
        {sendError && (
          <div className="px-4 py-2 flex items-center gap-2 text-red-400 bg-red-500/5 border-b border-red-500/10">
            <FaTriangleExclamation className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs">{sendError}</span>
          </div>
        )}
        {canSend ? (
          <form
            onSubmit={handleSend}
            className="px-4 py-3 flex items-center gap-2"
          >
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              maxLength={500}
              className="flex-1 bg-white/[0.04] border-white/[0.06] h-10 text-sm focus-visible:ring-[#00BFFF]/30 focus-visible:border-[#00BFFF]/40 placeholder:text-muted-foreground/40"
            />
            <Button
              type="submit"
              disabled={!input.trim() || sending}
              size="icon"
              className="w-10 h-10 bg-gradient-to-r from-[#00BFFF] to-[#0066FF] text-white border-0 hover:opacity-90 flex-shrink-0"
            >
              {sending ? (
                <FaSpinner className="w-4 h-4 animate-spin" />
              ) : (
                <FaPaperPlane className="w-4 h-4" />
              )}
            </Button>
          </form>
        ) : (
          renderGateBar()
        )}
      </div>
    </div>
  );
});
