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

  let error: any = null;
  try {
    const res = await supabase.rpc('exec_sql', { sql });
    error = res.error;
  } catch (err: any) {
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
