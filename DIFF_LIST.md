# DIFF_LIST.md — Haul Command OS v4.0 → v5.0
## What Changed (5X+ Improvements)
> Documents every significant upgrade made in the Master Dominance Spec v2 pass.
> v4.0 = prior spec | v5.0 = ANTI_GRAVITY.md current state

---

## 1. Trust Score: 7-Component → 8-Component (+CleanRunScore)

| v4.0 | v5.0 |
|------|------|
| 7 components, sum weights = 1.00 | 8 components, sum weights = 1.00 |
| No GPS-verification component | `clean_run_score` (weight 0.15): GPS-verified job breadcrumbs required |
| `review_quality` weight = 0.25 | `review_quality` weight = 0.20 (redistributed) |
| `completion_rate` weight = 0.25 | `completion_rate` weight = 0.20 (redistributed) |
| R = AVG(stars)/5.0 | R = AVG(verified_stars)/5.0 — only GPS-confirmed jobs count |
| J = incident_free_jobs/50 capped at 1.0 | J = same, but jobs must have GPS proof to qualify |

**Why 5X better:** You can no longer game the trust score by inflating unverified reviews. The GPS-verified `clean_run_score` requires proof of actual work, making the entire trust computation ground-truth anchored.

---

## 2. Fraud Score: 4 Signals → 9-Component Weighted Formula

| v4.0 | v5.0 |
|------|------|
| 4 rough boolean flags | 9 weighted components, sum = 1.00 |
| No quantitative scoring | Each component is 0..1, combined into fraud_score 0..1 |
| No auto-action thresholds | AUTO_SUSPEND ≥ 0.80, MANUAL_REVIEW ≥ 0.60 |
| No false-positive protection | False-positive gate: require ≥ 3 components elevated before suspension |
| No GPS spoof detection | `gps_spoof` component (weight 0.05) |
| No review stuffing detection | `review_stuffing` component (weight 0.10) |
| No identity-thin detection | `identity_thin` component (weight 0.08) |

**New components added:**
- `velocity_24h` 0.20 — abnormal action rate in 24h window
- `ip_mismatch` 0.15 — IP vs registration location delta
- `device_change` 0.12 — rapid device switching
- `cancel_spike` 0.12 — sudden cancel rate increase
- `rate_manipulation` 0.10 — bid/offer anomaly detection
- `review_stuffing` 0.10 — same-pair job + review velocity
- `identity_thin` 0.08 — low KYC level + high activity
- `payment_decline` 0.08 — repeated payment failures
- `gps_spoof` 0.05 — breadcrumb consistency failure

**Why 5X better:** v4.0 had no automated fraud scoring at all — just flags. v5.0 produces a continuous risk score that feeds automatic actions, with weighted components that can be tuned without code changes.

---

## 3. Monetization: 2 Tiers → 3 Tiers + Transaction Rates Defined

| v4.0 | v5.0 |
|------|------|
| FREE + PRO ($49/mo) | FREE + PRO ($49/mo) + ELITE ($129/mo) |
| Broker tiers not defined | Broker Basic (free) / Pro $99/mo / Enterprise $499/mo |
| Platform take rate: undefined | Driver jobs: 8% (FREE), 6% (PRO), 5% (ELITE) |
| No B2B data revenue | B2B Data API: $500-2000/mo per customer (enterprise) |
| No enterprise self-serve | Enterprise self-onboard pipeline via directory claim |

**New revenue lines:**
- ELITE driver tier at $129/mo (2.6× PRO revenue per seat)
- Broker Enterprise tier at $499/mo
- B2B Data API (DataMoatProduct) for logistics giants
- Visibility multiplier creates match-quality differentiation driving tier upgrades

**Why 5X better:** v4.0 had $0 monetization definition. v5.0 has 4 distinct revenue streams with specific price points, take rates, and upgrade incentives engineered into the product loop.

---

## 4. Dispute Workflow: None → Full 5-Tier Evidence-First Automation

| v4.0 | v5.0 |
|------|------|
| No dispute workflow defined | 5-tier resolution ladder |
| Manual only | Tier 1: auto-resolves in 48h via GPS proof |
| No evidence requirement | Evidence URLs required at dispute open time |
| No escalation policy | Auto-escalation if no resolution within tier SLA |
| Owner intervention required | Zero-owner up to Tier 3 |

**Tier ladder:**
1. GPS Match Auto-Resolve (48h)
2. Evidence Review (auto 48h)
3. Human Mediation (72h SLA)
4. Legal Hold (documented escalation)
5. Arbitration (external)

**Why 5X better:** Without a dispute workflow, any job conflict requires owner time. With Tier 1-2 auto-resolution covering ~80% of disputes (GPS data is unambiguous), the platform operates dispute-free for most cases.

---

## 5. KYC: None → L0–L4 With Step-Up Triggers

| v4.0 | v5.0 |
|------|------|
| No KYC defined | 5 levels (L0–L4) |
| No verification gates | L0 required for first match |
| No step-up logic | L2 required for jobs > $500 |

**Level definitions:**
- L0: Phone verified
- L1: L0 + document upload
- L2: L1 + Stripe Connect (payout verified)
- L3: L2 + background check
- L4: L3 + FMCSA record pull

**Step-up triggers:**
- L0→L1: First match attempt
- L1→L2: First payout attempt
- L2→L3: Job rate > $500 OR trust_score > 0.85 (optional Elite unlock)
- L3→L4: Enterprise customer or state pilot program

**Why 5X better:** v4.0 had no identity verification at all — any account could receive and complete jobs. L0-L2 gates block the highest-impact fraud vectors (fake accounts, no-payout intent) with minimal user friction.

---

## 6. GPS Proof Engine: Not Defined → Full Geofence-Gated Payment System

| v4.0 | v5.0 |
|------|------|
| No GPS verification | Geofence-triggered job start (500m radius) |
| Manual job status updates | Auto-status: OFFLINE → EN_ROUTE → IN_PROGRESS → COMPLETE |
| No breadcrumb trail | Breadcrumbs every 60s, stored in `gps_breadcrumbs` table |
| No off-route detection | Off-route alert at 2km deviation |
| No proof packet | Auto-generated defense packet on complete (breadcrumbs + timestamps + photos) |
| Payment triggered manually | Payment capture gated on GPS-confirmed complete |

**New columns on `jobs` table:**
- `start_geofence_lat/lng/radius_m`
- `gps_start_confirmed_at` / `gps_end_confirmed_at`
- `breadcrumb_count`
- `off_route_alerts`
- `proof_packet_url`

**Why 5X better:** GPS proof transforms payment disputes from "he said / she said" into objective, auditable records. Chargeback defense packets make payment disputes winnable. Breadcrumb trails make GPS spoofing detectable.

---

## 7. SEO Architecture: Flat Pages → Neighborhood Overlay + Geographic Weighting

| v4.0 | v5.0 |
|------|------|
| Single page template | Same template + neighborhood overlay sections |
| All cities equal | 3-tier geographic weighting (A/B/C) |
| No industrial POI content | Port, refinery, rail yard, industrial zone overlays on Tier A pages |
| No AI/LLM indexing strategy | Structured FAQ blocks + Q&A schema for AEO |
| No content pipeline | NotebookLM pipeline: DOT manuals → grounded compliance summaries |
| 1× keyword density | 5× keyword universe (service + location + compliance + equipment + corridor) |

**Geographic tiers:**
- Tier A (metro 500k+): Full depth — neighborhood overlays, industrial POI, hazard map
- Tier B (mid-size 50k-500k): Standard depth — city + compliance + availability
- Tier C (rural): Minimal — state coverage signal, "coming soon" CTA

**AEO additions:**
- FAQ schema on every page answering "How do I find a pilot car in [city]?"
- Organization + LocalBusiness JSON-LD
- BreadcrumbList schema on nested routes

**Why 5X better:** v4.0 had a template with no differentiation strategy. v5.0 has a tiered content depth model that concentrates quality signals where search volume justifies it, while efficiently covering the long tail with minimal content.

---

## 8. Visibility Multiplier: Not Defined → Leaderboard Tier × Match Revenue Loop

| v4.0 | v5.0 |
|------|------|
| Match ranking: flat score | Match ranking: score × visibility_multiplier |
| No tier differentiation in matching | FREE=1.00 → MYTHIC=1.20 (20% boost) |
| No upgrade incentive in product loop | Multiplier is visible to driver — direct upgrade motivation |

**Tier multipliers:**
```
ROOKIE       < 400 score  → 1.00
SCOUTER      400-699      → 1.05
ELITE        700-849      → 1.10
MASTER_SCOUT 850-949      → 1.15
MYTHIC       950+         → 1.20
```

**Why 5X better:** This creates a self-reinforcing loop: better service → higher score → higher multiplier → more matches → more revenue → more reviews → higher score. The multiplier is the economic signal that turns leaderboard rank from vanity into money.

---

## 9. Data Retention: Not Defined → Full Policy with Enforcement

| v4.0 | v5.0 |
|------|------|
| No retention policy | Explicit per-table policy |
| No purge crons | 4 cron-based purge jobs defined |

**Policy:**
- GPS breadcrumbs: 90 days, then purge
- Raw analytics events: 2 years, then purge (rollups kept indefinitely)
- Idempotency keys: 24h TTL, daily purge cron
- Notification events: 90 days (unread), 1 year (read)
- PII on deleted accounts: 30 days, then anonymize
- Job records: indefinite (financial records)
- Reviews: indefinite

**Why 5X better:** No retention policy = unlimited storage growth + PIPEDA/Law 25 non-compliance. Defined policy with automated enforcement eliminates the liability and cost.

---

## 10. Quebec Bilingual: Not Defined → Full Bilingual Strategy

| v4.0 | v5.0 |
|------|------|
| English only | EN + FR content defined |
| No French compliance rules | `description_fr` column on compliance_rules |
| No French consent | French consent forms required by Law 25 |
| No language preference | `preferred_lang` on profiles (default 'en', QC users 'fr') |
| No ASO strategy | French App Store listing copy for QC |

**Why 5X better:** Operating in Ontario/Quebec without French support blocks the entire Canadian market (8.5M French speakers) and creates legal exposure under Law 25. French-first support opens the Canadian heavy haul corridor.

---

## Summary: Net New Capabilities in v5.0

| Capability | v4.0 | v5.0 |
|-----------|------|------|
| Trust Score components | 7 | 8 (GPS-anchored) |
| Fraud Score components | 4 flags | 9 weighted (0..1) |
| Monetization tiers | 2 | 3 driver + 3 broker |
| Revenue streams | 1 (subscriptions) | 4 (subscriptions + transactions + B2B API + enterprise) |
| Dispute resolution | Manual | 5-tier automated |
| KYC levels | 0 | 5 (L0–L4 + step-up) |
| GPS verification | None | Geofence-gated + breadcrumbs + proof packet |
| SEO tiers | Flat | 3-tier geographic weighting |
| Neighborhood overlays | None | Port, refinery, rail yard, industrial zone |
| Visibility multiplier | None | 1.00–1.20 by leaderboard tier |
| Data retention policy | None | Per-table policy + enforcement crons |
| Language support | EN only | EN + FR (Quebec) |
| Bridge/height alerts | None | Defined alert engine |
| Predictive enforcement | None | 7-day advance warning model |
| App Store ASO | None | Full keyword + review strategy |

---

*Last updated: 2026-02-18 — Documents v4.0 → v5.0 delta*
