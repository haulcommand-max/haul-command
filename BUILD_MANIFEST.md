# HAUL COMMAND OS — BUILD MANIFEST
**Version**: 2.4 | **Date**: 2026-02-28

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
│   ├── MatchEngine.ts       6-Factor scoring (real data, no mocks)
│   ├── RiskEngine.ts
│   ├── IntelligenceEngine.ts
│   ├── InvoiceGenerator.ts
│   └── habe_engine.ts       Master orchestrator
│
├── supabase/
│   ├── migrations/          Numbered SQL migrations (source of truth)
│   └── functions/           95+ Edge functions (Deno)
│
├── app/
│   ├── loads/
│   │   ├── page.tsx                   Load Board index
│   │   ├── [slug]/page.tsx            Load detail (blurred + auth gate)
│   │   └── post/page.tsx              Post-a-Load (3-step wizard + Top 3)
│   ├── api/loads/
│   │   ├── match-generate/route.ts    Top 3 API (Sure Thing / Best Value / Speedster)
│   │   └── ...                        58 other API route groups
│   └── ...                            59 route groups total
│
├── android/                 Capacitor Android scaffold
├── ios/                     Capacitor iOS scaffold
├── capacitor.config.ts      App config (deep links, push, splash)
│
├── lib/
│   ├── leaderboard/         Leaderboard scoring engine
│   ├── ads/                 AdGrid monetization
│   ├── geo/                 Geocoding engine
│   └── ...                  68 lib modules
│
├── components/              49 component groups
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
- [x] Leaderboard + trust scoring (real data pipeline)
- [x] ReciprocityEngine
- [x] VerificationPortal JSX
- [x] Security: SECURITY INVOKER views, service_role policies

### Phase 2 — Directory, Load Board & Mobile (COMPLETE)
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
- [x] **Mobile: Capacitor scaffold (iOS + Android platforms added)**
- [x] **Load Board: `match-generate` → Top 3 (Sure Thing / Best Value / Speedster)**
- [x] **Load Board: `/post-a-load` 3-step intake form with instant match preview**
- [ ] Payments / HaulPay: (BLOCKED — Needs Stripe API volume qualification)

### Phase 3 — AdGrid & Monetization (IN PROGRESS)
- [x] AdGrid schema (database tables + indexes)
- [x] Ad decision engine edge function
- [x] RTB ad serve edge function
- [x] AdGrid YAML spec logged
- [ ] AdGrid: dashboard UI for advertisers
- [ ] AdGrid: campaign creation flow

### Tier 1 — Must-Win Features (COMPLETE)
- [x] **One-Tap Accept Flow**: `/accept/[offerId]` full-screen page + `/api/offers/accept` + `/api/offers/decline`
- [x] **Trust Card 2.0**: `TrustCardV2` component with behavioral signals (response time, on-time %, repeat rate, insurance freshness)
- [x] **True Real-Time Presence**: `usePresenceChannel` hook + `PresenceBadge` + `PresenceCounter` via Supabase Realtime Presence
- [x] **Live Market Command Map v2**: `CommandMapV2` with 7 layers + HUD panel (hard-fill zones, police/pole zones, density overlay)
### Tier 2 — Growth Weapons (COMPLETE)
- [x] **Territory Gamification**: `TerritoryEngine` + `TerritoryDashboard` + `/api/territory/claim`
- [x] **Smart Alerts Engine**: `SmartAlertsEngine` + `/api/alerts/evaluate` (anti-spam, dedup, push queue)
- [x] **Programmatic SEO**: county pages, available-now pages, high-pole-escorts pages (all with Schema.org + OG tags)

### Tier 3 — Daily Habit Engine + Profile Completion (COMPLETE)
- [x] **Habit Engine Core**: `core/engagement/habit_engine.ts` — momentum scoring, profile strength, opportunity radar, weekly reports, availability toggle hooks
- [x] **Profile Completion Engine**: `core/engagement/profile_completion_engine.ts` — 6-section weighted scoring (identity/coverage/equipment/availability/trust/performance), gate caps, milestone boosts, badges, nudges, daily digest, leaderboard gating
- [x] **Profile Strength Meter**: `components/engagement/ProfileStrengthMeter.tsx` — animated progress bar, visibility coupling, gate warnings, loss-aversion nudge, milestone toasts, smart next-step CTA, peer comparison, section breakdown
- [x] **Operator Command Center**: `components/engagement/OperatorCommandCenter.tsx` — momentum score + availability toggle + opportunity radar + missed loads + hot corridors + profile meter
- [x] **Broker View Nudge**: `components/engagement/BrokerViewNudge.tsx` — realtime broker view notifications + app download prompt + leaderboard gate banner
- [x] **API Routes**: `/api/operator/completion-score`, `/api/operator/momentum`, `/api/operator/radar`, `/api/operator/toggle-availability`, `/api/operator/weekly-report`, `/api/operator/profile-event`, `/api/operator/daily-digest`
- [x] **Database Migration**: `20260301_daily_habit_engine.sql` — operator_momentum, search_boosts, profile_views, push_queue, county_territories, territory_claims, weekly_reports tables + RLS

### Tier 4 — Social Gravity Engine v2 + Presence Engine (COMPLETE)
- [x] **Watchlist Engine**: `core/social/watchlist_engine.ts` — 4 watch types (corridor/operator/broker/equipment), 3 digest modes (realtime/daily/weekly), trigger evaluation + 30min cooldown, 25 watches/user cap, batch digest builder
- [x] **Urgency Engine**: `core/social/urgency_engine.ts` — 5 real-time triggers (near-miss/profile-attention/demand-spike/competitor-overtake/corridor-heating) + 4-stage reactivation sequence (3d/7d/14d/30d win-back), 4 push/day cap, 6h cooldown
- [x] **AdGrid Amplifier**: `core/social/adgrid_amplifier.ts` — Intent Harvest Layer (pre-surge ad targeting), dynamic CPM pricing (demand velocity + supply pressure + broker spikes + intent density + time-of-day), 15 ad surfaces across all page types, floor enforcement
- [x] **Idle Operator Reactor**: `core/social/idle_operator_reactor.ts` — 48-96h idle detection, corridor-aware wake-ups, 2-of-3 condition scoring, 4 nudge types (availability/earnings/rank-decay/corridor-match), earnings projection
- [x] **Broker Confidence Engine**: `core/social/broker_confidence_engine.ts` — response time percentile, reliability score, repeat broker social proof, corridor expertise, booking probability meter, 4-tier confidence (high/medium/low/unknown)
- [x] **Florida Local Amplifier**: `core/social/florida_local_amplifier.ts` — local liquidity snapshot (5-tier density), corridor heat engine (I-75/US-19/I-10/port/mobile-home), 72h forecast (day-of-week + seasonal), micro-pocket scarcity, nearby competition panel, Florida profile boosts (1.35× cap)
- [x] **Presence Engine**: `core/social/presence_engine.ts` — 5-state model (available_now/available_soon/on_job/recently_active/offline), auto-decay (4h→degrade, 24h→offline), freshness timers, truth guardrails (suppress after 3+ false reports), weighted density for Social Gravity, leaderboard points (check-in/available-minutes/on-job/accuracy), false availability penalty (-10pts + 3h visibility downgrade)
- [x] **Operator Status Card**: `components/presence/OperatorStatusCard.tsx` — one-tap toggle, freshness timer, pressure nudges (broker demand/rank decay/corridor heat), success toasts
- [x] **Broker Confidence Card**: `components/presence/BrokerConfidenceCard.tsx` — compact (search inline) + full (sidebar) modes, status badge + freshness, confidence score bar, booking probability ring, signal rows, factor badges
- [x] **Reactivation Modal**: `components/presence/ReactivationModal.tsx` — 3 variants (primary/urgency/rank-protection), exact spec copy, spring animation, backdrop blur, 18h/3-per-week cooldown
- [x] **API Routes**: `/api/watchlist` (CRUD), `/api/watchlist/trigger`, `/api/watchlist/digest`, `/api/operator/confidence`, `/api/cron/urgency`, `/api/corridor/forecast`, `/api/presence` (GET+POST), `/api/presence/decay`
- [x] **Database Migrations**: `20260301_social_gravity_engine_v2.sql` (watchlist, watchlist_events, intent_signals, broker_confidence_cache, corridor_forecasts, operator_stats + 3 RPCs), `20260301_presence_engine.sql` (operator_presence, presence_audit_log + momentum RPC)

---

## Build Log

### 2026-03-01: Tier 3 Daily Habit Engine + Profile Completion

#### 12. Daily Habit Engine Core (COMPLETED)
- **Habit Engine**: `core/engagement/habit_engine.ts`
  - Momentum scoring: 4-component weighted composite (profile 25%, response speed 25%, activity 30%, uptime 20%)
  - Four bands: Rising (75-100, 1.3x search boost), Steady (50-74, 1.0x), Cooling (25-49, 0.7x), Inactive (0-24, 0.3x)
  - Opportunity radar: jobs near you, hot corridors, missed opportunities with loss-aversion messaging
  - Weekly report generator: profile views, search appearances, response speed, momentum trend, demand data
  - Availability toggle hooks: 2hr search rank boost, broker notification, presence audit logging
  - App open hooks: refresh radar, update last active, recompute momentum

#### 13. Profile Completion Engine (COMPLETED)
- **Engine**: `core/engagement/profile_completion_engine.ts`
  - 6-section weighted scoring: identity (20%), coverage (25%), equipment (20%), availability (15%), trust (10%), performance (10%)
  - Gate caps: missing name/phone → capped at 35%, missing coverage_states → capped at 55%
  - Milestones at 20/40/60/80/100 with escalating search boosts (24h small → 48h medium → 7d featured → 30d featured)
  - Visibility score composite: profile (40%) + availability (25%) + recency (15%) + response speed (10%) + verified (10%)
  - 5 badges: founding_operator, verified_operator, fast_responder, complete_profile, rising_momentum
  - Trigger handlers: on_profile_claimed, on_field_updated, on_broker_view (24h throttle)
  - Daily digest job: nudges incomplete operators with nearby corridor demand
  - Leaderboard gating at 60%

#### 14. Engagement UI Components (COMPLETED)
- **Profile Strength Meter**: animated progress bar (red→yellow→green), milestone markers, visibility badge,
  gate warnings, loss-aversion nudge, leaderboard gate, smart next-step CTA, peer comparison, section breakdown
- **Operator Command Center**: momentum score + band badge + visibility multiplier + weekly trend,
  availability toggle with glow + boost indicator + broker count, opportunity radar (jobs + missed loads),
  hot corridors with demand levels, profile meter integration, momentum breakdown bars
- **Broker View Nudge**: realtime Supabase subscription for broker views, pulse animation,
  view count + recency, "finish now" CTA, auto-hide at 80%
- **App Download Prompt**: post-claim push notification signup, "enable alerts" / "later" buttons
- **Leaderboard Gate Banner**: progress indicator, "get to 60%" CTA

#### 15. API Routes (COMPLETED)
- `/api/operator/completion-score` — full profile completion breakdown
- `/api/operator/momentum` — momentum score with components and trend
- `/api/operator/radar` — opportunity radar: jobs, corridors, missed loads
- `/api/operator/toggle-availability` — availability toggle with boost + broker notification
- `/api/operator/weekly-report` — GET single, POST batch generate for all active operators
- `/api/operator/profile-event` — unified trigger handler (profile_claimed/field_updated/broker_view)
- `/api/operator/daily-digest` — cron job for daily nudges

#### 16. Database Migration (COMPLETED)
- `20260301_daily_habit_engine.sql` — 7 tables with RLS:
  operator_momentum, search_boosts, profile_views, push_queue,
  county_territories, territory_claims, weekly_reports

### 2026-03-01: Tier 2 Growth Weapons

#### 9. Territory Gamification (COMPLETED)
- **Engine**: `core/gamification/territory_engine.ts` — county scarcity counters (X of 3 slots remaining),
  territory claiming with defense alerts, streak bonuses (Bronze 3d → Silver 7d → Gold 14d → Diamond 30d),
  corridor ownership rankings, quarterly seasonal leaderboards
- **Dashboard**: `components/gamification/TerritoryDashboard.tsx` — county grid with slot bars, claim button
  with confetti explosion, streak progress bar, defense alert inbox
- **API**: `/api/territory/claim` — validates slots, prevents double claims, increments counter,
  sends defense alerts to existing claimants, writes audit log

#### 10. Smart Alerts Engine (COMPLETED)
Signal-aware notifications that only fire when meaningful:
- **Escort alerts**: hot load nearby (emergency + in range), repeat broker (past jobs together),
  above-median rate (10%+ above lane median)
- **Broker alerts**: supply shortage (<3 escorts in state), hard-fill risk (supply/demand <0.5),
  rate too low (below 25th percentile for lane)
- **Anti-spam**: max 3 alerts/user/hour, same type suppressed for 4 hours
- **API**: `/api/alerts/evaluate` — triggered from load creation flow, dispatches to inapp + push_queue

#### 11. Programmatic SEO at Scale (COMPLETED)
Three new dynamic page templates:
- **County pages** (`/county/[county-slug]`): live escort counts, territory scarcity banners, operator grid,
  LocalBusiness schema markup, booking CTA
- **Available Now pages** (`/available-now/[city-state]`): real-time availability with live pulse indicator,
  high pole counts, inter-city links mesh, Service schema markup
- **High Pole pages** (`/high-pole-escorts/[state]`): operator grid with equipment tags, state regulation notes,
  educational content block, pre-rendered for all 50 states, inter-state links

### 2026-03-01: Tier 1 Must-Win Features

#### 5. One-Tap Accept Flow (COMPLETED)
Full-screen accept page for push-to-action in ≤ 2 taps:
- **Route**: `/accept/[offerId]` — deep linkable from push notification
- **States**: loading → ready (with countdown timer) → accepting → accepted (celebration) → expired → error
- **Accept API**: `/api/offers/accept` — verifies ownership, marks offer accepted, expires other pending offers,
  sets load to filled, creates job, notifies broker, audit logs
- **Decline API**: `/api/offers/decline` — marks declined + audit
- **Mobile**: Capacitor Haptics integration for native feedback on accept

#### 6. Trust Card 2.0 (COMPLETED)
Premium behavioral signal card replacing basic star ratings:
- **Escort signals**: median response time (with percentile P95/P80/P60/P40), on-time rate, completed count,
  repeat broker rate, cancellation rate, incident count, insurance freshness (days until expiry),
  lane-specific reliability bars, 30-day trend indicator
- **Broker signals**: payment reliability, median fill time, dispute rate, escort repeat rate,
  loads posted, cancel rate, rate-vs-market indicator
- **UI**: Tier-colored gradient header (elite/strong/solid/watch/risk), trust score orb,
  6-cell signal grid, trend line

#### 7. True Real-Time Presence (COMPLETED)
Supabase Realtime Presence channel system:
- **`usePresenceChannel` hook**: supports broadcast (escorts share status) and subscribe (brokers/maps watch)
- **Heartbeat**: 30s interval keeps presence alive; auto-offline after 5 min no heartbeat
- **Ghost mode**: privacy toggle hides escort from public presence
- **`PresenceBadge`**: shows "Just now" / "2m ago" / "1h ago" with color-coded dot (green/yellow/gray)
- **`PresenceCounter`**: shows "X available in FL" with live indicator

#### 8. Live Command Map v2 (COMPLETED)
Bloomberg Terminal upgrade with 3 new layers + HUD:
- **Layer 5**: Hard-fill alert zones — red pulsing circles for loads struggling to fill
- **Layer 6**: Police/high-pole requirement zones — purple (police) / blue (high pole) region overlays
- **Layer 7**: Escort density heatmap — blue-to-green heat overlay (off by default)
- **HUD Panel**: Glassmorphic control panel with market pulse stats, layer toggles, and legend
- **Escort dots**: now color-coded by status (green = available, yellow = busy, gray = offline)

### 2026-02-28: Phase 2 Completion

#### 1. `/loads/post/page.tsx` — Post-a-Load Wizard (COMPLETED)
3-step wizard flow with glassmorphic UI.

#### 2. `/api/loads/match-generate/route.ts` — Top 3 API (COMPLETED)
Fully wired to 6 Supabase tables.

#### 3. `core/MatchEngine.ts` — Core Brain (REWIRED)
Replaced all mocked values with real queries.

#### 4. Capacitor Native Scaffold (COMPLETED)
iOS + Android platforms added.
