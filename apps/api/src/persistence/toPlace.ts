import type { Place } from "@my-places/shared";

/** A raw `places` table row, exactly as `pg` returns it. */
export interface PlaceRow {
  place_id: string;
  title: string;
  resolved_title: string | null;
  list_name: string;
  url: string;
  lat: number;
  lng: number;
  types: string[];
  saved_at: Date;
}

export function toPlace(row: PlaceRow): Place {
  return {
    placeId: row.place_id,
    title: row.title,
    resolvedTitle: row.resolved_title,
    category: row.list_name,
    types: row.types,
    url: row.url,
    lat: row.lat,
    lng: row.lng,
    savedAt: row.saved_at.toISOString(),
  };
}
