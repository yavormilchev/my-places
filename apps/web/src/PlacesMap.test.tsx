import { useEffect, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PlaceWithDistance } from "@my-places/shared";
import { PlacesMap } from "./PlacesMap";

// Stand-ins for the real Google Maps SDK components. The real ones need a
// loaded Maps script, a live API key, and canvas/WebGL rendering — none of
// which exist in jsdom. These fakes let us exercise our own event wiring
// (onIdle triggering a fetch, marker clicks selecting a place) without any
// of that: Map fires onIdle once on mount, Marker is a clickable button.
vi.mock("@vis.gl/react-google-maps", () => ({
  Map: ({
    children,
    onIdle,
  }: {
    children: ReactNode;
    onIdle: (event: {
      map: {
        getCenter: () => { lat: () => number; lng: () => number };
        getBounds: () => {
          getNorthEast: () => { lat: () => number; lng: () => number };
        };
      };
    }) => void;
  }) => {
    useEffect(() => {
      onIdle({
        map: {
          getCenter: () => ({ lat: () => 40.7128, lng: () => -74.006 }),
          getBounds: () => ({
            getNorthEast: () => ({ lat: () => 40.8, lng: () => -73.9 }),
          }),
        },
      });
      // Fire once, like the real onIdle settling after the initial load.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div>{children}</div>;
  },
  Marker: ({ title, onClick }: { title: string; onClick: () => void }) => (
    <button onClick={onClick}>{title}</button>
  ),
  InfoWindow: ({
    children,
    headerContent,
  }: {
    children: ReactNode;
    headerContent: ReactNode;
  }) => (
    <div role="dialog">
      {headerContent}
      {children}
    </div>
  ),
}));

const PLACE: PlaceWithDistance = {
  placeId: "test-place",
  title: "Test Cafe",
  resolvedTitle: "Test Cafe (Resolved)",
  category: "Cafe",
  types: ["cafe"],
  url: "https://maps.google.com/?cid=123",
  savedAt: "2026-01-01T00:00:00.000Z",
  lat: 40.71,
  lng: -74.0,
  distanceMiles: 1.2,
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [PLACE],
    } as Response),
  );
});

describe("PlacesMap", () => {
  it("loads the map and renders fetched places as markers", async () => {
    render(<PlacesMap />);

    expect(await screen.findByText("Test Cafe")).toBeInTheDocument();
  });

  it("shows a place's info when its marker is clicked, without throwing", async () => {
    const user = userEvent.setup();
    render(<PlacesMap />);

    await user.click(await screen.findByText("Test Cafe"));

    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Test Cafe (Resolved)",
    );
  });
});
