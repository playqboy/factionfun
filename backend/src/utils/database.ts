import pg from 'pg';
import dns from 'dns';
import { config } from './config.js';

const { Pool } = pg;

// Force IPv4 preference at the process level
dns.setDefaultResultOrder('ipv4first');

export let pool: pg.Pool;

export async function initPool(): Promise<void> {
  let connectionString = config.databaseUrl;

  // Explicitly resolve hostname to IPv4 to avoid ENETUNREACH on IPv6-only resolution
  try {
    const url = new URL(connectionString);
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) {
      const [ipv4] = await dns.promises.resolve4(url.hostname);
      if (ipv4) {
        url.hostname = ipv4;
        connectionString = url.toString();
      }
    }
  } catch {
    // Fall through with original URL
  }

  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: config.nodeEnv === 'production'
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false },
  });

  pool.on('error', (err) => {
    console.error('[DB] Pool error:', err.message);
  });
}

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
