# Saved Places Explorer — Project Plan

A backend-focused personal project: sign in with Google, import your Google Maps saved places, and browse them filtered
by radius and category.

---

## 1. What we're building

| Feature             | Notes                                                        |
| ------------------- | ------------------------------------------------------------ |
| Google sign-in      | Standard OAuth 2.0 authorization code flow                   |
| Import saved places | Via Takeout file upload (v1) → Data Portability API (v2)     |
| Radius filter       | "Show me saved places within X miles of my current location" |
| Category filter     | Restaurant / cafe / park / etc. — needs enrichment, see §3   |

Single-user by nature. No scaling concerns, no complex domain modelling.

---

## 2. The critical constraint: getting the data out

**There is no Google Maps API that returns a user's saved places.** This is the single most important thing to know
before starting. Every "import my saved places" product works around it.

### Option A — Google Takeout file upload (start here)

Two different Takeout products are involved, and they are **not interchangeable** — this tripped up the first attempt:

- **"Maps (your places)"** exports **Labeled places** — Home, Work, and custom map pins — as GeoJSON with real
  coordinates. This is _not_ your saved lists, despite being the obvious-sounding choice.
- **"Saved"** exports your actual saved-list places (Food, Coffee, Parks, Want to go, etc.) as **one CSV per list**:
  `Title, Note, URL, Tags, Comment`. **No coordinates anywhere in it** — starred places included, contrary to what an
  earlier version of this plan assumed.

The `URL` column looks like a normal Maps link but only encodes a Google Feature ID
(`.../data=!4m2!3m1!1s0x<hex>:0x<hex>`) — an opaque database key, not geodata. Turning it into a coordinate needs a
separate resolution step:

- **Scraping — tried, doesn't work.** A plain unauthenticated `GET` on a place URL isn't server-rendered per place at
  all: it's a client-side SPA, so the response is Google's generic app shell regardless of which place was requested.
  Confirmed by fetching two different real places and comparing — `og:image`, `og:title`, everything came back
  byte-identical between them. There's no server-rendered coordinate to scrape from a bare HTTP request; getting what
  the browser's address bar shows after load (`!3d<lat>!4d<lng>`) needs real JS execution — Playwright driving an
  actual headless Chromium, one real browser process per place. Doable, but a much heavier runtime dependency for
  something the Places API solves more cheaply.
- **Places API** (Place Details) — the sanctioned alternative, and the one we're using. `location` (lat/lng) _and_
  `types` (category, folds into §3) both sit in the cheapest tier, **Place Details Essentials — $5.00 per 1,000
  requests, first 10,000 calls/month free** (per-SKU free tier, effective March 2025). For a few hundred places
  that's within the free tier — effectively $0 for the initial import, and re-imports only pay for newly-saved
  places thanks to the caching rule below.

**Strategy:** wrap coordinate + category resolution behind a swappable boundary (`enrichPlace`/`enrichPlaces` in
`apps/api/src/data-enrichment/`) — paid off in practice, not just in theory: it's what let scraping get tried and
rejected without touching anything downstream. Same principle as the Takeout → Data Portability swap below, one
level down.

**How it actually resolves a place, once Places API was the answer:** the Feature ID isn't directly usable as API
input — no documented endpoint converts it to a `place_id`. Reverse-engineered instead, by decoding real Place IDs:
a Place ID is base64url of a small protobuf message holding the Feature ID's two hex64 values as raw little-endian
bytes — fully local, no network call (`featureIdToPlaceId`). Confirmed against the live API for multiple independent
real places, not just that the decoding math lined up. One Place Details Essentials call then gets `location` +
`types` together (`fetchPlaceDetails`) — see §8 for why this derivation, like scraping, is unofficial.

No OAuth, no verification, no API cost for the CSV export itself. Good enough to build everything else on.

### Option B — Google Data Portability API (the real version)

Google's official OAuth-based export API. This is what your original idea described, and it does exist.

- Resource group: `maps.starred_places`
- Scope: `https://www.googleapis.com/auth/dataportability.maps.starred_places`
- Documented to return the same shape as Takeout's starred-places export — **unverified against the coordinate gap
  found in Option A**. Don't assume this fixes the missing-coordinates problem; re-check once this path is actually
  built.
- Custom lists live separately under **Saved collections** (same CSV shape, same missing coordinates, as the Takeout
  "Saved" export)

**Two catches:**

1. **Verification.** These are sensitive/restricted scopes, so a public app must pass Google's app verification. For a
   personal project you stay in _testing_
   mode with your own account added as a test user.
2. **It's asynchronous.** The flow is `initiate job → poll for state → download
archive`. Not a simple request/response. This is the most interesting backend piece in the whole project.

**Strategy:** build the parser once against Takeout files, then swap the _source_
for the Data Portability API later. Same downstream code.

Docs: <https://developers.google.com/data-portability/schema-reference/local_actions>

---

## 3. The category problem

Not as bare as first assumed. Each "Saved" CSV file _is_ a list — `Food.csv`, `Coffee.csv`, `Club.csv`, `Parks.csv` —
and the list a place is saved under is free categorization, no extra field or API call needed. Some lists are
genuine categories (`Food`, `Coffee`, `Parks`); others (`Want to go`, `Loved places`, `Favorite places`) read more
like the tags idea below than a category. The mapping from list name to `Category` vs. free-form tag is a judgment
call per list, not automatic.

Two ways to go further, if the list-name mapping isn't enough on its own:

- **Places API enrichment** — resolve each place to its `types`
  (`restaurant`, `cafe`, `park`…). Same Place Details Essentials call already needed for coordinates in §2, not an
  extra one — free at this volume, but cache results in a `places` table and never re-fetch regardless, since that's
  what keeps it free as the place count grows.
- **User-assigned tags** — let the user tag places themselves. Free, simpler, and honestly more useful for personal
  categories like "date night".

Doing both eventually is reasonable: start from list names, layer Places API and/or manual tags on top.

---

## 4. Radius filtering

- **Honest baseline:** for a few hundred places, haversine in plain TypeScript over an in-memory array is completely
  sufficient.
- **PostGIS path:** Postgres + PostGIS, `ST_DWithin` with a GiST index.

Pick PostGIS for proper spatial indexing and query-level filtering; pick haversine if in-memory filtering over a few
hundred rows is good enough (it is, at this scale).

---

## 5. Stack decisions

```
/api      Express 5 + TypeScript + Postgres (+ PostGIS)
/web      Vite + React + TypeScript
```

Two processes, two `package.json` files, one repo.

### Why not Next.js

- It's a _frontend_ framework that runs server code. It hides routing, middleware ordering, and server lifecycle —
  exactly the layer this project needs direct control over.
- The Data Portability poller needs a **long-lived process**. Route handlers are request/response shaped and common
  deployment targets time out at 10–60s.
- Debugging becomes "is this Next or me?"

Next has a real place for a frontend-heavy app — just not this one.

### Why not Nuxt

Nuxt is Vue. Not applicable.

### Why Express over Fastify

Fastify is technically the better greenfield choice — native TypeScript generics, built-in JSON Schema validation,
automatic async error handling, Pino logging out of the box. It's also 3–5x faster, which is **completely irrelevant**
for a single-user app.

Express 5 wins here because:

- You already know it. Novelty budget is finite and this project spends it on OAuth, async jobs, rate limiting, and
  geospatial queries.
- Enormous tutorial and Stack Overflow corpus.
- v5 fixed the worst v4 wart: proper async/await error propagation.
- Choosing your own logger / validator / error handler is itself educational.

### Why not NestJS

Wraps Express anyway, adds Angular-style modules and dependency injection. Good architecture lessons, too much ceremony
to absorb alongside everything else.

### Background jobs

- **v1:** `setInterval` reading a `jobs` table.
- **When that gets annoying:** [pg-boss](https://github.com/timgit/pg-boss) — uses the Postgres you already have instead
  of dragging in Redis.

---

## 6. Build order

Each step ships something that works. That matters more than it sounds.

1. **✅ Parse Takeout "Saved" CSVs into Postgres**, resolving each place's coordinates and category through the
   swappable resolver (§2), backed by Places API. Built as a CLI script (`npm run import`). Re-imports fully
   reconcile the table against the current export — upserts everything present, and deletes rows for places no
   longer in it — not just insert-and-forget.
2. **✅ Radius + category filtering as a query API.** `GET /places?lat=&lng=&radius=&category=`
3. **✅ React frontend with a map.** Now you have something to look at.
4. **Google sign-in.** Auth only — OAuth flow, token storage, refresh handling.
5. **Replace file upload with the Data Portability API.** Job table, poller, archive download, idempotent re-import.

---

## 7. Backend concepts covered

- OAuth 2.0 authorization code flow, token storage, refresh handling
- Async job orchestration (initiate → poll → download)
- Third-party rate limits, caching, and cost control
- **Idempotent, reconciling imports** — running twice must not duplicate rows (upsert on place ID), and removing a
  place from the export should remove it from the table too, without treating "failed to resolve this run" the same
  as "actually removed" (see `syncPlaces`)
- Testing against a real database safely — a dedicated test database instead of mocking the DB driver, so tests
  prove real SQL behavior without risking real data
- Geospatial queries and index design
- Query-parameter API design for filtering
- File parsing and validation of untrusted input
- Isolating a data source behind a swappable resolver so the rest of the pipeline doesn't care where coordinates
  come from — paid off directly: scraping was tried, found broken, and swapped for Places API without touching
  anything downstream

**Deliberately out of scope:** real concurrency, horizontal scaling, complex domain modelling — not needed for a
single-user app.

---

## 8. Gotchas to remember

- **"Maps (your places)" and "Saved" are two different Takeout products.** The former gives GeoJSON but only for
  Labeled places (Home/Work/pins) — not your saved lists. The latter gives your actual saved lists, but only as CSV,
  no coordinates, for every list including starred places.
- No CSV export has coordinates. All of them need the Places API resolver from §2 before a place is usable for
  radius filtering.
- **Google Maps place pages are client-rendered SPAs, not server-rendered.** A plain unauthenticated `GET` on a
  place URL returns Google's generic app shell — same `og:image`/`og:title` regardless of which place was
  requested — not place-specific data. Confirmed by comparing two different real places side by side. Ruled out
  scraping as a free coordinate source because of this, not just because it's "unofficial."
- Re-imports must be idempotent. The unique key is the derived Place ID (see §2), not the raw Feature ID it comes
  from — upsert on that.
- **The Feature ID → Place ID conversion is unofficial and undocumented**, same caveat as scraping: reverse-engineered
  by decoding real Place IDs, not published anywhere by Google. Unlike scraping, though, the failure mode is clean —
  an invalid derived Place ID just 404s against Place Details, it doesn't silently return wrong data.
- **A Place ID can outlive the business occupying that location.** Google Place IDs track the physical listing, not
  the current occupant — a saved place's `resolved_title` (from the API) can legitimately differ from `title` (what
  you saved it as), because the business changed, not because anything broke. Confirmed for real: one saved place
  came back under a completely different business name at the same address.
- Coordinate/category resolution via Places API is free at single-user volume (Place Details Essentials: first
  10,000 calls/month free, $5.00/1,000 after). Cache aggressively regardless; never re-resolve a place already in
  `places` — that's what keeps it free as the place count grows.
- Express 5 changed wildcard route syntax and query parsing from v4 — old tutorials may not copy-paste cleanly.
- Data Portability API testing mode caps you at a limited number of test users.
