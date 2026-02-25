import { type Request, type Response, type NextFunction } from 'express';
import { privyClient, verifyPrivyToken } from '../utils/privy.js';
import { cache } from '../utils/cache.js';
import { query } from '../utils/database.js';

export interface AuthenticatedRequest extends Request {
  walletAddress?: string;
}

const WALLET_CACHE_TTL = 900; // 15 minutes

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Verify the Privy access token
    const claims = await verifyPrivyToken(token);

    // 2. Resolve Solana wallet address (with cache)
    const cacheKey = `privy:wallet:${claims.user_id}`;
    let walletAddress = cache.get(cacheKey);

    if (!walletAddress) {
      const user = await privyClient.users()._get(claims.user_id);
      const solanaWallet = user.linked_accounts.find(
        (account) =>
          account.type === 'wallet' &&
          'chain_type' in account &&
          account.chain_type === 'solana'
      );

      if (!solanaWallet || !('address' in solanaWallet)) {
        res.status(401).json({ error: 'No linked Solana wallet found' });
        return;
      }

      walletAddress = solanaWallet.address;
      cache.set(cacheKey, walletAddress, WALLET_CACHE_TTL);
    }

    req.walletAddress = walletAddress;

    // 3. Upsert user (fire-and-forget — don't block the request)
    query(
      `INSERT INTO users (wallet_address) VALUES ($1)
       ON CONFLICT (wallet_address) DO UPDATE SET last_active = NOW()`,
      [walletAddress]
    ).catch((err) => console.error('User upsert failed:', err));

    next();
  } catch (error) {
    console.error('Privy auth verification failed:', error);
    res.status(401).json({ error: 'Invalid or expired access token' });
  }
}
