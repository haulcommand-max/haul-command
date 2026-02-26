# Haul Command — Platform Walkthrough

> **Last updated:** 2026-02-25
> **Build status:** ✅ Green (Next.js 16.1.6, Turbopack)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Map Page (`/map`)](#map-page)
3. [Directory (`/directory`)](#directory)
4. [Ports System](#ports-system)
5. [EJQE (Escort Job Quality Engine)](#ejqe)
6. [Data Correctness Pipeline](#data-correctness-pipeline)
7. [AdGrid Revenue System](#adgrid-revenue-system)
8. [Navigation (GPS Deep-links)](#navigation)
9. [Content Pipeline](#content-pipeline)
10. [Observability](#observability)
11. [Golden Paths (Release Checklist)](#golden-paths)

---

## Golden Paths

> **Quick validation paths before every deploy or release.**
> Run these manually or via `npm run test:e2e` (Playwright).

| # | Path | Steps | Pass if... |
|---|------|-------|------------|
| 1 | **Map → State → Directory** | Open `/map` → click Florida → state page loads | Directory state page renders with county list |
| 2 | **Directory → Search → Results** | Open `/directory` → type "Texas" in search → results render | ≥1 state tile visible, no broken UI |
| 3 | **Port Page** | Open `/ports/port-of-houston` | Port details load, TWIC badge visible, demand score shown |
| 4 | **Load Board** | Open `/loads` | Loads render with EJQE badges (if any exist) |
| 5 | **Claim Flow** | Click "Claim" on any unclaimed listing | Claim modal opens, form is functional |
| 6 | **Mobile Viewport** | Resize to 375×812 → check `/directory` | No horizontal overflow, state tiles stack properly |

### Playwright Regression Coverage

```bash
npm run test:e2e          # Run all headless
npm run test:e2e:ui       # Interactive debugging mode
```

| Test File | Route | Key Assertions |
|-----------|-------|----------------|
| `tests/e2e/map.spec.ts` | `/map` | SVG visible, FL + Canada present, 3 view toggles |
| `tests/e2e/directory.spec.ts` | `/directory` | No category leakage, ≥50 tiles, country toggle works |

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Vercel (Edge)                        │
│  Next.js 16 · Turbopack · ISR · 11 Vercel Crons         │
├──────────────────────────────────────────────────────────┤
│  App Router                                              │
│  ├── (app)/map          → Command Center Map             │
│  ├── (public)/directory → Escort Directory (US+CA)       │
│  ├── (public)/pilot-car → State pages                    │
│  ├── (public)/ports     → Port pages (57 ports)          │
│  ├── api/cron/*         → 11 scheduled jobs              │
│  └── api/*              → REST endpoints                 │
├──────────────────────────────────────────────────────────┤
│  Supabase (Postgres)                                     │
│  ├── regions (64)       → US states + CA provinces       │
│  ├── counties (3,413)   → US counties + CA divisions     │
│  ├── cities (239+)      → Major US + CA cities           │
│  ├── ports (57)         → US + CA ports                  │
│  ├── corridors (20)     → OSOW spine corridors           │
│  ├── directory_listings (896) → Support entities         │
│  ├── directory_drivers (2,875) → Operator profiles       │
│  ├── loads              → Load board + EJQE scoring      │
│  ├── rate_baselines (35)→ Regional rate intelligence     │
│  └── content_jobs       → Content generation queue       │
└──────────────────────────────────────────────────────────┘
```

---

## Map Page

**Route:** `/map`
**Component:** [`app/(app)/map/page.tsx`](../app/(app)/map/page.tsx)

### Views

| View | Purpose |
|------|---------|
| **Jurisdictions** (default) | SVG map of US states + CA provinces, click → `/directory/us/{state}` |
| **Operations** | MapLibre GL vector map with real-time activity overlay |
| **Corridors** | OSOW corridor spine visualization |

### Key Components

- [`components/maps/NorthAmericaMap.tsx`](../components/maps/NorthAmericaMap.tsx) — Clickable SVG map
- [`components/map/CommandMap.tsx`](../components/map/CommandMap.tsx) — MapLibre GL interactive map
- [`components/map/ActivityTicker.tsx`](../components/map/ActivityTicker.tsx) — Real-time ops ticker

### Regression Assertions

- SVG must be visible on first paint
- Florida and Ontario (Canada) must be visible in the SVG
- View toggle bar must show three options: operations, jurisdictions, corridors

---

## Directory

**Route:** `/directory`
**Component:** [`app/(public)/directory/page.tsx`](../app/(public)/directory/page.tsx)

### Hard Rules (per product spec)

✅ Show ONLY: country toggle, search, region grid, corridors, claim bar
❌ Do NOT show: hotels, motels, truck stops, support categories at root level

### Directory Hierarchy

```
/directory
├── /directory/us         → US states grid
│   └── /directory/us/{state}  → State detail + counties
├── /directory/ca         → Canadian provinces grid
│   └── /directory/ca/{province} → Province detail
└── (Port hubs strip)     → Quick links to top ports
```

### Regression Assertions

- No category keywords at root: "hotel", "motel", "truck stop", "support"
- Must have ≥ 50 state/province tiles
- Links must resolve to valid `/directory/us/{code}` or `/directory/ca/{code}` paths

---

## Ports System

**57 ports seeded** — 47 US + 10 CA

### Port Types

| Type | Count | Examples |
|------|-------|---------|
| Seaport | 36 | Houston, LA/Long Beach, Savannah, Norfolk, Vancouver |
| Inland Port | 7 | Chicago, Detroit, Hamilton ON |
| River Port | 6 | St. Louis, Memphis, Pittsburgh, Baton Rouge |
| Border Port | 3 | Laredo, El Paso, Brownsville |

### Port Fields

Every port includes: `name`, `slug`, `lat/lng`, `port_type`, `twic_required`, `heavy_haul_score`, `demand_score`, `primary_industries[]`, `primary_corridors[]`, `last_verified_at`

### Port-to-Corridor Linking

Ports reference corridors via `primary_corridors` array (e.g., Port of Houston → `['i-10','i-45-tx','i-35']`).

---

## EJQE

**Escort Job Quality Engine** — Real-time load scoring and rate intelligence.

### Score Formula

```
Score = (rate_score × 0.40) + (complexity_adj × 0.25) + (deadhead_pen × 0.15)
      + (time_pen × 0.10) + (market × 0.10)
```

### Rate Baselines

35 baselines across 7 regions × 5 service types:

| Service | Unit | Range |
|---------|------|-------|
| PEVO (pilot escort) | per_mile | $1.90–$3.25 |
| Height Pole | per_mile | $2.40–$3.75 |
| Bucket Truck | per_hour | $90–$155 |
| Police Escort | per_mile | $3.25–$6.00 |
| Route Survey | flat | $475–$1,100 |

### Visual Badges (LoadCard v5)

- 🟢 **Strong Pay** — score ≥ 80
- 🟡 **Fair Rate** — score 60–79
- 🔴 **Under Market** — score < 60
- ▲▼■ Trend arrows (14-day broker trend)

---

## Data Correctness Pipeline

### Tables

| Table | Purpose |
|-------|---------|
| `ingest_runs` | Track every data import (source, version, hash, row counts) |
| `data_issues` | Community feedback queue with trust scoring |
| `moderation_actions` | Full moderation audit trail |
| `geo_audit_reports` | Automated validation results |

### Geo Audit (`run_geo_audit()` RPC)

5 automated checks:
1. Missing lat/lon across directory listings
2. Duplicate slugs within regions
3. Orphan drivers (no matching provider)
4. Corridors without states
5. Listings by country distribution

### User Feedback

`ReportIssueButton` component → POST `/api/data-issues` → `data_issues` table → moderation queue

---

## AdGrid Revenue System

### Components

| Component | Purpose |
|-----------|---------|
| `adgrid_pricing` (9 rows) | CPM/CPC/FLAT pricing per slot |
| `adgrid_attribution` | Campaign → conversion tracking |
| `adgrid_inventory` (9 slots) | Port, profile, corridor, directory placements |

### Fraud Prevention

- SHA-256 IP + UA hashing
- Click velocity cap: 5 clicks/visitor/slot/hour → 429
- `visitor_id` tracking

---

## Navigation

**Phase 1:** Free deep-link handoff to native maps apps (zero API cost)

```typescript
// lib/navigation.ts
openNavigation({ destination: 'Port of Houston, TX', provider: 'google' });
openNavigation({ destination: '29.76,-95.36', provider: 'apple' });
```

- Auto-detects iOS → Apple Maps, Android/desktop → Google Maps
- `NavigateButton` component with dual-choice dropdown
- Phase 2 (future): self-hosted OSRM/Valhalla when revenue supports

---

## Content Pipeline

### Vercel Crons (11 scheduled)

| Cron | Schedule | Purpose |
|------|----------|---------|
| `content-enqueue` | Hourly | Scan for new publishable entities → queue |
| `content-pipeline` | Every 15m | Process queued content jobs |
| `directory-rehydrate` | Daily 3am | Full directory listing refresh |
| `directory-incremental` | Every 15m | Incremental listing updates |
| `escort-supply-radar` | Every 15m | Supply availability scan |
| `broker-intent-radar` | Every 30m | Broker activity detection |
| `match-health-monitor` | Every 10m | Match quality monitoring |
| `autonomous-supply-mover` | Hourly | Supply redistribution |
| `control-tower-scan` | Every 30m | Platform health scan |
| `listmonk-weekly-digest` | Mon 2pm | Email digest |
| `county-intelligence-refresh` | Sun 2am | County data enrichment |

### Content Jobs Table

Schema: `id, job_type, key, status, attempts, last_error, output_slug, priority`

Status flow: `queued → processing → done | failed`

---

## Observability

### Health Routes

- **`/admin/directory/health`** — Directory system health check
- **`run_geo_audit()`** — Database-level geo integrity check

### Dev-mode Logging

Map page logs projection parameters in development:
```javascript
if (process.env.NODE_ENV === 'development') {
    console.log('[Map] projection:', { center, zoom, bounds });
}
```

### Cron Run Logging

All cron executions log to `cron_runs` table:
```sql
SELECT job_name, status, started_at, items_enqueued, items_processed, error_sample
FROM cron_runs ORDER BY started_at DESC LIMIT 10;
```

### Data Quality Monitoring

```sql
-- Run full geo audit
SELECT run_geo_audit();

-- Check anomalies
SELECT * FROM geo_audit_reports WHERE anomaly_detected = true ORDER BY created_at DESC;
```

---

## Entity Counts (as of 2026-02-25)

| Entity | US | Canada | Total |
|--------|-----|--------|-------|
| Regions (states/provinces) | 51 | 13 | **64** |
| Counties/Divisions | 3,109 | 304 | **3,413** |
| Cities | 197 | 42 | **239** |
| Ports | 47 | 10 | **57** |
| Corridors | 17 | 3 | **20** |
| Operators | — | — | **2,875** |
| Support Listings | 829 | 67 | **896** |
| Rate Baselines | — | — | **35** |
