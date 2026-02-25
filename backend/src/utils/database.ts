import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('[DB] Pool error:', err.message);
});

export async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    if (config.nodeEnv !== 'production') {
      console.log('PostgreSQL connected');
    }
  } finally {
    client.release();
  }
}
