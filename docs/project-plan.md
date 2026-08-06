# Saved Places Explorer — Project Plan

A backend-focused learning project: sign in with Google, import your Google Maps saved places, and browse them filtered
by radius and category.

---

## 1. What we're building

| Feature             | Notes                                                      |
| ------------------- | ---------------------------------------------------------- |
| Google sign-in      | Standard OAuth 2.0 authorization code flow                 |
| Import saved places | Via Takeout file upload (v1) → Data Portability API (v2)   |
| Radius filter       | "Show me saved places within X km of my current location"  |
| Category filter     | Restaurant / cafe / park / etc. — needs enrichment, see §3 |

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

- **Scraping** the place's page — confirmed working against real exported URLs: a plain unauthenticated `GET` on
  that link returns HTML whose `<meta property="og:image">` tag embeds a static-map preview URL with
  `center=<lat>,<lng>`. Free, no setup — but undocumented and unofficial, and could break without notice. Pace
  requests (sequential, small delay) and cache aggressively (once per place, ever) to stay a good citizen.
- **Places API** (Place Details) — the sanctioned, paid alternative. The same response also carries `types`, which
  would fold the category-resolution step (§3) into this same call.

**Strategy:** wrap coordinate resolution behind one swappable function (`resolvePlaceCoordinates`) — start with
scraping, swap the internals for Places API later if it breaks or the official path becomes worth the cost. Same
principle as the Takeout → Data Portability swap below, one level down.

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
  (`restaurant`, `cafe`, `park`…). This is a paid, rate-limited call, so cache results in a `places` table and never
  re-fetch. Good practice, real cost. Note this is the same API call already needed for coordinates in §2, not an
  extra one.
- **User-assigned tags** — let the user tag places themselves. Free, simpler, and honestly more useful for personal
  categories like "date night".

Doing both eventually is reasonable: start from list names, layer Places API and/or manual tags on top.

---

## 4. Radius filtering

- **Honest baseline:** for a few hundred places, haversine in plain TypeScript over an in-memory array is completely
  sufficient.
- **Learning path:** Postgres + PostGIS, `ST_DWithin` with a GiST index.

Pick PostGIS if the point is to learn spatial querying; pick haversine if you want to move fast. Don't pretend the first
is necessary at this scale.

---

## 5. Stack decisions

```
/api      Express 5 + TypeScript + Postgres (+ PostGIS)
/web      Vite + React + TypeScript
```

Two processes, two `package.json` files, one repo.

### Why not Next.js

- It's a _frontend_ framework that runs server code. It hides routing, middleware ordering, and server lifecycle —
  exactly what you want to learn.
- The Data Portability poller needs a **long-lived process**. Route handlers are request/response shaped and common
  deployment targets time out at 10–60s.
- Debugging becomes "is this Next or me?"

Build a Next app when learning Next is the goal. Separate project.

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

1. **Parse Takeout "Saved" CSVs into Postgres**, resolving each place's coordinates through the swappable resolver
   (§2). CLI script or one endpoint. No auth, no frontend. Get the data model right — including caching resolved
   coordinates so re-imports never re-resolve a place that's already been looked up.
2. **Radius + category filtering as a query API.** `GET /places?lat=&lng=&radius=&category=`
3. **React frontend with a map.** Now you have something to look at.
4. **Google sign-in.** Auth only — OAuth flow, token storage, refresh handling.
5. **Replace file upload with the Data Portability API.** Job table, poller, archive download, idempotent re-import.
6. _(Optional)_ Places API enrichment with caching and cost control.

---

## 7. Backend concepts this exercises

- OAuth 2.0 authorization code flow, token storage, refresh handling
- Async job orchestration (initiate → poll → download)
- Third-party rate limits, caching, and cost control
- **Idempotent imports** — running twice must not duplicate rows (upsert on place ID)
- Geospatial queries and index design
- Query-parameter API design for filtering
- File parsing and validation of untrusted input
- Isolating an unofficial/unstable data source (scraped coordinates) behind a swappable resolver, so the rest of the
  pipeline doesn't care where coordinates come from

**What it won't teach:** real concurrency, horizontal scaling, complex domain modelling. It's a single-user app and
that's fine.

---

## 8. Gotchas to remember

- **"Maps (your places)" and "Saved" are two different Takeout products.** The former gives GeoJSON but only for
  Labeled places (Home/Work/pins) — not your saved lists. The latter gives your actual saved lists, but only as CSV,
  no coordinates, for every list including starred places.
- No CSV export has coordinates. All of them need the resolver from §2 (scraping or Places API) before a place is
  usable for radius filtering.
- Re-imports must be idempotent. Design the unique key before writing the insert — the Feature ID in each row's URL
  is the natural candidate.
- Coordinate/category resolution costs money (Places API) or carries ToS risk at volume (scraping). Cache
  aggressively; never re-resolve a place already in `places`.
- Express 5 changed wildcard route syntax and query parsing from v4 — old tutorials may not copy-paste cleanly.
- Data Portability API testing mode caps you at a limited number of test users.
