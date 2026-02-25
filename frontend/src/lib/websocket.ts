const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";

export type WSEventType = "message" | "rankings" | "user_joined" | "user_left";

export interface WSEvent {
  type: WSEventType;
  data: unknown;
}

interface SocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

const MAX_RECONNECT_DELAY = 30_000;
const INITIAL_RECONNECT_DELAY = 1_000;

export function createChatSocket(
  tokenMint: string,
  onEvent: (event: WSEvent) => void,
  options?: SocketOptions
): { close: () => void } {
  let ws: WebSocket | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let closed = false;
  let reconnectDelay = INITIAL_RECONNECT_DELAY;

  function connect() {
    if (closed) return;

    ws = new WebSocket(`${WS_BASE}/chat/${tokenMint}`);

    ws.onopen = () => {
      reconnectDelay = INITIAL_RECONNECT_DELAY;
      options?.onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const parsed: WSEvent = JSON.parse(event.data);
        onEvent(parsed);
      } catch (err) {
        console.error("Failed to parse WS message:", err);
      }
    };

    ws.onclose = () => {
      options?.onDisconnect?.();
      if (!closed) {
        reconnectTimeout = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
      }
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  connect();

  return {
    close: () => {
      closed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      ws?.close();
    },
  };
}

export function createFeedSocket(
  onEvent: (event: WSEvent) => void,
  options?: SocketOptions
): { close: () => void } {
  let ws: WebSocket | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let closed = false;
  let reconnectDelay = INITIAL_RECONNECT_DELAY;

  function connect() {
    if (closed) return;

    ws = new WebSocket(`${WS_BASE}/feed`);

    ws.onopen = () => {
      reconnectDelay = INITIAL_RECONNECT_DELAY;
      options?.onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const parsed: WSEvent = JSON.parse(event.data);
        onEvent(parsed);
      } catch (err) {
        console.error("Failed to parse WS feed message:", err);
      }
    };

    ws.onclose = () => {
      options?.onDisconnect?.();
      if (!closed) {
        reconnectTimeout = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
      }
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  connect();

  return {
    close: () => {
      closed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      ws?.close();
    },
  };
}
