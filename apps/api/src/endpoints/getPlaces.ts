import type { Request, Response } from "express";
import { filterByCategory } from "../filtering/filterByCategory";
import { filterByRadiusWithDistance } from "../filtering/filterByRadiusWithDistance";
import { listPlaces } from "../persistence/listPlaces";
import { parsePlacesQuery } from "./parsePlacesQuery";

export async function getPlaces(req: Request, res: Response): Promise<void> {
  const query = parsePlacesQuery(req.query);
  if (!query) {
    res.status(400).json({
      status: "error",
      message:
        "lat, lng, and radius query params are required and must be numbers",
    });
    return;
  }

  // requireAuth (this route's middleware) always sets this before next()
  const userId = req.userId!;
  const places = await listPlaces(userId);
  const withinRadius = filterByRadiusWithDistance(places, query);
  const result = filterByCategory(withinRadius, query.categories);

  res.json(result);
}
