import { parseArgs } from "node:util";
import path from "node:path";
import { importAllPlaces } from "../import/import";
import { runImport } from "../import/runImport";
import { logger } from "../logger";

const { values } = parseArgs({
  options: {
    dir: {
      type: "string",
      default: path.resolve(import.meta.dirname, "../../../../uploads/places"),
    },
    refresh: {
      type: "boolean",
      default: false,
    },
  },
});

try {
  const places = await importAllPlaces(values.dir);
  logger.info(`Parsed ${places.length} places from ${values.dir}`);

  if (values.refresh) {
    logger.info("--refresh set: re-resolving every place, not just new ones");
  }

  const { saved, deleted } = await runImport(places, {
    refresh: values.refresh,
  });
  logger.info({ saved, deleted }, "Import complete");
} catch (err) {
  logger.error({ err }, "Import failed");
  process.exitCode = 1;
}
