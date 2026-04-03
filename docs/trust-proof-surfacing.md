# Trust / Proof / Report-Card Surfacing
# Skill #3 — compliance signals at decision points lift directory conversion
#
# This document defines:
#   1. The trust signal taxonomy for the platform
#   2. Where each signal surfaces (component + page)
#   3. The report-card model for operator profiles
#   4. Implementation checklist per signal type
# ════════════════════════════════════════════════════════════

## Why Trust Signals Win in Heavy Haul

Heavy haul buyers are not buying aesthetics. They are:
- Risking DOT fines if the escort operator is unqualified
- Moving loads worth $50K–$5M that cannot be re-routed cheaply
- On tight permit windows that expire if the escort doesn't show
- Personally liable for delays in some contract structures

A trust signal visible BEFORE the CTA reduces friction more than any copy change.
"FMCSA Verified" next to "Get a Quote" converts better than the best headline you can write.

---

## Trust Signal Taxonomy

### Tier 1 — Regulatory Compliance (highest conversion weight)

| Signal | Source | DB Field | Badge Label | Visible On |
|---|---|---|---|---|
| FMCSA Active Status | FMCSA API / manual | `operator.fmcsa_status` | `✓ FMCSA Active` | Directory card, Profile |
| DOT Number | FMCSA lookup | `operator.dot_number` | `DOT #XXXXXXX` | Profile, hover card |
| MC Number | FMCSA lookup | `operator.mc_number` | `MC-XXXXXXX` | Profile |
| State Permit Authority | Self-reported + verified | `operator.permit_states[]` | `Licensed in TX, LA, OK` | Directory card |
| CDL / Escort License | Document upload | `credentials.escort_cert` | `Escort Certified` | Profile |
| Insurance Verified | COI upload + expiry check | `credentials.insurance_expiry` | `Insured ✓ (exp. MM/YYYY)` | Profile, card (if current) |

### Tier 2 — Performance Proof

| Signal | Source | DB Field | Badge Label | Visible On |
|---|---|---|---|---|
| Jobs Completed | Verified completions | `operator.verified_runs` | `2,450 verified runs` | Leaderboard, Card |
| Rating | Aggregated buyer reviews | `operator.rating_avg` | `★ 4.97 / 5` | Card, Profile |
| Response Time | Activity log | `operator.avg_response_min` | `Avg response: 4 min` | Card (hot badge) |
| On-Time Rate | Completion records | `operator.on_time_rate` | `98.2% on-time` | Profile |
| Active Corridors | Route data | `operator.active_corridors[]` | `TX-LA · I-10 Specialist` | Card, Profile |

### Tier 3 — Social Proof

| Signal | Source | DB Field | Badge Label | Visible On |
|---|---|---|---|---|
| Years on Platform | Join date | `operator.created_at` | `Member since 2019` | Profile |
| Leaderboard Rank | HC Index score | `operator.hc_rank` | `#1 National` or `#3 Texas` | Card (if top 10), Profile |
| HC Tier Badge | Vanguard/Centurion/Sentinel | `operator.hc_tier` | badge | Card, Profile |
| Reviews (count + snippet) | Buyer reviews | `reviews[]` | `"Showed up 30 min early" — verified buyer` | Profile |

### Tier 4 — Freshness / Data Quality

| Signal | Source | DB Field | Badge Label | Visible On |
|---|---|---|---|---|
| Profile last verified | Admin/automated | `operator.verified_at` | `Data verified Q1 2026` | Profile footer |
| Availability updated | Operator self-update | `operator.availability_updated_at` | `Availability updated today` | Card |
| Insurance expiry warning | Automated check | `credentials.insurance_expiry` | `⚠ Insurance expires soon` | Admin only + operator dashboard |

---

## Report Card Model — Operator Profile

The "Report Card" is a structured summary block shown on every operator profile page.
It replaces or augments a generic bio section.

```
┌─────────────────────────────────────────────────────┐
│  HAUL COMMAND REPORT CARD         [HC Elite Badge]   │
├─────────────────────────────────────────────────────┤
│  REGULATORY                                          │
│  ✓ FMCSA Active        DOT #1234567                 │
│  ✓ MC-XXXXXXX          Insured ✓ (exp. 12/2026)     │
│  ✓ Licensed: TX · LA · OK · AR                      │
├─────────────────────────────────────────────────────┤
│  PERFORMANCE                                         │
│  2,450 verified runs   ★ 4.97/5  (312 reviews)      │
│  Avg response: 2 min   98.2% on-time                 │
│  Top corridors: I-10, I-20, TX-LA, TX-OK            │
├─────────────────────────────────────────────────────┤
│  STANDING                                            │
│  Rank: #1 National · #1 Texas · Vanguard Tier        │
│  Member since 2019  · Last verified: March 2026     │
├─────────────────────────────────────────────────────┤
│  ─ Latest review ──────────────────────────────────│
│  "Showed up 30 min early, load moved without         │
│   incident. Will use again." — Verified Buyer        │
├─────────────────────────────────────────────────────┤
│  [Get a Quote →]        [View Full Profile →]        │
└─────────────────────────────────────────────────────┘
```

---

## Component Map

| Component | Location | Signals Rendered |
|---|---|---|
| `<OperatorReportCard />` | `app/directory/profile/_components/` | All tiers |
| `<TrustBadgeCluster />` | `app/directory/_components/` | Tier 1 + 2 compact |
| `<FMCSABadge />` | Shared badges | FMCSA, DOT, MC |
| `<InsuranceBadge />` | Shared badges | Insurance verified + expiry |
| `<HCTierBadge />` | Shared badges | Vanguard/Centurion/Sentinel/Starter |
| `<PerformanceStrip />` | Card inline | Runs, rating, response time |
| `<FreshnessLabel />` | Profile footer | `Verified Q1 2026` |
| `<ReviewSnippet />` | Profile | Last review, verified buyer tag |

---

## Directory Card — Trust Signal Placement

```
┌─────────────────────────────────────────────────────┐
│  [HC Tier Badge]  Company Name              [Elite] │
│  📍 Dallas, TX  · I-10 Specialist                  │
│  ✓ FMCSA Active  ✓ Insured  DOT #1234567           │
│  ★ 4.97  (312)  ·  2,450 runs  ·  Avg 2 min        │
│                                                      │
│  [See Profile + Contact →]    [Get a Quote →]       │
└─────────────────────────────────────────────────────┘
```

**Rule:** Trust signals must appear ABOVE the CTA, never below.

---

## DB Fields Required

Ensure these columns exist on the operators / profiles table:

```sql
-- Regulatory
operator.fmcsa_status        VARCHAR  -- 'active' | 'inactive' | 'unverified'
operator.dot_number          VARCHAR
operator.mc_number           VARCHAR
operator.permit_states       TEXT[]   -- ['TX','LA','OK']

-- Credentials (join to credentials table)
credentials.escort_cert      BOOLEAN
credentials.insurance_expiry DATE
credentials.coi_url          TEXT

-- Performance
operator.verified_runs       INTEGER
operator.rating_avg          NUMERIC(4,2)
operator.rating_count        INTEGER
operator.avg_response_min    INTEGER
operator.on_time_rate        NUMERIC(5,2)
operator.active_corridors    TEXT[]

-- Standing
operator.hc_tier             VARCHAR  -- 'vanguard'|'centurion'|'sentinel'|'starter'
operator.hc_rank_national    INTEGER
operator.hc_rank_state       INTEGER
operator.verified_at         TIMESTAMPTZ
operator.availability_updated_at TIMESTAMPTZ
```

---

## Implementation Priority

| Signal | Effort | Conversion Impact | Do First? |
|---|---|---|---|
| FMCSA badge on directory card | Low (field exists) | Very High | ✅ Yes |
| HC Tier badge on card | Low (tier in DB) | High | ✅ Yes |
| Rating + run count on card | Low | High | ✅ Yes |
| Report card block on profile | Medium | High | ✅ Yes |
| Insurance badge + expiry | Medium (COI upload) | Medium | After above |
| Review snippet on profile | Medium | Medium | After above |
| Freshness label | Low | Medium (trust) | ✅ Yes |
| Availability updated badge | Low | Medium | ✅ Yes |
