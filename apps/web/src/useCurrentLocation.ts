import { useEffect, useState } from "react";
import type { Coordinates } from "@my-places/shared";

// Used only when geolocation fails, is denied, or isn't supported — the map
// is still fully pannable/zoomable from here, so this doesn't need to be
// personally meaningful, just a reasonable starting point.
const FALLBACK_LOCATION: Coordinates = { lat: 39.8283, lng: -98.5795 };

/**
 * Resolves once, to either the browser's geolocation or FALLBACK_LOCATION —
 * stays `null` until then, so callers can wait for a real starting point
 * before mounting the map, rather than rendering it once at the fallback
 * and jumping a moment later once geolocation resolves.
 */
export function useCurrentLocation(): Coordinates | null {
  // Browser support is a static, synchronous fact — decided once, up front,
  // rather than via a setState call inside the effect below (which should
  // only be doing the actual async thing: subscribing to getCurrentPosition).
  const [location, setLocation] = useState<Coordinates | null>(() =>
    navigator.geolocation ? null : FALLBACK_LOCATION,
  );

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Denied or unavailable — fall back; the map can still be panned
        // and zoomed to wherever's actually wanted.
        setLocation(FALLBACK_LOCATION);
      },
    );
  }, []);

  return location;
}
