-- ============================================================================
-- Haul Command Load Board Intelligence — Combined Migration
-- Safely creates all required tables (IF NOT EXISTS)
-- Handles missing identities table by skipping FK reference
-- ============================================================================

-- ── 1. Ingestion Batches ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lb_ingestion_batches (
    id              TEXT PRIMARY KEY,
    raw_text        TEXT NOT NULL,
    text_hash       TEXT NOT NULL,
    source_name     TEXT,
    source_type     TEXT NOT NULL DEFAULT 'unknown',
    country_hint    TEXT,
    supplied_date   DATE,
    ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    line_count      INTEGER NOT NULL DEFAULT 0,
    parsed_count    INTEGER NOT NULL DEFAULT 0,
    partial_count   INTEGER NOT NULL DEFAULT 0,
    unparsed_count  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_lb_batches_hash ON lb_ingestion_batches (text_hash);
CREATE INDEX IF NOT EXISTS idx_lb_batches_ingested ON lb_ingestion_batches (ingested_at);

-- ── 2. Load Board Observations ──────────────────────────────────

CREATE TABLE IF NOT EXISTS lb_observations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id                TEXT NOT NULL REFERENCES lb_ingestion_batches(id),
    raw_line                TEXT NOT NULL,
    observed_date           DATE,
    observed_date_uncertain BOOLEAN DEFAULT TRUE,
    source_name             TEXT,
    source_type             TEXT NOT NULL DEFAULT 'unknown',
    source_format           TEXT DEFAULT 'unknown',
    parsed_name_or_company  TEXT,
    raw_phone               TEXT,
    normalized_phone        TEXT,
    phone_is_placeholder    BOOLEAN DEFAULT FALSE,
    origin_raw              TEXT,
    destination_raw         TEXT,
    origin_city             TEXT,
    origin_admin_division   TEXT,
    destination_city        TEXT,
    destination_admin_division TEXT,
    country_code            TEXT,
    corridor_key            TEXT,
    route_family_key        TEXT,
    service_type            TEXT NOT NULL DEFAULT 'unknown',
    urgency                 TEXT NOT NULL DEFAULT 'unspecified',
    payment_terms           TEXT NOT NULL DEFAULT 'unspecified',
    role_candidates         JSONB DEFAULT '[]',
    special_requirements    TEXT[] DEFAULT '{}',
    quoted_amount           NUMERIC(10,2),
    quoted_currency         TEXT DEFAULT 'USD',
    quoted_miles            INTEGER,
    derived_pay_per_mile    NUMERIC(6,2),
    pricing_confidence      NUMERIC(3,2) DEFAULT 0,
    tags                    JSONB DEFAULT '{}',
    truncation_flag         BOOLEAN DEFAULT FALSE,
    parse_confidence        NUMERIC(3,2) DEFAULT 0,
    board_activity_flag     BOOLEAN DEFAULT TRUE,
    availability_assumption TEXT DEFAULT 'likely_not_available',
    volume_signal_weight    NUMERIC(3,2) DEFAULT 0,
    same_actor_repeat       BOOLEAN DEFAULT FALSE,
    same_route_repeat       BOOLEAN DEFAULT FALSE,
    timed_post_flag         BOOLEAN DEFAULT FALSE,
    fast_cover_signal       NUMERIC(3,2) DEFAULT 0,
    is_seed_data            BOOLEAN DEFAULT TRUE,
    ingested_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lb_obs_batch ON lb_observations (batch_id);
CREATE INDEX IF NOT EXISTS idx_lb_obs_phone ON lb_observations (normalized_phone);
CREATE INDEX IF NOT EXISTS idx_lb_obs_name ON lb_observations (parsed_name_or_company);
CREATE INDEX IF NOT EXISTS idx_lb_obs_corridor ON lb_observations (corridor_key);
CREATE INDEX IF NOT EXISTS idx_lb_obs_format ON lb_observations (source_format);

-- ── 3. Organizations ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lb_organizations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_name      TEXT NOT NULL UNIQUE,
    display_name        TEXT NOT NULL,
    aliases             TEXT[] DEFAULT '{}',
    phones              TEXT[] DEFAULT '{}',
    role_candidates     JSONB DEFAULT '[]',
    country_codes       TEXT[] DEFAULT '{}',
    corridors_seen      TEXT[] DEFAULT '{}',
    observation_count   INTEGER DEFAULT 0,
    recurrence_score    INTEGER DEFAULT 0,
    entity_confidence   NUMERIC(3,2) DEFAULT 0,
    claim_priority      NUMERIC(3,2) DEFAULT 0,
    monetization_value  NUMERIC(3,2) DEFAULT 0,
    internal_risk       NUMERIC(3,2) DEFAULT 0,
    data_completeness   NUMERIC(3,2) DEFAULT 0,
    public_display_ok   BOOLEAN DEFAULT FALSE,
    linked_identity_id  UUID,
    first_seen          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lb_orgs_canonical ON lb_organizations (canonical_name);
CREATE INDEX IF NOT EXISTS idx_lb_orgs_phones ON lb_organizations USING GIN (phones);

-- ── 4. Phones ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lb_phones (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    normalized_phone    TEXT NOT NULL UNIQUE,
    raw_phone           TEXT,
    is_placeholder      BOOLEAN DEFAULT FALSE,
    linked_names        TEXT[] DEFAULT '{}',
    linked_org_ids      UUID[] DEFAULT '{}',
    observation_count   INTEGER DEFAULT 0,
    first_seen          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lb_phones_norm ON lb_phones (normalized_phone);

-- ── 5. Aliases ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lb_aliases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_variant     TEXT NOT NULL,
    canonical_candidate TEXT NOT NULL,
    linked_phone        TEXT,
    linked_org_id       UUID,
    source_batch_id     TEXT REFERENCES lb_ingestion_batches(id),
    observed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lb_aliases_canonical ON lb_aliases (canonical_candidate);

-- ── 6. Corridors ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lb_corridors (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_key                TEXT NOT NULL UNIQUE,
    origin_admin_division       TEXT NOT NULL,
    destination_admin_division  TEXT NOT NULL,
    country_code                TEXT,
    route_family_key            TEXT,
    observation_count           INTEGER DEFAULT 0,
    service_types_seen          TEXT[] DEFAULT '{}',
    actor_count                 INTEGER DEFAULT 0,
    urgency_density             NUMERIC(3,2) DEFAULT 0,
    avg_price                   NUMERIC(10,2),
    price_observations          INTEGER DEFAULT 0,
    corridor_strength           NUMERIC(3,2) DEFAULT 0,
    volume_score                NUMERIC(3,2) DEFAULT 0,
    fast_cover_score            NUMERIC(3,2) DEFAULT 0,
    board_velocity              NUMERIC(3,2) DEFAULT 0,
    linked_corridor_id          UUID,
    first_seen                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lb_corridors_key ON lb_corridors (corridor_key);

-- ── 7. Reputation Observations ──────────────────────────────────

CREATE TABLE IF NOT EXISTS lb_reputation_observations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id            TEXT NOT NULL REFERENCES lb_ingestion_batches(id),
    raw_text            TEXT NOT NULL,
    target_name         TEXT,
    target_phone        TEXT,
    signal_type         TEXT NOT NULL DEFAULT 'caution',
    evidence_strength   TEXT NOT NULL DEFAULT 'single_mention',
    visibility          TEXT NOT NULL DEFAULT 'internal_only',
    repetition_count    INTEGER DEFAULT 1,
    corroboration_count INTEGER DEFAULT 0,
    confidence          NUMERIC(3,2) DEFAULT 0,
    source_quality      TEXT DEFAULT 'medium',
    ingested_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 8. Daily Volume ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lb_daily_volume (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date            DATE NOT NULL,
    country_code    TEXT,
    total_obs       INTEGER DEFAULT 0,
    by_service_type JSONB DEFAULT '{}',
    by_admin        JSONB DEFAULT '{}',
    urgent_count    INTEGER DEFAULT 0,
    price_obs_count INTEGER DEFAULT 0,
    repeat_actors   INTEGER DEFAULT 0,
    board_velocity  NUMERIC(3,2) DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (date, country_code)
);

-- ── 9. Contacts ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lb_contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_name  TEXT NOT NULL,
    display_name    TEXT NOT NULL,
    aliases         TEXT[] DEFAULT '{}',
    phones          TEXT[] DEFAULT '{}',
    linked_org_id   UUID,
    first_seen      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 10. Claim Queue ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lb_claim_queue (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID,
    org_name            TEXT NOT NULL,
    priority_score      NUMERIC(3,2) DEFAULT 0,
    reason              TEXT,
    status              TEXT DEFAULT 'pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 11. Broker Surfaces ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS broker_surfaces (
    broker_surface_id           TEXT PRIMARY KEY,
    canonical_display_name      TEXT NOT NULL,
    canonical_company_candidate TEXT,
    primary_phone               TEXT,
    additional_phones           TEXT[] DEFAULT '{}',
    alias_cluster_ids           TEXT[] DEFAULT '{}',
    linked_identity_id          UUID,
    verification_status         TEXT DEFAULT 'unverified',
    acquisition_status          TEXT DEFAULT 'seeded',
    activation_priority_score   NUMERIC(5,4) DEFAULT 0,
    claim_priority_score        NUMERIC(5,4) DEFAULT 0,
    outreach_priority_score     NUMERIC(5,4) DEFAULT 0,
    growth_target_flag          BOOLEAN DEFAULT FALSE,
    first_seen_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    observed_corridors          TEXT[] DEFAULT '{}',
    observed_route_families     TEXT[] DEFAULT '{}',
    observed_service_types      TEXT[] DEFAULT '{}',
    observed_price_points       NUMERIC[] DEFAULT '{}',
    observed_urgency_patterns   TEXT[] DEFAULT '{}',
    observed_payment_patterns   TEXT[] DEFAULT '{}',
    recurrence_score            NUMERIC(5,4) DEFAULT 0,
    corridor_strength_score     NUMERIC(5,4) DEFAULT 0,
    internal_risk_score         NUMERIC(5,4) DEFAULT 0,
    warning_cluster_count       INTEGER DEFAULT 0,
    internal_notes_only         BOOLEAN DEFAULT TRUE,
    countries_seen              TEXT[] DEFAULT '{}',
    admin_divisions_seen        TEXT[] DEFAULT '{}',
    origin_locations_seen       TEXT[] DEFAULT '{}',
    destination_locations_seen  TEXT[] DEFAULT '{}',
    profile_slug                TEXT,
    public_surface_eligibility  BOOLEAN DEFAULT FALSE,
    claimable_surface_flag      BOOLEAN DEFAULT FALSE,
    internal_seed_flag          BOOLEAN DEFAULT TRUE,
    monetization_value_score    NUMERIC(5,4) DEFAULT 0,
    source_batch_id             TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broker_surfaces_phone ON broker_surfaces (primary_phone);
CREATE INDEX IF NOT EXISTS idx_broker_surfaces_status ON broker_surfaces (acquisition_status);
CREATE INDEX IF NOT EXISTS idx_broker_surfaces_activation ON broker_surfaces (activation_priority_score DESC);

-- ── 12. Activation Queue ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS broker_surface_activation_queue (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_surface_id       TEXT NOT NULL REFERENCES broker_surfaces(broker_surface_id),
    bucket                  TEXT NOT NULL,
    score                   NUMERIC(5,4) DEFAULT 0,
    reason                  TEXT,
    source_batch_id         TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bsaq_bucket ON broker_surface_activation_queue (bucket);
CREATE INDEX IF NOT EXISTS idx_bsaq_score ON broker_surface_activation_queue (score DESC);

-- ── RLS ─────────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE lb_ingestion_batches ENABLE ROW LEVEL SECURITY;
  ALTER TABLE lb_observations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE lb_organizations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE lb_phones ENABLE ROW LEVEL SECURITY;
  ALTER TABLE lb_aliases ENABLE ROW LEVEL SECURITY;
  ALTER TABLE lb_corridors ENABLE ROW LEVEL SECURITY;
  ALTER TABLE lb_claim_queue ENABLE ROW LEVEL SECURITY;
  ALTER TABLE broker_surfaces ENABLE ROW LEVEL SECURITY;
  ALTER TABLE broker_surface_activation_queue ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Allow service role and anon insert (needed for ingestion)
DO $$ BEGIN
  CREATE POLICY "Allow insert lb_ingestion_batches" ON lb_ingestion_batches FOR INSERT WITH CHECK (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow select lb_ingestion_batches" ON lb_ingestion_batches FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow insert lb_observations" ON lb_observations FOR INSERT WITH CHECK (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN  
  CREATE POLICY "Allow select lb_observations" ON lb_observations FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all lb_organizations" ON lb_organizations FOR ALL USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all lb_phones" ON lb_phones FOR ALL USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all lb_aliases" ON lb_aliases FOR ALL USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all lb_corridors" ON lb_corridors FOR ALL USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all lb_claim_queue" ON lb_claim_queue FOR ALL USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all lb_daily_volume" ON lb_daily_volume FOR ALL USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all lb_reputation_observations" ON lb_reputation_observations FOR ALL USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all broker_surfaces" ON broker_surfaces FOR ALL USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all broker_surface_activation_queue" ON broker_surface_activation_queue FOR ALL USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
