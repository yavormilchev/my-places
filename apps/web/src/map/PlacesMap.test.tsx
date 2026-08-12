import { useEffect, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PlaceWithDistance } from "@my-places/shared";
import { PlacesMap } from "./PlacesMap";
import * as auth from "../auth/auth";

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

// PlacesMap builds each marker's icon via `new google.maps.Size(...)` /
// `Point(...)` directly (see emojiMarkerIcon.ts's use in PlacesMap.tsx) —
// that runs in our own render code, not inside the mocked Marker above, so
// it needs these to exist even though the real SDK is never loaded here.
vi.stubGlobal("google", {
  maps: {
    Size: class Size {
      constructor(
        public width: number,
        public height: number,
      ) {}
    },
    Point: class Point {
      constructor(
        public x: number,
        public y: number,
      ) {}
    },
  },
});

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

  it("redirects to sign-in when the places fetch comes back unauthenticated", async () => {
    const redirectToLogin = vi
      .spyOn(auth, "redirectToLogin")
      .mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401 } as Response),
    );

    render(<PlacesMap />);

    await waitFor(() => expect(redirectToLogin).toHaveBeenCalled());
  });
});
