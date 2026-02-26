# RISK_REGISTER.md — Haul Command OS
## Risk Register: Fraud, Abuse, Legal, SEO, Payments
> Derived from ANTI_GRAVITY.md v5.0 — Owner reviews quarterly

**Scoring:** Likelihood 1-5 (1=rare, 5=certain) | Impact 1-5 (1=trivial, 5=existential)
**Priority = Likelihood × Impact**

---

## Category 1 — Fraud

### FR-01: GPS Spoofing
| Field | Value |
|-------|-------|
| **Description** | Driver submits fake GPS coordinates to trigger job completion and payment capture without doing the work. Uses mock location apps or rooted devices. |
| **Likelihood** | 3 |
| **Impact** | 5 |
| **Priority** | 15 |
| **Mitigations** | (1) GPS Proof Engine: requires breadcrumb trail density check (≥1 ping/min over job duration). (2) `gps_spoof` component in Fraud Score (9-component formula, weight 0.05). (3) Cross-check device sensor data (speed, heading consistency). (4) Breadcrumb path must match route polyline within tolerance. (5) Auto-flag if job "completes" in < minimum expected drive time. (6) Dispute Tier 1 auto-resolves against driver if GPS proof is absent. |
| **Status** | `fraud_auto_suspend` flag = OFF (pending GPS engine rollout) |

---

### FR-02: Review Stuffing
| Field | Value |
|-------|-------|
| **Description** | Driver or broker creates fake jobs between sockpuppet accounts to inflate star ratings and trust score. |
| **Likelihood** | 3 |
| **Impact** | 4 |
| **Priority** | 12 |
| **Mitigations** | (1) `review_stuffing` component in Fraud Score (weight 0.10). (2) Reviews only count if job has GPS-confirmed start + complete (is_verified=true). (3) Velocity check: flag if same driver-broker pair completes > 3 jobs/day. (4) Device fingerprint check: reviewer and reviewee cannot share device. (5) IP velocity: flag same IP submitting > 5 reviews/24h. |
| **Status** | `is_verified` column on reviews table — enforced at edge function level |

---

### FR-03: Identity Thin / Account Farms
| Field | Value |
|-------|-------|
| **Description** | Bad actors create many minimal accounts to collect referral bonuses, spam the directory, or probe the match engine. |
| **Likelihood** | 4 |
| **Impact** | 3 |
| **Priority** | 12 |
| **Mitigations** | (1) `identity_thin` component in Fraud Score (weight 0.08). (2) KYC-Lite L0 (phone verify) required to receive first match. (3) KYC L2 (Stripe + ID) required for first payout. (4) Referral bonus held 30 days, voided if either account suspended. (5) Rate-limit signups to 3/IP/day. |
| **Status** | KYC L0-L2 gates defined; `kyc_step-up-trigger` function PENDING |

---

### FR-04: Payment Manipulation
| Field | Value |
|-------|-------|
| **Description** | Driver or broker attempts to manipulate rate fields, cancel after preauth to avoid fees, or trigger double-captures. |
| **Likelihood** | 2 |
| **Impact** | 5 |
| **Priority** | 10 |
| **Mitigations** | (1) `rate_manipulation` component in Fraud Score (weight 0.10). (2) Rate field server-validated — client never sets final rate. (3) Idempotency keys on all payment operations (prevents double-capture). (4) Pre-auth amount locked at match time, capture only on GPS-confirmed complete. (5) Stripe webhook events stored + replayed idempotently. (6) Hard block: job rate cannot be modified after ASSIGNED status. |
| **Status** | `idempotency_keys` table defined; migration 0027 PENDING |

---

### FR-05: Broker Non-Payment Intent
| Field | Value |
|-------|-------|
| **Description** | Broker posts a fake load to harvest driver data or competitor intelligence, never intending to pay. |
| **Likelihood** | 2 |
| **Impact** | 4 |
| **Priority** | 8 |
| **Mitigations** | (1) Stripe pre-auth required before offer becomes OPEN. (2) `payment_decline` component in Fraud Score (weight 0.08). (3) Brokers with > 2 cancelled offers in 30 days auto-downgraded to manual review queue. (4) `trust_floor` on offer: drivers below floor never see offer. |
| **Status** | `payments-preauth` edge function DEPLOYED |

---

## Category 2 — Abuse

### AB-01: Trust Score Gaming
| Field | Value |
|-------|-------|
| **Description** | Participants discover the trust score formula weights and optimize behavior specifically to game the score rather than provide genuine service quality. |
| **Likelihood** | 3 |
| **Impact** | 3 |
| **Priority** | 9 |
| **Mitigations** | (1) Score formula is not publicly documented (only visible to admins). (2) Multi-component formula (8 components) is harder to game than single metric. (3) `clean_run_score` requires GPS proof — cannot be faked without real work. (4) Weights can be adjusted via admin without migration (stored in feature_flags/config). (5) Cancel spike detector in fraud score cross-validates completion rate. |
| **Status** | Formula weights in code only, not exposed via API |

---

### AB-02: Leaderboard Exploitation
| Field | Value |
|-------|-------|
| **Description** | Drivers chase leaderboard rank for visibility multiplier without genuine service quality (e.g., accept many jobs and cancel strategically). |
| **Likelihood** | 3 |
| **Impact** | 2 |
| **Priority** | 6 |
| **Mitigations** | (1) Leaderboard score uses `trust_score × completed_jobs × avg_stars` — cancellations reduce all three. (2) Cancel spike in Fraud Score cross-monitors. (3) Visibility multiplier only applies to MATCH ranking, not client-facing profile. (4) MYTHIC tier requires sustained 950+ score over 90-day window (not a single sprint). |
| **Status** | Leaderboard formula in ANTI_GRAVITY.md Part 7 |

---

### AB-03: Dispute Abuse
| Field | Value |
|-------|-------|
| **Description** | Party files frivolous disputes to delay payment, harass the other party, or exploit the evidence collection window. |
| **Likelihood** | 3 |
| **Impact** | 3 |
| **Priority** | 9 |
| **Mitigations** | (1) Tier 1 auto-resolves in 48h via GPS proof — frivolous disputes auto-close. (2) `dispute_rate_inv` in Broker Trust Score penalizes chronic dispute filers. (3) Third frivolous dispute in 30 days triggers manual KYC review. (4) Legal hold (Tier 4) requires documented escalation — not self-serve. (5) Evidence URLs required at open time — no evidence = auto-close at 24h. |
| **Status** | `disputes` table + 5-tier ladder defined; `dispute-auto-resolve` edge function PENDING |

---

### AB-04: Rate Index Manipulation
| Field | Value |
|-------|-------|
| **Description** | Small group of brokers or drivers collude to skew the market rate index by posting artificially high/low offers that complete. |
| **Likelihood** | 2 |
| **Impact** | 3 |
| **Priority** | 6 |
| **Mitigations** | (1) Rate index uses median (not mean) — resistant to outliers. (2) Minimum and maximum rate validation at offer create (hard block: invalid rate). (3) Rates from accounts with fraud_score > 0.60 excluded from index calculation. (4) Admin can audit full rate history per corridor. |
| **Status** | `rate-index-recompute` cron DEPLOYED |

---

## Category 3 — Legal

### LE-01: Unauthorized Practice of Law / Compliance Advice
| Field | Value |
|-------|-------|
| **Description** | Platform displays compliance rules that are wrong or outdated. User relies on them, gets ticketed or fined, and sues platform. |
| **Likelihood** | 3 |
| **Impact** | 5 |
| **Priority** | 15 |
| **Mitigations** | (1) All compliance data labeled with `source_quality` (OFFICIAL / SECONDARY / UNSOURCED). (2) UNSOURCED rules carry mandatory disclaimer: "Verify with state DOT before relying on this information." (3) Terms of Service: platform provides informational reference only, not legal advice. (4) Source URLs displayed on every rule so user can verify independently. (5) Stale rules (last_verified > 90 days) automatically downgraded to UNSOURCED label. |
| **Status** | `source_quality` column on compliance_rules; UI disclaimer required on all UNSOURCED items |

---

### LE-02: FMCSA / DOT Regulatory Liability
| Field | Value |
|-------|-------|
| **Description** | Platform is deemed a "motor carrier" or "dispatcher" subject to FMCSA regulations, triggering licensing requirements. |
| **Likelihood** | 2 |
| **Impact** | 5 |
| **Priority** | 10 |
| **Mitigations** | (1) Platform is structured as a **technology marketplace**, not a carrier or dispatcher. (2) All drivers are independent contractors. (3) Platform never holds or directs cargo. (4) Terms of Service explicitly disclaim carrier/dispatcher status. (5) Legal counsel to review positioning annually. |
| **Status** | Legal review required before launch in each new state |

---

### LE-03: Canadian Jurisdiction — PIPEDA / Quebec Law 25
| Field | Value |
|-------|-------|
| **Description** | Collecting data from Canadian users (especially Quebec) without proper consent mechanisms violates federal PIPEDA or Quebec's Law 25 (more stringent). |
| **Likelihood** | 3 |
| **Impact** | 4 |
| **Priority** | 12 |
| **Mitigations** | (1) Quebec users must receive French-language consent forms (Law 25 requires this). (2) `preferred_lang` column on profiles — QC users default to 'fr'. (3) Data retention policy: personal data deleted within 30 days of account deletion request. (4) Privacy policy published in both EN and FR. (5) No data sold to third parties without explicit opt-in. (6) `quebec_bilingual` feature flag gates QC content until legal review complete. |
| **Status** | `quebec_bilingual` flag OFF pending legal review |

---

### LE-04: Stripe / Payment Licensing
| Field | Value |
|-------|-------|
| **Description** | Platform collecting and disbursing payments may require money transmitter licenses in certain states. |
| **Likelihood** | 2 |
| **Impact** | 4 |
| **Priority** | 8 |
| **Mitigations** | (1) Use Stripe Connect with direct charges — Stripe is the licensed payment processor; platform takes a platform fee only. (2) Do not hold funds in platform accounts beyond settlement period. (3) Consult payments counsel before enabling in all 50 states. |
| **Status** | Stripe Connect architecture adopted; counsel review at scale |

---

### LE-05: Worker Classification (1099 vs W2)
| Field | Value |
|-------|-------|
| **Description** | States (especially CA AB5) may classify platform drivers as employees, not contractors, requiring employment benefits. |
| **Likelihood** | 2 |
| **Impact** | 5 |
| **Priority** | 10 |
| **Mitigations** | (1) Drivers set their own rates, hours, and accept/decline freely. (2) Platform never mandates schedule or minimum hours. (3) Drivers may work on multiple competing platforms. (4) Platform does not provide equipment or training. (5) Legal counsel to review classification annually per state. |
| **Status** | Platform design intentionally contractor-first |

---

## Category 4 — SEO

### SE-01: Google Helpful Content Penalty (Thin Content)
| Field | Value |
|-------|-------|
| **Description** | Google detects programmatically generated SEO pages as thin/low-quality content and penalizes the entire domain. |
| **Likelihood** | 4 |
| **Impact** | 4 |
| **Priority** | 16 |
| **Mitigations** | (1) `local_intelligence` field on every page must be unique and substantive (minimum 150 words of real regional context). (2) NotebookLM content pipeline: each page grounded in actual DOT/state-specific data. (3) `source_quality` labels and source links on compliance data (not just text rehash). (4) Tier A metro pages have deeper content (neighborhood overlays: ports, refineries, rail yards). (5) Schema markup (JSON-LD ProfessionalService) on every page. (6) Canonical URLs on all pages. (7) Sitemap submitted to GSC. (8) Soft launch: index only Tier A pages first, monitor quality signals before Tier B/C rollout. |
| **Status** | SEO template built; content pipeline (NotebookLM) required before indexing |

---

### SE-02: Duplicate Content (City Variants)
| Field | Value |
|-------|-------|
| **Description** | Near-identical pages for adjacent cities (e.g., "Houston" vs "Houston Heights" vs "Houston TX") treated as duplicate content. |
| **Likelihood** | 3 |
| **Impact** | 3 |
| **Priority** | 9 |
| **Mitigations** | (1) De-duplicate slug generation: `generateStaticParams()` uses `new Set()` before generating routes. (2) Neighborhood overlays are additive content, not separate pages — they are sections within a city page. (3) `rel=canonical` pointing to the primary city page for any variant URLs. (4) Only one page per state/city combination in `seo_data_manifest.json`. |
| **Status** | De-duplication enforced in page.tsx; canonical tags required |

---

### SE-03: AI-Generated Content Detection / Manual Action
| Field | Value |
|-------|-------|
| **Description** | Google or Bing issues a manual action for AI-generated content that lacks original insight or "people-first" value. |
| **Likelihood** | 3 |
| **Impact** | 5 |
| **Priority** | 15 |
| **Mitigations** | (1) AI content is a starting draft only — human review required for Tier A pages before indexing. (2) Real operational data injected: `availabilityCount` from live Supabase query (not static). (3) Community/driver-submitted hazard reports generate unique, real-world content no AI can replicate. (4) Trust scoreboard (leaderboard) on city pages — real names, real scores. (5) Content marked with last-verified date. |
| **Status** | Human review gate for Tier A required before launch |

---

### SE-04: Competitors Filing DMCA for Data Scraping
| Field | Value |
|-------|-------|
| **Description** | Platform ingests vendor/provider data from competitor sites. Competitors file DMCA takedowns or litigation. |
| **Likelihood** | 3 |
| **Impact** | 3 |
| **Priority** | 9 |
| **Mitigations** | (1) Ingest only publicly available data (state DOT sites, FMCSA public records). (2) No scraping of competitor proprietary databases. (3) `source_quality` = OFFICIAL for government sources; SECONDARY for trade directories. (4) Data is transformed/enriched (not copied verbatim). (5) Vendor claim process allows any provider to edit/remove their listing. |
| **Status** | Source labeling enforced; legal review of ingestion sources |

---

## Category 5 — Payments

### PA-01: Stripe Pre-Auth Failure at Match Time
| Field | Value |
|-------|-------|
| **Description** | Broker's payment method fails pre-auth after a driver has already accepted the match, creating a bad experience and potential dispute. |
| **Likelihood** | 3 |
| **Impact** | 3 |
| **Priority** | 9 |
| **Mitigations** | (1) Pre-auth runs before offer becomes OPEN (not at match time). (2) If pre-auth fails at offer creation, offer is rejected immediately with clear error. (3) `payment_decline` in Fraud Score tracks repeated failures. (4) Broker accounts with 3 consecutive pre-auth failures auto-suspended. |
| **Status** | `payments-preauth` DEPLOYED; offer creation gate required |

---

### PA-02: Double Capture (Idempotency Failure)
| Field | Value |
|-------|-------|
| **Description** | Network retry or webhook replay causes a payment to be captured twice, double-billing the broker. |
| **Likelihood** | 2 |
| **Impact** | 5 |
| **Priority** | 10 |
| **Mitigations** | (1) All payment operations wrapped in `withIdempotency()` pattern with key `payment_capture:{job_id}:{pi_id}`. (2) Stripe idempotency key passed on every API call. (3) `idempotency_keys` table prevents duplicate processing within 24h window. (4) Stripe webhook events marked as processed in DB — replayed events are no-ops. |
| **Status** | `idempotency_keys` table defined; migration 0027 PENDING |

---

### PA-03: Driver Payout Failure (Stripe Connect)
| Field | Value |
|-------|-------|
| **Description** | Driver's Stripe Connect account has an issue (identity verification pending, bank error) causing payout to fail silently. |
| **Likelihood** | 3 |
| **Impact** | 3 |
| **Priority** | 9 |
| **Mitigations** | (1) `stripe-webhook` function handles `transfer.failed` and `payout.failed` events. (2) Failed payout triggers `PAYMENT_PAYOUT_FAILED` notification_event (push + SMS gate). (3) Funds held in platform escrow up to 14 days while driver resolves Connect issue. (4) Job status remains COMPLETE even if payout pending — driver trust not penalized. (5) Support email auto-generated on payout failure. |
| **Status** | `stripe-webhook` DEPLOYED; payout failure notification handler PENDING |

---

### PA-04: Chargeback / Friendly Fraud
| Field | Value |
|-------|-------|
| **Description** | Broker completes a job then files a chargeback claiming unauthorized use, attempting to get the work for free. |
| **Likelihood** | 2 |
| **Impact** | 4 |
| **Priority** | 8 |
| **Mitigations** | (1) GPS Proof Engine generates a defense packet (breadcrumbs, start/end timestamps, photos) automatically on job complete. (2) Defense packet URL stored in `jobs.proof_packet_url` — submitted to Stripe as chargeback evidence. (3) Broker trust profile `dispute_rate_inv` penalizes chargeback filers. (4) Broker account suspended on second chargeback within 90 days. |
| **Status** | GPS Proof Engine PENDING; proof_packet_url column defined |

---

### PA-05: Platform Fee Leakage
| Field | Value |
|-------|-------|
| **Description** | Due to a code bug, platform fee is calculated incorrectly (too low or zero), reducing margin. |
| **Likelihood** | 2 |
| **Impact** | 3 |
| **Priority** | 6 |
| **Mitigations** | (1) `platform_fee_cents` and `driver_payout_cents` computed server-side (edge function), never client-set. (2) Fee schedule stored in DB (feature_flags / pricing table) — single source of truth. (3) Daily reconciliation cron: cross-check sum(platform_fee_cents) vs Stripe dashboard deposits. (4) Admin alert if reconciliation diff > $10/day. |
| **Status** | Fee computation in `jobs-create-from-offer` edge function |

---

## Summary Table

| ID | Category | Priority | Status |
|----|----------|----------|--------|
| FR-01 | GPS Spoofing | **15** | Fraud Score defined; GPS engine PENDING |
| LE-01 | Compliance advice liability | **15** | Source labels implemented |
| SE-01 | Thin content penalty | **16** | Content pipeline required |
| SE-03 | AI content manual action | **15** | Human review gate required |
| FR-02 | Review stuffing | 12 | is_verified enforced |
| FR-03 | Identity thin | 12 | KYC gates defined |
| LE-03 | Quebec Law 25 | 12 | Flag OFF pending legal |
| PA-02 | Double capture | 10 | Idempotency keys PENDING |
| LE-02 | FMCSA liability | 10 | Legal positioning adopted |
| LE-05 | Worker classification | 10 | Contractor design |
| PA-04 | Chargeback | 8 | GPS proof PENDING |
| LE-04 | Payment licensing | 8 | Stripe Connect adopted |
| FR-05 | Broker non-payment | 8 | Pre-auth DEPLOYED |
| AB-01 | Score gaming | 9 | Formula not public |
| AB-03 | Dispute abuse | 9 | 5-tier ladder defined |
| PA-01 | Pre-auth failure | 9 | Gate required at offer create |
| PA-03 | Payout failure | 9 | Notification handler PENDING |
| SE-02 | Duplicate content | 9 | De-duplication enforced |
| SE-04 | DMCA data scraping | 9 | Source labeling |
| FR-04 | Payment manipulation | 10 | Idempotency PENDING |

---

## Quarterly Review Checklist
- [ ] Review any new Fraud Score auto-suspensions — false positive rate < 1%
- [ ] Legal counsel review: new states added this quarter
- [ ] GSC (Google Search Console) quality signals — any manual actions?
- [ ] Stripe reconciliation report — fee leakage check
- [ ] Compliance rules stale audit — downgrade rules last_verified > 90 days
- [ ] Worker classification review — any new AB5-style legislation?
- [ ] Quebec bilingual flag status — legal sign-off received?

---

*Last updated: 2026-02-18 — Derived from ANTI_GRAVITY.md v5.0*
