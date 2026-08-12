import type { PlaceWithDistance, PlacesQuery } from "@my-places/shared";
import { UnauthorizedError } from "../auth/auth";

export async function fetchPlaces(
  query: PlacesQuery,
): Promise<PlaceWithDistance[]> {
  const params = new URLSearchParams({
    lat: String(query.lat),
    lng: String(query.lng),
    radius: String(query.radiusMiles),
  });
  for (const category of query.categories) {
    params.append("category", category);
  }

  const response = await fetch(`/places?${params}`);
  if (response.status === 401) {
    throw new UnauthorizedError();
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch places: ${response.status}`);
  }

  return response.json();
}
