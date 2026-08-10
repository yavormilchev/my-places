import { parseArgs } from "node:util";
import path from "node:path";
import { getAllPlaces } from "../import/import";
import { enrichPlaces } from "../data-enrichment/enrichPlaces";
import { filterUnresolvedPlaces } from "../data-enrichment/filterUnresolvedPlaces";
import { getExistingPlaceIds } from "../persistence/getExistingPlaceIds";
import { syncPlaces } from "../persistence/syncPlaces";
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
  const places = await getAllPlaces(values.dir);
  logger.info(`Parsed ${places.length} places from ${values.dir}`);

  let placesToResolve = places;
  if (values.refresh) {
    logger.info("--refresh set: re-resolving every place, not just new ones");
  } else {
    const existingPlaceIds = await getExistingPlaceIds();
    placesToResolve = filterUnresolvedPlaces(places, existingPlaceIds);
    logger.info(
      `${placesToResolve.length} of ${places.length} places need resolving ` +
        `(${places.length - placesToResolve.length} already known)`,
    );
  }

  const resolved = await enrichPlaces(placesToResolve);
  logger.info(
    `Resolved ${resolved.length} of ${placesToResolve.length} places`,
  );

  const { saved, deleted } = await syncPlaces(places, resolved);
  logger.info({ saved, deleted }, "Import complete");
} catch (err) {
  logger.error({ err }, "Import failed");
  process.exitCode = 1;
}
