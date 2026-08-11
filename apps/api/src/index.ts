import express from "express";
import { env } from "./config";
import { logger } from "./logger";
import { getHealth } from "./endpoints/getHealth";
import { getDbHealth } from "./endpoints/getDbHealth";
import { getPlaces } from "./endpoints/getPlaces";

const app = express();
const port = env.port;

app.get("/health", getHealth);
app.get("/db-health", getDbHealth);
app.get("/places", getPlaces);

app.listen(port, () => {
  logger.info(`API listening on http://localhost:${port}`);
});
