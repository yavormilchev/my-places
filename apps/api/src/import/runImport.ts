import { enrichPlaces } from "../data-enrichment/enrichPlaces";
import { filterUnresolvedPlaces } from "../data-enrichment/filterUnresolvedPlaces";
import { getExistingPlaceIds } from "../persistence/getExistingPlaceIds";
import { syncPlaces, type SyncResult } from "../persistence/syncPlaces";
import type { RawSavedPlace } from "./parseSavedListCsv";

export interface RunImportOptions {
  /** Re-resolve every place via the Places API, not just new ones. */
  refresh?: boolean;
}

/**
 * The shared filter → enrich → sync sequence behind every import, whatever
 * fed it the parsed places — the CLI script (a whole directory of CSVs) and
 * the browser-upload endpoint (one CSV's worth) both call this instead of
 * duplicating it.
 */
export async function runImport(
  userId: string,
  places: RawSavedPlace[],
  options: RunImportOptions = {},
): Promise<SyncResult> {
  let placesToResolve = places;
  if (!options.refresh) {
    const existingPlaceIds = await getExistingPlaceIds(userId);
    placesToResolve = filterUnresolvedPlaces(places, existingPlaceIds);
  }

  const resolved = await enrichPlaces(placesToResolve);
  return syncPlaces(userId, places, resolved);
}
