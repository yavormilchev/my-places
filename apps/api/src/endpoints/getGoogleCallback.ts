import type { Request, Response } from "express";
import { verifyGoogleAuthCode } from "../auth/googleOAuth";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "../auth/session";
import { env } from "../config";
import { logger } from "../logger";

export async function getGoogleCallback(
  req: Request,
  res: Response,
): Promise<void> {
  const code = req.query.code;
  if (typeof code !== "string") {
    res
      .status(400)
      .json({ status: "error", message: "Missing authorization code" });
    return;
  }

  let identity: { email: string };
  try {
    identity = await verifyGoogleAuthCode(code);
  } catch (err) {
    logger.error({ err }, "Google OAuth code exchange failed");
    res.status(401).json({ status: "error", message: "Sign-in failed" });
    return;
  }

  if (identity.email.toLowerCase() !== env.allowedEmail.toLowerCase()) {
    logger.warn(
      { email: identity.email },
      "Rejected sign-in from non-allowlisted email",
    );
    res.status(403).json({ status: "error", message: "Not authorized" });
    return;
  }

  const token = createSessionToken({ email: identity.email });
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS * 1000,
  });

  res.redirect(env.webAppUrl);
}
