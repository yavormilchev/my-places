import cookieParser from "cookie-parser";
import express from "express";
import { requireAuth } from "./auth/requireAuth";
import { env } from "./config";
import { logger } from "./logger";
import { getGoogleCallback } from "./endpoints/getGoogleCallback";
import { getGoogleLogin } from "./endpoints/getGoogleLogin";
import { getHealth } from "./endpoints/getHealth";
import { getDbHealth } from "./endpoints/getDbHealth";
import { getPlaces } from "./endpoints/getPlaces";
import { postLogout } from "./endpoints/postLogout";

const app = express();
const port = env.port;

app.use(cookieParser());

app.get("/health", getHealth);
app.get("/db-health", getDbHealth);

app.get("/auth/google", getGoogleLogin);
app.get("/auth/google/callback", getGoogleCallback);
app.post("/auth/logout", postLogout);

app.get("/places", requireAuth, getPlaces);

app.listen(port, () => {
  logger.info(`API listening on http://localhost:${port}`);
});
