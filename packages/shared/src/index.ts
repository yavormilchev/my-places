/** A place as the API returns it. Not the DB row. */
export interface Place {
  id: string;
  googlePlaceId: string | null;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  categories: string[];
  tags: string[];
  savedAt: string; // ISO 8601
}

export interface PlacesQuery {
  lat: number;
  lng: number;
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
