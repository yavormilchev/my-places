import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SESSION_COOKIE_NAME, verifySessionToken } from './session.js';

// Everything behind this must already be allowlist-checked at sign-in time
// (see AuthController#callback) — this guard only confirms the cookie is a
// still-valid session, it doesn't re-check the email.
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token: unknown = request.cookies?.[SESSION_COOKIE_NAME];
    const session =
      typeof token === 'string' ? verifySessionToken(token) : null;

    if (!session) {
      throw new UnauthorizedException('Not signed in');
    }

    request.userId = session.userId;
    return true;
  }
}
