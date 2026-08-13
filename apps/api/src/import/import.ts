import { readFile } from "node:fs/promises";
import { parseSavedListCsv, RawSavedPlace } from "./parseSavedListCsv";
import { listSavedCsvFiles } from "./listSavedCsvFiles";

export async function importAllPlaces(dir: string): Promise<RawSavedPlace[]> {
  const files = await listSavedCsvFiles(dir);
  const parsed = await Promise.all(
    files.map(async (f) => {
      const content = await readFile(f.filePath, "utf-8");
      return parseSavedListCsv(content, f.listName);
    }),
  );
  return parsed.flat();
}
