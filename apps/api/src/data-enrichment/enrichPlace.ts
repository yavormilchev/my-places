import { logger } from "../logger";
import type { RawSavedPlace } from "../import/parseSavedListCsv";
import { extractPlaceIdFromUrl } from "./extractPlaceIdFromUrl";
import { fetchPlaceDetails, type PlaceDetails } from "./fetchPlaceDetails";

/**
 * A saved place plus what the Places API says about it today — `title`
 * (from the Takeout export) and `resolvedTitle` (from the API) can
 * legitimately differ, since the same Place ID can outlive the business
 * occupying that location (see project-plan.md §8). Comparing them and
 * deciding whether that's worth surfacing is a caller concern, not this
 * function's.
 */
export interface EnrichedPlace extends RawSavedPlace, PlaceDetails {}

export async function enrichPlace(
  place: RawSavedPlace,
): Promise<EnrichedPlace | null> {
  const placeId = extractPlaceIdFromUrl(place.url);
  if (!placeId) {
    logger.warn({ url: place.url }, "Could not extract a place ID from URL");
    return null;
  }

  const details = await fetchPlaceDetails(placeId);
  if (!details) return null;

  return { ...place, ...details };
}
