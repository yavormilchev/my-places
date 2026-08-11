import type { Request, Response } from "express";
import { pool } from "../db";
import { logger } from "../logger";

export async function getDbHealth(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      "select now() as now, postgis_version() as postgis",
    );
    res.json({ status: "ok", ...result.rows[0] });
  } catch (err) {
    logger.error({ err }, "Database health check failed");
    res.status(500).json({ status: "error", message: (err as Error).message });
  }
}
