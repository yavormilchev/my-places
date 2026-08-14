# Hosting & Deployment

**Status:** Auth and the production build pipeline are implemented. Infrastructure provisioning (the rest of this
document) is designed but not yet deployed — see the checklist at the bottom for exactly what's done versus planned.

---

## Goals

This is a single-user personal project with no revenue and no scaling requirements — the deployment strategy
optimizes for **cost, simplicity, and direct control over every layer of the stack** rather than for the kind of
resilience or scale a multi-tenant product would need. A real security posture anyway, because "no scale" doesn't
mean "no stakes": the app displays personal saved-places data and sits on the open internet.

---

## Architecture

### Compute: AWS Lightsail

**AWS Lightsail** over provisioning EC2 directly. Both give a real Ubuntu box configured by hand — nginx, systemd,
certbot, no platform abstraction in between — the difference is in the networking layer underneath. EC2 requires
owning VPC design, security groups, and Elastic IP association from scratch; for a single instance serving a
single-user app, that's overhead with no corresponding benefit. Lightsail bundles a static IP and a simplified
firewall by default, at a fixed monthly cost, while leaving everything above the network layer identical to EC2.

### One box, path-based routing

A single Lightsail instance runs everything:

- **nginx** is the only process bound to the public network (80/443), terminating TLS (Let's Encrypt via certbot,
  auto-renewing through the systemd timer certbot installs) and routing by request path:
  - `/places/` — the built React SPA, served directly off disk. No Node process touches a static asset request.
  - `/places/api/` — reverse-proxied to the Express API, which is bound to `127.0.0.1` only and never reachable
    directly from the internet.
- **The API process** runs under **systemd**, not PM2 or a Docker container. Chosen deliberately: systemd is already
  on the box, adds no runtime dependency, and restarts automatically on crash or reboot.
- **Postgres + PostGIS** runs via the same `docker-compose.yml` already used in local development. This is a
  deliberate inconsistency with the API's bare-metal placement above, not an oversight: Docker earns its place here
  specifically because PostGIS is the one component genuinely fussy to install and configure correctly by hand, and
  reusing the exact same image as local dev keeps that one piece identical in both environments. Bound to
  `127.0.0.1` only — worth flagging explicitly, since the compose file's default `5432:5432` port mapping binds all
  interfaces, which on a publicly reachable host means Postgres listening to the internet unless it's rewritten to
  `127.0.0.1:5432:5432`.

### Production entrypoint

The API ships as a single bundled file, not run through a TypeScript loader in production. `esbuild`'s JS API
compiles and bundles `src/index.ts` — including first-party workspace packages — into `dist/index.js`, while keeping
genuine third-party dependencies external so they install normally via `npm ci` rather than getting inlined.

That "JS API, not the CLI" detail isn't incidental: the CLI's blanket `--packages=external` flag treats _everything_
resolved through `node_modules` as external, including internal workspace packages that are only symlinked there,
not actually installed — which broke at runtime the first time it was tried. The build script instead derives its
external list from `package.json`'s real dependencies, verified by actually running the built bundle rather than
trusting a clean compile.

`ExecStart=node dist/index.js`, with `npm run build` as the deploy step beforehand.

---

## Security model

### Network layer

Lightsail's firewall permits exactly three ports: 22 (SSH), 80, 443. SSH is key-only — password authentication is
disabled at the OS level, not just discouraged.

### Application layer: Google OAuth, scoped to one identity

Authentication here isn't a general-purpose multi-user auth system — it's an access gate scoped to exactly one
Google account, because this is a single-user app displaying one person's saved-places data. Sign-in uses the
standard OAuth 2.0 authorization code flow; the callback checks the returned email against a single allow-listed
address before issuing anything.

The session itself is a signed, `httpOnly`, `Secure`, `SameSite=Lax` cookie — deliberately not a database-backed
session, since a single-user app has no meaningful session-invalidation requirement beyond "let it expire." No
password ever exists inside this app's own trust boundary; Google's own sign-in page is the only place one is ever
entered, which removes the classic credential-brute-force target entirely rather than just rate-limiting it.

### Rate limiting & abuse mitigation

Layered rather than single-point:

- nginx-level request throttling in front of the whole app — the first line of defense, before a request ever
  reaches Node.
- `fail2ban` watching nginx's access log, banning IPs that repeatedly hit 401/429 responses on the auth routes.
- Application-level rate limiting on the API itself as a second, independent layer, so a misconfiguration in one
  layer doesn't remove protection entirely.

---

## Deliberately out of scope

Horizontal scaling, load balancing, a managed database (RDS), a CDN, and zero-downtime deploys are all explicitly
not part of this design — not because they're hard, but because a single-user app with no uptime SLA and no revenue
doesn't need any of them.

---

## Step-by-step approach

1. Provision the Lightsail instance; harden it (SSH keys only, firewall)
2. Install Node, nginx, certbot
3. Postgres/PostGIS via `docker-compose.yml` (with the `5432` binding fixed)
4. nginx config (static `/places/`, reverse-proxied `/places/api/`) + TLS
5. Rate limiting + `fail2ban`
6. Point DNS at the new box
