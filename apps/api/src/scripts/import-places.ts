import { parseArgs } from "node:util";
import path from "node:path";
import { importAllPlaces } from "../import/import";
import { runImport } from "../import/runImport";
import { logger } from "../logger";
import { userExists } from "../persistence/userExists";

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
    userId: {
      type: "string",
    },
  },
});

try {
  if (!values.userId) {
    throw new Error(
      "--userId is required — sign in via the web app first to create a user, then pass their id here",
    );
  }

  if (!(await userExists(values.userId))) {
    throw new Error(`No user with id "${values.userId}" exists`);
  }

  const places = await importAllPlaces(values.dir);
  logger.info(`Parsed ${places.length} places from ${values.dir}`);

  if (values.refresh) {
    logger.info("--refresh set: re-resolving every place, not just new ones");
  }

  const { saved, deleted } = await runImport(values.userId, places, {
    refresh: values.refresh,
  });
  logger.info({ saved, deleted }, "Import complete");
} catch (err) {
  logger.error({ err }, "Import failed");
  process.exitCode = 1;
}
