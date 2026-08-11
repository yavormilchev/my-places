import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPlaceDetails } from "./fetchPlaceDetails";

// Real shape captured from the live API for ChIJx-PcrUzj2IgRIivwN5sAiPE.
const CREMA_GOURMET_RESPONSE = {
  types: ["cafe", "coffee_shop", "restaurant", "food", "point_of_interest"],
  location: { latitude: 26.3534175, longitude: -80.0858128 },
  displayName: { text: "Crema Gourmet Boca Raton", languageCode: "en" },
};

describe("fetchPlaceDetails", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the resolved title, coordinates, and types on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(CREMA_GOURMET_RESPONSE), { status: 200 }),
        ),
    );

    const result = await fetchPlaceDetails("ChIJx-PcrUzj2IgRIivwN5sAiPE");

    expect(result).toEqual({
      resolvedTitle: "Crema Gourmet Boca Raton",
      lat: 26.3534175,
      lng: -80.0858128,
      types: ["cafe", "coffee_shop", "restaurant", "food", "point_of_interest"],
    });
  });

  it("sends the field mask and API key as headers", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(CREMA_GOURMET_RESPONSE), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await fetchPlaceDetails("ChIJx-PcrUzj2IgRIivwN5sAiPE");

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toEqual(
      "https://places.googleapis.com/v1/places/ChIJx-PcrUzj2IgRIivwN5sAiPE",
    );
    expect(options.headers["X-Goog-FieldMask"]).toEqual(
      "displayName,location,types",
    );
    expect(options.headers["X-Goog-Api-Key"]).toBeTruthy();
  });

  it("returns null when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 404 })),
    );

    const result = await fetchPlaceDetails("not-a-real-place-id");

    expect(result).toBeNull();
  });

  it("returns null when the response is missing expected fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ types: [] }), { status: 200 }),
        ),
    );

    const result = await fetchPlaceDetails("ChIJx-PcrUzj2IgRIivwN5sAiPE");

    expect(result).toBeNull();
  });

  it("returns null when fetch itself throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const result = await fetchPlaceDetails("ChIJx-PcrUzj2IgRIivwN5sAiPE");

    expect(result).toBeNull();
  });
});
