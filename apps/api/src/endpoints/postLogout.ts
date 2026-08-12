import type { Request, Response } from "express";
import { SESSION_COOKIE_NAME } from "../auth/session";

export function postLogout(_req: Request, res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME);
  res.status(204).end();
}
