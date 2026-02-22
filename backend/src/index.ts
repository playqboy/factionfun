import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { config } from './utils/config.js';
import { pool, testConnection } from './utils/database.js';
import { redisClient, connectRedis } from './utils/redis.js';
import { tokenRoutes } from './routes/token.js';
import { chatRoutes } from './routes/chat.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { createWebSocketServer } from './websocket/handlers.js';
import { startRankingJob } from './jobs/updateRankings.js';

async function main() {
  // Connect to databases
  await testConnection();
  await connectRedis();

  // Create Express app
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use(globalLimiter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/token', tokenRoutes);
  app.use('/api/chat', chatRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Start HTTP server
  const httpServer = app.listen(config.port, () => {
    console.log(`HTTP server running on port ${config.port}`);
  });

  // Start WebSocket server
  const wss = createWebSocketServer(config.wsPort);

  // Start background ranking job
  startRankingJob();

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down...');
    httpServer.close();
    wss.close();
    await redisClient.quit();
    await pool.end();
    console.log('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
