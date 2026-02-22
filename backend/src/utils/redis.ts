import { createClient, type RedisClientType } from 'redis';
import { config } from './config.js';

export const redisClient: RedisClientType = createClient({
  url: config.redisUrl,
});

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis connected');
});

export async function connectRedis(): Promise<void> {
  await redisClient.connect();
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await redisClient.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  const raw = JSON.stringify(value);
  if (ttlSeconds) {
    await redisClient.set(key, raw, { EX: ttlSeconds });
  } else {
    await redisClient.set(key, raw);
  }
}
