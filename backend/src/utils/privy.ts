import { PrivyClient, verifyAccessToken } from '@privy-io/node';
import type { VerifyAccessTokenResponse } from '@privy-io/node';
import { config } from './config.js';

export const privyClient = new PrivyClient({
  appId: config.privyAppId,
  appSecret: config.privyAppSecret,
});

export async function verifyPrivyToken(token: string): Promise<VerifyAccessTokenResponse> {
  return verifyAccessToken({
    access_token: token,
    app_id: config.privyAppId,
    verification_key: config.privyVerificationKey,
  });
}
