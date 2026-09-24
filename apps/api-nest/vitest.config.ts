import { defineConfig } from 'vitest/config';
import { loadTestDatabaseUrl } from './vitest.env.js';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    env: {
      DATABASE_URL: loadTestDatabaseUrl(),
    },
    // Some *.spec.ts files (e.g. users.repository.spec.ts) hit the real
    // test database — see loadTestDatabaseUrl.
    fileParallelism: false,
  },
});
