import { parseSavedListCsv, RawSavedPlace } from "./parseSavedListCsv";
import { listSavedCsvFiles } from "./listSavedCsvFiles";

export async function getAllPlaces(dir: string): Promise<RawSavedPlace[]> {
  const files = await listSavedCsvFiles(dir);
  return files.flatMap((f) => parseSavedListCsv(f.filePath, f.listName));
}
