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

/**
 * Takes raw CSV text rather than a file path — this is what lets the same
 * parser serve both the CLI import (reads the file itself, see import.ts)
 * and the browser-upload endpoint (already has the content in memory from
 * the request body, never writes it to disk at all).
 */
export function parseSavedListCsv(
  content: string,
  listName: string,
): RawSavedPlace[] {
  try {
    const records = parse<CsvSavedPlace>(content, {
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
    throw new Error(`Could not parse saved-places CSV for list: ${listName}`, {
      cause: err,
    });
  }
}
