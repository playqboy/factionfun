import { Router, type Request, type Response } from 'express';
import { fetchTopHolders, getUserStatus, fetchTokenInfo } from '../services/holderService.js';
import { isValidSolanaAddress } from '../utils/validation.js';
import { publicApiLimiter } from '../middleware/rateLimit.js';

export const tokenRoutes = Router();

// GET /api/token/:mint/top-holders
tokenRoutes.get('/:mint/top-holders', publicApiLimiter, async (req: Request, res: Response) => {
  const { mint } = req.params;

  if (!isValidSolanaAddress(mint)) {
    res.status(400).json({ error: 'Invalid token mint address' });
    return;
  }

  try {
    const holders = await fetchTopHolders(mint);
    const serialized = holders.map((h) => ({
      ...h,
      balance: h.balance.toString(),
    }));
    res.json(serialized);
  } catch {
    res.status(500).json({ error: 'Failed to fetch top holders' });
  }
});

// GET /api/token/:mint/user/:wallet
tokenRoutes.get('/:mint/user/:wallet', publicApiLimiter, async (req: Request, res: Response) => {
  const { mint, wallet } = req.params;

  if (!isValidSolanaAddress(mint) || !isValidSolanaAddress(wallet)) {
    res.status(400).json({ error: 'Invalid address format' });
    return;
  }

  try {
    const status = await getUserStatus(mint, wallet);
    const serialized = {
      ...status,
      balance: status.balance?.toString(),
    };
    res.json(serialized);
  } catch {
    res.status(500).json({ error: 'Failed to fetch user status' });
  }
});

// GET /api/token/:mint/info
tokenRoutes.get('/:mint/info', publicApiLimiter, async (req: Request, res: Response) => {
  const { mint } = req.params;

  if (!isValidSolanaAddress(mint)) {
    res.status(400).json({ error: 'Invalid token mint address' });
    return;
  }

  try {
    const info = await fetchTokenInfo(mint);
    res.json({
      ...info,
      totalSupply: info.totalSupply.toString(),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch token info' });
  }
});
