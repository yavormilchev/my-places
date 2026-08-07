import { readdir } from "fs/promises";
import path from "node:path";

export interface SavedListFile {
  listName: string;
  filePath: string;
}

export async function listSavedCsvFiles(dir: string): Promise<SavedListFile[]> {
  try {
    const files = await readdir(dir);
    return files
      .filter((f) => f.toLowerCase().endsWith(".csv"))
      .map((f) => ({
        listName: path.basename(f, ".csv"),
        filePath: path.join(dir, f),
      }));
  } catch (err) {
    throw new Error(`Could not read saved-places directory: ${dir}`, {
      cause: err,
    });
  }
}
