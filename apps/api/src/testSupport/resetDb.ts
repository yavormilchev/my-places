import { pool } from "../db";

/**
 * Empties the places table. Meant for use in beforeEach/afterEach in tests
 * that hit the database for real — tests run against my_places_test (see
 * vitest.config.ts), never the real database, so this is safe to call
 * freely.
 */
export async function resetDb(): Promise<void> {
  await pool.query("truncate table places");
}
