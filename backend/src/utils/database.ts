import pg from 'pg';
import dns from 'node:dns';
import { config } from './config.js';

// Force IPv4 — Railway doesn't support IPv6 outbound
dns.setDefaultResultOrder('ipv4first');

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('PostgreSQL connected');
  } finally {
    client.release();
  }
}
