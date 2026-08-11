import type { PlacesQuery } from "@my-places/shared";

/**
 * Parses and validates GET /places's query params. lat/lng/radius are
 * required — there's no sensible default center point, so any of them
 * missing or non-numeric fails the whole query rather than silently
 * returning everything or crashing downstream.
 *
 * `category` may be repeated (`?category=Parks&category=Coffee`) for an
 * OR match across several categories; omitted entirely means no filter.
 *
 * Takes a plain `Record<string, unknown>` rather than Express's own query
 * type, so this has no dependency on Express and is testable with plain
 * object literals.
 */
export function parsePlacesQuery(
  query: Record<string, unknown>,
): PlacesQuery | null {
  const lat = parseRequiredNumber(query.lat);
  const lng = parseRequiredNumber(query.lng);
  const radiusMiles = parseRequiredNumber(query.radius);

  if (lat === null || lng === null || radiusMiles === null) {
    return null;
  }

  return { lat, lng, radiusMiles, categories: toStringArray(query.category) };
}

/**
 * Requires an actual non-empty string before parsing it as a number, rather
 * than trusting `Number()`'s own coercion — `Number(null)` is `0`,
 * `Number("")` is `0`, `Number([])` is `0`, none of which should count as
 * valid numeric input just because they happen to coerce to a falsy-ish
 * number instead of NaN.
 */
function parseRequiredNumber(value: unknown): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  if (typeof value === "string") return [value];
  return [];
}
