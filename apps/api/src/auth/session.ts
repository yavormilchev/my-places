import jwt from "jsonwebtoken";
import { env } from "../config";

export const SESSION_COOKIE_NAME = "my_places_session";
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export interface SessionPayload {
  email: string;
}

export function createSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, env.sessionSecret, {
    expiresIn: SESSION_TTL_SECONDS,
  });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, env.sessionSecret);
    if (typeof decoded === "string" || typeof decoded.email !== "string") {
      return null;
    }
    return { email: decoded.email };
  } catch {
    // Covers expiry, tampering, and wrong-secret cases alike — all of them
    // just mean "not signed in," not an error worth surfacing to the caller.
    return null;
  }
}
