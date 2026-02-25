import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage, Server } from 'http';
import type { ChatMessage, Holder } from '../types/index.js';
import { config } from '../utils/config.js';

// Map of tokenMint -> Set<WebSocket>
const rooms = new Map<string, Set<WebSocket>>();
// Global feed subscribers (homepage live feed)
const feedSubscribers = new Set<WebSocket>();
// Track alive status for heartbeat
const aliveClients = new WeakSet<WebSocket>();

export function createWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    verifyClient: (info: { origin: string; req: IncomingMessage }) => {
      const origin = info.origin || info.req.headers.origin;
      if (!origin) return config.nodeEnv !== 'production';
      return config.corsOrigin === '*' || config.corsOrigin === origin;
    },
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    aliveClients.add(ws);
    ws.on('pong', () => aliveClients.add(ws));

    const url = new URL(req.url || '', 'ws://0.0.0.0');
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Global feed: /feed
    if (pathParts.length === 1 && pathParts[0] === 'feed') {
      feedSubscribers.add(ws);
      console.log(`WS client joined global feed (${feedSubscribers.size} clients)`);

      ws.on('close', () => {
        feedSubscribers.delete(ws);
      });

      ws.on('error', (err) => {
        console.error('WS feed client error:', err);
      });
      return;
    }

    // Token room: /chat/:mint
    const mint = pathParts.length >= 2 && pathParts[0] === 'chat' ? pathParts[1] : null;

    if (!mint) {
      ws.close(1008, 'Missing token mint in URL path');
      return;
    }

    // Add to room
    if (!rooms.has(mint)) {
      rooms.set(mint, new Set());
    }
    rooms.get(mint)!.add(ws);

    console.log(`WS client joined room ${mint.slice(0, 8)}... (${rooms.get(mint)!.size} clients)`);

    ws.on('close', () => {
      rooms.get(mint)?.delete(ws);
      if (rooms.get(mint)?.size === 0) {
        rooms.delete(mint);
      }
    });

    ws.on('error', (err) => {
      console.error('WS client error:', err);
    });
  });

  // Heartbeat every 30 seconds — terminate clients that didn't respond
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!aliveClients.has(ws)) {
        ws.terminate();
        return;
      }
      aliveClients.delete(ws);
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, 30000);

  console.log('WebSocket server attached to HTTP server');
  return wss;
}

export function broadcastMessage(tokenMint: string, message: ChatMessage, tokenSymbol?: string): void {
  const payload = JSON.stringify({
    type: 'message',
    data: message,
  });

  // Broadcast to token-specific room
  const subscribers = rooms.get(tokenMint);
  if (subscribers) {
    subscribers.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }

  // Broadcast to global feed subscribers with tokenSymbol
  if (feedSubscribers.size > 0) {
    const feedPayload = JSON.stringify({
      type: 'message',
      data: { ...message, tokenSymbol: tokenSymbol || tokenMint.slice(0, 6) },
    });
    feedSubscribers.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(feedPayload);
      }
    });
  }
}

export function broadcastRankingUpdate(tokenMint: string, holders: Holder[]): void {
  const subscribers = rooms.get(tokenMint);
  if (!subscribers) return;

  const payload = JSON.stringify({
    type: 'rankings',
    data: holders.map((h) => ({ ...h, balance: h.balance.toString() })),
  });

  subscribers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

export function broadcastMembershipEvent(
  tokenMint: string,
  eventType: 'user_joined' | 'user_left',
  walletAddress: string,
  rank: number
): void {
  const subscribers = rooms.get(tokenMint);
  if (!subscribers) return;

  const payload = JSON.stringify({
    type: eventType,
    data: { walletAddress, rank },
  });

  subscribers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

export function getActiveTokenMints(): string[] {
  return Array.from(rooms.keys());
}
