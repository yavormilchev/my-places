import type { NextFunction, Request, Response } from "express";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

// Everything behind this must already be allowlist-checked at sign-in time
// (see getGoogleCallback) — this middleware only confirms the cookie is a
// still-valid session, it doesn't re-check the email.
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token: unknown = req.cookies?.[SESSION_COOKIE_NAME];
  const session = typeof token === "string" ? verifySessionToken(token) : null;

  if (!session) {
    res.status(401).json({ status: "error", message: "Not signed in" });
    return;
  }

  next();
}
