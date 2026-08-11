import {
  PlacesQuery,
  haversineDistanceMiles,
  Place,
  PlaceWithDistance,
} from "@my-places/shared";

export function filterByRadiusWithDistance<T extends Place>(
  locations: T[],
  query: PlacesQuery,
): PlaceWithDistance[] {
  return locations
    .map((p: T) => ({ ...p, distanceMiles: haversineDistanceMiles(p, query) }))
    .filter((p: PlaceWithDistance) => p.distanceMiles <= query.radiusMiles);
}
