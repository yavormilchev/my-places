import type { Place } from "@my-places/shared";
import { pool } from "../db";
import { toPlace, type PlaceRow } from "./toPlace";

export async function listPlaces(userId: string): Promise<Place[]> {
  const { rows } = await pool.query<PlaceRow>(
    "select * from places where user_id = $1",
    [userId],
  );
  return rows.map(toPlace);
}
