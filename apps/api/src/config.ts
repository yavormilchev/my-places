import { config } from "dotenv";
import path from "node:path";

config({
  path: path.resolve(import.meta.dirname, "../../../.env"),
  quiet: true,
});

export function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

/**
 * A curated, multi-person allowlist rather than open sign-up.
 */
export function parseAllowedEmails(raw: string): string[] {
  const emails = raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);

  if (emails.length === 0) {
    throw new Error("ALLOWED_EMAILS resolved to zero valid addresses");
  }

  return emails;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required("DATABASE_URL", process.env.DATABASE_URL),
  isProduction: process.env.NODE_ENV === "production",
  logLevel: process.env.LOG_LEVEL ?? "info",
  googlePlacesServerSideApiKey: required(
    "GOOGLE_PLACES_SERVER_SIDE_API_KEY",
    process.env.GOOGLE_PLACES_SERVER_SIDE_API_KEY,
  ),
  googleOAuthClientId: required(
    "GOOGLE_OAUTH_CLIENT_ID",
    process.env.GOOGLE_OAUTH_CLIENT_ID,
  ),
  googleOAuthClientSecret: required(
    "GOOGLE_OAUTH_CLIENT_SECRET",
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  ),
  googleOAuthRedirectUri: required(
    "GOOGLE_OAUTH_REDIRECT_URI",
    process.env.GOOGLE_OAUTH_REDIRECT_URI,
  ),
  // Where to send the browser after a successful sign-in — the web app's
  // origin, not the API's. Differs between dev (Vite) and prod (nginx).
  webAppUrl: required("WEB_APP_URL", process.env.WEB_APP_URL),
  allowedEmails: parseAllowedEmails(
    required("ALLOWED_EMAILS", process.env.ALLOWED_EMAILS),
  ),
  sessionSecret: required("SESSION_SECRET", process.env.SESSION_SECRET),
};
