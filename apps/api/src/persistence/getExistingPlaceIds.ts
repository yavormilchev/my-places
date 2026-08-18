import { pool } from "../db";

export async function getExistingPlaceIds(
  userId: string,
): Promise<Set<string>> {
  const { rows } = await pool.query<{ place_id: string }>(
    "select place_id from places where user_id = $1",
    [userId],
  );
  return new Set(rows.map((r) => r.place_id));
}
