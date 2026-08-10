import { describe, expect, it } from "vitest";
import { extractPlaceIdFromUrl } from "./extractPlaceIdFromUrl";

describe("extractPlaceIdFromUrl", () => {
  it("returns a Place ID from Google Maps link", () => {
    expect(
      extractPlaceIdFromUrl(
        "https://www.google.com/maps/place/Crema+Gourmet/data=!4m2!3m1!1s0x88d8e34caddce3c7:0xf188009b37f02b22",
      ),
    ).toEqual("ChIJx-PcrUzj2IgRIivwN5sAiPE");
  });

  it("returns a null from invalid Google Maps link", () => {
    expect(
      extractPlaceIdFromUrl(
        "https://www.google.com/maps/place/Crema+Gourmet/data=",
      ),
    ).toEqual(null);
  });

  it("returns a synthetic pin: ID for a dropped pin, from real coordinates in the URL", () => {
    expect(
      extractPlaceIdFromUrl(
        "https://www.google.com/maps/search/26.8444241,-80.0670146",
      ),
    ).toEqual("pin:26.8444241,-80.0670146");
  });

  it("returns the same pin: ID for the same dropped pin every time, for idempotent re-imports", () => {
    const url = "https://www.google.com/maps/search/26.8444241,-80.0670146";
    expect(extractPlaceIdFromUrl(url)).toEqual(extractPlaceIdFromUrl(url));
  });
});
