import type { Coordinates } from "./index";

/**
 * Calculates the great-circle distance between two points on the Earth
 * using the Haversine formula.
 * @param point1 Starting coordinate
 * @param point2 Destination coordinate
 * @returns The distance between the points
 */
export function haversineDistanceMiles(
  point1: Coordinates,
  point2: Coordinates,
): number {
  // Return 0 early if coordinates are identical
  if (point1.lat === point2.lat && point1.lng === point2.lng) {
    return 0;
  }

  // Define Earth's radius in miles
  const EARTH_RADIUS = 3959;

  // Helper function to convert degrees to radians
  const toRadians = (degree: number): number => (degree * Math.PI) / 180;

  // Convert latitudes and longitudes from degrees to radians
  const lat1Rad = toRadians(point1.lat);
  const lat2Rad = toRadians(point2.lat);
  const deltaLatRad = toRadians(point2.lat - point1.lat);
  const deltaLonRad = toRadians(point2.lng - point1.lng);

  // Apply Haversine formula components
  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) *
      Math.sin(deltaLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Compute final distance
  return EARTH_RADIUS * c;
}
