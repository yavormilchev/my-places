# Saved Places Explorer — Project Plan

A backend-focused learning project: sign in with Google, import your Google Maps saved places, and browse them filtered
by radius and category.

---

## 1. What we're building

| Feature             | Notes                                                      |
|---------------------|------------------------------------------------------------|
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

User exports from [takeout.google.com](https://takeout.google.com), selects **Maps (your places)**, and uploads the
resulting file to your app.

- Starred places arrive as **GeoJSON** with coordinates, name, address, country code, and the Maps URL.
- Custom list CSVs contain only title / URL / note — **no coordinates**.
- No OAuth, no verification, no API cost. Good enough to build everything else on.

### Option B — Google Data Portability API (the real version)

Google's official OAuth-based export API. This is what your original idea described, and it does exist.

- Resource group: `maps.starred_places`
- Scope: `https://www.googleapis.com/auth/dataportability.maps.starred_places`
- Returns the same GeoJSON shape as Takeout
- Custom lists live separately under **Saved collections** (CSV, no coordinates)

**Two catches:**

1. **Verification.** These are sensitive/restricted scopes, so a public app must pass Google's app verification. For a
   personal project you stay in *testing*
   mode with your own account added as a test user.
2. **It's asynchronous.** The flow is `initiate job → poll for state → download
   archive`. Not a simple request/response. This is the most interesting backend piece in the whole project.

**Strategy:** build the parser once against Takeout files, then swap the *source*
for the Data Portability API later. Same downstream code.

Docs: <https://developers.google.com/data-portability/schema-reference/local_actions>

---

## 3. The category problem

The starred-places export has **no category field**. Two ways to fill the gap:

- **Places API enrichment** — resolve each place to its `types`
  (`restaurant`, `cafe`, `park`…). This is a paid, rate-limited call, so cache results in a `places` table and never
  re-fetch. Good practice, real cost.
- **User-assigned tags** — let the user tag places themselves. Free, simpler, and honestly more useful for personal
  categories like "date night".

Doing both eventually is reasonable: auto-categorise, then let the user override.

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

- It's a *frontend* framework that runs server code. It hides routing, middleware ordering, and server lifecycle —
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

1. **Parse a Takeout GeoJSON file into Postgres.** CLI script or one endpoint. No auth, no frontend. Get the data model
   right.
2. **Radius + category filtering as a query API.** `GET /places?lat=&lng=&radius=&category=`
3. **React frontend with a map.** Now you have something to look at.
4. **Google sign-in.** Auth only — OAuth flow, token storage, refresh handling.
5. **Replace file upload with the Data Portability API.** Job table, poller, archive download, idempotent re-import.
6. *(Optional)* Places API enrichment with caching and cost control.

---

## 7. Backend concepts this exercises

- OAuth 2.0 authorization code flow, token storage, refresh handling
- Async job orchestration (initiate → poll → download)
- Third-party rate limits, caching, and cost control
- **Idempotent imports** — running twice must not duplicate rows (upsert on place ID)
- Geospatial queries and index design
- Query-parameter API design for filtering
- File parsing and validation of untrusted input

**What it won't teach:** real concurrency, horizontal scaling, complex domain modelling. It's a single-user app and
that's fine.

---

## 8. Gotchas to remember

- Starred places and custom lists are **two different data sources** with different shapes. Don't assume one parser
  handles both.
- Custom list CSVs have no coordinates — they need Places API resolution.
- Re-imports must be idempotent. Design the unique key before writing the insert.
- Places API calls cost money. Cache aggressively; never re-fetch a resolved place.
- Express 5 changed wildcard route syntax and query parsing from v4 — old tutorials may not copy-paste cleanly.
- Data Portability API testing mode caps you at a limited number of test users.
