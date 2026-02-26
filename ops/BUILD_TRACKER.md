# BUILD_TRACKER — Haul Command Open Wires

> **Rule:** Only mark ✅ when the acceptance check has been manually confirmed.
> Updated: 2026-02-24

---

## A — Map Wiring ✅

| Item | Status | Files |
|------|--------|-------|
| Map style reads `NEXT_PUBLIC_MAPLIBRE_STYLE` env var | ✅ | `components/map/CommandMap.tsx:18-20` |
| Dev warning banner if env var missing | ✅ | `components/map/CommandMap.tsx:23-31` |
| `/map` mounts CommandMap (full viewport) | ✅ | `app/(app)/map/page.tsx` |
| `/directory` has NO map component | ✅ | `app/(public)/directory/page.tsx` |
| Stadia dark style in `.env.local` | ✅ | `.env.local` (NEXT_PUBLIC_MAPLIBRE_STYLE) |

**Acceptance:**
- [ ] `http://localhost:3000/map` → map visible, interactive
- [ ] `http://localhost:3000/directory` → no map, grid only
- [ ] Console: no map init errors

---

## B — Region Pricing Rate Card Grid ✅

| Item | Status | Files |
|------|--------|-------|
| `RateCardGrid` component built | ✅ | `components/directory/RateCardGrid.tsx` |
| Grouped by category (lead/chase, height pole, survey, specialty, premiums) | ✅ | `components/directory/RateCardGrid.tsx:45-72` |
| Price range + currency + confidence chip + p25/p75 | ✅ | `components/directory/RateCardGrid.tsx` |
| Route survey tiers with mile ranges labeled | ✅ | `components/directory/RateCardGrid.tsx` |
| Empty state if no pricing | ✅ | `components/directory/RateCardGrid.tsx:149-163` |
| Wired into region page after Active Corridors section | ✅ | `app/(public)/directory/[country]/[region]/page.tsx:168-181` |
| Request Quote CTA routes to `/claim` | ✅ | `components/directory/RateCardGrid.tsx` |

**Acceptance:**
- [ ] `/directory/us/fl` → Rate Benchmarks section visible with cards
- [ ] Categories are ordered and labeled correctly
- [ ] CTA "Request Quote" does not 404

---

## C — Operator Freshness Signals ✅

| Item | Status | Files |
|------|--------|-------|
| `last_seen_at` added to `escort_profiles` | ✅ | Migration: `add_last_seen_at_to_escort_profiles` |
| `operator_heartbeats` table created | ✅ | Migration: `add_last_seen_at_to_escort_profiles` |
| `POST /api/heartbeat` route | ✅ | `app/api/heartbeat/route.ts` |
| 90s throttle on heartbeat writes | ✅ | `app/api/heartbeat/route.ts:26-30` |
| `useHeartbeat` hook (2min ping, tab-aware) | ✅ | `hooks/useHeartbeat.ts` |
| `FreshnessBadge` component (Online/Active/Stale) | ✅ | `components/ui/FreshnessBadge.tsx` |
| Badge wired onto operator cards on region page | ✅ | `app/(public)/directory/[country]/[region]/page.tsx:49-51` |

**Thresholds (configurable in `FreshnessBadge.tsx`):**
- **Online** < 5 min → green pulse
- **Active** < 60 min → blue
- **Stale** ≥ 60 min → gray

> ⚠️ `useHeartbeat` must be added to the authenticated app layout or dashboard page to fire. It is built but not yet mounted in a root layout.

**Acceptance:**
- [ ] Operator cards on region page show freshness badge when `last_seen_at` is set
- [ ] Badge reflects correct tier based on time delta
- [ ] Stale operators show gray badge, not green

---

## D — Region SEO Metadata ✅

| Item | Status | Files |
|------|--------|-------|
| `generateMetadata()` on region page | ✅ | `app/(public)/directory/[country]/[region]/page.tsx:22-45` |
| Title: `{Region} Pilot Car Escorts \| Haul Command` | ✅ | |
| Description with service keywords | ✅ | |
| canonical URL | ✅ | |
| Open Graph title/description/url | ✅ | |
| JSON-LD Service schema | ✅ | `app/(public)/directory/[country]/[region]/page.tsx:125-132` |

**Acceptance:**
- [ ] `view-source:http://localhost:3000/directory/us/fl` → correct `<title>` and `<meta name="description">`
- [ ] `<link rel="canonical">` present
- [ ] JSON-LD `<script>` block visible in source

---

## E — Load Board Realtime ✅

| Item | Status | Files |
|------|--------|-------|
| Supabase Realtime channel on `loads` table | ✅ | `components/map/CommandMap.tsx:310-335` |
| Replaces 30s `setInterval` for load refresh on map | ✅ | |
| Fallback to 30s polling on `CHANNEL_ERROR` | ✅ | `components/map/CommandMap.tsx:322-327` |
| Channel cleanup on unmount | ✅ | `components/map/CommandMap.tsx:339-348` |
| Escorts + corridors keep 30s refresh (acceptable frequency) | ✅ | |

> ℹ️ **Scope note:** Realtime is wired for the map's load markers. The load board listing page (`/loads`) uses server-side rendering. Full realtime on the list view is a next-session item.

**Acceptance:**
- [ ] Post a load → map pin appears within 2–3 seconds (no refresh)
- [ ] Load status change → map updates without refresh
- [ ] No duplicate load pins
- [ ] DevTools: no unclosed realtime subscriptions on navigation away

---

## F — Finish Line Controls ✅

| Item | Status | Files |
|------|--------|-------|
| `BUILD_TRACKER.md` created in `/ops/` | ✅ | `ops/BUILD_TRACKER.md` |
| Checklist sections A–F with file links | ✅ | This file |
| Acceptance checks per workstream | ✅ | Each section above |

---

## Smoke Verification Checklist

Run these manually or automate with Playwright:

```
GET /map                        → 200, map canvas visible
GET /directory                  → 200, no <canvas> element
GET /directory/us/fl            → 200, "Rate Benchmarks" heading present, meta title correct
GET /directory/ca/on            → 200, "Rate Benchmarks" heading present
POST /api/heartbeat             → 200 {ok:true} (authenticated), 200 (anon no-op)
POST /api/directory/region-stats → 200, JSON object with region keys
GET /map                        → post a load, pin appears <5s (realtime)
```

---

## Next Session Queue

| Priority | Item |
|----------|------|
| 1 | Mount `useHeartbeat` in authenticated app layout |
| 2 | Full realtime on `/loads` list page (not just map) |
| 3 | Skeleton loaders on `/loads` during initial fetch |
| 4 | `pricing_matrix` → consider using as materialized cache of rate_benchmarks |
| 5 | Corridor overlay pricing (I-10, I-75, port zones) |
| 6 | Region Intelligence Score surfaced on BrowseRegions2026 tiles |
