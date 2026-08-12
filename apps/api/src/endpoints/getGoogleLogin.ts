import type { Request, Response } from "express";
import { getGoogleAuthorizationUrl } from "../auth/googleOAuth";

export function getGoogleLogin(_req: Request, res: Response): void {
  res.redirect(getGoogleAuthorizationUrl());
}
