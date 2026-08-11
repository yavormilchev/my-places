import { Coordinates, PlacesQuery } from "@my-places/shared";
import { haversineDistanceMiles } from "./haversineDistanceMiles";

export function filterByRadius<T extends Coordinates>(
  locations: T[],
  query: PlacesQuery,
): T[] {
  return locations.filter(
    (l: T) => haversineDistanceMiles(l, query) <= query.radiusMiles,
  );
}
