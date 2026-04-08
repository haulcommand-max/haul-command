-- ============================================================================
-- HAUL COMMAND V3 — Migration Block 001: Extensions, Helper Functions, Enums
-- ============================================================================
-- Prerequisites: none
-- Idempotent: yes (all CREATE IF NOT EXISTS / DO blocks)
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. EXTENSIONS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. HELPER TRIGGER FUNCTION: updated_at
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION hc_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. SHARED ENUMS
-- ══════════════════════════════════════════════════════════════════════════════

-- Status lifecycle for entities, surfaces, content
DO $$ BEGIN
    CREATE TYPE hc_status AS ENUM (
        'draft',
        'pending',
        'active',
        'paused',
        'archived',
        'deleted'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Run status for workflows, skills, sessions
DO $$ BEGIN
    CREATE TYPE hc_run_status AS ENUM (
        'queued',
        'running',
        'succeeded',
        'failed',
        'cancelled',
        'timed_out',
        'skipped'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Entity type classification
DO $$ BEGIN
    CREATE TYPE hc_entity_type AS ENUM (
        'person',
        'company',
        'operator',
        'broker',
        'fleet',
        'agency',
        'port',
        'terminal',
        'corridor',
        'market',
        'vehicle',
        'equipment'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Actor type for audit trails
DO $$ BEGIN
    CREATE TYPE hc_actor_type AS ENUM (
        'user',
        'system',
        'skill',
        'workflow',
        'cron',
        'webhook',
        'browser_grid',
        'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
