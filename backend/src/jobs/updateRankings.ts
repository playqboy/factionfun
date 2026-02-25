import { fetchTopHolders } from '../services/holderService.js';
import { pool } from '../utils/database.js';
import { cache } from '../utils/cache.js';
import { getActiveTokenMints, broadcastRankingUpdate, broadcastMembershipEvent } from '../websocket/handlers.js';
import { config } from '../utils/config.js';

const UPDATE_INTERVAL = 30000; // 30 seconds

// Simple in-memory lock set — prevents overlapping runs per token
const activeLocks = new Set<string>();

async function updateRankingsForToken(tokenMint: string): Promise<void> {
  if (activeLocks.has(tokenMint)) return;
  activeLocks.add(tokenMint);

  const client = await pool.connect();
  try {
    // 1. Acquire PostgreSQL advisory lock (prevents concurrent updates across instances)
    const lockId = hashStringToInt(tokenMint);
    const lockResult = await client.query('SELECT pg_try_advisory_lock($1)', [lockId]);
    if (!lockResult.rows[0].pg_try_advisory_lock) {
      return; // Another instance is already updating this token
    }

    try {
      // 2. Fetch current top 10
      const newHolders = await fetchTopHolders(tokenMint);

      // 3. Begin transaction — load previous rankings inside it for isolation
      await client.query('BEGIN');

      const previousResult = await client.query(
        'SELECT wallet_address, rank FROM rankings WHERE token_mint = $1 FOR UPDATE',
        [tokenMint]
      );
      const previousWallets = new Set(previousResult.rows.map((r: { wallet_address: string }) => r.wallet_address));
      const newWallets = new Set(newHolders.map((h) => h.walletAddress));

      // 4. Detect membership changes — batch event inserts
      const enterEvents: { wallet: string; rank: number }[] = [];
      const leaveEvents: { wallet: string; rank: number }[] = [];

      for (const holder of newHolders) {
        if (!previousWallets.has(holder.walletAddress)) {
          enterEvents.push({ wallet: holder.walletAddress, rank: holder.rank });
        }
      }
      for (const row of previousResult.rows) {
        if (!newWallets.has(row.wallet_address)) {
          leaveEvents.push({ wallet: row.wallet_address, rank: row.rank });
        }
      }

      // Batch insert membership events
      if (enterEvents.length > 0) {
        const values: unknown[] = [];
        const placeholders = enterEvents.map((e, i) => {
          const offset = i * 3;
          values.push(tokenMint, e.wallet, e.rank);
          return `($${offset + 1}, $${offset + 2}, 'enter_top10', $${offset + 3})`;
        });
        await client.query(
          `INSERT INTO membership_events (token_mint, wallet_address, event_type, rank_after) VALUES ${placeholders.join(', ')}`,
          values
        );
      }

      if (leaveEvents.length > 0) {
        const values: unknown[] = [];
        const placeholders = leaveEvents.map((e, i) => {
          const offset = i * 3;
          values.push(tokenMint, e.wallet, e.rank);
          return `($${offset + 1}, $${offset + 2}, 'leave_top10', $${offset + 3})`;
        });
        await client.query(
          `INSERT INTO membership_events (token_mint, wallet_address, event_type, rank_before) VALUES ${placeholders.join(', ')}`,
          values
        );
      }

      // Delete stale rankings + batch insert new ones in same transaction
      await client.query('DELETE FROM rankings WHERE token_mint = $1', [tokenMint]);

      if (newHolders.length > 0) {
        const values: unknown[] = [];
        const placeholders = newHolders.map((h, i) => {
          const offset = i * 5;
          values.push(tokenMint, h.rank, h.walletAddress, h.balance.toString(), h.percentage);
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
        });
        await client.query(
          `INSERT INTO rankings (token_mint, rank, wallet_address, balance, percentage) VALUES ${placeholders.join(', ')}`,
          values
        );
      }

      await client.query('COMMIT');

      // 5. Invalidate holder cache so next request gets fresh data
      cache.del(`holders:${tokenMint}`);

      // 6. Broadcast updates (outside transaction)
      for (const e of enterEvents) broadcastMembershipEvent(tokenMint, 'user_joined', e.wallet, e.rank);
      for (const e of leaveEvents) broadcastMembershipEvent(tokenMint, 'user_left', e.wallet, e.rank);
      broadcastRankingUpdate(tokenMint, newHolders);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      // Always release advisory lock
      await client.query('SELECT pg_advisory_unlock($1)', [lockId]).catch(() => {});
    }
  } catch (err) {
    console.error(`[RANKINGS] Failed to update ${tokenMint.slice(0, 8)}:`, err instanceof Error ? err.message : err);
  } finally {
    client.release();
    activeLocks.delete(tokenMint);
  }
}

// Hash a string to a stable 32-bit integer for pg_advisory_lock
function hashStringToInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

export function startRankingJob(): void {
  if (config.nodeEnv !== 'production') {
    console.log(`Ranking update job started (every ${UPDATE_INTERVAL / 1000}s)`);
  }

  setInterval(() => {
    const activeTokens = getActiveTokenMints();
    if (activeTokens.length === 0) return;
    Promise.allSettled(activeTokens.map(updateRankingsForToken)).catch(() => {});
  }, UPDATE_INTERVAL);
}
