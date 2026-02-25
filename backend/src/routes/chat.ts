import { Router, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { requireTop10 } from '../middleware/verify.js';
import { chatMessageLimiter, publicApiLimiter } from '../middleware/rateLimit.js';
import { storeMessage, getMessages, getRecentMessagesGlobal, getTokenSymbol } from '../services/chatService.js';
import { broadcastMessage } from '../websocket/handlers.js';
import { isValidSolanaAddress } from '../utils/validation.js';

export const chatRoutes = Router();

// GET /api/chat/recent — recent messages across all tokens (for homepage feed)
chatRoutes.get('/recent', publicApiLimiter, async (_req, res) => {
  try {
    const messages = await getRecentMessagesGlobal(20);
    res.json(messages);
  } catch {
    res.status(500).json({ error: 'Failed to fetch recent messages' });
  }
});

// GET /api/chat/:mint/messages?limit=50&offset=0
chatRoutes.get('/:mint/messages', publicApiLimiter, async (req, res) => {
  const { mint } = req.params;

  if (!isValidSolanaAddress(mint)) {
    res.status(400).json({ error: 'Invalid token mint address' });
    return;
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = Math.min(Math.max(parseInt(req.query.offset as string) || 0, 0), 10000);

  try {
    const messages = await getMessages(mint, limit, offset);
    res.json(messages);
  } catch {
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

    if (!tokenMint || !content || typeof content !== 'string') {
      res.status(400).json({ error: 'Missing tokenMint or content' });
      return;
    }

    if (content.length > 500) {
      res.status(400).json({ error: 'Message too long (max 500 characters)' });
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
      // Only expose validation errors, not internal details
      const isValidationError = err instanceof Error &&
        (err.message === 'Message cannot be empty' || err.message === 'Message too long (max 500 characters)');
      res.status(400).json({
        error: isValidationError ? err.message : 'Failed to send message',
      });
    }
  }
);
