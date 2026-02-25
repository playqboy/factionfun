"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchMessages,
  sendMessage as apiSendMessage,
  type ChatMessageResponse,
} from "@/lib/api";
import { createChatSocket, type WSEvent } from "@/lib/websocket";

export function useChat(tokenMint: string | null, authToken: string | null) {
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const socketRef = useRef<{ close: () => void } | null>(null);

  // Load initial messages
  useEffect(() => {
    if (!tokenMint) {
      setMessages([]);
      setLoadError(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);
    fetchMessages(tokenMint)
      .then((msgs) => {
        if (!controller.signal.aborted) setMessages(msgs);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [tokenMint]);

  // WebSocket subscription
  useEffect(() => {
    if (!tokenMint) return;

    socketRef.current?.close();

    const MAX_MESSAGES = 200;
    const socket = createChatSocket(tokenMint, (event: WSEvent) => {
      if (event.type === "message") {
        const msg = event.data as ChatMessageResponse;
        setMessages((prev) => {
          const next = [...prev, msg];
          return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
        });
      }
    });

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [tokenMint]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!tokenMint || !authToken) {
        throw new Error("Not authenticated");
      }
      await apiSendMessage(tokenMint, content, authToken);
    },
    [tokenMint, authToken]
  );

  return { messages, loading, loadError, sendMessage };
}
