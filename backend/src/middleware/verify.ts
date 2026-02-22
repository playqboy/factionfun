import { type Response, type NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.js';
import { getUserStatus } from '../services/holderService.js';

export function requireTop10(mintParamName: string = 'mint') {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const tokenMint = req.params[mintParamName] || req.body.tokenMint;
    const walletAddress = req.walletAddress;

    if (!walletAddress || !tokenMint) {
      res.status(400).json({ error: 'Missing wallet address or token mint' });
      return;
    }

    try {
      const status = await getUserStatus(tokenMint, walletAddress);
      if (!status.isInTop10) {
        res.status(403).json({ error: 'Not in top 10 holders' });
        return;
      }
      next();
    } catch (err) {
      console.error('Top 10 verification failed:', err);
      res.status(500).json({ error: 'Failed to verify holder status' });
    }
  };
}
