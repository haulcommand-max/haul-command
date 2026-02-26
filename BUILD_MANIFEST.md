# HAUL COMMAND OS — BUILD MANIFEST
**Version**: 2.3 | **Date**: 2026-02-23

## Navigation

| Document | Contents |
|---|---|
| **SPEC.md** | Spec accumulator — formulas, contracts, policies, schemas |
| **DEPLOYED.md** | Deployed state — migrations, edge functions, secrets |
| **DEPLOY.md** | Deployment commands — run these to push to Supabase |
| **BUILD_MANIFEST.md** | This file — phases, folder structure, checklist |

---

## Folder Structure

```
c:\Users\PC User\Biz\
├── core/
│   ├── compliance/          ReciprocityEngine, ComplianceFirewall, VerificationGate,
│   │                        EquipmentAlerts, curfew_countdown_engine, pilot_car_rules
│   ├── intelligence/        IntelligenceBus (uib)
│   ├── gamification/        GamificationEngine
│   ├── geospatial/          HighPoleMapping
│   ├── realtime/            ConvoySyncLogic
│   ├── directory/           WideLoadFilter
│   ├── api/                 DataMoatAPI
│   ├── seeds/               Vendor seed data
│   ├── MatchEngine.ts
│   ├── RiskEngine.ts
│   ├── IntelligenceEngine.ts
│   ├── InvoiceGenerator.ts
│   └── habe_engine.ts       Master orchestrator
│
├── supabase/
│   ├── migrations/          Numbered SQL migrations (source of truth)
│   └── functions/           Edge functions (Deno)
│
├── haul-command-hub/        Next.js — Directory / Money Site
│   └── src/
│       ├── app/             App Router pages
│       ├── components/      SEOLandingPage, VerifiedBadge, HubMap, GatedCTA
│       └── data/
│
├── command-dashboard/       React — Internal ops dashboard
│   └── src/components/      VerificationPortal
│
├── scripts/                 Data ingestion, SEO generation, verification
└── tools/                   MCP tools
```

---

## Phase Checklist

### Phase 1 — Backend & Core Foundation (COMPLETE)
- [x] Supabase schema (21+ migrations)
- [x] RLS policies & Auth setup
- [x] 17+ edge functions deployed
- [x] Feature flags table
- [x] Leaderboard + trust scoring
- [x] ReciprocityEngine
- [x] VerificationPortal JSX
- [x] Security: SECURITY INVOKER views, service_role policies

### Phase 2 — Directory, Load Board & Mobile (IN PROGRESS)
- [x] Directory: `/states/[state]` + `/states/[state]/[city]` pages
- [x] Directory: `/providers/[slug]` profile page
- [x] Directory: `<GatedCTA>`, `<HubMap>`, `/united-states`, `/canada`, `/regulatory-db`
- [x] Directory: Sitemap (189-line dynamic XML, 10k+ URLs)
- [x] Load Board: `/loads` teaser index (`v_loads_teaser` safe view)
- [x] Load Board: `/loads/[id]` blurred details + auth gate
- [x] Load Board: Greenlight Match UI (GREENLIGHT / WARN / BLOCKED banners)
- [x] Load Board: In-app notification inbox (unread badge + list)
- [x] Mobile: `<AvailableNowToggle>` + `driver-presence-update` edge fn
- [x] Mobile: Support components (`<CurfewClock>`, `<ComplianceLocker>`)
- [ ] Mobile: Capacitor scaffold (iOS + Android builds) (DEFERRED)
- [ ] Load Board: `match-generate` → Top 3 (Sure Thing / Best Value / Speedster)
- [ ] Load Board: `/post-a-load` intake form
- [ ] Payments / HaulPay: (BLOCKED — Needs Stripe API volume qualification)

