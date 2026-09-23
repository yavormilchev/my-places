import { defineConfig } from 'vitest/config';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

// Loaded here so the override below applies before any test file imports
// app code — by the time PgPool reads process.env.DATABASE_URL, it must
// already be pointed at the test database, not the real one. Mirrors
// apps/api/vitest.config.ts.
loadEnv({
  path: path.resolve(import.meta.dirname, '../../.env'),
  quiet: true,
});

if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'Missing required env var: TEST_DATABASE_URL (see .env.example)',
  );
}

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'api-nest:e2e',
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL,
    },
    fileParallelism: false,
  },
});
