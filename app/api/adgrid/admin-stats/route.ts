/**
 * GET /api/adgrid/admin-stats
 * Revenue stats for admin ads dashboard
 */
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data: campaigns } = await supabase
    .from('hc_ad_campaigns')
    .select('status, spend_cents, spend_total_cents, daily_budget_cents, budget_daily_cents')
    .in('status', ['active', 'pending_review', 'paused']);

  const { data: events } = await supabase
    .from('hc_adgrid_events')
    .select('event_type, billing_amount_cents')
    .limit(100000);

  const { data: outcomes } = await supabase
    .from('hc_adgrid_outcome_events')
    .select('outcome_value_cents, billed_amount_cents, billing_status')
    .limit(100000);

  const active = (campaigns || []).filter(c => c.status === 'active');
  const mrr = 0;
  const total_revenue = (outcomes || []).reduce(
    (sum, o) => sum + ((o.billed_amount_cents ?? o.outcome_value_cents ?? 0) / 100),
    0,
  );
  const tracked_spend = (campaigns || []).reduce(
    (sum, c) => sum + ((c.spend_cents ?? c.spend_total_cents ?? 0) / 100),
    0,
  );
  const active_campaigns = active.length;

  const impressions = (events || []).filter(e => e.event_type === 'impression').length;
  const clicks = (events || []).filter(e => e.event_type === 'click').length;
  const conversions = (events || []).filter(e => e.event_type === 'conversion').length;
  const avg_ctr = impressions ? clicks / impressions : 0;

  // Simple projection: assume 10% MoM growth
  const projected_monthly = mrr * 1.1;

  return NextResponse.json({
    stats: {
      mrr,
      projected_monthly,
      active_campaigns,
      total_revenue,
      tracked_spend,
      total_impressions: impressions,
      total_clicks: clicks,
      total_conversions: conversions,
      avg_ctr,
    },
  });
}
