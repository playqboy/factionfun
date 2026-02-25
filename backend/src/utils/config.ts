import dotenv from 'dotenv';
dotenv.config();

export interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  solanaRpcUrl: string;
  heliusApiKey: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  privyAppId: string;
  privyAppSecret: string;
  privyVerificationKey: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';

/** Normalize a PEM key that may arrive with escaped newlines, literal \n, or no headers at all. */
function normalizePem(raw: string): string {
  // 1. Replace literal two-char sequences "\ n" with real newlines
  let key = raw.replace(/\\n/g, '\n').trim();

  // 2. If it already looks like a valid PEM, return it
  if (key.startsWith('-----BEGIN')) {
    return key;
  }

  // 3. Strip any whitespace/newlines from the base64 body, then wrap in PEM headers
  const body = key.replace(/[\s\r\n]+/g, '');
  // Wrap at 64-char lines (PEM standard)
  const lines = body.match(/.{1,64}/g) ?? [body];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
}

export const config: Config = {
  nodeEnv,
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: requireEnv('DATABASE_URL'),
  solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  heliusApiKey: requireEnv('HELIUS_API_KEY'),
  corsOrigin: nodeEnv === 'production' ? requireEnv('CORS_ORIGIN') : (process.env.CORS_ORIGIN || 'http://localhost:3000'),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  privyAppId: requireEnv('PRIVY_APP_ID'),
  privyAppSecret: requireEnv('PRIVY_APP_SECRET'),
  privyVerificationKey: normalizePem(requireEnv('PRIVY_VERIFICATION_KEY')),
};
