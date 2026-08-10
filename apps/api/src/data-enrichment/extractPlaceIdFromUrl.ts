import { featureIdToPlaceId } from "./featureIdToPlaceId";

/**
 * Derives a stable ID for a saved URL — either a real Google Place ID (for
 * an established place), or a synthetic `pin:<lat>,<lng>` ID for a dropped
 * pin, which has no established place at all, just coordinates embedded
 * directly in the URL (`/maps/search/<lat>,<lng>`). The `pin:` prefix is
 * how enrichPlace tells the two apart — a dropped pin has nothing to
 * resolve via the Places API, its coordinates are already right here.
 */
export function extractPlaceIdFromUrl(url: string): string | null {
  const featureMatch = url.match(/!1s(0x[0-9a-f]+):(0x[0-9a-f]+)/i);
  if (featureMatch) {
    return featureIdToPlaceId({ hexA: featureMatch[1], hexB: featureMatch[2] });
  }

  const pinMatch = url.match(
    /\/maps\/search\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  );
  if (pinMatch) {
    return `pin:${pinMatch[1]},${pinMatch[2]}`;
  }

  return null;
}
