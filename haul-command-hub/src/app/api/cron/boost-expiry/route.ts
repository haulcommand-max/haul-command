/**
 * GET /api/cron/boost-expiry
 *
 * Cron job to expire ad boosts that have passed their end_date.
 * Runs every 6 hours via Vercel Cron.
 * Updates status from 'active' to 'expired'.
 */

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sb = supabaseServer();
    const now = new Date().toISOString();

    // Find and expire active boosts past their end_date
    const { data: expired, error: findErr } = await sb
      .from('ad_boosts')
      .select('id, operator_id')
      .eq('status', 'active')
      .lt('end_date', now);

    if (findErr) {
      console.error('[Boost Expiry] Query error:', findErr);
      return NextResponse.json({ error: findErr.message }, { status: 500 });
    }

    if (!expired || expired.length === 0) {
      return NextResponse.json({ message: 'No boosts to expire', expiredCount: 0 });
    }

    // Batch update to expired
    const ids = expired.map(b => b.id);
    const { error: updateErr } = await sb
      .from('ad_boosts')
      .update({ status: 'expired' })
      .in('id', ids);

    if (updateErr) {
      console.error('[Boost Expiry] Update error:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Also expire AdGrid campaigns
    const { data: expiredCampaigns } = await sb
      .from('adgrid_campaigns')
      .select('id')
      .eq('status', 'active')
      .lt('end_date', now);

    if (expiredCampaigns && expiredCampaigns.length > 0) {
      const campaignIds = expiredCampaigns.map(c => c.id);
      await sb.from('adgrid_campaigns').update({ status: 'expired' }).in('id', campaignIds);
    }

    console.log(`✅ [Boost Expiry] Expired ${ids.length} boosts, ${expiredCampaigns?.length ?? 0} campaigns`);

    return NextResponse.json({
      message: 'Expiry complete',
      expiredBoosts: ids.length,
      expiredCampaigns: expiredCampaigns?.length ?? 0,
    });
  } catch (err) {
    console.error('[Boost Expiry] Error:', err);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
