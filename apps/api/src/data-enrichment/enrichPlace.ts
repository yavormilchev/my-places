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
 *
 * `placeId` is the derived Google Place ID (see extractPlaceIdFromUrl.ts) —
 * the natural unique key for idempotent imports, since it's Google's own
 * canonical identity for the place, not our own encoding of it.
 */
export interface EnrichedPlace extends RawSavedPlace, PlaceDetails {
  placeId: string;
}

const DROPPED_PIN_PLACE_ID = /^pin:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/;

export async function enrichPlace(
  place: RawSavedPlace,
): Promise<EnrichedPlace | null> {
  const placeId = extractPlaceIdFromUrl(place.url);
  if (!placeId) {
    logger.warn({ url: place.url }, "Could not extract a place ID from URL");
    return null;
  }

  const droppedPin = placeId.match(DROPPED_PIN_PLACE_ID);
  if (droppedPin) {
    // A dropped pin has no established place to resolve — the coordinates
    // are already in the URL, so there's nothing to ask the Places API for.
    return {
      ...place,
      placeId,
      resolvedTitle: place.title,
      lat: Number(droppedPin[1]),
      lng: Number(droppedPin[2]),
      types: [],
    };
  }

  const details = await fetchPlaceDetails(placeId);
  if (!details) return null;

  return { ...place, ...details, placeId };
}
