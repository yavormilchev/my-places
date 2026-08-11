import type { Place } from "@my-places/shared";
import { pool } from "../db";
import { toPlace, type PlaceRow } from "./toPlace";

export async function listPlaces(): Promise<Place[]> {
  const { rows } = await pool.query<PlaceRow>("select * from places");
  return rows.map(toPlace);
}
