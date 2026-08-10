import { describe, expect, it } from "vitest";
import { featureIdToPlaceId } from "./featureIdToPlaceId";

describe("featureIdToPlaceId", () => {
  it("returns a place ID from a valid hex cid pairs", () => {
    expect(
      featureIdToPlaceId({
        hexA: "0x88d8e34caddce3c7",
        hexB: "0xf188009b37f02b22",
      }),
    ).toEqual("ChIJx-PcrUzj2IgRIivwN5sAiPE");

    expect(
      featureIdToPlaceId({
        hexA: "0x88e8a3e7c309054d",
        hexB: "0x9f7662e5538bb215",
      }),
    ).toEqual("ChIJTQUJw-ej6IgRFbKLU-Vidp8");
  });
});
