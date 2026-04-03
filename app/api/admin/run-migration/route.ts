/**
 * POST /api/admin/run-migration
 * One-shot DDL runner — applies SQL migrations via Supabase service role.
 * Protected by HC_ADMIN_SECRET header.
 *
 * Usage:
 *   curl -X POST https://haulcommand.com/api/admin/run-migration \
 *     -H "x-admin-secret: $HC_ADMIN_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"migration":"lead_captures"}'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MIGRATIONS: Record<string, string> = {
  lead_captures: `
    CREATE TABLE IF NOT EXISTS lead_captures (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email        TEXT NOT NULL,
      name         TEXT,
      source       TEXT NOT NULL DEFAULT 'unknown',
      country_code TEXT,
      metadata     JSONB DEFAULT '{}',
      status       TEXT NOT NULL DEFAULT 'new',
      listmonk_id  INTEGER,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT lead_captures_email_source_uniq UNIQUE (email, source)
    );

    CREATE INDEX IF NOT EXISTS idx_lead_captures_email   ON lead_captures (email);
    CREATE INDEX IF NOT EXISTS idx_lead_captures_source  ON lead_captures (source);
    CREATE INDEX IF NOT EXISTS idx_lead_captures_created ON lead_captures (created_at DESC);

    CREATE OR REPLACE FUNCTION update_lead_captures_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$;

    DROP TRIGGER IF EXISTS trg_lead_captures_updated_at ON lead_captures;
    CREATE TRIGGER trg_lead_captures_updated_at
      BEFORE UPDATE ON lead_captures
      FOR EACH ROW EXECUTE FUNCTION update_lead_captures_updated_at();

    ALTER TABLE lead_captures ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "service_role_all"  ON lead_captures;
    DROP POLICY IF EXISTS "anon_insert_leads" ON lead_captures;

    CREATE POLICY "service_role_all" ON lead_captures
      FOR ALL TO service_role USING (true) WITH CHECK (true);

    CREATE POLICY "anon_insert_leads" ON lead_captures
      FOR INSERT TO anon WITH CHECK (true);

    GRANT SELECT, INSERT ON lead_captures TO anon;
    GRANT ALL ON lead_captures TO service_role;

    -- Migrate existing waitlist_signups
    INSERT INTO lead_captures (email, source, country_code, metadata, created_at)
    SELECT LOWER(TRIM(email)), 'waitlist', UPPER(country_code),
           jsonb_build_object('original_source', source),
           COALESCE(signed_up_at, NOW())
    FROM waitlist_signups
    ON CONFLICT (email, source) DO NOTHING;
  `,

  country_readiness_engine: `
    -- Autonomous Country Expansion Engine
    -- Tables: hc_country_readiness, hc_country_state_log, hc_claim_pressure_state
    -- States: dormant → prepared → seed → live

    CREATE TABLE IF NOT EXISTS hc_country_readiness (
      country_code TEXT PRIMARY KEY,
      country_name TEXT NOT NULL,
      market_state TEXT NOT NULL DEFAULT 'dormant'
        CHECK (market_state IN ('dormant', 'prepared', 'seed', 'live')),
      previous_state TEXT,
      state_changed_at TIMESTAMPTZ DEFAULT now(),
      supply_depth_score NUMERIC(5,4) DEFAULT 0,
      demand_pull_score NUMERIC(5,4) DEFAULT 0,
      claimable_surface_density_score NUMERIC(5,4) DEFAULT 0,
      law_readiness_score NUMERIC(5,4) DEFAULT 0,
      trust_signal_density_score NUMERIC(5,4) DEFAULT 0,
      monetization_readiness_score NUMERIC(5,4) DEFAULT 0,
      cross_border_leverage_score NUMERIC(5,4) DEFAULT 0,
      localization_strength_score NUMERIC(5,4) DEFAULT 0,
      law_pack_gate BOOLEAN DEFAULT false,
      supply_gate BOOLEAN DEFAULT false,
      demand_gate BOOLEAN DEFAULT false,
      localization_gate BOOLEAN DEFAULT false,
      support_gate BOOLEAN DEFAULT false,
      payments_gate BOOLEAN DEFAULT false,
      trust_gate BOOLEAN DEFAULT false,
      currency_code TEXT DEFAULT 'USD',
      timezone TEXT,
      language_primary TEXT DEFAULT 'en',
      measurement_system TEXT DEFAULT 'imperial'
        CHECK (measurement_system IN ('imperial', 'metric')),
      legal_source_pack JSONB DEFAULT '{}',
      terminology_pack JSONB DEFAULT '{}',
      role_map JSONB DEFAULT '{}',
      first_metros JSONB DEFAULT '[]',
      first_corridors JSONB DEFAULT '[]',
      cross_border_adjacency JSONB DEFAULT '[]',
      entity_hunt_queue JSONB DEFAULT '[]',
      autonomous_freight_score NUMERIC(3,2) DEFAULT 0,
      av_regulatory_maturity TEXT DEFAULT 'none'
        CHECK (av_regulatory_maturity IN ('none','exploring','framework','active','commercial')),
      last_scored_at TIMESTAMPTZ,
      last_promotion_reason TEXT,
      last_demotion_reason TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_country_readiness_state
      ON hc_country_readiness (market_state);

    CREATE TABLE IF NOT EXISTS hc_country_state_log (
      id BIGSERIAL PRIMARY KEY,
      country_code TEXT NOT NULL,
      from_state TEXT NOT NULL,
      to_state TEXT NOT NULL,
      reason TEXT,
      score_snapshot JSONB,
      triggered_by TEXT DEFAULT 'system',
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS hc_claim_pressure_state (
      entity_id TEXT PRIMARY KEY,
      country_code TEXT NOT NULL,
      shell_published_at TIMESTAMPTZ DEFAULT now(),
      pressure_stage INTEGER DEFAULT 0 CHECK (pressure_stage BETWEEN 0 AND 4),
      page_indexed BOOLEAN DEFAULT false,
      organic_impressions INTEGER DEFAULT 0,
      profile_views INTEGER DEFAULT 0,
      nearby_competitor_claims INTEGER DEFAULT 0,
      saved_search_touches INTEGER DEFAULT 0,
      demand_activity_touches INTEGER DEFAULT 0,
      claim_status TEXT DEFAULT 'unclaimed'
        CHECK (claim_status IN ('unclaimed','nudged','invited','claimed','verified')),
      claimed_at TIMESTAMPTZ,
      last_nudge_at TIMESTAMPTZ,
      nudge_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_claim_pressure_stage
      ON hc_claim_pressure_state (pressure_stage, claim_status);
    CREATE INDEX IF NOT EXISTS idx_claim_pressure_country
      ON hc_claim_pressure_state (country_code);

    INSERT INTO hc_country_readiness
      (country_code, country_name, market_state, currency_code, measurement_system, language_primary)
    VALUES
      ('US','United States','live','USD','imperial','en'),
      ('CA','Canada','seed','CAD','metric','en'),
      ('AU','Australia','seed','AUD','metric','en'),
      ('GB','United Kingdom','prepared','GBP','imperial','en'),
      ('NZ','New Zealand','prepared','NZD','metric','en'),
      ('ZA','South Africa','prepared','ZAR','metric','en'),
      ('DE','Germany','prepared','EUR','metric','de'),
      ('NL','Netherlands','prepared','EUR','metric','nl'),
      ('AE','United Arab Emirates','prepared','AED','metric','ar'),
      ('BR','Brazil','prepared','BRL','metric','pt'),
      ('IE','Ireland','dormant','EUR','metric','en'),
      ('SE','Sweden','dormant','SEK','metric','sv'),
      ('NO','Norway','dormant','NOK','metric','nb'),
      ('DK','Denmark','dormant','DKK','metric','da'),
      ('FI','Finland','dormant','EUR','metric','fi'),
      ('BE','Belgium','dormant','EUR','metric','nl'),
      ('AT','Austria','dormant','EUR','metric','de'),
      ('CH','Switzerland','dormant','CHF','metric','de'),
      ('ES','Spain','dormant','EUR','metric','es'),
      ('FR','France','dormant','EUR','metric','fr'),
      ('IT','Italy','dormant','EUR','metric','it'),
      ('PT','Portugal','dormant','EUR','metric','pt'),
      ('SA','Saudi Arabia','dormant','SAR','metric','ar'),
      ('QA','Qatar','dormant','QAR','metric','ar'),
      ('MX','Mexico','dormant','MXN','metric','es'),
      ('SG','Singapore','dormant','SGD','metric','en'),
      ('JP','Japan','dormant','JPY','metric','ja'),
      ('KR','South Korea','dormant','KRW','metric','ko'),
      ('IN','India','dormant','INR','metric','hi'),
      ('MY','Malaysia','dormant','MYR','metric','ms'),
      ('PL','Poland','dormant','PLN','metric','pl'),
      ('CZ','Czech Republic','dormant','CZK','metric','cs'),
      ('TR','Turkey','dormant','TRY','metric','tr'),
      ('CL','Chile','dormant','CLP','metric','es'),
      ('CO','Colombia','dormant','COP','metric','es'),
      ('AR','Argentina','dormant','ARS','metric','es'),
      ('ID','Indonesia','dormant','IDR','metric','id'),
      ('TH','Thailand','dormant','THB','metric','th'),
      ('VN','Vietnam','dormant','VND','metric','vi'),
      ('PH','Philippines','dormant','PHP','metric','en')
    ON CONFLICT (country_code) DO NOTHING;

    UPDATE hc_country_readiness
      SET cross_border_adjacency = '["CA","MX"]'::jsonb
      WHERE country_code = 'US';
    UPDATE hc_country_readiness
      SET cross_border_adjacency = '["US"]'::jsonb
      WHERE country_code = 'CA';
    UPDATE hc_country_readiness
      SET cross_border_adjacency = '["NZ","PG"]'::jsonb
      WHERE country_code = 'AU';

    CREATE OR REPLACE VIEW v_next_country_candidates AS
    SELECT
      country_code, country_name, market_state,
      (0.24*supply_depth_score + 0.20*demand_pull_score
       + 0.14*claimable_surface_density_score + 0.14*law_readiness_score
       + 0.08*trust_signal_density_score + 0.08*monetization_readiness_score
       + 0.06*cross_border_leverage_score + 0.06*localization_strength_score) AS total_score,
      (law_pack_gate AND supply_gate AND demand_gate AND localization_gate
       AND support_gate AND payments_gate AND trust_gate) AS all_gates_passed,
      CASE
        WHEN market_state='dormant' AND law_pack_gate AND localization_gate THEN 'promote_to_prepared'
        WHEN market_state='prepared' AND supply_gate AND demand_gate THEN 'promote_to_seed'
        WHEN market_state='seed' AND law_pack_gate AND supply_gate AND demand_gate
             AND localization_gate AND support_gate AND payments_gate AND trust_gate THEN 'promote_to_live'
        ELSE 'hold'
      END AS recommendation,
      autonomous_freight_score, av_regulatory_maturity, last_scored_at
    FROM hc_country_readiness
    WHERE market_state != 'live'
    ORDER BY total_score DESC;
  `,
};


export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret');
  if (!adminSecret || adminSecret !== process.env.HC_ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { migration } = await req.json().catch(() => ({}));
  const sql = MIGRATIONS[migration as string];

  if (!sql) {
    return NextResponse.json(
      { error: `Unknown migration: "${migration}". Valid: ${Object.keys(MIGRATIONS).join(', ')}` },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  let result: any = null;
  let error: any = null;
  try {
    const _res = await supabase.rpc('exec_sql', { sql });
    result = _res.data;
    error = _res.error;
  } catch (err) {
    error = { message: 'exec_sql RPC not available — run migration manually in Supabase SQL Editor' };
  }

  if (error) {
    // Fallback: attempt direct rest
    console.warn('[migration] exec_sql RPC not available, returning SQL for manual apply');
    return NextResponse.json({
      ok: false,
      manual_required: true,
      sql,
      instructions: 'Paste the SQL field into Supabase Dashboard → SQL Editor → New Query → Run',
    });
  }

  return NextResponse.json({ ok: true, migration, applied_at: new Date().toISOString() });
}
