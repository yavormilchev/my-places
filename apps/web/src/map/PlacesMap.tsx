import { useCallback, useMemo, useRef, useState } from "react";
import {
  Map,
  Marker,
  InfoWindow,
  type MapEvent,
} from "@vis.gl/react-google-maps";
import {
  haversineDistanceMiles,
  type Coordinates,
  type PlaceWithDistance,
  type PlacesQuery,
} from "@my-places/shared";
import { useCurrentLocation } from "./useCurrentLocation";
import { fetchPlaces } from "./fetchPlaces";
import { redirectToLogin, UnauthorizedError } from "../auth/auth";
import { CategoryFilter } from "./CategoryFilter";
import { SignOutButton } from "../auth/SignOutButton";
import { ImportDropZone } from "../import/ImportDropZone";
import { emojiForCategory } from "./categoryEmoji";
import { emojiMarkerIconUrl } from "./emojiMarkerIcon";

/**
 * The backend filters by a circular radius, but the map viewport is a
 * rectangle — sizing the radius to reach the farthest corner means nothing
 * currently visible is ever missing, at the cost of a few extra places just
 * outside the rectangle's edges also coming back.
 */
function radiusMilesFromBounds(
  center: Coordinates,
  bounds: google.maps.LatLngBounds,
): number {
  const corner = bounds.getNorthEast();
  return haversineDistanceMiles(center, {
    lat: corner.lat(),
    lng: corner.lng(),
  });
}

export function PlacesMap() {
  const location = useCurrentLocation();
  const [places, setPlaces] = useState<PlaceWithDistance[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithDistance | null>(
    null,
  );
  // Categories the user has unchecked. Kept as "what's excluded" rather
  // than "what's included" so a category present in a future fetch (e.g.
  // after panning) defaults to shown, without needing to know about it
  // ahead of time.
  const [excludedCategories, setExcludedCategories] = useState<Set<string>>(
    new Set(),
  );

  // The center/bounds query only exists inside handleIdle's event — kept
  // here too so a completed import can re-run the same fetch afterward,
  // without needing a live handle on the underlying map instance.
  const lastQueryRef = useRef<PlacesQuery | null>(null);

  const refetchPlaces = useCallback((query: PlacesQuery) => {
    fetchPlaces(query)
      .then(setPlaces)
      .catch((err: unknown) => {
        if (err instanceof UnauthorizedError) {
          redirectToLogin();
          return;
        }
        console.error("Failed to fetch places", err);
      });
  }, []);

  // Fires once after the map settles from a pan or zoom — not continuously
  // during the interaction. Always fetched unfiltered by category so toggling
  // a checkbox doesn't need a round trip.
  const handleIdle = useCallback(
    (event: MapEvent) => {
      const center = event.map.getCenter();
      const bounds = event.map.getBounds();
      if (!center || !bounds) return;

      const centerCoords: Coordinates = {
        lat: center.lat(),
        lng: center.lng(),
      };
      const query: PlacesQuery = {
        ...centerCoords,
        radiusMiles: radiusMilesFromBounds(centerCoords, bounds),
        categories: [],
      };

      lastQueryRef.current = query;
      refetchPlaces(query);
    },
    [refetchPlaces],
  );

  const handleImported = useCallback(() => {
    if (lastQueryRef.current) refetchPlaces(lastQueryRef.current);
  }, [refetchPlaces]);

  const toggleCategory = useCallback((category: string) => {
    setExcludedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const availableCategories = useMemo(
    () => Array.from(new Set(places.map((place) => place.category))).sort(),
    [places],
  );
  const visiblePlaces = useMemo(
    () => places.filter((place) => !excludedCategories.has(place.category)),
    [places, excludedCategories],
  );

  if (!location) {
    return <p>Finding your location…</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div
        style={{
          position: "fixed",
          top: "0.75rem",
          right: "1rem",
          zIndex: 10,
          display: "flex",
          gap: "0.5rem",
        }}
      >
        <ImportDropZone onImported={handleImported} />
        <SignOutButton />
      </div>
      <CategoryFilter
        categories={availableCategories}
        excluded={excludedCategories}
        onToggle={toggleCategory}
      />
      <Map
        defaultCenter={location}
        defaultZoom={13}
        onIdle={handleIdle}
        gestureHandling="greedy"
        style={{ width: "100%", flex: 1 }}
      >
        {visiblePlaces.map((place) => (
          <Marker
            key={place.placeId}
            position={{ lat: place.lat, lng: place.lng }}
            title={place.title}
            icon={{
              url: emojiMarkerIconUrl(emojiForCategory(place.category)),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16),
            }}
            onClick={() => setSelectedPlace(place)}
          />
        ))}
        {selectedPlace && !excludedCategories.has(selectedPlace.category) && (
          <InfoWindow
            position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
            onCloseClick={() => setSelectedPlace(null)}
            headerContent={<strong>{selectedPlace.category}</strong>}
          >
            <div>
              <strong>
                {selectedPlace.resolvedTitle ?? selectedPlace.title}
              </strong>
              <div>{selectedPlace.category}</div>
              <div>{selectedPlace.distanceMiles.toFixed(1)} mi away</div>
              <div>
                <a href={selectedPlace.url} target="_blank" rel="noreferrer">
                  Open in Google Maps
                </a>
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}
