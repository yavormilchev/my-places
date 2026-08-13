import type { Request, Response } from "express";
import { parseImportInput } from "./parseImportInput";
import { parseSavedListCsv } from "../import/parseSavedListCsv";
import { runImport } from "../import/runImport";
import { logger } from "../logger";

/**
 * Takes one CSV's raw content straight from the request body — the browser
 * already has it in memory (see the web-side upload code), so there's
 * nothing to write to disk here at all, unlike the CLI import.
 */
export async function postImport(req: Request, res: Response): Promise<void> {
  const parsed = parseImportInput(req.body);
  if (!parsed.ok) {
    res.status(400).json({ status: "error", message: parsed.message });
    return;
  }
  const { listName, content } = parsed.input;

  let places;
  try {
    places = parseSavedListCsv(content, listName);
  } catch (err) {
    logger.warn({ err, listName }, "Could not parse uploaded CSV");
    res.status(400).json({ status: "error", message: "Could not parse CSV" });
    return;
  }

  try {
    const result = await runImport(places);
    logger.info({ listName, ...result }, "Import complete");
    res.json({ status: "ok", ...result });
  } catch (err) {
    logger.error({ err, listName }, "Import failed");
    res.status(500).json({ status: "error", message: "Import failed" });
  }
}
