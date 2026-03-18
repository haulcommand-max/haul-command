import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * POST /api/admin/apply-migrations
 * 
 * One-time migration runner. Requires HC_ADMIN_SECRET header.
 * Reads SQL files from supabase/migrations/ and executes them via Supabase SQL.
 * 
 * Uses Supabase service role key to run DDL statements.
 * Delete this file after migration is complete.
 */
export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-secret');
  if (secret !== process.env.HC_ADMIN_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'missing env vars' }, { status: 500 });
  }

  // Migration files in order
  const migrationFiles = [
    '20260318_120100_hc_market_truth_flags.sql',
    '20260318_120200_hc_page_seo_contracts.sql',
    '20260318_120300_hc_sponsor_inventory.sql',
    '20260318_120400_hc_provider_best_public_record.sql',
    '20260318_120500_hc_provider_search_index.sql',
    '20260318_120600_hc_broker_public_profile.sql',
    '20260318_120700_hc_rates_public.sql',
    '20260318_120800_hc_requirements_public.sql',
    '20260318_120900_hc_public_helpers.sql',
  ];

  const results: { file: string; status: string; error?: string }[] = [];

  for (const file of migrationFiles) {
    try {
      const sqlPath = resolve(process.cwd(), 'supabase', 'migrations', file);
      const sql = readFileSync(sqlPath, 'utf8');

      // Split on semicolons and execute each statement
      const statements = sql
        .split(/;\s*$/m)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      const supabase = createClient(url, key, {
        auth: { persistSession: false },
      });

      for (const stmt of statements) {
        // Use rpc to execute SQL
        const { error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });
        if (error) {
          // If exec_sql doesn't exist, we'll note it and try direct
          results.push({ file, status: 'error', error: error.message });
          break;
        }
      }

      if (!results.find(r => r.file === file)) {
        results.push({ file, status: 'success' });
      }
    } catch (e: any) {
      results.push({ file, status: 'error', error: e.message });
    }
  }

  return NextResponse.json({ migrationResults: results });
}
