import { describe, expect, it } from "vitest";
import { haversineDistanceMiles } from "./haversineDistanceMiles";

describe("haversineDistanceMiles", () => {
  it("calculates distance between two points", () => {
    expect(
      haversineDistanceMiles(
        {
          lat: 40.7128,
          lng: -74.006,
        },
        {
          lat: 34.0522,
          lng: -118.2437,
        },
      ).toFixed(2),
    ).toEqual("2445.71");
  });
});
