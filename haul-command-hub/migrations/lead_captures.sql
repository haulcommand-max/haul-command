-- ═══════════════════════════════════════════════════════════════════════════
-- HaulCommand: lead_captures + waitlist_signups merge migration
-- Run this in Supabase SQL Editor → New Query → Run
-- Merges: lead_captures + waitlist_signups into a unified lead tracking table
-- Strategy: lead_captures is the canonical table; waitlist_signups stays for compat
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create lead_captures as the unified lead table
CREATE TABLE IF NOT EXISTS lead_captures (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL,
    name        TEXT,
    source      TEXT NOT NULL DEFAULT 'unknown',
    -- source values: resource_hub_download | waitlist | directory_cta | glossary_cta
    --                newsletter | claim_cta | rate_guide | certification_guide
    country_code TEXT,
    metadata    JSONB DEFAULT '{}',
    status      TEXT NOT NULL DEFAULT 'new',
    -- status values: new | subscribed | unsubscribed | bounced
    listmonk_id INTEGER,          -- Listmonk subscriber ID after sync
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT lead_captures_email_source_uniq UNIQUE (email, source)
);

-- 2. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_lead_captures_email     ON lead_captures (email);
CREATE INDEX IF NOT EXISTS idx_lead_captures_source    ON lead_captures (source);
CREATE INDEX IF NOT EXISTS idx_lead_captures_created   ON lead_captures (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_captures_status    ON lead_captures (status);

-- 3. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lead_captures_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_captures_updated_at ON lead_captures;
CREATE TRIGGER trg_lead_captures_updated_at
    BEFORE UPDATE ON lead_captures
    FOR EACH ROW EXECUTE FUNCTION update_lead_captures_updated_at();

-- 4. RLS — only service role can insert/update/delete; anon can INSERT only (for lead forms)
ALTER TABLE lead_captures ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "service_role_all"    ON lead_captures;
DROP POLICY IF EXISTS "anon_insert_leads"   ON lead_captures;
DROP POLICY IF EXISTS "auth_read_own_lead"  ON lead_captures;

-- Service role has full access
CREATE POLICY "service_role_all" ON lead_captures
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anonymous can INSERT (lead capture forms work without auth)
CREATE POLICY "anon_insert_leads" ON lead_captures
    FOR INSERT TO anon WITH CHECK (true);

-- Authenticated users can read their own lead record
CREATE POLICY "auth_read_own_lead" ON lead_captures
    FOR SELECT TO authenticated
    USING (email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1));

-- 5. Migrate existing waitlist_signups into lead_captures (idempotent)
INSERT INTO lead_captures (email, source, country_code, metadata, created_at)
SELECT
    LOWER(TRIM(email)),
    'waitlist',
    UPPER(country_code),
    jsonb_build_object('original_source', source),
    COALESCE(signed_up_at, NOW())
FROM waitlist_signups
ON CONFLICT (email, source) DO NOTHING;

-- 6. Create waitlist_signups if it doesn't exist (backward compat)
CREATE TABLE IF NOT EXISTS waitlist_signups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL,
    country_code TEXT,
    source      TEXT,
    signed_up_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT waitlist_signups_email_country_uniq UNIQUE (email, country_code)
);

-- 7. Grant permissions
GRANT SELECT, INSERT ON lead_captures TO anon;
GRANT ALL ON lead_captures TO service_role;
GRANT USAGE ON SEQUENCE lead_captures_id_seq TO anon;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verify: SELECT count(*), source FROM lead_captures GROUP BY source;
-- ═══════════════════════════════════════════════════════════════════════════
