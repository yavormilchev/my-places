import type { RawSavedPlace } from "../import/parseSavedListCsv";
import { extractPlaceIdFromUrl } from "./extractPlaceIdFromUrl";

/**
 * Drops places whose derived place ID is already in the DB — re-resolving
 * an already-known place only buys a fresher `resolvedTitle` (see
 * project-plan.md §8: a Place ID can outlive the business at that
 * location), which isn't worth a Places API call on every import.
 *
 * Places syncPlaces still protects these from deletion via the full
 * `allPlaces` list passed alongside this filtered subset — they just won't
 * get re-upserted with fresh data this run, same as a place that failed to
 * resolve.
 *
 * A place whose ID can't be derived at all is kept (not dropped) — it needs
 * to reach enrichPlace so its "could not extract a place ID" warning still
 * fires, rather than disappearing silently one step earlier.
 */
export function filterUnresolvedPlaces(
  places: RawSavedPlace[],
  existingPlaceIds: ReadonlySet<string>,
): RawSavedPlace[] {
  return places.filter((place) => {
    const placeId = extractPlaceIdFromUrl(place.url);
    return !placeId || !existingPlaceIds.has(placeId);
  });
}
