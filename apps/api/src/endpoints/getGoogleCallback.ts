import type { Request, Response } from "express";
import { sendAuthErrorPage } from "../auth/authErrorPage";
import { verifyGoogleAuthCode, type GoogleIdentity } from "../auth/googleOAuth";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "../auth/session";
import { env } from "../config";
import { logger } from "../logger";
import { upsertUser } from "../persistence/upsertUser";

export async function getGoogleCallback(
  req: Request,
  res: Response,
): Promise<void> {
  const code = req.query.code;
  if (typeof code !== "string") {
    sendAuthErrorPage(res, 401, "Something went wrong completing sign-in.");
    return;
  }

  let identity: GoogleIdentity;
  try {
    identity = await verifyGoogleAuthCode(code);
  } catch (err) {
    logger.error({ err }, "Google OAuth code exchange failed");
    sendAuthErrorPage(res, 401, "Something went wrong completing sign-in.");
    return;
  }

  if (!env.allowedEmails.includes(identity.email.toLowerCase())) {
    logger.warn(
      { email: identity.email },
      "Rejected sign-in from non-allowlisted email",
    );
    sendAuthErrorPage(
      res,
      403,
      "This app is restricted to a specific set of Google accounts, and this isn't one of them.",
    );
    return;
  }

  await upsertUser(identity.sub, identity.email);

  const token = createSessionToken({
    userId: identity.sub,
    email: identity.email,
  });
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS * 1000,
  });

  res.redirect(env.webAppUrl);
}
