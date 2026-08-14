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
import { postImport } from "./endpoints/postImport";
import { postLogout } from "./endpoints/postLogout";

const app = express();
const port = env.port;

app.use(cookieParser());

const apiRouter = express.Router();

apiRouter.get("/health", getHealth);
apiRouter.get("/db-health", getDbHealth);

apiRouter.get("/auth/google", getGoogleLogin);
apiRouter.get("/auth/google/callback", getGoogleCallback);
apiRouter.post("/auth/logout", postLogout);

apiRouter.get("/places", requireAuth, getPlaces);
apiRouter.post(
  "/import",
  requireAuth,
  express.json({ limit: "5mb" }),
  postImport,
);

app.use("/api", apiRouter);

app.listen(port, () => {
  logger.info(`API listening on http://localhost:${port}`);
});
