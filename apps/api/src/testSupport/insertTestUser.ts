import { pool } from "../db";

/**
 * Inserts a user row so tests can satisfy the places table's user_id
 * foreign key — most persistence tests need a valid user to attach places
 * to; this is the shared way to get one.
 */
export async function insertTestUser(
  id = "test-user",
  email = "test-user@example.com",
): Promise<string> {
  await pool.query(
    "insert into users (id, email) values ($1, $2) on conflict (id) do nothing",
    [id, email],
  );
  return id;
}
