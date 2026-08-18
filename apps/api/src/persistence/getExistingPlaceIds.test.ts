import { beforeEach, describe, expect, it } from "vitest";
import type { EnrichedPlace } from "../data-enrichment/enrichPlace";
import { extractPlaceIdFromUrl } from "../data-enrichment/extractPlaceIdFromUrl";
import type { RawSavedPlace } from "../import/parseSavedListCsv";
import { insertTestUser } from "../testSupport/insertTestUser";
import { resetDb } from "../testSupport/resetDb";
import { getExistingPlaceIds } from "./getExistingPlaceIds";
import { syncPlaces } from "./syncPlaces";

const USER = "test-user";

function rawPlace(seed: number): RawSavedPlace {
  const hexA = `0x${(1_000_000 + seed).toString(16).padStart(16, "0")}`;
  const hexB = `0x${(2_000_000 + seed).toString(16).padStart(16, "0")}`;
  return {
    listName: "Coffee",
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

describe("getExistingPlaceIds", () => {
  beforeEach(async () => {
    await resetDb();
    await insertTestUser(USER);
  });

  it("returns an empty set when the table is empty", async () => {
    const result = await getExistingPlaceIds(USER);

    expect(result).toEqual(new Set());
  });

  it("returns every place_id currently in the table for that user", async () => {
    const raw1 = rawPlace(1);
    const raw2 = rawPlace(2);
    await syncPlaces(
      USER,
      [raw1, raw2],
      [enrichedPlace(raw1), enrichedPlace(raw2)],
    );

    const result = await getExistingPlaceIds(USER);

    expect(result).toEqual(
      new Set([
        extractPlaceIdFromUrl(raw1.url),
        extractPlaceIdFromUrl(raw2.url),
      ]),
    );
  });

  it("doesn't include another user's place_ids", async () => {
    const otherUser = await insertTestUser("other-user");
    const raw = rawPlace(1);
    await syncPlaces(otherUser, [raw], [enrichedPlace(raw)]);

    expect(await getExistingPlaceIds(USER)).toEqual(new Set());
  });
});
