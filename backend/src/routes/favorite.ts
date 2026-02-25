import { Router, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { isValidSolanaAddress } from '../utils/validation.js';
import { getFavorites, addFavorite, removeFavorite } from '../services/favoriteService.js';

export const favoriteRoutes = Router();

// GET /api/favorites
favoriteRoutes.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const favorites = await getFavorites(req.walletAddress!);
    res.json(favorites);
  } catch {
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// POST /api/favorites
favoriteRoutes.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { tokenMint, name, symbol, imageUri } = req.body;

  if (!tokenMint || !isValidSolanaAddress(tokenMint)) {
    res.status(400).json({ error: 'Invalid or missing token mint address' });
    return;
  }

  try {
    const favorite = await addFavorite(
      req.walletAddress!,
      tokenMint,
      name || null,
      symbol || null,
      imageUri || null,
    );
    res.status(201).json(favorite);
  } catch {
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// DELETE /api/favorites/:mint
favoriteRoutes.delete('/:mint', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { mint } = req.params;

  if (!isValidSolanaAddress(mint)) {
    res.status(400).json({ error: 'Invalid token mint address' });
    return;
  }

  try {
    const removed = await removeFavorite(req.walletAddress!, mint);
    if (!removed) {
      res.status(404).json({ error: 'Favorite not found' });
      return;
    }
    res.json({ status: 'removed' });
  } catch {
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});
