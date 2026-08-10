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
    // Multiple test files (syncPlaces, getExistingPlaceIds, ...) truncate
    // and write to the same my_places_test database via resetDb(). Running
    // test files in parallel means one file's resetDb() can wipe another
    // file's in-progress test data mid-assertion — a real race, not a
    // flaky test. This whole suite runs in well under a second, so
    // trading file-level parallelism for correctness costs nothing here.
    fileParallelism: false,
  },
});
