/**
 * GET /api/adgrid/admin-stats
 * Revenue stats for admin ads dashboard
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from('ad_campaigns')
    .select('status, plan_monthly_fee, spend_to_date')
    .in('status', ['active', 'pending_review', 'paused']);

  const { data: events } = await supabase
    .from('hc_ad_events')
    .select('event_type, revenue_credit')
    .limit(100000);

  const active = (campaigns || []).filter(c => c.status === 'active');
  const mrr = active.reduce((sum, c) => sum + (c.plan_monthly_fee || 0), 0);
  const total_revenue = (campaigns || []).reduce((sum, c) => sum + (c.spend_to_date || 0), 0);
  const active_campaigns = active.length;

  const impressions = (events || []).filter(e => e.event_type === 'impression').length;
  const clicks = (events || []).filter(e => e.event_type === 'click').length;
  const avg_ctr = impressions ? clicks / impressions : 0;

  // Simple projection: assume 10% MoM growth
  const projected_monthly = mrr * 1.1;

  return NextResponse.json({
    stats: {
      mrr,
      projected_monthly,
      active_campaigns,
      total_revenue,
      total_impressions: impressions,
      total_clicks: clicks,
      avg_ctr,
    },
  });
}
