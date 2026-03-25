/**
 * GET /api/cron/boost-expiry
 *
 * Cron job to expire ad boosts that have passed their expires_at.
 * Runs every 6 hours via Vercel Cron.
 * Updates status from 'active' to 'expired'.
 */

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // ── Auth: only Vercel cron or manual calls with the secret can trigger this ──
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();
  let expiredBoostCount = 0;
  let expiredCampaignCount = 0;

  try {
    const sb = supabaseServer();

    // ── Step 1: Find expired ad_boosts ──────────────────────────────────
    const { data: expired, error: findErr } = await sb
      .from('ad_boosts')
      .select('id, profile_id')
      .eq('status', 'active')
      .lt('expires_at', now);

    if (findErr) {
      console.error('[Boost Expiry] Query error on ad_boosts:', findErr.message, findErr.details);
      return NextResponse.json({ error: 'ad_boosts query failed', details: findErr.message }, { status: 500 });
    }

    if (expired && expired.length > 0) {
      const ids = expired.map(b => b.id);

      // ── Step 2: Bulk expire ────────────────────────────────────────────
      const { error: updateErr } = await sb
        .from('ad_boosts')
        .update({ status: 'expired' })
        .in('id', ids);

      if (updateErr) {
        console.error('[Boost Expiry] Update error on ad_boosts:', updateErr.message);
        return NextResponse.json({ error: 'ad_boosts update failed', details: updateErr.message }, { status: 500 });
      }

      expiredBoostCount = ids.length;

      // ── Step 3: Downgrade operator boost flags (non-fatal) ──────────────
      const profileIds = [...new Set(expired.map(b => b.profile_id).filter(Boolean))];
      if (profileIds.length > 0) {
        const { error: placeErr } = await sb
          .from('hc_places')
          .update({ is_boosted: false, boost_tier: null })
          .in('id', profileIds);

        if (placeErr) {
          console.warn('[Boost Expiry] Operator downgrade warning:', placeErr.message);
        }
      }
    }

    // ── Step 4: Also expire AdGrid campaigns ─────────────────────────────
    const { data: expiredCampaigns, error: campErr } = await sb
      .from('adgrid_campaigns')
      .select('id')
      .eq('status', 'active')
      .lt('end_date', now);

    if (campErr) {
      console.warn('[Boost Expiry] adgrid_campaigns query warning:', campErr.message);
    } else if (expiredCampaigns && expiredCampaigns.length > 0) {
      const campaignIds = expiredCampaigns.map(c => c.id);
      const { error: campUpdateErr } = await sb
        .from('adgrid_campaigns')
        .update({ status: 'expired' })
        .in('id', campaignIds);

      if (campUpdateErr) {
        console.warn('[Boost Expiry] adgrid_campaigns update warning:', campUpdateErr.message);
      } else {
        expiredCampaignCount = campaignIds.length;
      }
    }

    console.log(`✅ [Boost Expiry] Expired ${expiredBoostCount} boosts, ${expiredCampaignCount} campaigns at ${now}`);

    return NextResponse.json({
      message: 'Expiry complete',
      expiredBoosts: expiredBoostCount,
      expiredCampaigns: expiredCampaignCount,
      timestamp: now,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Boost Expiry] Unexpected error:', message);
    return NextResponse.json({ error: 'Unexpected server error', details: message }, { status: 500 });
  }
}
