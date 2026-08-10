import { pool } from "../db";

export async function getExistingPlaceIds(): Promise<Set<string>> {
  const { rows } = await pool.query<{ place_id: string }>(
    "select place_id from places",
  );
  return new Set(rows.map((r) => r.place_id));
}
