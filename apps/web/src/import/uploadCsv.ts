import { UnauthorizedError } from "../auth/auth";

export interface ImportResult {
  saved: number;
  deleted: number;
}

/**
 * Sends one CSV's content straight from the browser — read via File.text(),
 * never written anywhere — plus the list name derived from its filename
 * (matching the CLI import's convention, see listSavedCsvFiles.ts).
 */
export async function uploadCsv(file: File): Promise<ImportResult> {
  const content = await file.text();
  const listName = file.name.replace(/\.csv$/i, "");

  const response = await fetch("/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listName, content }),
  });

  if (response.status === 401) {
    throw new UnauthorizedError();
  }
  if (!response.ok) {
    throw new Error(`Failed to import ${file.name}: ${response.status}`);
  }

  return response.json();
}
