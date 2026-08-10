import { featureIdToPlaceId } from "./featureIdToPlaceId";

export function extractPlaceIdFromUrl(url: string): string | null {
  const match = url.match(/!1s(0x[0-9a-f]+):(0x[0-9a-f]+)/i);
  if (!match) return null;
  return featureIdToPlaceId({ hexA: match[1], hexB: match[2] });
}
