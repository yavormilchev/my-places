import { describe, expect, it } from "vitest";
import { emojiMarkerIconUrl } from "./emojiMarkerIcon";

describe("emojiMarkerIconUrl", () => {
  it("builds a data: SVG URI with the emoji embedded", () => {
    const url = emojiMarkerIconUrl("☕");

    expect(url).toMatch(/^data:image\/svg\+xml/);
    expect(decodeURIComponent(url)).toContain("☕");
  });
});
