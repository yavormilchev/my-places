import { describe, expect, it } from "vitest";
import { emojiForCategory } from "./categoryEmoji";

describe("emojiForCategory", () => {
  it("returns the mapped emoji for a known category", () => {
    expect(emojiForCategory("Coffee")).toBe("☕");
  });

  it("falls back to a plain pin for an unmapped category", () => {
    expect(emojiForCategory("Some New List")).toBe("📌");
  });
});
