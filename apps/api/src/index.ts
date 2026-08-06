import {env} from "./config";
import {pool} from "./db";
import express from "express";

const app = express();
const port = env.port;

app.get('/health', (_req, res) => {
  res.json({status: 'ok'});
});

app.get('/db-health', async (_req, res) => {
  try {
    const result = await pool.query("select now() as now, postgis_version() as postgis");
    res.json({status: 'ok', ...result.rows[0]});
  } catch (err) {
    console.error(err);
    res.status(500).json({status: "error", message: (err as Error).message});
  }
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
