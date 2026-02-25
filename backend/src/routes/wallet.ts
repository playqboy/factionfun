import { Router, type Request, type Response } from 'express';
import { fetchWalletHoldings, fetchWalletRanks } from '../services/walletService.js';
import { isValidSolanaAddress } from '../utils/validation.js';
import { publicApiLimiter } from '../middleware/rateLimit.js';

export const walletRoutes = Router();

// GET /api/wallet/:address/holdings/ranks?mints=mint1,mint2,...
// Must be registered before /:address/holdings to avoid route shadowing
walletRoutes.get('/:address/holdings/ranks', publicApiLimiter, async (req: Request, res: Response) => {
  const { address } = req.params;
  const mintsParam = req.query.mints as string | undefined;

  if (!isValidSolanaAddress(address)) {
    res.status(400).json({ error: 'Invalid wallet address' });
    return;
  }

  if (!mintsParam) {
    res.status(400).json({ error: 'mints query parameter required' });
    return;
  }

  const mints = mintsParam.split(',').filter((m) => isValidSolanaAddress(m));
  if (mints.length === 0) {
    res.status(400).json({ error: 'No valid mints provided' });
    return;
  }

  try {
    const ranks = await fetchWalletRanks(address, mints);
    res.json({ wallet: address, ranks });
  } catch {
    res.status(500).json({ error: 'Failed to fetch wallet ranks' });
  }
});

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
