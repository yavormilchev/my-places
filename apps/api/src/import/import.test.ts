import { describe, expect, it } from "vitest";
import { importAllPlaces } from "./import";
import { fixturePath } from "../testSupport/fixtures";

describe("import", () => {
  it("returns an array of lists of places", async () => {
    const result = await importAllPlaces(fixturePath("places"));

    expect(result.length).toEqual(8);
    expect(result.filter((p) => p.title === "Coffee Culture").length).toEqual(
      1,
    );
    expect(result.filter((p) => p.listName === "Coffee").length).toEqual(2);
  });

  it("throws error when directory does not exist", async () => {
    await expect(importAllPlaces("/some-missing-dir/")).rejects.toThrow(
      "Could not read saved-places directory",
    );
  });
});
