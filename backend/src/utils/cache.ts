// In-memory TTL cache — replaces Redis for single-instance deployment

interface CacheEntry {
  value: string;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

// Cleanup expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) {
      store.delete(key);
    }
  }
}, 60_000);

export const cache = {
  get(key: string): string | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },

  set(key: string, value: string, ttlSeconds?: number): void {
    const expiresAt = ttlSeconds
      ? Date.now() + ttlSeconds * 1000
      : Date.now() + 3600_000; // default 1 hour
    store.set(key, { value, expiresAt });
  },

  del(key: string): void {
    store.delete(key);
  },

  mGet(keys: string[]): (string | null)[] {
    return keys.map((key) => this.get(key));
  },
};
