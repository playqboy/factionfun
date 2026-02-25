import { Router, type Request, type Response } from 'express';
import { fetchWalletHoldings } from '../services/walletService.js';
import { isValidSolanaAddress } from '../utils/validation.js';
import { publicApiLimiter } from '../middleware/rateLimit.js';

export const walletRoutes = Router();

// GET /api/wallet/:address/holdings
walletRoutes.get('/:address/holdings', publicApiLimiter, async (req: Request, res: Response) => {
  const { address } = req.params;

  if (!isValidSolanaAddress(address)) {
    res.status(400).json({ error: 'Invalid wallet address' });
    return;
  }

  try {
    const holdings = await fetchWalletHoldings(address);
    res.json(holdings);
  } catch {
    res.status(500).json({ error: 'Failed to fetch wallet holdings' });
  }
});
