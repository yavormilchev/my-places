/**
 * Keeps places whose category is any of `categories` — OR semantics, since
 * a query might span several categories at once (e.g. "parks" and "coffee"
 * for a loose "outdoors" search). An empty `categories` list means no
 * filter at all, not "match nothing".
 */
export function filterByCategory<T extends { category: string }>(
  places: T[],
  categories: string[],
): T[] {
  if (categories.length === 0) return places;
  return places.filter((place) => categories.includes(place.category));
}
