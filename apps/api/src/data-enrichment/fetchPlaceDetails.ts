import { env } from "../config";
import { logger } from "../logger";
import { Coordinates } from "@my-places/shared";

export interface PlaceDetails extends Coordinates {
  resolvedTitle: string;
  types: string[];
}

/**
 * Fetches a place's current name, coordinates, and category types from the
 * Places API (New), by derived Place ID (see extractPlaceIdFromUrl.ts).
 *
 * `resolvedTitle` is always returned as-is from the API, even when it
 * doesn't match whatever the place was originally saved as (see
 * project-plan.md §8 — the same Place ID can outlive the business occupying
 * that location). Comparing it against the saved Title and deciding whether
 * to warn is a caller concern, not this function's — it just reports what
 * the API says today.
 */
export async function fetchPlaceDetails(
  placeId: string,
): Promise<PlaceDetails | null> {
  let response: Response;
  try {
    response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          "X-Goog-Api-Key": env.googleMapsApiKey,
          "X-Goog-FieldMask": "displayName,location,types",
        },
      },
    );
  } catch (err) {
    logger.warn({ err, placeId }, "Failed to fetch place details");
    return null;
  }

  if (!response.ok) {
    logger.warn(
      { placeId, status: response.status },
      "Places API returned a non-OK status",
    );
    return null;
  }

  const body = await response.json();

  if (!body.displayName?.text || !body.location) {
    logger.warn(
      { placeId, body },
      "Places API response missing expected fields",
    );
    return null;
  }

  return {
    resolvedTitle: body.displayName.text,
    lat: body.location.latitude,
    lng: body.location.longitude,
    types: body.types ?? [],
  };
}
