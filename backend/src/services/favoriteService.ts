import { query } from '../utils/database.js';
import type { Favorite } from '../types/index.js';

export async function getFavorites(walletAddress: string): Promise<Favorite[]> {
  const result = await query(
    `SELECT id, wallet_address, token_mint, name, symbol, image_uri, created_at
     FROM favorites
     WHERE wallet_address = $1
     ORDER BY created_at DESC`,
    [walletAddress],
  );
  return result.rows.map((row) => ({
    id: row.id,
    walletAddress: row.wallet_address,
    tokenMint: row.token_mint,
    name: row.name,
    symbol: row.symbol,
    imageUri: row.image_uri,
    createdAt: row.created_at,
  }));
}

export async function addFavorite(
  walletAddress: string,
  tokenMint: string,
  name: string | null,
  symbol: string | null,
  imageUri: string | null,
): Promise<Favorite> {
  const result = await query(
    `INSERT INTO favorites (wallet_address, token_mint, name, symbol, image_uri)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (wallet_address, token_mint) DO NOTHING
     RETURNING id, wallet_address, token_mint, name, symbol, image_uri, created_at`,
    [walletAddress, tokenMint, name, symbol, imageUri],
  );

  // If ON CONFLICT hit, fetch existing row
  if (result.rows.length === 0) {
    const existing = await query(
      `SELECT id, wallet_address, token_mint, name, symbol, image_uri, created_at
       FROM favorites
       WHERE wallet_address = $1 AND token_mint = $2`,
      [walletAddress, tokenMint],
    );
    const row = existing.rows[0];
    return {
      id: row.id,
      walletAddress: row.wallet_address,
      tokenMint: row.token_mint,
      name: row.name,
      symbol: row.symbol,
      imageUri: row.image_uri,
      createdAt: row.created_at,
    };
  }

  const row = result.rows[0];
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    tokenMint: row.token_mint,
    name: row.name,
    symbol: row.symbol,
    imageUri: row.image_uri,
    createdAt: row.created_at,
  };
}

export async function removeFavorite(
  walletAddress: string,
  tokenMint: string,
): Promise<boolean> {
  const result = await query(
    `DELETE FROM favorites
     WHERE wallet_address = $1 AND token_mint = $2`,
    [walletAddress, tokenMint],
  );
  return (result.rowCount ?? 0) > 0;
}
