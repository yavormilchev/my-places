import { describe, expect, it } from "vitest";
import type { PlacesQuery } from "@my-places/shared";
import { filterByRadius } from "./filterByRadius";
import { haversineDistanceMiles } from "./haversineDistanceMiles";

const NYC = { lat: 40.7128, lng: -74.006 };
const LA = { lat: 34.0522, lng: -118.2437 };

function queryFor(radiusMiles: number): PlacesQuery {
  return { ...NYC, radiusMiles, categories: [] };
}

describe("filterByRadius", () => {
  it("includes a place within the radius", () => {
    expect(filterByRadius([NYC], queryFor(10))).toEqual([NYC]);
  });

  it("excludes a place outside the radius", () => {
    expect(filterByRadius([LA], queryFor(100))).toEqual([]);
  });

  it("includes a place exactly at the radius boundary", () => {
    const exactDistance = haversineDistanceMiles(NYC, LA);
    expect(filterByRadius([LA], queryFor(exactDistance))).toEqual([LA]);
  });

  it("excludes a place just past the radius boundary", () => {
    const exactDistance = haversineDistanceMiles(NYC, LA);
    expect(filterByRadius([LA], queryFor(exactDistance - 0.001))).toEqual([]);
  });

  it("preserves the full object, not just its coordinates", () => {
    const place = { ...NYC, title: "Somewhere", placeId: "abc" };
    expect(filterByRadius([place], queryFor(10))).toEqual([place]);
  });
});
