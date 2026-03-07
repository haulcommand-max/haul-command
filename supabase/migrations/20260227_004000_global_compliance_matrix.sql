-- ============================================================
-- HAUL COMMAND — Global Compliance Matrix
-- Spec: Revenue & Compliance Hardening Pack v1.0.0
-- Date: 2026-02-27
-- ============================================================
-- Tables: country_call_rules, data_residency_rules,
--         marketplace_liability_profile
-- Purpose: Jurisdiction-aware automation safety layer
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. COUNTRY CALL RULES — VAPI hard-stop compliance
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS country_call_rules (
    country_code        TEXT PRIMARY KEY,
    country_name        TEXT NOT NULL,

    -- Dialing rules
    autodial_allowed    BOOLEAN DEFAULT FALSE,
    consent_required    BOOLEAN DEFAULT TRUE,
    recording_disclosure_required BOOLEAN DEFAULT TRUE,

    -- Quiet hours (local time)
    quiet_hours_start   SMALLINT DEFAULT 21,   -- 9 PM
    quiet_hours_end     SMALLINT DEFAULT 8,    -- 8 AM

    -- Frequency caps
    max_attempts_per_30d INTEGER DEFAULT 6,
    cooling_window_hours INTEGER DEFAULT 72,

    -- SMS rules
    sms_allowed         BOOLEAN DEFAULT FALSE,
    sms_consent_required BOOLEAN DEFAULT TRUE,

    -- Risk classification
    risk_tier           TEXT DEFAULT 'medium'
                        CHECK (risk_tier IN ('low','medium','high')),

    last_reviewed_at    TIMESTAMPTZ DEFAULT now(),
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 2. DATA RESIDENCY RULES — GDPR / privacy compliance
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS data_residency_rules (
    country_code        TEXT PRIMARY KEY,

    requires_local_storage    BOOLEAN DEFAULT FALSE,
    requires_consent_logging  BOOLEAN DEFAULT TRUE,
    requires_deletion_sla_days INTEGER DEFAULT 30,

    cross_border_transfer_restricted BOOLEAN DEFAULT FALSE,
    legal_basis_required      BOOLEAN DEFAULT TRUE,

    -- GDPR / data protection act references
    governing_law_ref   TEXT,
    dpa_authority_name  TEXT,

    last_reviewed_at    TIMESTAMPTZ DEFAULT now(),
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 3. MARKETPLACE LIABILITY PROFILE — Legal posture per country
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_liability_profile (
    country_code        TEXT PRIMARY KEY,

    intermediary_safe_harbor     BOOLEAN DEFAULT TRUE,
    requires_operator_independence BOOLEAN DEFAULT TRUE,
    requires_ranking_transparency BOOLEAN DEFAULT TRUE,
    dispute_mediation_required   BOOLEAN DEFAULT FALSE,

    -- Auto-dispatch is ALWAYS false (facilitator only)
    auto_dispatch_forbidden      BOOLEAN DEFAULT TRUE,

    risk_tier           TEXT DEFAULT 'medium'
                        CHECK (risk_tier IN ('low','medium','high')),

    last_reviewed_at    TIMESTAMPTZ DEFAULT now(),
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────────────────────────

ALTER TABLE country_call_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_residency_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_liability_profile ENABLE ROW LEVEL SECURITY;

-- Service role only for writes
CREATE POLICY "service_write_call_rules"
    ON country_call_rules FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "service_write_residency"
    ON data_residency_rules FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "service_write_liability"
    ON marketplace_liability_profile FOR ALL
    USING (auth.role() = 'service_role');

-- Public read (non-sensitive config)
CREATE POLICY "public_read_call_rules"
    ON country_call_rules FOR SELECT USING (true);

CREATE POLICY "public_read_residency"
    ON data_residency_rules FOR SELECT USING (true);

CREATE POLICY "public_read_liability"
    ON marketplace_liability_profile FOR SELECT USING (true);
