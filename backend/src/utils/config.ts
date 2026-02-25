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
  privyVerificationKey: requireEnv('PRIVY_VERIFICATION_KEY'),
};
