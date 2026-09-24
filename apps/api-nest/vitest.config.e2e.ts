import { defineConfig } from 'vitest/config';
import { loadTestDatabaseUrl } from './vitest.env.js';

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
      DATABASE_URL: loadTestDatabaseUrl(),
    },
    fileParallelism: false,
  },
});
