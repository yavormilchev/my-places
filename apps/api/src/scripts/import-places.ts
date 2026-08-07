import { parseArgs } from "node:util";
import path from "node:path";
import { getAllPlaces } from "../import/import";
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
} catch (err) {
  logger.error({ err }, "Import failed");
  process.exitCode = 1;
}
