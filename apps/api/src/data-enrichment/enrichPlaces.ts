import type { RawSavedPlace } from "../import/parseSavedListCsv";
import { enrichPlace, type EnrichedPlace } from "./enrichPlace";

const DEFAULT_CONCURRENCY = 10;

/**
 * Resolves every place via enrichPlace, running up to `concurrency` requests
 * at once instead of one at a time — Places API's default quota is in the
 * low hundreds of QPS per project, so a modest cap comfortably avoids
 * bursting a per-second limit without the minutes-long wait a strictly
 * sequential, delayed loop would add for no real benefit at this scale.
 *
 * Places that fail to resolve are silently dropped rather than returned as
 * null placeholders — each EnrichedPlace carries its own `url`, so callers
 * that need to know what failed can diff the input list against `url`s
 * present in the result, without tracking positions themselves.
 */
export async function enrichPlaces(
  places: RawSavedPlace[],
  concurrency = DEFAULT_CONCURRENCY,
): Promise<EnrichedPlace[]> {
  const results = new Array<EnrichedPlace | null>(places.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < places.length) {
      const index = nextIndex++;
      results[index] = await enrichPlace(places[index]);
    }
  }

  const workerCount = Math.min(concurrency, places.length);
  await Promise.all(Array.from({ length: workerCount }, worker));

  return results.filter((r) => r !== null);
}
