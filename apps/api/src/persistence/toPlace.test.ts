import { describe, expect, it } from "vitest";
import { toPlace, type PlaceRow } from "./toPlace";

describe("toPlace", () => {
  it("maps a DB row to the API's Place shape", () => {
    const row: PlaceRow = {
      place_id: "ChIJx-PcrUzj2IgRIivwN5sAiPE",
      title: "Crema Gourmet (saved years ago)",
      resolved_title: "Crema Gourmet Boca Raton",
      list_name: "Coffee",
      url: "https://www.google.com/maps/place/Crema+Gourmet/data=!4m2!3m1!1s0x88d8e34caddce3c7:0xf188009b37f02b22",
      lat: 26.3534175,
      lng: -80.0858128,
      types: ["cafe", "coffee_shop"],
      saved_at: new Date("2026-01-15T12:00:00.000Z"),
    };

    expect(toPlace(row)).toEqual({
      placeId: "ChIJx-PcrUzj2IgRIivwN5sAiPE",
      title: "Crema Gourmet (saved years ago)",
      resolvedTitle: "Crema Gourmet Boca Raton",
      category: "Coffee",
      types: ["cafe", "coffee_shop"],
      url: "https://www.google.com/maps/place/Crema+Gourmet/data=!4m2!3m1!1s0x88d8e34caddce3c7:0xf188009b37f02b22",
      lat: 26.3534175,
      lng: -80.0858128,
      savedAt: "2026-01-15T12:00:00.000Z",
    });
  });

  it("keeps resolvedTitle as null when the row has no resolved title", () => {
    const row: PlaceRow = {
      place_id: "pin:26.8444241,-80.0670146",
      title: "Dropped pin",
      resolved_title: null,
      list_name: "Favorite places",
      url: "https://www.google.com/maps/search/26.8444241,-80.0670146",
      lat: 26.8444241,
      lng: -80.0670146,
      types: [],
      saved_at: new Date("2026-01-15T12:00:00.000Z"),
    };

    expect(toPlace(row).resolvedTitle).toBeNull();
  });
});
