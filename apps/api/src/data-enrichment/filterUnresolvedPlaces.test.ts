import { describe, expect, it } from "vitest";
import type { RawSavedPlace } from "../import/parseSavedListCsv";
import { extractPlaceIdFromUrl } from "./extractPlaceIdFromUrl";
import { filterUnresolvedPlaces } from "./filterUnresolvedPlaces";

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

describe("filterUnresolvedPlaces", () => {
  it("drops a place whose ID is already known", () => {
    const known = rawPlace(1);
    const unknown = rawPlace(2);
    const existingPlaceIds = new Set([extractPlaceIdFromUrl(known.url)!]);

    const result = filterUnresolvedPlaces([known, unknown], existingPlaceIds);

    expect(result).toEqual([unknown]);
  });

  it("keeps a place whose ID can't be derived at all, so enrichPlace still logs it", () => {
    const unresolvable: RawSavedPlace = {
      ...rawPlace(1),
      url: "https://www.google.com/maps/place/No+Feature+Id/data=nothing-useful",
    };

    const result = filterUnresolvedPlaces([unresolvable], new Set());

    expect(result).toEqual([unresolvable]);
  });

  it("keeps a place when the known-IDs set is empty", () => {
    const place = rawPlace(1);

    const result = filterUnresolvedPlaces([place], new Set());

    expect(result).toEqual([place]);
  });
});
