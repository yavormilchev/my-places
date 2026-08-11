# My Places Explorer

[![CI](https://github.com/yavormilchev/my-places/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/yavormilchev/my-places/actions/workflows/ci.yml)

A personal tool for importing Google Maps saved places and browsing them by location and category — not a product.
Single-user by design: no accounts, no multi-tenancy, just me. Full design reasoning and tradeoffs live in
[`docs/project-plan.md`](docs/project-plan.md).

## A few things worth knowing about how this works

- **Google Maps has no API for a user's saved places.** Every "import my saved places" tool works around that —
  this one starts from a Google Takeout CSV export, since that's the only path that exists.
- **The first coordinate-resolution approach — scraping — turned out not to work**, and not for a vague "it's
  unofficial" reason: a plain unauthenticated request to a Maps place URL returns Google's generic app shell, not
  place-specific data (confirmed by fetching two different real places and finding byte-identical responses).
  Swapped for the Places API instead, without touching anything downstream — coordinate/category resolution was
  built behind one swappable boundary from the start specifically so a wrong bet like that wouldn't be expensive to
  unwind.
- **Turning a saved place's URL into something the Places API accepts required reverse-engineering Google's Place
  ID format** — there's no documented conversion from what Takeout exports. Decoding real Place IDs showed they're
  base64url of a small protobuf message holding the URL's embedded ID as raw bytes — fully local, no API call
  needed, and confirmed against the live API for multiple real places before being trusted.
- **Re-importing doesn't just add places — it reconciles.** Removing a place from Google Maps removes it from the
  database too on the next import, with a safety guard against ever treating "the API had a bad day this run" the
  same as "you actually removed this."

## Stack

- `/api` — Express 5, TypeScript, Postgres, raw `pg` (no ORM)
- `/web` — Vite, React, TypeScript
- npm workspaces, one repo

## Initial setup

Run these commands in the root folder:

To install dependencies:
`npm install`

Copy `.env.example` to `.env` and fill in your own values (Postgres credentials, a Google Maps API key with the
Places API enabled).

To provision the DB:
`npm run db:up`

To create the test database (a separate, disposable database the test suite runs against — see
[`docs/project-plan.md`](docs/project-plan.md) §7):

```shell
docker compose exec postgres createdb -U $POSTGRES_USER my_places_test
```

To run the migrations (both the main and test databases):

```shell
npm run migrate -w @my-places/api -- up
npm run migrate:test -w @my-places/api -- up
```

## Running locally

Provided the DB is already running:

To run web and api:
`npm run dev`

## Checks

To run the local checks:
`npm run check`

Is web reachable at http://localhost:5173/
Is API responding at http://localhost:3000/health
Is API responding with DB live at: http://localhost:3000/db-health

## How to export your saved places

1. Go to takeout.google.com.
2. Click "Deselect all", then check just "Saved".
3. Continue through the export options (file type .zip, default size limit is way more than enough for this).
4. Create the export — Google emails you when it's done.
5. Download and unzip it. Inside you'll find a Takeout/Saved/ folder containing csv files for all your saved lists.
6. Drop the desired csv files in the uploads folder.
7. Run the import command to load them into the app.

```shell
npm run import -w @my-places/api
```

## License

[MIT](LICENSE)
