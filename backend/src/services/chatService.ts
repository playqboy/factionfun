import { query } from '../utils/database.js';
import { cache } from '../utils/cache.js';
import { sanitizeMessageContent, validateMessageContent } from '../utils/validation.js';
import type { ChatMessage } from '../types/index.js';

export interface FeedMessage {
  id: number;
  tokenMint: string;
  walletAddress: string;
  content: string;
  createdAt: Date;
  tokenSymbol: string;
}

export async function storeMessage(
  tokenMint: string,
  walletAddress: string,
  content: string,
  signature: string
): Promise<ChatMessage> {
  const sanitized = sanitizeMessageContent(content);
  const validation = validateMessageContent(sanitized);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const result = await query(
    `INSERT INTO messages (token_mint, wallet_address, content, signature)
     VALUES ($1, $2, $3, $4)
     RETURNING id, token_mint, wallet_address, content, signature, created_at`,
    [tokenMint, walletAddress, sanitized, signature]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    tokenMint: row.token_mint,
    walletAddress: row.wallet_address,
    content: row.content,
    signature: row.signature,
    createdAt: row.created_at,
  };
}

export async function getMessages(
  tokenMint: string,
  limit: number = 50,
  offset: number = 0
): Promise<ChatMessage[]> {
  const result = await query(
    `SELECT id, token_mint, wallet_address, content, signature, created_at
     FROM messages
     WHERE token_mint = $1
     ORDER BY created_at ASC
     LIMIT $2 OFFSET $3`,
    [tokenMint, Math.min(limit, 100), offset]
  );

  return result.rows.map((row) => ({
    id: row.id,
    tokenMint: row.token_mint,
    walletAddress: row.wallet_address,
    content: row.content,
    signature: row.signature,
    createdAt: row.created_at,
  }));
}

export async function getRecentMessagesGlobal(
  limit: number = 20
): Promise<FeedMessage[]> {
  const result = await query(
    `SELECT id, token_mint, wallet_address, content, created_at
     FROM messages
     ORDER BY created_at DESC
     LIMIT $1`,
    [Math.min(limit, 50)]
  );

  // Batch fetch cached symbols for all unique mints
  const mints = [...new Set(result.rows.map((r) => r.token_mint))];
  const symbolMap = new Map<string, string>();

  if (mints.length > 0) {
    const keys = mints.map((m) => `tokeninfo:${m}`);
    const cached = cache.mGet(keys);
    for (let i = 0; i < mints.length; i++) {
      const raw = cached[i];
      if (raw) {
        try {
          const info = JSON.parse(raw);
          symbolMap.set(mints[i], info.symbol || mints[i].slice(0, 6));
        } catch {
          symbolMap.set(mints[i], mints[i].slice(0, 6));
        }
      } else {
        symbolMap.set(mints[i], mints[i].slice(0, 6));
      }
    }
  }

  return result.rows.map((row) => ({
    id: row.id,
    tokenMint: row.token_mint,
    walletAddress: row.wallet_address,
    content: row.content,
    createdAt: row.created_at,
    tokenSymbol: symbolMap.get(row.token_mint) || row.token_mint.slice(0, 6),
  }));
}

export async function getTokenSymbol(tokenMint: string): Promise<string> {
  try {
    const cached = cache.get(`tokeninfo:${tokenMint}`);
    if (cached) {
      const info = JSON.parse(cached);
      return info.symbol || tokenMint.slice(0, 6);
    }
  } catch { /* ignore */ }
  return tokenMint.slice(0, 6);
}
