import { fetchTopHolders } from '../services/holderService.js';
import { pool } from '../utils/database.js';
import { redisClient } from '../utils/redis.js';
import { getActiveTokenMints, broadcastRankingUpdate, broadcastMembershipEvent } from '../websocket/handlers.js';

const UPDATE_INTERVAL = 30000; // 30 seconds
const LOCK_TTL = 25; // seconds

async function updateRankingsForToken(tokenMint: string): Promise<void> {
  // Redis lock to prevent overlapping runs
  const lockKey = `lock:rankings:${tokenMint}`;
  const acquired = await redisClient.set(lockKey, '1', { EX: LOCK_TTL, NX: true });
  if (!acquired) return;

  const client = await pool.connect();
  try {
    // 1. Fetch current top 10
    const newHolders = await fetchTopHolders(tokenMint);

    // 2. Load previous rankings from DB
    const previousResult = await client.query(
      'SELECT wallet_address, rank FROM rankings WHERE token_mint = $1',
      [tokenMint]
    );
    const previousWallets = new Set(previousResult.rows.map((r: { wallet_address: string }) => r.wallet_address));
    const newWallets = new Set(newHolders.map((h) => h.walletAddress));

    // 3. Detect membership changes — batch event inserts
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

    // 4. Run all DB writes in a single transaction
    await client.query('BEGIN');

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

    // 5. Broadcast updates (outside transaction)
    for (const e of enterEvents) broadcastMembershipEvent(tokenMint, 'user_joined', e.wallet, e.rank);
    for (const e of leaveEvents) broadcastMembershipEvent(tokenMint, 'user_left', e.wallet, e.rank);
    broadcastRankingUpdate(tokenMint, newHolders);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(`Failed to update rankings for ${tokenMint}:`, err);
  } finally {
    client.release();
    await redisClient.del(lockKey);
  }
}

export function startRankingJob(): void {
  console.log(`Ranking update job started (every ${UPDATE_INTERVAL / 1000}s)`);

  setInterval(async () => {
    const activeTokens = getActiveTokenMints();
    if (activeTokens.length === 0) return;

    await Promise.allSettled(activeTokens.map(updateRankingsForToken));
  }, UPDATE_INTERVAL);
}
