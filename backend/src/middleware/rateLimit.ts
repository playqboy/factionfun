import { rateLimit } from 'express-rate-limit';
import { config } from '../utils/config.js';
import type { AuthenticatedRequest } from './auth.js';

// Global rate limiter (IP-based)
export const globalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// Public API rate limiter: 30 requests per minute per IP
export const publicApiLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  keyGenerator: (req) => req.ip || 'unknown',
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat message rate limiter: 1 message per 2 seconds per wallet
export const chatMessageLimiter = rateLimit({
  windowMs: 2000,
  max: 1,
  keyGenerator: (req) => {
    const wallet = (req as AuthenticatedRequest).walletAddress;
    if (!wallet) return req.ip || 'unknown';
    return wallet;
  },
  message: { error: 'Rate limit exceeded. Wait before sending another message.' },
  standardHeaders: true,
  legacyHeaders: false,
});
