import { parseArgs } from "node:util";
import path from "node:path";
import { getAllPlaces } from "../import/import";
import { enrichPlaces } from "../data-enrichment/enrichPlaces";
import { syncPlaces } from "../persistence/syncPlaces";
import { logger } from "../logger";

const { values } = parseArgs({
  options: {
    dir: {
      type: "string",
      default: path.resolve(import.meta.dirname, "../../../../uploads/places"),
    },
  },
});

try {
  const places = await getAllPlaces(values.dir);
  logger.info(`Parsed ${places.length} places from ${values.dir}`);

  const resolved = await enrichPlaces(places);
  logger.info(`Resolved ${resolved.length} of ${places.length} places`);

  const { saved, deleted } = await syncPlaces(places, resolved);
  logger.info({ saved, deleted }, "Import complete");
} catch (err) {
  logger.error({ err }, "Import failed");
  process.exitCode = 1;
}
