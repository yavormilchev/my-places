import {
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { env } from '../config.js';
import { UsersRepository } from '../users/users.repository.js';
import { sendAuthErrorPage } from './auth-error-page.js';
import {
  GoogleOAuthService,
  type GoogleIdentity,
} from './google-oauth.service.js';
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from './session.js';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly googleOAuth: GoogleOAuthService,
    private readonly users: UsersRepository,
  ) {}

  @Get('google')
  login(@Res() res: Response): void {
    res.redirect(this.googleOAuth.getAuthorizationUrl());
  }

  @Get('google/callback')
  async callback(
    @Query('code') code: unknown,
    @Res() res: Response,
  ): Promise<void> {
    if (typeof code !== 'string') {
      sendAuthErrorPage(res, 401, 'Something went wrong completing sign-in.');
      return;
    }

    let identity: GoogleIdentity;
    try {
      identity = await this.googleOAuth.verifyAuthCode(code);
    } catch (err) {
      this.logger.error('Google OAuth code exchange failed', err as Error);
      sendAuthErrorPage(res, 401, 'Something went wrong completing sign-in.');
      return;
    }

    if (!env.allowedEmails.includes(identity.email.toLowerCase())) {
      this.logger.warn(
        `Rejected sign-in from non-allowlisted email: ${identity.email}`,
      );
      sendAuthErrorPage(
        res,
        403,
        "This app is restricted to a specific set of Google accounts, and this isn't one of them.",
      );
      return;
    }

    await this.users.upsert(identity.sub, identity.email);

    const token = createSessionToken({
      userId: identity.sub,
      email: identity.email,
    });
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: 'lax',
      maxAge: SESSION_TTL_SECONDS * 1000,
    });

    res.redirect(env.webAppUrl);
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(SESSION_COOKIE_NAME);
  }
}
