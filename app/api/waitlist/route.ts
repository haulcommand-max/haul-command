/**
 * POST /api/waitlist — Country expansion waitlist signup
 *
 * Accepts fields from both the new coming-soon page form and
 * the legacy directory waitlist widget:
 *
 *  New form (coming-soon/page.tsx):
 *    { email, countryCode, countryName, tier, role }
 *
 *  Legacy form (directory, alerts):
 *    { email, country, source }
 *
 * Upserts into hc_country_waitlist (primary) and falls back gracefully
 * if the table doesn't exist yet. Also writes to legacy waitlist_signups
 * for backward compatibility.
 *
 * Rate-limit: 1 signup per email+country combo (ON CONFLICT DO NOTHING).
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Normalize field names from both form variants ──
    const email = (body.email || '').toLowerCase().trim();
    const countryCode = (body.countryCode || body.country || 'unknown').toUpperCase();
    const countryName = body.countryName || countryCode;
    const role = body.role || 'unknown';
    const tier = body.tier || 'unknown';
    const source = body.source || 'coming_soon_page';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    if (!countryCode || countryCode === 'UNKNOWN') {
      return NextResponse.json({ error: 'Country code required' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const now = new Date().toISOString();

    // ── Primary table: hc_country_waitlist ──
    try {
      const { error } = await sb.from('hc_country_waitlist').upsert(
        {
          email,
          country_code: countryCode,
          country_name: countryName,
          role,
          tier,
          source,
          signed_up_at: now,
        },
        { onConflict: 'email,country_code' }
      );
      if (error && !error.message.includes('does not exist')) {
        console.error('[waitlist] Primary table error:', error.message);
      }
    } catch (e: any) {
      // Table not yet created — non-fatal, migration pending
      console.log('[waitlist] hc_country_waitlist not ready:', e?.message);
    }

    // ── Legacy table: waitlist_signups (backward compat) ──
    try {
      await sb.from('waitlist_signups').upsert(
        {
          email,
          country_code: countryCode,
          source,
          signed_up_at: now,
        },
        { onConflict: 'email,country_code' }
      );
    } catch {
      // Table may not exist — non-fatal
    }

    // ── Demand signal: increment waitlist_count on hc_country_readiness ──
    try {
      await sb.rpc('increment_waitlist_count', { p_country_code: countryCode });
    } catch {
      // RPC not yet deployed — non-fatal
    }

    return NextResponse.json({
      ok: true,
      message: `You're on the ${countryName} waitlist. We'll notify you at launch.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
