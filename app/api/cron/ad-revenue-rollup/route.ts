/**
 * POST /api/cron/ad-revenue-rollup
 * Daily cron: rolls up hc_ad_events into ad_revenue_daily
 * Schedule: "0 1 * * *" (1am UTC every day)
 * Auth: CRON_SECRET header (Vercel Cron)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@/utils/supabase/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Roll up yesterday's data by default
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0]; // 'YYYY-MM-DD'

  try {
    const { data, error } = await supabase
      .rpc('fn_rollup_ad_revenue_daily', { p_date: dateStr });

    if (error) throw error;

    // Also update campaign CTR in ad_creatives
    const { data: events } = await supabase
      .from('hc_ad_events')
      .select('creative_id, event_type')
      .gte('created_at', `${dateStr}T00:00:00Z`)
      .lt('created_at', `${new Date(yesterday.getTime() + 86400000).toISOString().split('T')[0]}T00:00:00Z`);

    if (events && events.length > 0) {
      // Group by creative_id
      const creativeStats: Record<string, { impressions: number; clicks: number }> = {};
      for (const ev of events) {
        if (!ev.creative_id) continue;
        if (!creativeStats[ev.creative_id]) creativeStats[ev.creative_id] = { impressions: 0, clicks: 0 };
        if (ev.event_type === 'impression') creativeStats[ev.creative_id].impressions++;
        if (ev.event_type === 'click')      creativeStats[ev.creative_id].clicks++;
      }

      // Update each creative's cumulative stats
      for (const [creative_id, stats] of Object.entries(creativeStats)) {
        const ctr = stats.impressions > 0 ? stats.clicks / stats.impressions : 0;
        await supabase
          .from('ad_creatives')
          .update({
            impressions: supabase.rpc('coalesce_add', { col: 'impressions', val: stats.impressions }),
            clicks:      supabase.rpc('coalesce_add', { col: 'clicks',      val: stats.clicks }),
            ctr:         ctr,
          })
          .eq('id', creative_id);
      }
    }

    console.log('[AdRevenue Rollup] Completed:', data);

    return NextResponse.json({
      ok:   true,
      date: dateStr,
      result: data,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[AdRevenue Rollup] Failed:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// Allow GET for manual trigger from admin
export async function GET(req: NextRequest) {
  // Require admin secret for manual runs
  const adminSecret = process.env.ADMIN_SECRET;
  const provided    = req.headers.get('x-admin-secret');
  if (!adminSecret || provided !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return POST(req);
}
