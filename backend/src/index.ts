import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { config } from './utils/config.js';
import { pool, query, testConnection } from './utils/database.js';
import { tokenRoutes } from './routes/token.js';
import { chatRoutes } from './routes/chat.js';
import { walletRoutes } from './routes/wallet.js';
import { favoriteRoutes } from './routes/favorite.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { createWebSocketServer } from './websocket/handlers.js';
import { startRankingJob } from './jobs/updateRankings.js';

async function main() {
  console.log(`[BOOT] NODE_ENV=${config.nodeEnv} PORT=${config.port}`);
  const vk = config.privyVerificationKey;
  console.log(`[BOOT] Privy verification key: ${vk.startsWith('-----BEGIN') ? 'PEM format OK' : 'WARNING: not PEM'} (${vk.length} chars)`);
  console.log(`[BOOT] Testing database connection...`);
  await testConnection();
  console.log(`[BOOT] Database OK`);

  // Create Express app
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: config.nodeEnv === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'https:', 'wss:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        frameAncestors: ["'none'"],
      },
    } : false,
  }));
  const allowedOrigins = config.nodeEnv === 'production'
    ? config.corsOrigin.split(',').flatMap(s => {
        const o = s.trim().replace(/\/+$/, '');
        return o.includes('://www.')
          ? [o, o.replace('://www.', '://')]
          : [o, o.replace('://', '://www.')];
      })
    : null;
  console.log('[CORS] Allowed origins:', allowedOrigins ?? 'all (development)');
  app.use(cors({
    origin: allowedOrigins ?? true,
    credentials: true,
  }));
  app.use(express.json({ limit: '16kb' }));
  app.use(globalLimiter);

  // Simple request logger (method + path + status + time)
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`[HTTP] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
  });

  // Liveness probe — no dependencies, just proves the process is alive
  app.get('/ping', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Readiness check — verifies DB connectivity
  app.get('/health', async (_req, res) => {
    try {
      const start = Date.now();
      await query('SELECT 1');
      console.log(`[HEALTH] DB check OK (${Date.now() - start}ms)`);
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    } catch (err) {
      console.error(`[HEALTH] DB check FAILED:`, err instanceof Error ? err.message : err);
      res.status(503).json({ status: 'unhealthy', timestamp: new Date().toISOString() });
    }
  });

  // Routes
  app.use('/api/token', tokenRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/favorites', favoriteRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[EXPRESS] Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Create HTTP server and attach WebSocket to the same server
  const httpServer = createServer(app);
  const wss = createWebSocketServer(httpServer);

  httpServer.listen(config.port, () => {
    console.log(`[BOOT] Server running on port ${config.port}`);
    console.log(`[BOOT] Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB RSS`);
  });

  // Start background ranking job
  startRankingJob();

  // Log memory usage every 60s to detect leaks / OOM
  setInterval(() => {
    const mem = process.memoryUsage();
    console.log(`[MEM] RSS=${Math.round(mem.rss / 1024 / 1024)}MB Heap=${Math.round(mem.heapUsed / 1024 / 1024)}/${Math.round(mem.heapTotal / 1024 / 1024)}MB`);
  }, 60000);

  // Graceful shutdown with forced exit timeout
  const shutdown = async (signal: string) => {
    console.log(`[SHUTDOWN] Received ${signal}, shutting down...`);
    const forceExit = setTimeout(() => {
      console.error('[SHUTDOWN] Forced exit after 10s timeout');
      process.exit(1);
    }, 10000);

    try {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
      wss.close();
      await pool.end();
      console.log('[SHUTDOWN] Clean shutdown complete');
    } catch (err) {
      console.error('[SHUTDOWN] Error during shutdown:', err instanceof Error ? err.message : err);
    }

    clearTimeout(forceExit);
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Log unhandled rejections but keep running — these are usually non-fatal
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled promise rejection:', reason);
});

// Uncaught exceptions leave the process in an undefined state — log and EXIT
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception — exiting:', err);
  process.exit(1);
});

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
