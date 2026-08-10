import { defineConfig } from "vitest/config";

// Each package owns its own vitest.config.ts (or none, if it has no
// package-specific test setup) — this just discovers them. apps/api's
// carries the DB env override; nothing here applies to other packages.
export default defineConfig({
  test: {
    projects: ["apps/*/vitest.config.ts"],
  },
});
