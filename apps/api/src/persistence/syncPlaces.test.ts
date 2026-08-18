import { beforeEach, describe, expect, it } from "vitest";
import { pool } from "../db";
import type { EnrichedPlace } from "../data-enrichment/enrichPlace";
import { extractPlaceIdFromUrl } from "../data-enrichment/extractPlaceIdFromUrl";
import type { RawSavedPlace } from "../import/parseSavedListCsv";
import { insertTestUser } from "../testSupport/insertTestUser";
import { resetDb } from "../testSupport/resetDb";
import { syncPlaces } from "./syncPlaces";

const USER = "test-user";

function rawPlace(seed: number, listName = "Coffee"): RawSavedPlace {
  const hexA = `0x${(1_000_000 + seed).toString(16).padStart(16, "0")}`;
  const hexB = `0x${(2_000_000 + seed).toString(16).padStart(16, "0")}`;
  return {
    listName,
    title: `Place ${seed}`,
    note: "",
    url: `https://www.google.com/maps/place/Place+${seed}/data=!4m2!3m1!1s${hexA}:${hexB}`,
    tags: "",
    comment: "",
  };
}

function enrichedPlace(raw: RawSavedPlace): EnrichedPlace {
  return {
    ...raw,
    placeId: extractPlaceIdFromUrl(raw.url)!,
    resolvedTitle: raw.title,
    lat: 12.34,
    lng: -56.78,
    types: ["cafe"],
  };
}

describe("syncPlaces", () => {
  // Runs against my_places_test (see vitest.config.ts), never the real
  // database — safe to actually commit and reset between tests.
  beforeEach(async () => {
    await resetDb();
    await insertTestUser(USER);
  });

  it("refuses to run when the current export resolves to zero place IDs", async () => {
    const unresolvable: RawSavedPlace = {
      ...rawPlace(1),
      url: "https://www.google.com/maps/place/No+Feature+Id/data=nothing-useful",
    };

    await expect(syncPlaces(USER, [unresolvable], [])).rejects.toThrow(
      "Refusing to sync",
    );
  });

  it("upserts a resolved place and it's actually readable back afterward", async () => {
    const raw = rawPlace(1);
    const enriched = enrichedPlace(raw);

    await syncPlaces(USER, [raw], [enriched]);

    const { rows } = await pool.query(
      "select * from places where place_id = $1",
      [enriched.placeId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      user_id: USER,
      title: raw.title,
      list_name: raw.listName,
      url: raw.url,
      lat: enriched.lat,
      lng: enriched.lng,
      types: enriched.types,
    });
  });

  it("stores resolved_title as null when it matches title exactly", async () => {
    const raw = rawPlace(1);
    const enriched = { ...enrichedPlace(raw), resolvedTitle: raw.title };

    await syncPlaces(USER, [raw], [enriched]);

    const { rows } = await pool.query(
      "select resolved_title from places where place_id = $1",
      [enriched.placeId],
    );
    expect(rows[0].resolved_title).toBeNull();
  });

  it("re-running with the same place updates the row instead of duplicating it", async () => {
    const raw = rawPlace(1);
    const enriched = enrichedPlace(raw);

    await syncPlaces(USER, [raw], [enriched]);
    await syncPlaces(USER, [raw], [{ ...enriched, lat: 99 }]);

    const { rows } = await pool.query(
      "select lat from places where place_id = $1",
      [enriched.placeId],
    );
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].lat)).toEqual(99);
  });

  it("deletes a place once it's gone from the export, but protects one that's still there even if it failed to resolve this run", async () => {
    const raw1 = rawPlace(1);
    const raw2 = rawPlace(2);
    const enriched1 = enrichedPlace(raw1);
    const enriched2 = enrichedPlace(raw2);

    // simulate a prior import where both places saved successfully
    await syncPlaces(USER, [raw1, raw2], [enriched1, enriched2]);

    // this run: raw1 is genuinely gone from the export; raw2 is still
    // there but, say, hit a transient API failure (absent from resolved)
    const result = await syncPlaces(USER, [raw2], [enriched2]);

    const { rows } = await pool.query("select place_id from places");
    const remainingIds = rows.map((r) => r.place_id);

    expect(remainingIds).not.toContain(enriched1.placeId);
    expect(remainingIds).toContain(enriched2.placeId);
    expect(result).toEqual({ saved: 1, deleted: 1 });
  });

  it("importing one list doesn't touch places from a different list, even absent ones", async () => {
    const coffeePlace = rawPlace(1, "Coffee");
    const oldFoodPlace = rawPlace(2, "Food");
    const newFoodPlace = rawPlace(3, "Food");
    const enrichedCoffee = enrichedPlace(coffeePlace);
    const enrichedOldFood = enrichedPlace(oldFoodPlace);
    const enrichedNewFood = enrichedPlace(newFoodPlace);

    // both lists exist from a prior full import
    await syncPlaces(
      USER,
      [coffeePlace, oldFoodPlace],
      [enrichedCoffee, enrichedOldFood],
    );

    // this run only re-uploads Food.csv, and oldFoodPlace is genuinely gone
    // from it, replaced by newFoodPlace — Coffee's place must survive
    // untouched, since Coffee.csv wasn't part of this run at all
    const result = await syncPlaces(USER, [newFoodPlace], [enrichedNewFood]);

    const { rows } = await pool.query("select place_id from places");
    const remainingIds = rows.map((r) => r.place_id);

    expect(remainingIds).toContain(enrichedCoffee.placeId);
    expect(remainingIds).toContain(enrichedNewFood.placeId);
    expect(remainingIds).not.toContain(enrichedOldFood.placeId);
    expect(result).toEqual({ saved: 1, deleted: 1 });
  });

  it("keeps two users' saved copies of the same real-world place fully independent", async () => {
    const otherUser = await insertTestUser("other-user");
    const raw = rawPlace(1);
    const enriched = enrichedPlace(raw);

    await syncPlaces(USER, [raw], [enriched]);
    await syncPlaces(otherUser, [raw], [{ ...enriched, lat: 99 }]);

    const { rows } = await pool.query(
      "select user_id, lat from places where place_id = $1 order by user_id",
      [enriched.placeId],
    );
    expect(rows).toEqual([
      { user_id: "other-user", lat: 99 },
      { user_id: USER, lat: 12.34 },
    ]);

    // deleting it from the other user's export must not touch this user's copy
    const otherUnrelated = rawPlace(2);
    await syncPlaces(
      otherUser,
      [otherUnrelated],
      [enrichedPlace(otherUnrelated)],
    );

    const { rows: afterDelete } = await pool.query(
      "select user_id from places where place_id = $1",
      [enriched.placeId],
    );
    expect(afterDelete).toEqual([{ user_id: USER }]);
  });

  it("rolls back the whole batch if one insert fails, not just the bad row", async () => {
    const raw1 = rawPlace(1);
    const raw2 = rawPlace(2);
    const goodPlace = enrichedPlace(raw1);
    // a null place_id violates the primary key's implicit NOT NULL — a
    // genuine Postgres constraint failure, not a simulated one
    const badPlace = {
      ...enrichedPlace(raw2),
      placeId: null as unknown as string,
    };

    await expect(
      syncPlaces(USER, [raw1, raw2], [goodPlace, badPlace]),
    ).rejects.toThrow();

    const { rows } = await pool.query("select place_id from places");
    // goodPlace was inserted first, in the same transaction — it must not
    // have survived the rollback either
    expect(rows).toHaveLength(0);
  });
});
