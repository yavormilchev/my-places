import { afterEach, describe, expect, it, vi } from "vitest";
import type { RawSavedPlace } from "../import/parseSavedListCsv";
import { enrichPlace } from "./enrichPlace";

const SAVED_PLACE: RawSavedPlace = {
  listName: "Coffee",
  title: "Crema Gourmet (saved years ago)",
  note: "",
  url: "https://www.google.com/maps/place/Crema+Gourmet/data=!4m2!3m1!1s0x88d8e34caddce3c7:0xf188009b37f02b22",
  tags: "",
  comment: "",
};

// Real shape captured from the live API for ChIJx-PcrUzj2IgRIivwN5sAiPE.
const CREMA_GOURMET_RESPONSE = {
  types: ["cafe", "coffee_shop", "restaurant", "food", "point_of_interest"],
  location: { latitude: 26.3534175, longitude: -80.0858128 },
  displayName: { text: "Crema Gourmet Boca Raton" },
};

describe("enrichPlace", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves a place from its saved Maps URL, keeping the original title alongside the API's resolved title", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(CREMA_GOURMET_RESPONSE), { status: 200 }),
        ),
    );

    const result = await enrichPlace(SAVED_PLACE);

    expect(result).toEqual({
      ...SAVED_PLACE,
      placeId: "ChIJx-PcrUzj2IgRIivwN5sAiPE",
      resolvedTitle: "Crema Gourmet Boca Raton",
      lat: 26.3534175,
      lng: -80.0858128,
      types: ["cafe", "coffee_shop", "restaurant", "food", "point_of_interest"],
    });
  });

  it("returns null without calling fetch when the URL has no feature ID", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await enrichPlace({
      ...SAVED_PLACE,
      url: "https://www.google.com/maps/place/No+Feature+Id/data=nothing-useful",
    });

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when the Places API call fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 404 })),
    );

    const result = await enrichPlace(SAVED_PLACE);

    expect(result).toBeNull();
  });
});
