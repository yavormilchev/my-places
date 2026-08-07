import { describe, expect, it } from "vitest";
import { getAllPlaces } from "./import";
import path from "node:path";

describe("import", () => {
  it("returns an array of lists of places", async () => {
    const fixturesDir = path.resolve(
      import.meta.dirname,
      "../../../../fixtures/places",
    );

    const result = await getAllPlaces(fixturesDir);

    expect(result.length).toEqual(8);
    expect(result.filter((p) => p.title === "Coffee Culture").length).toEqual(
      1,
    );
    expect(result.filter((p) => p.listName === "Coffee").length).toEqual(2);
  });

  it("throws error when directory does not exist", async () => {
    await expect(getAllPlaces("/some-missing-dir/")).rejects.toThrow(
      "Could not read saved-places directory",
    );
  });
});
