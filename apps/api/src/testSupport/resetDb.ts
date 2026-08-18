import { pool } from "../db";

/**
 * Empties the places and users tables. Meant for use in beforeEach/afterEach
 * in tests that hit the database for real — tests run against
 * my_places_test (see vitest.config.ts), never the real database, so this
 * is safe to call freely. Both tables in one statement so Postgres handles
 * the places → users foreign key itself, without needing CASCADE.
 */
export async function resetDb(): Promise<void> {
  await pool.query("truncate table places, users");
}
