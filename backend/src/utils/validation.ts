import { PublicKey } from '@solana/web3.js';

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeMessageContent(content: string): string {
  return content
    .replace(/<[^>]*>?/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .slice(0, 500);
}

export function validateMessageContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  if (content.length > 500) {
    return { valid: false, error: 'Message too long (max 500 characters)' };
  }
  return { valid: true };
}
