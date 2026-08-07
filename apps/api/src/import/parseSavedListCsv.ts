import * as fs from "node:fs";
import { parse } from "csv-parse/sync";

export interface RawSavedPlace {
  listName: string;
  title: string;
  note: string;
  url: string;
  tags: string;
  comment: string;
}

interface CsvSavedPlace {
  Title: string;
  Note: string;
  URL: string;
  Tags: string;
  Comment: string;
}

export function parseSavedListCsv(
  filePath: string,
  listName: string,
): RawSavedPlace[] {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const records = parse<CsvSavedPlace>(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    return records
      .filter((r) => !!r.URL)
      .map((r) => ({
        listName: listName,
        title: r.Title,
        note: r.Note,
        url: r.URL,
        tags: r.Tags,
        comment: r.Comment,
      }));
  } catch (err) {
    throw new Error(`Could not parse saved-places CSV: ${filePath}`, {
      cause: err,
    });
  }
}
