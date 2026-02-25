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
  await testConnection();

  // Create Express app
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: config.nodeEnv === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'https:', 'wss:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    } : false,
  }));
  app.use(cors({
    origin: config.nodeEnv === 'production' ? config.corsOrigin : true,
  }));
  app.use(express.json({ limit: '16kb' }));
  app.use(globalLimiter);

  // Health check — verifies DB connectivity
  app.get('/health', async (_req, res) => {
    try {
      await query('SELECT 1');
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    } catch {
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
    if (config.nodeEnv !== 'production') {
      console.error('Unhandled error:', err);
    }
    res.status(500).json({ error: 'Internal server error' });
  });

  // Create HTTP server and attach WebSocket to the same server
  const httpServer = createServer(app);
  const wss = createWebSocketServer(httpServer);

  httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });

  // Start background ranking job
  startRankingJob();

  // Graceful shutdown with forced exit timeout
  const shutdown = async () => {
    const forceExit = setTimeout(() => {
      process.exit(1);
    }, 10000);

    try {
      httpServer.close();
      wss.close();
      await pool.end();
    } catch {
      // Best-effort shutdown
    }

    clearTimeout(forceExit);
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
