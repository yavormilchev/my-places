import { pool } from "../db";
import { extractPlaceIdFromUrl } from "../data-enrichment/extractPlaceIdFromUrl";
import type { EnrichedPlace } from "../data-enrichment/enrichPlace";
import type { RawSavedPlace } from "../import/parseSavedListCsv";

export interface SyncResult {
  saved: number;
  deleted: number;
}

/**
 * Reconciles the places table with the current export: upserts every
 * resolved place, and deletes any row whose place_id isn't among the
 * current export's places — but only within the list(s)/category(ies)
 * actually present in `allPlaces` this run. A place belonging to a list
 * that wasn't touched this run is left completely alone, regardless of
 * whether its ID shows up in `currentPlaceIds`.
 *
 * This matters because imports no longer have to be a full-directory batch
 * covering every list at once (see the CSV-drop-in-UI feature) — a single
 * uploaded "Food.csv" must reconcile only the Food list, not silently wipe
 * every other category just because they're absent from this one file.
 * A CLI import of a whole directory still reconciles every list it
 * contains, same as before, since every list present gets included in the
 * touched-list-names scope below.
 *
 * Deletion scope within each touched list is deliberately based on
 * `allPlaces` (the full parsed CSV set, derived locally via
 * extractPlaceIdFromUrl — no network involved) and NOT on `resolvedPlaces`
 * (only the subset that successfully resolved this run). A place that's
 * still in the export but hit a transient Places API failure this run must
 * not look the same as one you actually removed — it should just keep its
 * stale data, not get deleted.
 *
 * Refuses to run at all if the current export resolves to zero place IDs —
 * an empty set almost certainly means a misconfigured/empty file or a
 * parsing bug, not that every saved place was actually removed. Without
 * this guard, an empty set would otherwise match (and delete) every row in
 * the touched list(s).
 */
export async function syncPlaces(
  userId: string,
  allPlaces: RawSavedPlace[],
  resolvedPlaces: EnrichedPlace[],
): Promise<SyncResult> {
  const currentPlaceIds = [
    ...new Set(
      allPlaces
        .map((place) => extractPlaceIdFromUrl(place.url))
        .filter((id): id is string => id !== null),
    ),
  ];

  if (currentPlaceIds.length === 0) {
    throw new Error(
      "Refusing to sync: the current export resolved to zero place IDs, " +
        "which would delete every saved place in the affected list(s). " +
        "Check the import.",
    );
  }

  const touchedListNames = [...new Set(allPlaces.map((p) => p.listName))];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rowCount: deleted } = await client.query(
      `delete from places
       where user_id = $3
         and list_name = any($2::text[])
         and place_id <> all($1::text[])`,
      [currentPlaceIds, touchedListNames, userId],
    );

    for (const place of resolvedPlaces) {
      const resolvedTitle =
        place.resolvedTitle === place.title ? null : place.resolvedTitle;

      await client.query(
        `insert into places (user_id, place_id, title, resolved_title, list_name, url, lat, lng, types)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         on conflict (user_id, place_id) do update set
           title = excluded.title,
           resolved_title = excluded.resolved_title,
           list_name = excluded.list_name,
           url = excluded.url,
           lat = excluded.lat,
           lng = excluded.lng,
           types = excluded.types`,
        [
          userId,
          place.placeId,
          place.title,
          resolvedTitle,
          place.listName,
          place.url,
          place.lat,
          place.lng,
          place.types,
        ],
      );
    }

    await client.query("COMMIT");

    return { saved: resolvedPlaces.length, deleted: deleted ?? 0 };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
