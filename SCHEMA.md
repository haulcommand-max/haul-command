# SCHEMA.md — Haul Command OS
## Complete Database Schema, Edge Functions, and Cron Map
> Auto-generated from ANTI_GRAVITY.md v5.0 — Source of truth for all table definitions, indexes, RLS, and automation

---

## Part 1 — Core Tables

### 1.1 `profiles`
```sql
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('driver','broker','admin','viewer')),
  display_name text,
  phone       text,
  email       text,
  tier        text NOT NULL DEFAULT 'FREE' CHECK (tier IN ('FREE','PRO','ELITE')),
  kyc_level   int  NOT NULL DEFAULT 0 CHECK (kyc_level BETWEEN 0 AND 4),
  stripe_customer_id text,
  stripe_connect_id  text,
  preferred_lang     text NOT NULL DEFAULT 'en' CHECK (preferred_lang IN ('en','fr')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_role_idx ON profiles(role);
CREATE INDEX profiles_tier_idx ON profiles(tier);
```

**RLS:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Owner can read/update own row
CREATE POLICY profiles_owner ON profiles
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
-- Admins read all
CREATE POLICY profiles_admin_read ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
```

---

### 1.2 `driver_trust_scores`
```sql
CREATE TABLE driver_trust_scores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trust_score     numeric(5,4) NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 1),
  -- 8-component breakdown (all 0..1)
  review_quality      numeric(5,4) NOT NULL DEFAULT 0,
  completion_rate     numeric(5,4) NOT NULL DEFAULT 0,
  cancel_rate_inv     numeric(5,4) NOT NULL DEFAULT 0,  -- 1 - cancel_rate
  clean_run_score     numeric(5,4) NOT NULL DEFAULT 0,  -- GPS-verified
  response_score      numeric(5,4) NOT NULL DEFAULT 0,
  compliance_score    numeric(5,4) NOT NULL DEFAULT 0,
  job_tenure_score    numeric(5,4) NOT NULL DEFAULT 0,
  funds_verified      numeric(5,4) NOT NULL DEFAULT 0,
  computed_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(driver_id)
);

CREATE INDEX dts_driver_id_idx ON driver_trust_scores(driver_id);
CREATE INDEX dts_trust_score_idx ON driver_trust_scores(trust_score DESC);
```

**Trust Score Formula:**
```
trust_score =
  0.20 * review_quality       +
  0.20 * completion_rate      +
  0.15 * cancel_rate_inv      +
  0.15 * clean_run_score      +
  0.10 * response_score       +
  0.10 * compliance_score     +
  0.05 * job_tenure_score     +
  0.05 * funds_verified
-- Weights sum = 1.00
```

**RLS:**
```sql
ALTER TABLE driver_trust_scores ENABLE ROW LEVEL SECURITY;
-- Driver reads own
CREATE POLICY dts_owner ON driver_trust_scores FOR SELECT
  USING (driver_id = auth.uid());
-- Brokers read any driver score (for match display)
CREATE POLICY dts_broker_read ON driver_trust_scores FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('broker','admin')));
```

---

### 1.3 `fraud_signals`
```sql
CREATE TABLE fraud_signals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fraud_score     numeric(5,4) NOT NULL DEFAULT 0 CHECK (fraud_score BETWEEN 0 AND 1),
  -- 9-component breakdown
  velocity_24h    numeric(5,4) NOT NULL DEFAULT 0,
  ip_mismatch     numeric(5,4) NOT NULL DEFAULT 0,
  device_change   numeric(5,4) NOT NULL DEFAULT 0,
  cancel_spike    numeric(5,4) NOT NULL DEFAULT 0,
  rate_manipulation numeric(5,4) NOT NULL DEFAULT 0,
  review_stuffing  numeric(5,4) NOT NULL DEFAULT 0,
  identity_thin   numeric(5,4) NOT NULL DEFAULT 0,
  payment_decline  numeric(5,4) NOT NULL DEFAULT 0,
  gps_spoof       numeric(5,4) NOT NULL DEFAULT 0,
  computed_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX fs_user_id_idx   ON fraud_signals(user_id);
CREATE INDEX fs_fraud_score_idx ON fraud_signals(fraud_score DESC);
```

**Fraud Score Formula:**
```
fraud_score =
  0.20 * velocity_24h    +
  0.15 * ip_mismatch     +
  0.12 * device_change   +
  0.12 * cancel_spike    +
  0.10 * rate_manipulation +
  0.10 * review_stuffing +
  0.08 * identity_thin   +
  0.08 * payment_decline +
  0.05 * gps_spoof
-- Weights sum = 1.00
-- AUTO_SUSPEND at fraud_score >= 0.80
-- MANUAL_REVIEW at fraud_score >= 0.60
```

**RLS:**
```sql
ALTER TABLE fraud_signals ENABLE ROW LEVEL SECURITY;
-- Admins only
CREATE POLICY fs_admin_only ON fraud_signals
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
```

---

### 1.4 `kyc_verifications`
```sql
CREATE TABLE kyc_verifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level       int  NOT NULL CHECK (level BETWEEN 0 AND 4),
  -- L0: phone verified  L1: +doc upload  L2: +Stripe  L3: +background  L4: +FMCSA pull
  verified_at timestamptz,
  expires_at  timestamptz,
  status      text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','EXPIRED')),
  reviewer_id uuid REFERENCES profiles(id),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX kyc_user_id_idx ON kyc_verifications(user_id);
CREATE INDEX kyc_level_idx   ON kyc_verifications(level, status);
```

---

### 1.5 `offers`
```sql
CREATE TABLE offers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id           uuid NOT NULL REFERENCES profiles(id),
  status              text NOT NULL DEFAULT 'OPEN'
                          CHECK (status IN ('OPEN','MATCHED','IN_PROGRESS','COMPLETE','CANCELLED','DISPUTED')),
  pickup_lat          numeric(9,6) NOT NULL,
  pickup_lng          numeric(9,6) NOT NULL,
  dropoff_lat         numeric(9,6) NOT NULL,
  dropoff_lng         numeric(9,6) NOT NULL,
  pickup_address      text,
  dropoff_address     text,
  required_equipment_tags text[] NOT NULL DEFAULT '{}',
  jurisdictions       text[] NOT NULL DEFAULT '{}',
  rate_cents          int NOT NULL CHECK (rate_cents > 0),
  rate_currency       text NOT NULL DEFAULT 'USD',
  trust_floor         numeric(5,4) NOT NULL DEFAULT 0.50,
  scheduled_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX offers_broker_id_idx ON offers(broker_id);
CREATE INDEX offers_status_idx    ON offers(status);
CREATE INDEX offers_scheduled_idx ON offers(scheduled_at) WHERE status = 'OPEN';
-- PostGIS spatial index (requires postgis extension)
-- CREATE INDEX offers_pickup_geo_idx ON offers USING GIST(ST_MakePoint(pickup_lng, pickup_lat));
```

**RLS:**
```sql
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
-- Broker reads own offers
CREATE POLICY offers_broker_own ON offers FOR ALL
  USING (broker_id = auth.uid());
-- Drivers read OPEN offers
CREATE POLICY offers_driver_read ON offers FOR SELECT
  USING (status = 'OPEN' AND
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'driver'));
-- Admins read all
CREATE POLICY offers_admin ON offers FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
```

---

### 1.6 `match_runs`
```sql
CREATE TABLE match_runs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id         uuid NOT NULL REFERENCES offers(id),
  run_reason       text NOT NULL CHECK (run_reason IN ('NEW_OFFER','RERUN','MANUAL')),
  algorithm_version text NOT NULL DEFAULT 'v1.0',
  ran_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mr_offer_id_idx ON match_runs(offer_id);
```

### 1.7 `match_candidates`
```sql
CREATE TABLE match_candidates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_run_id  uuid NOT NULL REFERENCES match_runs(id) ON DELETE CASCADE,
  escort_id     uuid NOT NULL REFERENCES profiles(id),
  rank          int NOT NULL,
  score_total   numeric(6,2) NOT NULL,
  score_breakdown jsonb,
  notified_at   timestamptz,
  responded_at  timestamptz,
  response      text CHECK (response IN ('ACCEPTED','DECLINED','TIMEOUT'))
);

CREATE INDEX mc_run_id_idx    ON match_candidates(match_run_id);
CREATE INDEX mc_escort_id_idx ON match_candidates(escort_id);
```

---

### 1.8 `jobs`
```sql
CREATE TABLE jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id        uuid NOT NULL REFERENCES offers(id),
  driver_id       uuid NOT NULL REFERENCES profiles(id),
  broker_id       uuid NOT NULL REFERENCES profiles(id),
  status          text NOT NULL DEFAULT 'ASSIGNED'
                      CHECK (status IN ('ASSIGNED','EN_ROUTE','IN_PROGRESS','COMPLETE','DISPUTED','CANCELLED')),
  -- GPS Proof
  start_geofence_lat  numeric(9,6),
  start_geofence_lng  numeric(9,6),
  start_geofence_radius_m int NOT NULL DEFAULT 500,
  gps_start_confirmed_at  timestamptz,
  gps_end_confirmed_at    timestamptz,
  breadcrumb_count        int NOT NULL DEFAULT 0,
  off_route_alerts        int NOT NULL DEFAULT 0,
  -- Payment
  stripe_payment_intent_id text,
  stripe_preauth_at    timestamptz,
  stripe_capture_at    timestamptz,
  rate_cents           int NOT NULL,
  platform_fee_cents   int NOT NULL DEFAULT 0,
  driver_payout_cents  int NOT NULL DEFAULT 0,
  -- Proof packet
  proof_packet_url text,
  -- Timestamps
  assigned_at  timestamptz NOT NULL DEFAULT now(),
  started_at   timestamptz,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX jobs_driver_id_idx ON jobs(driver_id);
CREATE INDEX jobs_broker_id_idx ON jobs(broker_id);
CREATE INDEX jobs_status_idx    ON jobs(status);
CREATE INDEX jobs_offer_id_idx  ON jobs(offer_id);
```

**RLS:**
```sql
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY jobs_driver ON jobs FOR ALL   USING (driver_id = auth.uid());
CREATE POLICY jobs_broker ON jobs FOR ALL   USING (broker_id = auth.uid());
CREATE POLICY jobs_admin  ON jobs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
```

---

### 1.9 `gps_breadcrumbs`
```sql
CREATE TABLE gps_breadcrumbs (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id    uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES profiles(id),
  lat       numeric(9,6) NOT NULL,
  lng       numeric(9,6) NOT NULL,
  accuracy_m int,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- Partitioned by day in production for performance
CREATE INDEX gps_job_id_idx    ON gps_breadcrumbs(job_id);
CREATE INDEX gps_recorded_idx  ON gps_breadcrumbs(recorded_at DESC);
```

**Retention:** Purge breadcrumbs older than 90 days (see cron schedule).

---

### 1.10 `disputes`
```sql
CREATE TABLE disputes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid NOT NULL REFERENCES jobs(id),
  opened_by       uuid NOT NULL REFERENCES profiles(id),
  against_id      uuid NOT NULL REFERENCES profiles(id),
  status          text NOT NULL DEFAULT 'OPENED'
                      CHECK (status IN ('OPENED','EVIDENCE_COLLECTION','MEDIATION','ESCALATED','RESOLVED','CLOSED')),
  tier            int NOT NULL DEFAULT 1 CHECK (tier BETWEEN 1 AND 5),
  -- Tier 1: auto-resolve (GPS match)
  -- Tier 2: evidence review (auto 48h)
  -- Tier 3: human mediation
  -- Tier 4: legal hold
  -- Tier 5: arbitration
  evidence_urls   text[] NOT NULL DEFAULT '{}',
  resolution      text,
  resolved_by     uuid REFERENCES profiles(id),
  auto_resolved   boolean NOT NULL DEFAULT false,
  opened_at       timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz,
  escalate_at     timestamptz  -- deadline for auto-escalation
);

CREATE INDEX disputes_job_id_idx     ON disputes(job_id);
CREATE INDEX disputes_status_idx     ON disputes(status);
CREATE INDEX disputes_escalate_idx   ON disputes(escalate_at) WHERE status NOT IN ('RESOLVED','CLOSED');
```

---

### 1.11 `notification_events`
```sql
CREATE TABLE notification_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text NOT NULL,
  -- e.g. MATCH_OFFER, JOB_STARTED, PAYMENT_CAPTURED, DISPUTE_OPENED, COMPLIANCE_WARN, etc.
  title       text NOT NULL,
  body        text NOT NULL,
  data        jsonb,
  read_at     timestamptz,
  push_sent   boolean NOT NULL DEFAULT false,
  push_sent_at timestamptz,
  sms_sent    boolean NOT NULL DEFAULT false,
  sms_sent_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ne_user_id_idx    ON notification_events(user_id);
CREATE INDEX ne_read_idx       ON notification_events(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX ne_created_idx    ON notification_events(created_at DESC);
```

**RLS:**
```sql
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY ne_owner ON notification_events FOR ALL USING (user_id = auth.uid());
```

---

### 1.12 `idempotency_keys`
```sql
CREATE TABLE idempotency_keys (
  key         text PRIMARY KEY,
  -- Format: {operation}:{entity_id}:{timestamp_or_hash}
  -- Examples:
  --   payment_preauth:job_uuid:stripe_pi_id
  --   match_run:offer_uuid:run_timestamp
  --   review_submit:job_uuid:reviewer_uuid
  result      jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX ik_expires_idx ON idempotency_keys(expires_at);
-- Cron purges expired keys daily
```

---

### 1.13 `reviews`
```sql
CREATE TABLE reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      uuid NOT NULL REFERENCES jobs(id),
  reviewer_id uuid NOT NULL REFERENCES profiles(id),
  reviewee_id uuid NOT NULL REFERENCES profiles(id),
  stars       int NOT NULL CHECK (stars BETWEEN 1 AND 5),
  body        text,
  is_verified boolean NOT NULL DEFAULT false,  -- GPS-verified job = true
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, reviewer_id)
);

CREATE INDEX reviews_reviewee_idx ON reviews(reviewee_id);
CREATE INDEX reviews_job_id_idx   ON reviews(job_id);
```

---

### 1.14 `provider_directory`
```sql
CREATE TABLE provider_directory (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid REFERENCES profiles(id),
  slug            text UNIQUE NOT NULL,
  display_name    text NOT NULL,
  state           text NOT NULL,
  city            text NOT NULL,
  lat             numeric(9,6),
  lng             numeric(9,6),
  service_tags    text[] NOT NULL DEFAULT '{}',
  phone           text,
  website         text,
  description     text,
  coverage_status text NOT NULL DEFAULT 'coming_soon'
                      CHECK (coverage_status IN ('live','onboarding','coming_soon')),
  source_quality  text NOT NULL DEFAULT 'UNSOURCED'
                      CHECK (source_quality IN ('OFFICIAL','SECONDARY','UNSOURCED')),
  verified        boolean NOT NULL DEFAULT false,
  claimed_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pd_state_city_idx   ON provider_directory(state, city);
CREATE INDEX pd_service_tags_idx ON provider_directory USING GIN(service_tags);
CREATE INDEX pd_coverage_idx     ON provider_directory(coverage_status);
```

**Public safe view (anon read):**
```sql
CREATE VIEW public_providers AS
  SELECT id, slug, display_name, state, city, service_tags,
         coverage_status, source_quality, verified
  FROM provider_directory
  WHERE coverage_status IN ('live','onboarding');
```

---

### 1.15 `compliance_rules`
```sql
CREATE TABLE compliance_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction    text NOT NULL,  -- e.g. 'TX', 'LA', 'ON'
  rule_type       text NOT NULL,
  -- PERMIT_REQUIRED, ESCORT_REQUIRED, WIDTH_LIMIT, HEIGHT_LIMIT, CURFEW, RECIPROCITY
  description     text NOT NULL,
  description_fr  text,  -- Quebec bilingual
  effective_date  date,
  expires_date    date,
  source_url      text,
  source_quality  text NOT NULL DEFAULT 'UNSOURCED'
                      CHECK (source_quality IN ('OFFICIAL','SECONDARY','UNSOURCED')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cr_jurisdiction_idx ON compliance_rules(jurisdiction);
CREATE INDEX cr_rule_type_idx    ON compliance_rules(rule_type);
```

---

### 1.16 `reciprocity_matrix`
```sql
CREATE TABLE reciprocity_matrix (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_state    text NOT NULL,
  dest_state      text NOT NULL,
  is_accepted     boolean NOT NULL DEFAULT false,
  conditions      text,
  last_verified   date,
  source_url      text,
  UNIQUE(origin_state, dest_state)
);

CREATE INDEX rm_origin_idx ON reciprocity_matrix(origin_state);
CREATE INDEX rm_dest_idx   ON reciprocity_matrix(dest_state);
```

---

### 1.17 `hazard_reports`
```sql
CREATE TABLE hazard_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     uuid REFERENCES profiles(id),
  job_id          uuid REFERENCES jobs(id),
  type            text NOT NULL CHECK (type IN ('SCALE','HEIGHT','CHOKE_POINT','BRIDGE','ROAD_DAMAGE','OTHER')),
  lat             numeric(9,6) NOT NULL,
  lng             numeric(9,6) NOT NULL,
  severity        text NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  description     text,
  verified_count  int NOT NULL DEFAULT 0,
  active          boolean NOT NULL DEFAULT true,
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX hr_geo_idx    ON hazard_reports(lat, lng) WHERE active = true;
CREATE INDEX hr_type_idx   ON hazard_reports(type, severity) WHERE active = true;
```

---

### 1.18 `broker_trust_profiles`
```sql
CREATE TABLE broker_trust_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  broker_score    numeric(5,4) NOT NULL DEFAULT 0,
  -- 4-component breakdown
  pay_speed       numeric(5,4) NOT NULL DEFAULT 0,  -- median hours to payment release
  dispute_rate_inv numeric(5,4) NOT NULL DEFAULT 0,  -- 1 - dispute_rate
  repeat_hire     numeric(5,4) NOT NULL DEFAULT 0,   -- repeat_hires / total_hires
  platform_tenure numeric(5,4) NOT NULL DEFAULT 0,   -- MIN(months_active/24, 1.0)
  computed_at     timestamptz NOT NULL DEFAULT now()
);

-- Broker Score Formula:
-- broker_score = 0.35*pay_speed + 0.30*dispute_rate_inv + 0.20*repeat_hire + 0.15*platform_tenure

CREATE INDEX btp_broker_id_idx    ON broker_trust_profiles(broker_id);
CREATE INDEX btp_broker_score_idx ON broker_trust_profiles(broker_score DESC);
```

---

### 1.19 `leaderboard_snapshots`
```sql
CREATE TABLE leaderboard_snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id   uuid NOT NULL REFERENCES profiles(id),
  period      text NOT NULL CHECK (period IN ('WEEKLY','MONTHLY','ALLTIME')),
  rank        int NOT NULL,
  score       numeric(8,2) NOT NULL,
  tier_label  text NOT NULL CHECK (tier_label IN ('ROOKIE','SCOUTER','ELITE','MASTER_SCOUT','MYTHIC')),
  visibility_multiplier numeric(4,2) NOT NULL DEFAULT 1.0,
  snapshotted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ls_driver_period_idx ON leaderboard_snapshots(driver_id, period);
CREATE INDEX ls_period_rank_idx   ON leaderboard_snapshots(period, rank);
```

**Tier thresholds + visibility multipliers:**
```
ROOKIE        score < 400     multiplier = 1.00
SCOUTER       400-699         multiplier = 1.05
ELITE         700-849         multiplier = 1.10
MASTER_SCOUT  850-949         multiplier = 1.15
MYTHIC        950+            multiplier = 1.20
```

---

### 1.20 `analytics_events`
```sql
CREATE TABLE analytics_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id),
  session_id  text,
  event_type  text NOT NULL,
  properties  jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ae_user_id_idx   ON analytics_events(user_id);
CREATE INDEX ae_event_idx     ON analytics_events(event_type, created_at DESC);
-- Partition by month in production
```

**Retention:** Purge raw events older than 2 years. Aggregate into `analytics_rollups` after 90 days.

---

### 1.21 `feature_flags`
```sql
CREATE TABLE feature_flags (
  key         text PRIMARY KEY,
  enabled     boolean NOT NULL DEFAULT false,
  rollout_pct int     NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

**Seed (key flags):**
```sql
INSERT INTO feature_flags(key, enabled, rollout_pct, description) VALUES
  ('gps_proof_engine',         false, 0,   'GPS-gated job start/complete + breadcrumbs'),
  ('stripe_preauth',           true,  100, 'Stripe pre-auth before match confirmation'),
  ('fraud_auto_suspend',       false, 0,   'Auto-suspend at fraud_score >= 0.80'),
  ('dispute_auto_resolve',     false, 0,   'Auto-resolve Tier 1 disputes via GPS proof'),
  ('kyc_level_2_required',     false, 0,   'Require KYC L2 for jobs > $500'),
  ('leaderboard_public',       true,  100, 'Public leaderboard on directory'),
  ('sms_escalation',           false, 0,   'SMS fallback after 2 missed push (6-condition gate)'),
  ('quebec_bilingual',         false, 0,   'French content for QC jurisdictions'),
  ('bridge_alerts',            false, 0,   'Bridge height/weight restriction alerts'),
  ('predictive_enforcement',   false, 0,   'Predictive enforcement alert engine'),
  ('b2b_data_api',             false, 0,   'B2B hazard feed API (enterprise)'),
  ('aso_optimized_listings',   false, 0,   'App Store ASO content injection');
```

---

## Part 2 — Edge Functions Inventory

| # | Function Name | Trigger | Description | Status |
|---|--------------|---------|-------------|--------|
| 1 | `match-generate` | DB trigger / manual | Run MatchEngine for new offer | DEPLOYED |
| 2 | `payments-preauth` | Job assigned | Stripe pre-auth hold on broker | DEPLOYED |
| 3 | `payments-capture` | GPS job complete | Capture pre-auth, payout driver | DEPLOYED |
| 4 | `stripe-webhook` | Stripe event | Handle payment events idempotently | DEPLOYED |
| 5 | `compliance-match-preview` | On-demand | Compliance check before offer goes live | DEPLOYED |
| 6 | `compliance-reminders-run` | Cron daily | Scan expiring docs, queue notifications | DEPLOYED |
| 7 | `compliance-snapshot-generate` | Cron weekly | Snapshot compliance scores per driver | DEPLOYED |
| 8 | `hazard-score-rollup` | Cron hourly | Aggregate hazard reports → area risk score | DEPLOYED |
| 9 | `leaderboard-snapshot-hourly` | Cron hourly | Update leaderboard rankings | DEPLOYED |
| 10 | `broker-score-recompute` | Cron daily | Recompute broker_trust_profiles | DEPLOYED |
| 11 | `driver-presence-update` | Mobile ping | Update driver AVAILABLE/OFFLINE status | DEPLOYED |
| 12 | `reviews-log` | Post-job | Write verified review, recompute trust_score | DEPLOYED |
| 13 | `rate-index-recompute` | Cron weekly | Recompute market rate index by corridor | DEPLOYED |
| 14 | `referrals-redeem` | On-demand | Process referral code redemption | DEPLOYED |
| 15 | `installs-track` | On app install | Track install source for ASO/growth | DEPLOYED |
| 16 | `directory-claim-submit` | On-demand | Handle provider claim request | DEPLOYED |
| 17 | `deeplink-redirect` | HTTP GET | Handle deep links (mobile → web fallback) | DEPLOYED |
| 18 | `deadhead-estimate` | On-demand | Estimate deadhead miles for match scoring | DEPLOYED |
| 19 | `docs-init-upload` | On-demand | Initiate KYC document upload (presigned URL) | DEPLOYED |
| 20 | `admin-set-setting` | Admin only | Update feature_flags or system settings | DEPLOYED |
| 21 | `jobs-create-from-offer` | DB trigger | Atomically create job from accepted match | DEPLOYED |
| 22 | `dispute-auto-resolve` | Cron / DB trigger | Tier 1 GPS-match auto-resolution | **PENDING** |
| 23 | `fraud-score-recompute` | Cron 6h | Recompute fraud_signals for active users | **PENDING** |
| 24 | `trust-score-recompute` | Cron daily | Recompute driver_trust_scores | **PENDING** |
| 25 | `gps-breadcrumb-ingest` | Mobile stream | Batch-insert GPS breadcrumbs | **PENDING** |
| 26 | `kyc-step-up-trigger` | DB trigger | Fire KYC step-up when threshold crossed | **PENDING** |
| 27 | `notification-dispatch` | DB trigger | Route notification_events → FCM/SMS | **PENDING** |

---

## Part 3 — Cron Schedule

| Frequency | Function | Purpose |
|-----------|----------|---------|
| Every 5 min | `driver-presence-update` (passive) | TTL check — mark OFFLINE if no ping 10 min |
| Every hour | `leaderboard-snapshot-hourly` | Rank update |
| Every hour | `hazard-score-rollup` | Area risk aggregation |
| Every 6h | `fraud-score-recompute` | Rolling window fraud signals |
| Every day | `compliance-reminders-run` | Expiring doc warnings |
| Every day | `broker-score-recompute` | Broker trust profile update |
| Every day | `trust-score-recompute` | Driver trust score update |
| Every day | `idempotency_keys` purge | DELETE WHERE expires_at < now() |
| Every day | `dispute-auto-resolve` | Escalate stale Tier 1 disputes (48h gate) |
| Every week | `compliance-snapshot-generate` | Weekly snapshot archive |
| Every week | `rate-index-recompute` | Market rate index |
| Every month | `leaderboard-snapshot-hourly` (MONTHLY) | Monthly rank snapshot |
| Every 90 days | `gps_breadcrumbs` purge | DELETE WHERE recorded_at < now()-90d |
| Every year | `analytics_events` purge | Aggregate + delete raw events > 2 years |

---

## Part 4 — Pending Migrations

These migrations must be written and applied in order:

| # | File | Contents |
|---|------|----------|
| 0026 | `0026_notification_events.sql` | `notification_events` table + RLS + realtime |
| 0027 | `0027_idempotency_keys.sql` | `idempotency_keys` table + purge function |
| 0028 | `0028_fraud_signals.sql` | `fraud_signals` table + RLS |
| 0029 | `0029_broker_trust_profiles.sql` | `broker_trust_profiles` table + RLS |
| 0030 | `0030_driver_trust_scores_v2.sql` | Add `clean_run_score` column to `driver_trust_scores` |
| 0031 | `0031_kyc_verifications.sql` | `kyc_verifications` table + step-up triggers |
| 0032 | `0032_disputes_v2.sql` | Add `tier`, `escalate_at`, `auto_resolved` to disputes |
| 0033 | `0033_gps_breadcrumbs.sql` | `gps_breadcrumbs` table + retention policy |
| 0034 | `0034_jobs_gps_fields.sql` | Add GPS proof columns to `jobs` |
| 0035 | `0035_feature_flags_seed.sql` | Insert all 12 feature flags |
| 0036 | `0036_compliance_rules_fr.sql` | Add `description_fr` column to compliance_rules |
| 0037 | `0037_reciprocity_matrix.sql` | `reciprocity_matrix` table + seed |

---

## Part 5 — Public Safe Views (anon accessible)

```sql
-- Used by SEO pages — NO PII
CREATE VIEW public_directory_seo AS
  SELECT id, slug, display_name, state, city,
         service_tags, coverage_status, verified
  FROM provider_directory;

-- Used by leaderboard page
CREATE VIEW public_leaderboard AS
  SELECT ls.rank, ls.tier_label, ls.score, ls.period,
         p.display_name
  FROM leaderboard_snapshots ls
  JOIN profiles p ON p.id = ls.driver_id
  WHERE ls.period = 'WEEKLY'
  ORDER BY ls.rank ASC
  LIMIT 100;

-- Used by compliance page
CREATE VIEW public_compliance_summary AS
  SELECT jurisdiction, rule_type, description, source_quality
  FROM compliance_rules
  WHERE source_quality IN ('OFFICIAL','SECONDARY')
  ORDER BY jurisdiction, rule_type;
```

---

*Last updated: 2026-02-18 — Derived from ANTI_GRAVITY.md v5.0*
