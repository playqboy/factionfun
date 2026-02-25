"use client";

import { useState, useEffect, useRef, memo } from "react";
import { FaMessage } from "react-icons/fa6";
import { Badge } from "@/components/ui/badge";

interface MockMessage {
  wallet: string;
  content: string;
  ticker: string;
}

const CONVERSATION: MockMessage[] = [
  { wallet: "7xKp..3nFq", content: "just crossed 2.1M tokens... top 3 now", ticker: "$FOMO" },
  { wallet: "9dRm..vL2x", content: "nice, welcome to the inner circle", ticker: "$FOMO" },
  { wallet: "3pWz..8kTn", content: "anyone else watching this pump? dev wallet hasn't sold", ticker: "$FOMO" },
  { wallet: "7xKp..3nFq", content: "yeah the chart looks insane rn. holding everything", ticker: "$FOMO" },
  { wallet: "Bx4f..mQ9s", content: "we coordinating on this or what", ticker: "$FOMO" },
  { wallet: "9dRm..vL2x", content: "diamond hands only in here. no paper hands allowed", ticker: "$FOMO" },
  { wallet: "3pWz..8kTn", content: "lol someone just dropped out of top 10. new guy incoming?", ticker: "$FOMO" },
  { wallet: "Fy7j..2eHc", content: "that's me. just aped in 500 SOL worth", ticker: "$FOMO" },
  { wallet: "7xKp..3nFq", content: "welcome to the faction", ticker: "$FOMO" },
  { wallet: "Bx4f..mQ9s", content: "this chat is actually so based. top holder coordination hits different", ticker: "$FOMO" },
  { wallet: "9dRm..vL2x", content: "nobody selling before we hit 100M mcap. agreed?", ticker: "$FOMO" },
  { wallet: "3pWz..8kTn", content: "agreed. let's run it", ticker: "$FOMO" },
];

const TYPING_SPEED = 30;       // ms per character
const PAUSE_BETWEEN = 1800;    // ms pause between messages
const TYPING_INDICATOR_MS = 1200; // ms to show "typing..." before message appears
const INITIAL_MESSAGES = 3;    // messages visible on load

interface DisplayMessage extends MockMessage {
  id: number;
  displayedText: string;
  isComplete: boolean;
}

export default memo(function LiveChatFeed() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [typingWallet, setTypingWallet] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  useEffect(() => {
    // Seed initial messages (already "sent")
    const initial: DisplayMessage[] = CONVERSATION.slice(0, INITIAL_MESSAGES).map((msg) => ({
      ...msg,
      id: idCounter.current++,
      displayedText: msg.content,
      isComplete: true,
    }));
    setMessages(initial);

    let nextIndex = INITIAL_MESSAGES;
    let cancelled = false;

    function scheduleNext() {
      if (cancelled) return;

      const msgIndex = nextIndex % CONVERSATION.length;

      // If we've looped, reset
      if (msgIndex === 0 && nextIndex > 0) {
        idCounter.current = 0;
        const reset: DisplayMessage[] = CONVERSATION.slice(0, INITIAL_MESSAGES).map((msg) => ({
          ...msg,
          id: idCounter.current++,
          displayedText: msg.content,
          isComplete: true,
        }));
        setMessages(reset);
        setShowTypingIndicator(false);
        nextIndex = INITIAL_MESSAGES;
        setTimeout(scheduleNext, PAUSE_BETWEEN);
        return;
      }

      const mockMsg = CONVERSATION[msgIndex];

      // Show typing indicator
      setTypingWallet(mockMsg.wallet);
      setShowTypingIndicator(true);

      setTimeout(() => {
        if (cancelled) return;
        setShowTypingIndicator(false);

        // Add the message with empty text, then type it out
        const msgId = idCounter.current++;
        const newMsg: DisplayMessage = {
          ...mockMsg,
          id: msgId,
          displayedText: "",
          isComplete: false,
        };

        setMessages((prev) => [...prev, newMsg]);

        // Type out character by character
        let charIndex = 0;
        const typeInterval = setInterval(() => {
          if (cancelled) {
            clearInterval(typeInterval);
            return;
          }
          charIndex++;
          const text = mockMsg.content.slice(0, charIndex);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId ? { ...m, displayedText: text, isComplete: charIndex >= mockMsg.content.length } : m
            )
          );
          if (charIndex >= mockMsg.content.length) {
            clearInterval(typeInterval);
            nextIndex++;
            setTimeout(scheduleNext, PAUSE_BETWEEN);
          }
        }, TYPING_SPEED);
      }, TYPING_INDICATOR_MS);
    }

    const initialDelay = setTimeout(scheduleNext, PAUSE_BETWEEN);

    return () => {
      cancelled = true;
      clearTimeout(initialDelay);
    };
  }, []);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showTypingIndicator]);

  return (
    <div className="bg-transparent border-0 shadow-none">
      {/* Header */}
      <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 border border-primary/20">
            <FaMessage className="w-2.5 h-2.5 text-primary" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-foreground/90 uppercase">
            Messaging Feed
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="p-0">
        <div className="h-[280px] sm:h-[360px] overflow-hidden relative">
          {/* Top fade */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#0a0a14]/90 to-transparent z-10 pointer-events-none" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0a0a14]/90 to-transparent z-10 pointer-events-none" />

          <div ref={scrollRef} className="px-3 py-2 space-y-px h-full overflow-y-auto scrollbar-hide">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start gap-2.5 py-2 px-2.5 rounded-md hover:bg-white/[0.03] transition-colors duration-200 animate-fade-in"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Badge variant="outline" className="text-[10px] font-mono text-primary/80 bg-primary/[0.06] border-primary/15 px-1.5 py-0.5 rounded-md">
                    {msg.ticker}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono text-muted-foreground/70">
                    {msg.wallet}
                  </span>
                  <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">
                    {msg.displayedText}
                    {!msg.isComplete && (
                      <span className="inline-block w-[2px] h-3 bg-primary/70 ml-0.5 align-middle animate-pulse" />
                    )}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {showTypingIndicator && (
              <div className="flex items-start gap-2.5 py-2 px-2.5 rounded-md animate-fade-in">
                <div className="flex-shrink-0 mt-0.5">
                  <Badge variant="outline" className="text-[10px] font-mono text-primary/80 bg-primary/[0.06] border-primary/15 px-1.5 py-0.5 rounded-md">
                    $FOMO
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono text-muted-foreground/70">
                    {typingWallet}
                  </span>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
