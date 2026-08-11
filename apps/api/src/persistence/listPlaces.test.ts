import { beforeEach, describe, expect, it } from "vitest";
import type { EnrichedPlace } from "../data-enrichment/enrichPlace";
import { extractPlaceIdFromUrl } from "../data-enrichment/extractPlaceIdFromUrl";
import type { RawSavedPlace } from "../import/parseSavedListCsv";
import { resetDb } from "../testSupport/resetDb";
import { listPlaces } from "./listPlaces";
import { syncPlaces } from "./syncPlaces";

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

describe("listPlaces", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns an empty array when the table is empty", async () => {
    expect(await listPlaces()).toEqual([]);
  });

  it("returns every place, mapped to the API's Place shape", async () => {
    const raw = rawPlace(1);
    await syncPlaces([raw], [enrichedPlace(raw)]);

    const result = await listPlaces();

    expect(result).toEqual([
      {
        placeId: extractPlaceIdFromUrl(raw.url),
        title: raw.title,
        resolvedTitle: null, // resolvedTitle matched title, so it's null in storage
        category: raw.listName,
        types: ["cafe"],
        url: raw.url,
        lat: 12.34,
        lng: -56.78,
        savedAt: expect.any(String),
      },
    ]);
  });
});
