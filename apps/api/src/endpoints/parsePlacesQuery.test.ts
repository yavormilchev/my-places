import { describe, expect, it } from "vitest";
import { parsePlacesQuery } from "./parsePlacesQuery";

describe("parsePlacesQuery", () => {
  it("parses valid lat/lng/radius, with no category filter", () => {
    expect(
      parsePlacesQuery({ lat: "40.7128", lng: "-74.006", radius: "10" }),
    ).toEqual({ lat: 40.7128, lng: -74.006, radiusMiles: 10, categories: [] });
  });

  it("returns null when lat is missing", () => {
    expect(parsePlacesQuery({ lng: "-74.006", radius: "10" })).toBeNull();
  });

  it("returns null when lng is missing", () => {
    expect(parsePlacesQuery({ lat: "40.7128", radius: "10" })).toBeNull();
  });

  it("returns null when radius is missing", () => {
    expect(parsePlacesQuery({ lat: "40.7128", lng: "-74.006" })).toBeNull();
  });

  it("returns null when a param isn't a valid number", () => {
    expect(
      parsePlacesQuery({ lat: "not-a-number", lng: "-74.006", radius: "10" }),
    ).toBeNull();
  });

  it("returns null when a param is literally null, not just missing", () => {
    // Number(null) is 0, not NaN — a real gotcha this must guard against
    // explicitly, not just rely on Number.isFinite to catch.
    expect(
      parsePlacesQuery({ lat: null, lng: "-74.006", radius: "10" }),
    ).toBeNull();
  });

  it("returns null when a param is an empty string", () => {
    // Number("") is also 0, same class of gotcha as null above.
    expect(
      parsePlacesQuery({ lat: "", lng: "-74.006", radius: "10" }),
    ).toBeNull();
  });

  it("returns null when a param is an array instead of a string", () => {
    // Number([]) is also 0 — a param repeated by mistake shouldn't coerce
    // into a bogus valid coordinate either.
    expect(
      parsePlacesQuery({ lat: ["40.7128"], lng: "-74.006", radius: "10" }),
    ).toBeNull();
  });

  it("collects a single repeated category into a one-element array", () => {
    const result = parsePlacesQuery({
      lat: "40.7128",
      lng: "-74.006",
      radius: "10",
      category: "Parks",
    });
    expect(result?.categories).toEqual(["Parks"]);
  });

  it("collects multiple repeated categories, as Express/qs would parse them", () => {
    const result = parsePlacesQuery({
      lat: "40.7128",
      lng: "-74.006",
      radius: "10",
      category: ["Parks", "Coffee"],
    });
    expect(result?.categories).toEqual(["Parks", "Coffee"]);
  });
});
