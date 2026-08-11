import { useCallback, useState } from "react";
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

/**
 * The backend filters by a circular radius, but the map viewport is a
 * rectangle — sizing the radius to reach the farthest corner means nothing
 * currently visible is ever missing, at the cost of a few extra places just
 * outside the rectangle's edges also coming back. That's the right side to
 * be imprecise on.
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

  // Fires once after the map settles from a pan or zoom (including the
  // initial load) — not continuously during the interaction, so this needs
  // no hand-rolled debouncing.
  const handleIdle = useCallback((event: MapEvent) => {
    const center = event.map.getCenter();
    const bounds = event.map.getBounds();
    if (!center || !bounds) return;

    const centerCoords: Coordinates = { lat: center.lat(), lng: center.lng() };
    const query: PlacesQuery = {
      ...centerCoords,
      radiusMiles: radiusMilesFromBounds(centerCoords, bounds),
      categories: [],
    };

    fetchPlaces(query)
      .then(setPlaces)
      .catch((err: unknown) => {
        console.error("Failed to fetch places", err);
      });
  }, []);

  if (!location) {
    return <p>Finding your location…</p>;
  }

  return (
    <Map
      defaultCenter={location}
      defaultZoom={13}
      onIdle={handleIdle}
      gestureHandling="greedy"
      style={{ width: "100%", height: "100vh" }}
    >
      {places.map((place) => (
        <Marker
          key={place.placeId}
          position={{ lat: place.lat, lng: place.lng }}
          title={place.title}
          onClick={() => setSelectedPlace(place)}
        />
      ))}
      {selectedPlace && (
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
  );
}
