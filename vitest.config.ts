import { defineConfig } from "vitest/config";

// Each package owns its own vitest.config.ts (or none, if it has no
// package-specific test setup) — this just discovers them. apps/api's
// carries the DB env override; nothing here applies to other packages.
// vitest.config.e2e.ts is included too, so e2e suites (currently just
// api-nest's) run as part of the same `npm test`/`npm run check`, rather
// than needing a separate command to remember.
export default defineConfig({
  test: {
    projects: ["apps/*/vitest.config.ts", "apps/*/vitest.config.e2e.ts"],
  },
});
