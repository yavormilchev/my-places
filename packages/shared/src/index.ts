export { haversineDistanceMiles } from "./haversineDistanceMiles";

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * A place as the API returns it. Not the DB row — see apps/api's
 * persistence/toPlace.ts for the mapping.
 */
export interface Place extends Coordinates {
  placeId: string;
  title: string;
  resolvedTitle: string | null;
  category: string;
  types: string[];
  url: string;
  savedAt: string; // ISO 8601
}

export interface PlacesQuery extends Coordinates {
  radiusMiles: number;
  categories: string[];
}

/** Distance is computed per-query, so it isn't part of Place. */
export interface PlaceWithDistance extends Place {
  distanceMiles: number;
}

export type ImportJobStatus = "pending" | "running" | "succeeded" | "failed";

export interface ImportJob {
  id: string;
  status: ImportJobStatus;
  source: "takeout" | "data-portability";
  placesImported: number;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}
