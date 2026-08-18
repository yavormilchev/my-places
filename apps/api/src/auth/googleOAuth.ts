import { OAuth2Client } from "google-auth-library";
import { env } from "../config";

const client = new OAuth2Client(
  env.googleOAuthClientId,
  env.googleOAuthClientSecret,
  env.googleOAuthRedirectUri,
);

export function getGoogleAuthorizationUrl(): string {
  return client.generateAuthUrl({
    // We only need to confirm identity once, not call Google APIs on the
    // user's behalf later — no refresh token, no offline access. The
    // Data Portability API would have needed that, but it's unavailable
    // for US accounts!
    access_type: "online",
    scope: ["openid", "email"],
    prompt: "select_account",
  });
}

export interface GoogleIdentity {
  /** Google's stable, immutable identifier for the account */
  sub: string;
  email: string;
  emailVerified: boolean;
}

// Exchanges the one-time auth code for tokens, then verifies the ID token's
// signature against Google's public keys before trusting anything in it.
export async function verifyGoogleAuthCode(
  code: string,
): Promise<GoogleIdentity> {
  const { tokens } = await client.getToken(code);

  if (!tokens.id_token) {
    throw new Error("Google token response did not include an ID token");
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.googleOAuthClientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new Error("Google ID token did not include an email");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified ?? false,
  };
}
