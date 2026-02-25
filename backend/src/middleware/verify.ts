import { type Response, type NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.js';
import { getUserStatus } from '../services/holderService.js';
import { isValidSolanaAddress } from '../utils/validation.js';

export function requireTop10(mintParamName: string = 'mint') {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Use params first, fallback to body — but ensure they match if both present
    const paramMint = req.params[mintParamName];
    const bodyMint = req.body?.tokenMint;
    const tokenMint = paramMint || bodyMint;
    const walletAddress = req.walletAddress;

    if (!walletAddress || !tokenMint) {
      res.status(400).json({ error: 'Missing wallet address or token mint' });
      return;
    }

    // Prevent mismatch: if both param and body provide a mint, they must agree
    if (paramMint && bodyMint && paramMint !== bodyMint) {
      res.status(400).json({ error: 'Token mint mismatch' });
      return;
    }

    if (!isValidSolanaAddress(tokenMint)) {
      res.status(400).json({ error: 'Invalid token mint address' });
      return;
    }

    try {
      const status = await getUserStatus(tokenMint, walletAddress);
      if (!status.isInTop10) {
        res.status(403).json({ error: 'Not in top 10 holders' });
        return;
      }
      next();
    } catch {
      res.status(500).json({ error: 'Failed to verify holder status' });
    }
  };
}
