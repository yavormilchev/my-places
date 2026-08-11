import {
  Coordinates,
  PlacesQuery,
  haversineDistanceMiles,
} from "@my-places/shared";

export function filterByRadius<T extends Coordinates>(
  locations: T[],
  query: PlacesQuery,
): T[] {
  return locations.filter(
    (l: T) => haversineDistanceMiles(l, query) <= query.radiusMiles,
  );
}
