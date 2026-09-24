import { config as loadEnv } from 'dotenv';
import path from 'node:path';

export function loadTestDatabaseUrl(): string {
  loadEnv({
    path: path.resolve(import.meta.dirname, '../../.env'),
    quiet: true,
  });

  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    throw new Error(
      'Missing required env var: TEST_DATABASE_URL (see .env.example)',
    );
  }
  return testDatabaseUrl;
}
