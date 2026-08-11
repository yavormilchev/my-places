import { defineConfig } from "vitest/config";

// apps/api runs in plain Node, but component tests here need a DOM to
// render into — jsdom provides that. See the root vitest.config.ts for how
// this file gets discovered.
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/testSupport/setup.ts"],
  },
});
