import { PrivyClient, verifyAccessToken } from '@privy-io/node';
import type { VerifyAccessTokenResponse } from '@privy-io/node';
import { createRemoteJWKSet } from 'jose';
import { config } from './config.js';

export const privyClient = new PrivyClient({
  appId: config.privyAppId,
  appSecret: config.privyAppSecret,
});

// Use JWKS endpoint to fetch the verification key from Privy's servers.
// This is more reliable than a static key which can have formatting issues.
const PRIVY_API = 'https://api.privy.io';
const jwks = createRemoteJWKSet(
  new URL(`${PRIVY_API}/v1/apps/${config.privyAppId}/jwks.json`),
  { cacheMaxAge: 60 * 60 * 1000, cooldownDuration: 10 * 60 * 1000 },
);

let firstCall = true;
export async function verifyPrivyToken(token: string): Promise<VerifyAccessTokenResponse> {
  if (firstCall) {
    console.log(`[AUTH] verifyPrivyToken using: JWKS (typeof jwks = ${typeof jwks})`);
    firstCall = false;
  }
  return verifyAccessToken({
    access_token: token,
    app_id: config.privyAppId,
    verification_key: jwks,
  });
}
