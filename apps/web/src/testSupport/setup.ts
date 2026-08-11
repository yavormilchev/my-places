// Extends vitest's expect with jest-dom's DOM matchers (toBeInTheDocument,
// etc.) for every test file in this package — see vitest.config.ts.
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Testing Library's own auto-cleanup only registers itself when it finds a
// global `afterEach` — we don't enable vitest's `globals` option (matching
// apps/api, which imports describe/it/expect explicitly), so it never
// fires on its own. Without this, a render() in one test leaves its DOM
// mounted for the next test in the same file.
afterEach(() => {
  cleanup();
});
