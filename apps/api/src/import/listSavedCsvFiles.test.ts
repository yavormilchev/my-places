import { describe, expect, it } from "vitest";
import { listSavedCsvFiles } from "./listSavedCsvFiles";
import { fixturePath } from "../testSupport/fixtures";

describe("listSavedCsvFiles", () => {
  it("finds one entry per CSV file, using the filename as the list name", async () => {
    const files = await listSavedCsvFiles(fixturePath("places"));
    const byListName = [...files].sort((a, b) =>
      a.listName.localeCompare(b.listName),
    );

    expect(byListName).toEqual([
      { listName: "Club", filePath: fixturePath("places", "Club.csv") },
      { listName: "Coffee", filePath: fixturePath("places", "Coffee.csv") },
      { listName: "Empty", filePath: fixturePath("places", "Empty.csv") },
      { listName: "Food", filePath: fixturePath("places", "Food.csv") },
      { listName: "Parks", filePath: fixturePath("places", "Parks.csv") },
      { listName: "Zero", filePath: fixturePath("places", "Zero.csv") },
    ]);
  });

  it("throws when the directory doesn't exist", async () => {
    await expect(
      listSavedCsvFiles(fixturePath("does-not-exist")),
    ).rejects.toThrow();
  });
});
