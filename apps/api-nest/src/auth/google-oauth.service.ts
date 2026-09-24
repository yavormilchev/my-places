import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config.js';

export interface GoogleIdentity {
  /** Google's stable, immutable identifier for the account */
  sub: string;
  email: string;
  emailVerified: boolean;
}

@Injectable()
export class GoogleOAuthService {
  private readonly client = new OAuth2Client(
    env.googleOAuthClientId,
    env.googleOAuthClientSecret,
    env.googleOAuthRedirectUri,
  );

  getAuthorizationUrl(): string {
    return this.client.generateAuthUrl({
      // We only need to confirm identity once, not call Google APIs on the
      // user's behalf later — no refresh token, no offline access. The
      // Data Portability API would have needed that, but it's unavailable
      // for US accounts!
      access_type: 'online',
      scope: ['openid', 'email'],
      prompt: 'select_account',
    });
  }

  // Exchanges the one-time auth code for tokens, then verifies the ID
  // token's signature against Google's public keys before trusting
  // anything in it.
  async verifyAuthCode(code: string): Promise<GoogleIdentity> {
    const { tokens } = await this.client.getToken(code);

    if (!tokens.id_token) {
      throw new Error('Google token response did not include an ID token');
    }

    const ticket = await this.client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.googleOAuthClientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new Error('Google ID token did not include an email');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified ?? false,
    };
  }
}
