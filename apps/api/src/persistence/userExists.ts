import { pool } from "../db";

/**
 * Used by the CLI import to validate a --userId before doing anything else.
 */
export async function userExists(id: string): Promise<boolean> {
  const { rows } = await pool.query("select 1 from users where id = $1", [id]);
  return rows.length > 0;
}
