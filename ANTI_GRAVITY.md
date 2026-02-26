# HAUL COMMAND OS — ANTI-GRAVITY BUILD SPECIFICATION
**Version**: 5.0 | **Date**: 2026-02-18 | **Model**: Zero-Operator, National Infrastructure

> **Usage**: Paste into any AI coding session as the complete build context.
> Canonical spec. See DEPLOYED.md for backend state. SCHEMA.md for tables. RISK_REGISTER.md for risks.

---

## PART 0: STRATEGIC IDENTITY

**Mission**: Haul Command OS = The default operating system for pilot car + heavy haul.

| Layer | Surface | Value |
|---|---|---|
| Authority | Directory (SEO) | The place Google sends for pilot car searches |
| Liquidity | Load Board | Fastest way to secure a certified pilot car |
| Retention | Mobile App | Daily field utility that creates habit |
| Trust | Leaderboard + Compliance Score | Verifiable reputation math that influences money |

**The flywheel**:
```
SEO traffic → load urgency → push alerts → matches → payments →
proof packets → trust scores → better rankings → more SEO traffic
```

**Brand tone**: Infrastructure authority. National reach. Fast + certified. Data-driven.
**Brand voice**: Secure. Verify. Deploy. Match. Protect. (Confident, not hype.)
**Perception target**: "$75,000 build quality. Built by a national infrastructure team."

**Territory**: US (50 states) + Canada (all provinces + territories) + Puerto Rico + Guam + USVI + CNMI + American Samoa.

---

## PART 1: TECH SPINE

```
Supabase     = Source of truth: marketplace, trust, audit, payments, notifications
Firebase     = Delivery only: FCM push (primary), Crashlytics + Analytics (optional)
SMS          = Opt-in fallback only. Never default. Requires 2 FCM failures + explicit opt-in.
Offline      = SyncQueue only (no PouchDB/RxDB)
Routing      = Store start/end/waypoints only. Polylines computed on demand, never stored.
Pricing      = Warn > Block. Block only: invalid/negative inputs or safety-critical cert failures.
RLS          = Strict. Anon reads safe views only. Service_role for sensitive writes.
Payments     = Idempotent Stripe Connect flows (pre-auth → capture → release)
Zero-op      = No manual triggers for any routine operation. Owner never handles leads.
SQS labels   = OFFICIAL (DOT/Gov) | SECONDARY (Industry) | UNSOURCED (Unverified)
```

---

## PART 2: ZERO-OPERATOR MODEL

**Haul Command is infrastructure, not a service desk.** All routine operations run automatically.

| Operation | Trigger | Handler |
|---|---|---|
| Provider ↔ Broker matching | Load posted | `match-generate` → FCM push |
| Trust score update | Job complete / cert event / review | Event trigger + nightly CRON |
| Tier progression | Score threshold crossed | DB trigger → `notification_events` |
| Compliance reminders | 30d/14d/7d/1d before expiry | `compliance-reminders-run` CRON |
| Availability expiration | 4h after toggle | Supabase scheduled fn |
| Payment pre-auth | Broker selects driver | `payments-preauth` edge fn |
| Payment capture | Job complete (GPS-confirmed) | `payments-capture` edge fn |
| Invoice creation | Job complete | Auto-generated, emailed |
| Defense packet | Job complete | `compliance-snapshot-generate` → PDF |
| Stripe dispute | Stripe webhook event | `stripe-webhook` → fraud flag + evidence collect |
| Fraud scoring | Account activity events | `fraud-score-update` event-driven |
| Leaderboard update | Hourly CRON | `leaderboard-snapshot-hourly` |
| Sitemap refresh | Nightly, count-change trigger | DB trigger on providers/loads |
| Referral credits | Referee's first job completes | `referrals-redeem` edge fn |
| Enterprise onboarding | Self-serve form submit | Email sequence + Stripe checkout |
| Review requests | 48h post job completion | Auto-push to both parties |
| KYC step-up | Fraud score ≥ 50 or trip wire | `kyc-step-up-trigger` edge fn |

---

## PART 3: LEGAL INSULATION LAYER

### Platform Positioning (use verbatim in UI + Terms)
```
Haul Command IS:
  ✓ A marketplace platform connecting load posters with pilot car providers
  ✓ A technology infrastructure and information provider
  ✓ A compliance visibility and documentation tooling layer
  ✓ A payment processing intermediary via Stripe Connect

Haul Command is NOT:
  ✗ An employer of any driver or provider
  ✗ A dispatcher, transportation broker, or carrier of record
  ✗ The escort provider or performance guarantor
  ✗ An insurer, legal representative, or on-road safety guarantor
  ✗ Responsible for on-road outcomes
```

### Required Legal Pages (all public)
| Page | Contents |
|---|---|
| Terms of Service | Marketplace role, disclaimers, arbitration clause |
| Provider Agreement | Independent contractor status, non-employment, performance responsibility |
| Broker/Carrier Agreement | Funds verified rules, dispute process, venue selection |
| Verification Policy | What "Verified" means (informational signal, not guarantee) |
| Dispute Policy | Evidence-first process, escalation ladder, SLAs |
| Safety Disclaimer | Routing tools are advisory, not safety guarantees |
| Privacy Policy | GPS data, documents, retention, PIPEDA (Canada), CCPA |

### Defense Packet Disclaimer (on every generated PDF)
> "This document was auto-generated by Haul Command OS as an operational record. It is not a legal certification. Verify all regulatory compliance with the applicable state/provincial DOT."

> ⚠️ **Note**: Have an attorney review final ToS before launch. This is architecture, not legal advice.

---

## PART 4: FRAUD PREVENTION ENGINE

**Silent operation. No public drama. Escalate internally only.**

### Fraud Risk Score
```
FraudRiskScore = 100 × (
  0.20 · GhostLoadRatio        +  // broker: expired unfunded / total (90d)
  0.15 · CancellationSpike     +  // cancellations / accepted (30d)
  0.15 · PaymentFailureRate    +  // failed payments / attempted (30d)
  0.10 · IPClusterScore        +  // accounts sharing /24 subnet
  0.10 · DeviceAnomaly         +  // fingerprint mismatch, emulator signals
  0.10 · CertInconsistency     +  // metadata mismatch, duplicate hash
  0.10 · AccountVelocity       +  // new accounts / IP / hour
  0.05 · HazardSpam            +  // reports / hour from same user
  0.05 · PayoutAnomaly            // payout > 3× account average
)
```
All components normalized 0..1. Uses rolling windows: 24h + 7d + 30d. Cold-start new users start at 0 (not penalized for no history).

### Auto Actions (silent)

| Score | Action | User-visible? |
|---|---|---|
| 0–29 | Normal | No |
| 30–49 | Soft throttle: reduced visibility, slower match queue | No |
| 50–69 | Step-up verification required (KYC-lite) | Yes ("Complete verification") |
| 70–89 | Temporary suspension + restrict payouts | Yes ("Account under review") |
| ≥ 90 | Auto-lock + dispute-only mode | Yes ("Account suspended") |

### False Positive Protection
- Use soft throttle before hard actions
- Require step-up verification before suspension
- Allow recovery via verification completion
- Separate new-user cold-start from malicious patterns
- Rolling windows prevent single-event overreaction

---

## PART 5: KYC-LITE & STEP-UP VERIFICATION

### Verification Levels

| Level | Name | Requirements |
|---|---|---|
| L0 | Unverified | Scraped/unclaimed profile or new registration |
| L1 | Claimed | Email + phone verified + identity attestation |
| L2 | Verified Docs | Insurance + certs verified (OCR + logic check) |
| L3 | Funds Verified | Payment method verified + pre-auth behavior established |
| L4 | Trusted | Sustained performance + clean runs + low disputes + 90d history |

### Step-Up Triggers (automatic)
Require additional verification if ANY of:
- `fraud_score ≥ 50`
- First load post over $2,500
- First Instant Pay request
- Payment failures ≥ 3 in 30d
- IP cluster or account velocity flags
- Document anomaly detected

### Step-Up Actions (in order)
1. Government ID check (vendor integration, optional)
2. Selfie liveness check (optional vendor)
3. Business verification (enterprise only)
4. Voice verification of insurance producer (Vapi integration, high value)
5. Manual review queue → internal `admin_ops` role only (never owner)

---

## PART 6: DISPUTE WORKFLOW AUTOMATION

**Zero-owner resolution. Evidence-first. Platform provides tools, not judgment.**

### Dispute Types
- Provider no-show
- Broker/provider cancellation
- Route deviation / safety incident
- Payment dispute / chargeback
- Document fraud allegation
- Harassment / misconduct

### Automated Flow

```
1. TRIGGER
   Chargeback filed
   OR broker taps "Dispute"
   OR provider taps "Non-payment/Issue"

2. AUTO-COLLECT EVIDENCE
   GPS breadcrumbs (start/end/geofences/deviations)
   Off-route logs + alert timestamps
   Timestamped photos (pre-trip checklist, proof of work)
   Digital handshake signatures
   Compliance snapshot "verified at time of job"
   In-app message history
   Payment logs (pre-auth/capture/settlement)

3. AUTO-CLASSIFY
   Rules engine assigns Likely Outcome:
   "Provider likely completed" / "Broker valid cancellation" /
   "Insufficient evidence" / "Fraud suspected"

4. RESOLUTION LADDER
   Tier 1: Auto-refund (small amount + low risk + clear evidence)
   Tier 2: Partial release (split funds)
   Tier 3: Hold + require additional evidence (48h window)
   Tier 4: Arbitration queue (enterprise paid feature)
   Tier 5: Permanent ban + payout lock (fraud confirmed)
```

### SLAs (no-human model)
| Stage | SLA |
|---|---|
| First response | Instant (automated) |
| Evidence collection window | 48 hours |
| Default resolution | 7 days |
| Escalation to admin queue | Only on Tier 4+ or manual flag |

### Score Impacts
- Broker Trust Score: down on late pay, chargebacks, repeated disputes
- Driver Trust Score: down on no-shows, unsafe deviations, failure to provide proof

---

## PART 7: GPS PROOF ENGINE

**Payment and "Verified Complete" require GPS proof. No proof = no capture.**

### Proof-of-Work Logic
```
Job Start
  → Driver enters pickup geofence (radius configurable per load)
  → "Job Started" event logged to audit_log
  → Pre-trip checklist completion recorded

In Transit
  → Continuous breadcrumbs (stored 30d full, 2yr summarized hash)
  → Off-route deviation > threshold → alert fired + logged
  → Bridge clearance proximity alert (if load height known)

Job Complete
  → Driver enters destination geofence
  → Required photos uploaded (min N photos from checklist)
  → Optional: broker/recipient digital signature
  → "Job Complete" event logged
  → Auto-generate: invoice + defense packet
  → Trigger: payments-capture (or on job_start for high-risk policy)
```

### Quick Pay (Platform-Run, Zero-Owner)
```
Driver selects "Instant Pay" on completion
Platform pays driver immediately (minus 2–4% fee)
Platform collects from broker on net terms
Broker Trust Score affected by late/non-payment
```

### Off-Route Alert Rules
| Deviation | Action |
|---|---|
| > 0.5 miles from planned route | Warning logged internally |
| > 2 miles | Push alert to driver + logged |
| > 5 miles | Alert to broker + logged + affects CleanRunScore |
| Unknown road with load height risk | Immediate alert if bridge data available |

---

## PART 8: BRIDGE RESTRICTION ALERTS

### Data Sources
| Source | Type | Refresh |
|---|---|---|
| US National Bridge Inventory (NBI) | Official (SQS: OFFICIAL) | Annual federal update |
| State DOT restriction lists | Official (SQS: OFFICIAL) | Per state, varies |
| Provincial restriction lists (CA) | Official (SQS: OFFICIAL) | Per province |
| Crowd hazard reports (2-driver confirmed) | Community (SQS: SECONDARY) | Realtime |

### Alert Logic
```
For a route with known load_height:
  1. Find all structures within X miles of planned path
  2. Compute "lowest credible clearance" per structure
  3. Compare: load_height > clearance → ALERT

Alert levels:
  RED:    load_height > confirmed clearance (OFFICIAL source) → block + reroute
  YELLOW: load_height > clearance (SECONDARY source) → warn + "verify required"
  GRAY:   No data → "clearance unknown, verify with state DOT"
```

### Monetization
- Free tier: basic clearance warnings on route
- Pro/Elite: corridor intelligence + risk scoring + proactive alerts + NBI query API

---

## PART 9: PREDICTIVE ENFORCEMENT ALERTS

**"Waze++ for heavy haul" — presented as risk estimates, never guarantees.**

### Inputs
- Crowd hazard reports (verified, 2-driver confirm)
- Historical incident density (internal `audit_log`)
- Time-of-day patterns (learned from historical data)
- Known chokepoints: weigh stations, ports, interchanges, urban corridors

### Output
- "Enforcement Risk Score" along route (0–100)
- Suggested movement windows (ties into curfew tool)

### Required Disclaimers (on every alert)
> "Enforcement risk estimate. Not a guarantee. Verify with state DOT and permit conditions."

### SQS Label Rule
- Risk based on OFFICIAL data only → SQS: OFFICIAL
- Risk based on crowd reports → SQS: SECONDARY
- Risk based on internal patterns only → SQS: UNSOURCED (mark clearly)

---

## PART 10: SCORING FORMULAS (ALL LOCKED)

### Driver Trust Score (8 components)
```
TrustScore = 100 × (
  0.22 · InsuranceValidity      +
  0.18 · CertCoverage           +
  0.15 · CleanRunScore          +
  0.12 · EquipmentMatchRate     +
  0.10 · ActivityRecency        +
  0.10 · CompletionRate         +
  0.08 · FundsVerifiedBehavior  +
  0.05 · ReviewQuality
)
```

| Component | Formula (0..1) | Cadence |
|---|---|---|
| InsuranceValidity | `1.0` if active + meets min limits; decay as expiry approaches | On cert event |
| CertCoverage | `verified_certs / required_certs` weighted by regional demand | On cert event |
| CleanRunScore | `1 - deviation_rate - incident_flags` (GPS-verified) | On job complete |
| EquipmentMatchRate | `verified_equipment / claimed_equipment` | On equipment update |
| ActivityRecency | Exponential decay after 48h; strong decay after 14d; 0 after 30d | Realtime |
| CompletionRate | `completed_jobs / accepted_jobs` rolling 90d | On job event |
| FundsVerifiedBehavior | Inverted: payout_disputes + chargeback_rate + broker_pay_speed | On payment event |
| ReviewQuality | Weighted star avg with "safety" tag boost; downweight low-sample | On review |

### Match Score
```
MatchScore = 100 × (
  0.40 · ProximityScore     +
  0.25 · EquipmentFit       +
  0.20 · TrustNormalized    +
  0.15 · InterestSignal
)
```

| Component | Formula |
|---|---|
| ProximityScore | `MAX(0, 1 - deadhead_miles/300)` |
| EquipmentFit | `1.0` exact; `0.7` overcapacity; `0.0` under |
| TrustNormalized | `trust_score / 100` |
| InterestSignal | `1.0` applied; `0.7` viewed; `0.5` default + tier multiplier |

**Match Labels**:
- **Sure Thing**: Highest Trust + completion rate + proximity
- **Best Value**: Best combined score per price band
- **Speedster**: Lowest deadhead + Active Now + fast response history

### Broker Trust Score
```
BrokerScore = 100 × (
  0.30 · PaymentSpeed      +
  0.25 · GhostRateInverted +
  0.25 · Satisfaction      +
  0.20 · VolumeVerified
)
```

| Component | Formula (0..1) |
|---|---|
| PaymentSpeed | `1.0` ≤1d; `0.7` ≤5d; `0.3` >5d avg_payment_days |
| GhostRateInverted | `1.0 - ghost_load_rate` |
| Satisfaction | `AVG(driver_broker_rating) / 5.0` |
| VolumeVerified | `MIN(funds_verified_count / 20, 1.0)` |

### Leaderboard Visibility Multiplier (affects match interest_score)

| Tier | Multiplier | Interest boost |
|---|---|---|
| ROOKIE (0–499 pts) | 1.00 | 0% |
| SCOUTER (500–1,499) | 1.05 | +5% |
| ELITE (1,500–3,999) | 1.10 | +10% |
| MASTER SCOUT (4,000–9,999) | 1.15 | +15% |
| MYTHIC (10,000+) | 1.20 | +20% (hard to earn — requires sustained multi-season) |

---

## PART 11: MONETIZATION ENGINE

**Monetize speed, visibility, trust, intelligence. Never friction.**

### Driver Tiers

| Plan | Price | Key features |
|---|---|---|
| Free | $0 | Listing, basic alerts, job archive, standard visibility |
| Pro | $49/mo | +15min early alerts, verified badge, T+1 payouts, priority placement, compliance export, +5% match weight |
| Elite | $129/mo | Instant payout, premium placement, corridor analytics, bridge alert API, +10% match weight, Pro badge + Elite badge |
| 7-Day Trial | Free | Full Pro, auto-downgrade |
| Annual Pro | $499/yr (save $89) | — |
| Annual Elite | $1,299/yr (save $249) | — |

### Broker Tiers

| Plan | Price | Key features |
|---|---|---|
| Basic | $0 | Post loads, standard exposure |
| Verified | $99/mo | Funds verified badge, priority listings, analytics, lower fraud suspicion, ghost rate suppressed from public view until resolved |
| Enterprise | $499+/mo | White-label dashboard, bulk posting, corridor reports, API, SLA |

### Transaction Revenue

| Item | Rate |
|---|---|
| Platform take rate | 8–12% (configurable by load category) |
| Instant payout fee | 2–4% |
| Defense packet export | $19 |
| Compliance snapshot export | $9 |
| Corridor intelligence report (one-time) | $49 |

### Freemium Gates

| Gate | Free | Pro | Elite |
|---|---|---|---|
| Load detail rate | Hidden | Visible | Visible |
| Driver contact | Hidden | Visible | Visible |
| Alert lead time | Standard | +15min | +30min |
| Payout speed | 2–5 days | T+1 | Same day |
| Compliance export | — | $9/export | Included |
| Corridor analytics | — | — | Included |
| Bridge alert API | — | Basic | Full |

### Upsell Moments

| Trigger | Copy |
|---|---|
| Match received | "Reply 15min faster with Pro →" |
| Payment processed | "Get same-day payout with Elite →" |
| Compliance update | "Export your compliance report →" |
| Leaderboard milestone | "Elite earns 1.5× points + instant pay →" |
| Trial day 6 | "Your trial ends tomorrow. Lock in Pro →" |

---

## PART 12: DIRECTORY — AUTHORITY + GRAVITY

### Routes (P0 = Phase 2, P1 = Phase 3, P2 = Phase 4)

| Route | Priority |
|---|---|
| `/`, `/united-states`, `/canada` | P0 |
| `/states/[state]`, `/states/[state]/[city]` | P0 |
| `/providers/[slug]` | P0 |
| `/leaderboard` | P0 |
| `/corridors/[corridor]`, `/ports/[port]` | P1 |
| `/regulatory-db` | P1 |
| `/enterprise` | P1 |
| `/services`, `/service-area`, `/compliance-proof` | P2 |
| `/territories/[territory]` | P2 |
| `/neighborhoods/[poi]` (ports, refineries, rail yards, interchanges) | P2 |

### Provider Trust Scoreboard (display priority order)
```
1.  Compliance Score         (large, dominant — 0–100)
2.  Verified Badge           (date issued)
3.  Funds Verified           (Stripe pre-auth history)
4.  Insurance Status         (active/expiring/expired, versioned)
5.  Equipment Matrix         (amber lights / high pole / cones / fire ext / signs)
6.  Cert Coverage            (per-state green/red matrix)
7.  Activity Timestamp       ("Last active: 2h ago")
8.  CleanRun Score           (GPS-verified deviation rate)
9.  Completion Rate          (completed / accepted, 90d)
10. On-Time %                (when ≥5 jobs, else hidden)
11. Jobs Completed
12. Service Types + Areas
```

### GatedCTA Component
| `coverage_status` | Anon | Driver | Broker |
|---|---|---|---|
| `live` | **BOOK NOW** | Available Now Toggle | Post a Load |
| `onboarding` | **CLAIM PROFILE** | Claim Profile | Post a Load |
| `coming_soon` | **JOIN WAITLIST** | Join Waitlist | Post a Load |

**Invariant**: "Post a Load" always in nav + footer.

---

## PART 13: SEO ARCHITECTURE — 50X AI-FORWARD

### Geographic Weighting

| Tier | Examples | Depth |
|---|---|---|
| Tier A — Major metro | Houston, Dallas, ATL, Miami, Chicago, Toronto, Vancouver | 5+ clusters + FAQ schema + tools + corridor links + citations |
| Tier B — Mid-size | Baton Rouge, Savannah, Memphis, Calgary, Regina | 3 clusters + FAQ + corridor |
| Tier C — Rural | County seats, small towns | 1 cluster + structured data + links to nearby cities |

### Neighborhood Overlay (Lower competition, higher intent)
Build pages around physical infrastructure:
```
/neighborhoods/port-of-houston
/neighborhoods/port-of-savannah
/neighborhoods/eagle-ford-shale
/neighborhoods/I-10-baton-rouge-corridor
/neighborhoods/port-of-vancouver
```

### Keyword Universe

**Primary (commercial)**:
`pilot car [city/state]` · `oversize escort [city]` · `high pole escort` · `heavy haul pilot car` · `chase car escort` · `oversize permit escort [corridor]` · `certified escort vehicle [state]`

**Compliance (informational → trust conversion)**:
`oversize curfew [state]` · `pilot car requirements [state]` · `escort vehicle equipment requirements` · `pilot car certification reciprocity`

**Seed + Tools (dwell time + bookmarks)**:
`reciprocity checker [state]` · `curfew clock [state]` · `true cost calculator heavy haul` · `oversize route checklist`

**Future-proof (10–20yr)**:
`oversize compliance automation` · `autonomous freight support [corridor]` · `AI routing heavy haul` · `infrastructure clearance mapping` · `freight intelligence platform`

### Every Programmatic Page Must Include
1. ≥1 interactive tool (reciprocity checker / curfew clock / equipment checklist / cost calculator)
2. `"${n} verified providers in ${city}"` (live)
3. `"Last match: ${n} hours ago"` (live)
4. `<GatedCTA>` with region status
5. ≥3 FAQ schema blocks (answer format for AI Overviews)
6. `LocalBusiness` + `Service` + `FAQPage` JSON-LD
7. ≥2 forward internal links + ≥1 backward

### AI Search / LLM Indexing Rules
Every state page answers: "What are the pilot car requirements in [state]?"
Every city page answers: "How do I find a certified pilot car in [city]?"
Every corridor page answers: "What are the enforcement considerations on [corridor]?"
All answers use citation-style "Source quality: OFFICIAL / SECONDARY" notes.

### NotebookLM Content Pipeline
```
NotebookLM ingests:
  - State DOT manuals
  - FMCSA regulations
  - Reciprocity data (pilot_car_rules.ts)
  - Corridor enforcement history

Outputs (grounded):
  - State/province compliance summaries
  - FAQ blocks per corridor
  - Reciprocity notes per state pair

Claude produces final copy:
  - Strict grounding rules (no hallucination)
  - SQS labels on all claims
  - Links to source pages
```

---

## PART 14: LOAD BOARD — LIQUIDITY + SPEED

### Identity: Fastest way to secure a certified pilot car.

**Two-step conversion**: Value displayed first. Account required only to book.

```
Step 1: Post load (no auth) → See Top 3 matches immediately
Step 2: Select + compliance preview (GREENLIGHT / WARN / BLOCKED)
Step 3: Create/login → Stripe pre-auth → job active
```

### Match Labels
| Score | Label | Definition |
|---|---|---|
| ≥ 85 | **Sure Thing** | High trust + completion + proximity |
| 70–84 | **Best Value** | Best score/price band combination |
| 50–69 | **Speedster** | Active Now + fast response + close; shows WARN if compliance < floor |
| < 50 | Not surfaced | — |

### Speed Signals (always public)
```
⚡ Avg match time: [X]min    🟢 Active now: [N]
📦 Loads (24h): [N]          ✅ Funds verified: [N]%
```

### Anti-Ghost Broker Badge (on every load listing)
- ≤10% ghost rate: no badge
- 11–30%: `⚠️ Verify funds`
- >30%: `🚫 High ghost rate`

---

## PART 15: MOBILE APP — UTILITY + RETENTION

### Core MVP
| Feature | Notes |
|---|---|
| Curfew Clock | State-aware sunset countdown + parking suggestion |
| Compliance Locker | Certs + insurance, versioned, expiry alerts |
| Availability Toggle | Auto-expires 4h; 30min warning push |
| Instant Alerts (FCM) | Match, payment, compliance, curfew |
| Job Archive | History + compliance snapshot link |
| Notification Inbox | Unread badge, list, mark-read |
| GPS Tracking (active job) | Background tracking, geofence triggers |
| Pre-Trip Checklist | State-aware, auto-populates from pilot_car_rules |

### Deep Link Schema
```
haulcommand://driver/availability
haulcommand://loads/[id]
haulcommand://compliance/locker
haulcommand://curfew/[stateCode]
haulcommand://leaderboard
haulcommand://notifications
haulcommand://checklist/[stateCode]
haulcommand://jobs/[id]/defense-packet
haulcommand://bridge-alerts/[corridor]
```

### App Store ASO
- **Name**: Haul Command — Pilot Car Load Board & Alerts
- **Subtitle**: Compliance, Curfew & Load Alerts
- **Keywords**: pilot car, oversize escort, heavy haul, curfew clock, load board, PEVO, chase car, superload, route survey
- **Screenshots**: Instant alert → Curfew clock → Compliance score → Proof packet → Leaderboard
- **Review prompt rules**: Trigger ONLY after: job completed / funds captured / dispute resolved. NEVER after: cancellation / payment failure / dispute opened.

---

## PART 16: LEADERBOARD — TRUST + STATUS

Scoring inputs (verifiable only):

| Event | Points |
|---|---|
| Job completed (no incident) | 50 |
| Funds verified | 25 |
| Document verified | 30 |
| On-time arrival (GPS ≤15min) | 20 |
| Verified hazard report (2-driver) | 40 |
| Availability streak (7d active) | 15 |
| Review ≥4 stars | 10 |

Seasonal reset: quarterly (Jan/Apr/Jul/Oct). Historical peak tier badge preserved.

---

## PART 17: QUEBEC BILINGUAL STRATEGY

**Quebec is not optional for Canada.**

- French-first option on all Quebec pages (FR/EN toggle)
- Key compliance summaries available in FR
- App strings localized for FR on Quebec region detection
- French keywords: `escorte convoi exceptionnel` · `véhicule pilote` · `escortage charges surdimensionnées`
- PIPEDA compliance on data handling
- French Language Charter compliance on commercial interfaces
- SEO benefit: establishes real-entity trust for Canadian search results

---

## PART 18: DATA RETENTION POLICY

| Data type | Full retention | Summarized/archived | Purge |
|---|---|---|---|
| GPS breadcrumbs (full) | 30 days | Hash proof for 2 years | After 2 years |
| Documents (certs/insurance) | Current + last 2 versions | — | Old raw images after 90 days (if legally permissible) |
| Defense packets (PDF) | 2–5 years (configurable by tier) | — | Per tier policy |
| Dispute evidence | Until dispute closed | + 12 months | 13 months post-close |
| Audit log | Permanent (append-only) | — | Never |
| Message history | 2 years | — | 2 years post-account close |
| Analytics events | 90 days hot | 2 years cold | 2 years |

**User controls**: Export proof packet / Download compliance snapshot / Enterprise sets retention policies.

---

## PART 19: NOTIFICATION SYSTEM

Push = delivery. Supabase = storage. Never depend on push receipt.

```sql
CREATE TABLE notification_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT,
  payload      JSONB DEFAULT '{}',
  read_at      TIMESTAMPTZ,
  push_sent_at TIMESTAMPTZ,
  push_status  TEXT DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### SMS Escalation (all 6 must be true)
```
sms_fallback_enabled = true
AND user.sms_opt_in = true AND user.phone_verified = true
AND consecutive_push_failures >= 2
AND type NOT IN ('LOAD_MATCH')
AND last_sms_sent_at < NOW() - INTERVAL '1 hour'
```

---

## PART 20: GROWTH LOOPS (ALL MEASURABLE)

| Loop | Flow | Measure |
|---|---|---|
| Directory → Load Board | Live load count on state pages + "Post a Load" | CTR |
| Load Board → Mobile | "Accept on app" deep link + install banner | Install rate |
| Mobile → Leaderboard | Tier push after each job | DAU |
| Leaderboard → Match | Rank multiplier → more bookings | Revenue per tier |
| Bookings → Rank | Job points → better rank | Points/booking |
| Activity → SEO | Live counts update programmatic pages | Crawl rate |
| SEO → Traffic → Signups | State/city ranks → new accounts | CAC |

### 5 Mandatory Connectors
1. Single Supabase identity across all surfaces
2. Activity counters everywhere (live from safe views)
3. Deep linking (`haulcommand://` + web fallback)
4. Two-step conversion (value → account)
5. Push-first engagement loop

---

## PART 21: ENTERPRISE PIPELINE (ZERO-OWNER CONTACT)

```
/enterprise page:
  → Self-serve form (fleet size, region, volume)
  → Auto-tier recommendation
  → Stripe subscription checkout
  → Auto-provision: sub-account + API keys + branding
  → Automated onboarding: tutorials + templates + compliance upload + team invites
  → Optional: Calendly demo (routes to internal sales agent, not owner)
```

---

## PART 22: DATA MOAT SIGNALS

Show signals, protect raw data.

| Signal | Public | Protected |
|---|---|---|
| Corridor heatmap | Risk index Low/Med/High | Raw coordinates + scores |
| Rate transparency | "Median on I-10: $X–$Y/mi" | Per-load rates |
| Hazard rollup | State hazard index 0–100 | Individual reports |
| Completion density | "847 jobs in TX this month" | Per-driver breakdown |
| Bridge clearance | Alert on route | Full NBI dataset |
| Enforcement risk | Route score 0–100 | Source data |

---

## PART 23: RBAC + RLS

| Role | Access |
|---|---|
| `anon` | SEO safe views only |
| `driver` | Own profile + own jobs + available loads |
| `broker` | Own loads + provider profiles (public fields) |
| `org_admin` | Org scope |
| `admin_ops` | KYC queue + fraud queue + dispute escalations |
| `admin` | All |
| `service_role` | All — edge functions only |

Public safe views (no PII):
```sql
CREATE VIEW public.v_providers_seo AS
  SELECT id, slug, display_name, service_area, coverage_status,
         compliance_score, verified_badge, equipment_summary, city, state
  FROM providers WHERE coverage_status IN ('live', 'onboarding');

CREATE VIEW public.v_loads_teaser AS
  SELECT id, pickup_state, dropoff_state, load_type, posted_at
  FROM loads WHERE status = 'open';

CREATE VIEW public.v_leaderboard AS
  SELECT display_name, leaderboard_tier, leaderboard_points,
         visibility_multiplier, city, state
  FROM providers
  ORDER BY leaderboard_points DESC LIMIT 100;
```

---

## PART 24: EDGE FUNCTIONS (18)

| Function | Trigger | Auth | Idempotency |
|---|---|---|---|
| `deadhead-estimate` | POST | driver JWT | none |
| `compliance-match-preview` | POST | driver/broker JWT | none |
| `compliance-reminders-run` | CRON daily 8am | service_role | none |
| `compliance-snapshot-generate` | job complete event | service_role | `snapshot:{job_id}:{driver_id}` |
| `payments-preauth` | POST | broker JWT | `preauth:{load_id}:{driver_id}:{broker_id}` |
| `payments-capture` | GPS job complete | service_role | `capture:{payment_intent_id}` |
| `driver-presence-update` | POST | driver JWT | last-write-wins |
| `hazard-score-rollup` | CRON hourly | service_role | none |
| `rate-index-recompute` | CRON nightly | service_role | none |
| `match-generate` | POST | broker JWT | none |
| `leaderboard-snapshot-hourly` | CRON hourly | service_role | none |
| `broker-score-recompute` | POST | service_role | none |
| `reviews-log` | POST | driver/broker JWT | DB unique `(job_id, reviewer_id)` |
| `referrals-redeem` | POST | driver JWT | `referral:{code}:{new_user_id}` |
| `stripe-webhook` | Stripe event | Stripe signature | Stripe `event.id` |
| `deeplink-redirect` | GET | anon | none |
| `admin-set-setting` | POST | admin JWT | none |
| `fraud-score-update` | DB trigger / event | service_role | none |

---

## PART 25: FEATURE FLAGS

| Flag | Default |
|---|---|
| `pricing_guardrails_mode` | `warn` |
| `route_geometry_mode` | `waypoints_only` |
| `offline_sync_queue` | true |
| `sms_fallback_enabled` | false |
| `notifications_fcm_enabled` | true |
| `national_coverage_mode` | `mixed` |
| `load_board_enabled` | true |
| `broker_trust_score_enabled` | true |
| `fraud_engine_enabled` | true |
| `gps_proof_engine_enabled` | true |
| `bridge_alerts_enabled` | false (Phase 3) |
| `predictive_enforcement_enabled` | false (Phase 3) |
| `leaderboard_seasonal_reset` | true |
| `leaderboard_mythic_tier` | false (Phase 3) |
| `pro_trial_7day_enabled` | true |
| `elite_tier_enabled` | false (Phase 3) |
| `instant_pay_enabled` | false (Phase 3) |
| `enterprise_self_serve_enabled` | true |
| `quebec_bilingual_enabled` | false (Phase 3) |
| `territories_enabled` | false (Phase 3) |
| `hazard_reporting_enabled` | false (Phase 4) |
| `defense_packet_enabled` | false (Phase 4) |
| `kyc_stepup_enabled` | true |
| `dispute_automation_enabled` | true |
| `clearance_data_enabled` | false |

---

## PART 26: 90-DAY DOMINATION ROLLOUT

### Days 1–30: Infrastructure Ignition
- Launch directory with US + Canada + PR + territory hubs
- Generate Core 30 service pages
- Launch 500–3,000 city pages (tier-weighted)
- Embed tools: reciprocity checker + curfew clock + availability ticker
- Launch Load Board "teaser" + app deep links
- App launch: utility first (curfew, locker, availability, alerts)

### Days 31–60: Liquidity + Trust Takeover
- Activate Funds Verified
- Enable "load preview" pages (24h indexable load posts)
- Turn on leaderboard seasons + milestone pushes
- Badge backlink program begins (automated HTML embed generation)
- Introduce Pro trial (7-day auto-trigger on signup)
- KYC step-up and fraud engine go live

### Days 61–90: Default Lock-In
- Corridor intelligence pages expand + seed with pilot_car_rules data
- Quick Pay + GPS proof engine visible
- Enterprise self-serve launches at `/enterprise`
- Data moat signals: heatmaps, rate teasers, hazard rollups
- Scale city/corridor/port pages + maintain sharded sitemaps
- Quebec bilingual pages begin if Canada traffic warrants

---

## PART 27: IDENTIFIED WEAKNESSES + FIXES

| Weakness | Fix |
|---|---|
| No email capture before auth wall | Email opt-in on `/providers/[slug]` + `/loads/[id]` before account prompt |
| Leaderboard not public | `/leaderboard` public page — SEO + social sharing + competition |
| No review automation | Auto-push both parties 48h post job for review |
| Waitlist not seeding supply | Onboarding waitlist → email sequence → "Be first in [city]" |
| No social proof automation | Auto-generate shareable "Compliance Card" (score + badge) per driver |
| Hazard reporting needs trust | 2-driver confirmation queue before publishing |
| Corridor pages launch empty | Seed day 1 with `pilot_car_rules` + rate index data |
| Territories have no local data | Minimal stub pages for URL authority — don't launch empty |
| Fraud engine has no admin UI | `/admin/fraud` view — soft-review queue + account flags |
| No bridge data pipeline | NBI ingestion script + nightly refresh job |
| Quebec requires bilingual UX | FR/EN toggle — build as layout wrapper, not page duplication |
| App review prompt not gated | Only trigger after positive events (see Part 15 ASO rules) |
