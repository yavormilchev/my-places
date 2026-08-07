import path from "node:path";
import { describe, expect, it } from "vitest";
import { listSavedCsvFiles } from "./listSavedCsvFiles";

const fixturesDir = path.resolve(
  import.meta.dirname,
  "../../../../fixtures/places",
);

describe("listSavedCsvFiles", () => {
  it("finds one entry per CSV file, using the filename as the list name", async () => {
    const files = await listSavedCsvFiles(fixturesDir);
    const byListName = [...files].sort((a, b) =>
      a.listName.localeCompare(b.listName),
    );

    expect(byListName).toEqual([
      { listName: "Club", filePath: path.join(fixturesDir, "Club.csv") },
      { listName: "Coffee", filePath: path.join(fixturesDir, "Coffee.csv") },
      { listName: "Food", filePath: path.join(fixturesDir, "Food.csv") },
      { listName: "Parks", filePath: path.join(fixturesDir, "Parks.csv") },
    ]);
  });

  it("throws when the directory doesn't exist", async () => {
    await expect(
      listSavedCsvFiles(path.join(fixturesDir, "does-not-exist")),
    ).rejects.toThrow();
  });
});
