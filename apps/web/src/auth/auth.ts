const LOGIN_PATH = "/auth/google";
const LOGOUT_PATH = "/auth/logout";

/**
 * Thrown when the API rejects a request as unauthenticated — distinct from
 * other failures so callers can send the browser to sign-in instead of just
 * logging an error.
 */
export class UnauthorizedError extends Error {}

/** Sends the browser into the Google sign-in flow. */
export function redirectToLogin(): void {
  window.location.href = LOGIN_PATH;
}

/**
 * Clears the session cookie, then reloads. The resulting unauthenticated
 * places fetch is what actually sends the browser to sign-in (see
 * UnauthorizedError above) — kept this way so there's only one place in
 * the app that decides "not signed in → go to login".
 */
export async function logout(): Promise<void> {
  await fetch(LOGOUT_PATH, { method: "POST" });
  window.location.reload();
}
