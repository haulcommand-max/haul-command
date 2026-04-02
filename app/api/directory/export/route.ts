import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { evaluatePaywall } from '@/lib/data/paywall-engine';

export const dynamic = 'force-dynamic';

/**
 * POST /api/directory/export — Bulk export directory listings (paywall-gated).
 *
 * Money OS wiring:
 * - Checks evaluatePaywall('bulk_export') before returning data
 * - Returns CSV-ready JSON for qualifying subscribers
 * - Free users get paywall verdict with upgrade path
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, countryCode, state, format } = await req.json();

    // 1. Paywall check — bulk_export is a premium feature
    const verdict = await evaluatePaywall(userId || null, 'bulk_export', countryCode);

    if (!verdict.allowed) {
      return NextResponse.json({
        error: 'premium_feature',
        message: 'Bulk export requires a Pro or Enterprise subscription',
        paywall: {
          reason: verdict.reason,
          upgrade_url: verdict.upgrade_url || '/pricing',
          price_hint: verdict.price_hint,
          trial_remaining_days: verdict.trial_remaining_days,
        },
      }, { status: 403 });
    }

    // 2. Paywall passed — query listings
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('hc_global_operators')
      .select('name, city, admin1_code, country_code, role_primary, confidence_score, is_claimed')
      .order('confidence_score', { ascending: false })
      .limit(1000);

    if (countryCode) query = query.eq('country_code', countryCode.toUpperCase());
    if (state) query = query.eq('admin1_code', state.toUpperCase());

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Log export event for analytics
    try {
      await supabase.from('intake_events').insert({
        channel_id: null,
        raw_payload: { type: 'bulk_export', country: countryCode, state, format, row_count: data?.length },
        sender_entity_id: userId,
        intake_status: 'composed',
        priority: 'normal',
        metadata: { source: 'directory_export' },
      });
    } catch { /* non-fatal */ }

    return NextResponse.json({
      success: true,
      format: format || 'json',
      total: data?.length || 0,
      listings: data || [],
    }, {
      headers: {
        'Content-Disposition': `attachment; filename="haul-command-export-${countryCode || 'all'}.json"`,
      },
    });

  } catch (err: any) {
    console.error('[DIRECTORY_EXPORT_ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
