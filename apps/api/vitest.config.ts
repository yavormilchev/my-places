import { defineConfig } from "vitest/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";

// Loaded here (not relying on config.ts's own dotenv.config()) so the
// override below applies before any test file imports app code — by the
// time db.ts reads process.env.DATABASE_URL, it must already be pointed at
// the test database, not the real one.
loadEnv({
  path: path.resolve(import.meta.dirname, "../../.env"),
  quiet: true,
});

if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    "Missing required env var: TEST_DATABASE_URL (see .env.example)",
  );
}

export default defineConfig({
  test: {
    env: {
      // Every DB-touching module just reads DATABASE_URL — overriding it
      // here means tests transparently run against my_places_test instead
      // of the real database, with zero test-awareness needed in app code.
      DATABASE_URL: process.env.TEST_DATABASE_URL,
    },
  },
});
