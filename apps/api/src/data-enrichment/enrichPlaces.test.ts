import { afterEach, describe, expect, it, vi } from "vitest";
import type { RawSavedPlace } from "../import/parseSavedListCsv";
import { enrichPlaces } from "./enrichPlaces";
import { extractPlaceIdFromUrl } from "./extractPlaceIdFromUrl";

function placeFor(seed: number): RawSavedPlace {
  const hexA = `0x${(1_000_000 + seed).toString(16).padStart(16, "0")}`;
  const hexB = `0x${(2_000_000 + seed).toString(16).padStart(16, "0")}`;
  return {
    listName: "Food",
    title: `Place ${seed}`,
    note: "",
    url: `https://www.google.com/maps/place/Place+${seed}/data=!4m2!3m1!1s${hexA}:${hexB}`,
    tags: "",
    comment: "",
  };
}

function fakeDetailsResponse(name: string): Response {
  return new Response(
    JSON.stringify({
      displayName: { text: name },
      location: { latitude: 0, longitude: 0 },
      types: [],
    }),
    { status: 200 },
  );
}

describe("enrichPlaces", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves every place and preserves input order regardless of completion timing", async () => {
    const places = Array.from({ length: 8 }, (_, i) => placeFor(i));

    vi.stubGlobal(
      "fetch",
      vi.fn(async (requestUrl: string) => {
        const placeId = requestUrl.split("/places/")[1];
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 15));
        return fakeDetailsResponse(placeId);
      }),
    );

    const results = await enrichPlaces(places, 3);

    expect(results).toHaveLength(8);
    places.forEach((place, i) => {
      expect(results[i]?.resolvedTitle).toEqual(
        extractPlaceIdFromUrl(place.url),
      );
      expect(results[i]?.title).toEqual(place.title);
    });
  });

  it("never runs more than the given concurrency limit at once", async () => {
    const places = Array.from({ length: 10 }, (_, i) => placeFor(100 + i));

    let inFlight = 0;
    let maxInFlight = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 10));
        inFlight--;
        return fakeDetailsResponse("x");
      }),
    );

    await enrichPlaces(places, 3);

    expect(maxInFlight).toBeLessThanOrEqual(3);
    expect(maxInFlight).toBeGreaterThan(1);
  });

  it("fetches each place exactly once, even with many workers racing over a large list", async () => {
    const places = Array.from({ length: 50 }, (_, i) => placeFor(200 + i));
    const callsPerPlaceId = new Map<string, number>();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (requestUrl: string) => {
        const placeId = requestUrl.split("/places/")[1];
        callsPerPlaceId.set(placeId, (callsPerPlaceId.get(placeId) ?? 0) + 1);
        // random delay so workers don't just happen to finish in lockstep
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
        return fakeDetailsResponse(placeId);
      }),
    );

    // more workers than a real quota would need, specifically to stress the
    // shared nextIndex counter with as much contention as possible
    await enrichPlaces(places, 25);

    const expectedPlaceIds = places.map((place) =>
      extractPlaceIdFromUrl(place.url),
    );
    expect(callsPerPlaceId.size).toEqual(50);
    for (const placeId of expectedPlaceIds) {
      expect(callsPerPlaceId.get(placeId!)).toEqual(1);
    }
  });

  it("drops entries with no extractable place ID from the result, without calling fetch for them", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(fakeDetailsResponse("Real Place"));
    vi.stubGlobal("fetch", fetchMock);

    const goodPlace = placeFor(999);
    const badPlace: RawSavedPlace = {
      ...placeFor(998),
      url: "https://www.google.com/maps/place/No+Feature+Id/data=nothing-useful",
    };

    const results = await enrichPlaces([goodPlace, badPlace]);

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      ...goodPlace,
      placeId: extractPlaceIdFromUrl(goodPlace.url),
      resolvedTitle: "Real Place",
      lat: 0,
      lng: 0,
      types: [],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
