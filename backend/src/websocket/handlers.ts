import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage, Server } from 'http';
import type { ChatMessage, Holder } from '../types/index.js';
import { config } from '../utils/config.js';
import { isValidSolanaAddress } from '../utils/validation.js';

const MAX_CONNECTIONS = 1000;

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
      const origin = (info.origin || info.req.headers.origin || '').replace(/\/+$/, '');
      if (!origin) return false; // Always require origin
      const allowed = config.corsOrigin.split(',').flatMap(s => {
        const o = s.trim().replace(/\/+$/, '');
        return o.includes('://www.')
          ? [o, o.replace('://www.', '://')]
          : [o, o.replace('://', '://www.')];
      });
      if (config.nodeEnv !== 'production') {
        return allowed.includes(origin) || origin === 'http://localhost:3000';
      }
      return allowed.includes(origin);
    },
    maxPayload: 4096,
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    if (wss.clients.size > MAX_CONNECTIONS) {
      ws.close(1013, 'Server too busy');
      return;
    }

    aliveClients.add(ws);
    ws.on('pong', () => aliveClients.add(ws));

    const url = new URL(req.url || '', 'ws://0.0.0.0');
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Global feed: /feed
    if (pathParts.length === 1 && pathParts[0] === 'feed') {
      feedSubscribers.add(ws);

      ws.on('close', () => {
        feedSubscribers.delete(ws);
      });

      ws.on('error', () => {
        // Silently handle — heartbeat will clean up dead connections
      });
      return;
    }

    // Token room: /chat/:mint
    const mint = pathParts.length >= 2 && pathParts[0] === 'chat' ? pathParts[1] : null;

    if (!mint || !isValidSolanaAddress(mint)) {
      ws.close(1008, 'Invalid or missing token mint');
      return;
    }

    // Add to room
    if (!rooms.has(mint)) {
      rooms.set(mint, new Set());
    }
    rooms.get(mint)!.add(ws);

    ws.on('close', () => {
      rooms.get(mint)?.delete(ws);
      if (rooms.get(mint)?.size === 0) {
        rooms.delete(mint);
      }
    });

    ws.on('error', () => {
      // Silently handle — heartbeat will clean up dead connections
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

  if (config.nodeEnv !== 'production') {
    console.log('WebSocket server attached to HTTP server');
  }
  return wss;
}

function safeSend(ws: WebSocket, payload: string): void {
  try {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  } catch {
    // Connection broken — heartbeat will clean it up
  }
}

export function broadcastMessage(tokenMint: string, message: ChatMessage, tokenSymbol?: string): void {
  const payload = JSON.stringify({
    type: 'message',
    data: message,
  });

  // Broadcast to token-specific room
  const subscribers = rooms.get(tokenMint);
  if (subscribers) {
    subscribers.forEach((ws) => safeSend(ws, payload));
  }

  // Broadcast to global feed subscribers with tokenSymbol
  if (feedSubscribers.size > 0) {
    const feedPayload = JSON.stringify({
      type: 'message',
      data: { ...message, tokenSymbol: tokenSymbol || tokenMint.slice(0, 6) },
    });
    feedSubscribers.forEach((ws) => safeSend(ws, feedPayload));
  }
}

export function broadcastRankingUpdate(tokenMint: string, holders: Holder[]): void {
  const subscribers = rooms.get(tokenMint);
  if (!subscribers) return;

  const payload = JSON.stringify({
    type: 'rankings',
    data: holders.map((h) => ({ ...h, balance: h.balance.toString() })),
  });

  subscribers.forEach((ws) => safeSend(ws, payload));
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

  subscribers.forEach((ws) => safeSend(ws, payload));
}

export function getActiveTokenMints(): string[] {
  return Array.from(rooms.keys());
}
