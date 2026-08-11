import { describe, expect, it } from "vitest";
import {
  haversineDistanceMiles,
  type Place,
  type PlacesQuery,
} from "@my-places/shared";
import { filterByRadiusWithDistance } from "./filterByRadiusWithDistance";

function place(overrides: Partial<Place> & Pick<Place, "lat" | "lng">): Place {
  return {
    placeId: "test-place",
    title: "Test Place",
    resolvedTitle: null,
    category: "Test",
    types: [],
    url: "https://example.com",
    savedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const NYC = place({ placeId: "nyc", lat: 40.7128, lng: -74.006 });
const LA = place({ placeId: "la", lat: 34.0522, lng: -118.2437 });

function queryFor(radiusMiles: number): PlacesQuery {
  return { lat: NYC.lat, lng: NYC.lng, radiusMiles, categories: [] };
}

describe("filterByRadiusWithDistance", () => {
  it("includes a place within the radius, with its distance attached", () => {
    expect(filterByRadiusWithDistance([NYC], queryFor(10))).toEqual([
      { ...NYC, distanceMiles: 0 },
    ]);
  });

  it("excludes a place outside the radius", () => {
    expect(filterByRadiusWithDistance([LA], queryFor(100))).toEqual([]);
  });

  it("includes a place exactly at the radius boundary", () => {
    const exactDistance = haversineDistanceMiles(NYC, LA);
    expect(filterByRadiusWithDistance([LA], queryFor(exactDistance))).toEqual([
      { ...LA, distanceMiles: exactDistance },
    ]);
  });

  it("excludes a place just past the radius boundary", () => {
    const exactDistance = haversineDistanceMiles(NYC, LA);
    expect(
      filterByRadiusWithDistance([LA], queryFor(exactDistance - 0.001)),
    ).toEqual([]);
  });
});
