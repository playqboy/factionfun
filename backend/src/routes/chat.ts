import { Router, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { requireTop10 } from '../middleware/verify.js';
import { chatMessageLimiter } from '../middleware/rateLimit.js';
import { storeMessage, getMessages, getRecentMessagesGlobal, getTokenSymbol } from '../services/chatService.js';
import { broadcastMessage } from '../websocket/handlers.js';
import { isValidSolanaAddress } from '../utils/validation.js';

export const chatRoutes = Router();

// GET /api/chat/recent — recent messages across all tokens (for homepage feed)
chatRoutes.get('/recent', async (_req, res) => {
  try {
    const messages = await getRecentMessagesGlobal(20);
    res.json(messages);
  } catch (err) {
    console.error('Failed to fetch recent messages:', err);
    res.status(500).json({ error: 'Failed to fetch recent messages' });
  }
});

// GET /api/chat/:mint/messages?limit=50&offset=0
chatRoutes.get('/:mint/messages', async (req, res) => {
  const { mint } = req.params;

  if (!isValidSolanaAddress(mint)) {
    res.status(400).json({ error: 'Invalid token mint address' });
    return;
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

  try {
    const messages = await getMessages(mint, limit, offset);
    res.json(messages);
  } catch (err) {
    console.error('Failed to fetch messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/chat/message
chatRoutes.post(
  '/message',
  requireAuth,
  requireTop10(),
  chatMessageLimiter,
  async (req: AuthenticatedRequest, res: Response) => {
    const { tokenMint, content } = req.body;
    const walletAddress = req.walletAddress!;

    if (!tokenMint || !content) {
      res.status(400).json({ error: 'Missing tokenMint or content' });
      return;
    }

    if (!isValidSolanaAddress(tokenMint)) {
      res.status(400).json({ error: 'Invalid token mint address' });
      return;
    }

    try {
      const [message, tokenSymbol] = await Promise.all([
        storeMessage(tokenMint, walletAddress, content, 'verified'),
        getTokenSymbol(tokenMint),
      ]);
      broadcastMessage(tokenMint, message, tokenSymbol);
      res.json({ messageId: message.id, status: 'sent' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Failed to send message:', err);
      res.status(400).json({ error: errorMessage });
    }
  }
);
