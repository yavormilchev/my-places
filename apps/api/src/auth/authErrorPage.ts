import type { Response } from "express";

/**
 * The OAuth callback is a full-page browser navigation, not a fetch() call
 * like the rest of the API — whatever's sent here renders directly in the
 * person's browser, so it gets an actual page instead of a JSON error body.
 *
 * `message` is always a fixed string written by the caller, never user
 * input (e.g. never the attempted email) — it's interpolated unescaped.
 */
export function sendAuthErrorPage(
  res: Response,
  status: number,
  message: string,
): void {
  res
    .status(status)
    .type("html")
    .send(
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Sign-in failed</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
        background: #f1f3f4;
        color: #202124;
      }
      main {
        text-align: center;
        max-width: 24rem;
        padding: 2rem;
      }
      h1 {
        font-size: 1.25rem;
        margin-bottom: 0.5rem;
      }
      a {
        color: #4285f4;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Sign-in failed</h1>
      <p>${message}</p>
      <p><a href="/api/auth/google">Try again</a></p>
    </main>
  </body>
</html>
`,
    );
}
