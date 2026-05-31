/**
 * GET  /api/adgrid/admin-stats   — revenue + impression stats for admin dashboard
 * 
 * GET  /api/adgrid/admin-campaigns — list all campaigns
 * PATCH /api/adgrid/admin-campaigns — update campaign status
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type AdgridCampaignAdminRow = {
  campaign_id: string;
  advertiser_id: string | null;
  name: string | null;
  campaign_type: string | null;
  status: string;
  budget_daily_cents: number | null;
  daily_budget_cents: number | null;
  budget_total_cents: number | null;
  total_budget_cents: number | null;
  spend_total_cents: number | null;
  spend_cents: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export async function GET() {
  const supabase = getSupabaseAdmin();

  // Campaigns with spend rollup
  const { data: campaigns } = await supabase
    .from('hc_ad_campaigns')
    .select(`
      campaign_id, advertiser_id, name, campaign_type, status,
      budget_daily_cents, daily_budget_cents, budget_total_cents, total_budget_cents,
      spend_total_cents, spend_cents, start_date, end_date, created_at
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  // Impression/click totals per placement & per campaign
  const { data: placementStats } = await supabase
    .from('hc_adgrid_events')
    .select('surface, event_type, campaign_id')
    .limit(50000);

  // Aggregate by placement and campaign
  const placementMap: Record<string, { impressions: number; clicks: number }> = {};
  const campaignStats: Record<string, { impressions: number; clicks: number }> = {};

  for (const ev of (placementStats || [])) {
    if (!placementMap[ev.surface]) placementMap[ev.surface] = { impressions: 0, clicks: 0 };
    if (ev.event_type === 'impression') placementMap[ev.surface].impressions++;
    if (ev.event_type === 'click')      placementMap[ev.surface].clicks++;

    if (ev.campaign_id) {
      if (!campaignStats[ev.campaign_id]) campaignStats[ev.campaign_id] = { impressions: 0, clicks: 0 };
      if (ev.event_type === 'impression') campaignStats[ev.campaign_id].impressions++;
      if (ev.event_type === 'click')      campaignStats[ev.campaign_id].clicks++;
    }
  }
  const topPlacements = Object.entries(placementMap).map(([placement, p]) => ({
    placement,
    impressions: p.impressions,
    clicks: p.clicks,
    ctr: p.impressions ? p.clicks / p.impressions : 0,
  })).sort((a, b) => b.impressions - a.impressions).slice(0, 6);

  // Flatten campaigns for response
  const flatCampaigns = ((campaigns || []) as AdgridCampaignAdminRow[]).map((c) => ({
    ...c,
    id: c.campaign_id,
    company_name: '',
    plan_type: c.campaign_type,
    plan_monthly_fee: (c.budget_daily_cents ?? c.daily_budget_cents ?? 0) * 30 / 100,
    spend_to_date: (c.spend_total_cents ?? c.spend_cents ?? 0) / 100,
    impressions: campaignStats[c.campaign_id]?.impressions || 0,
    clicks: campaignStats[c.campaign_id]?.clicks || 0,
  }));

  return NextResponse.json({ campaigns: flatCampaigns, top_placements: topPlacements });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { campaign_id, status } = body;

  const VALID = ['active','paused','pending_review','rejected','completed'];
  if (!campaign_id || !VALID.includes(status)) {
    return NextResponse.json({ error: 'campaign_id and valid status required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('hc_ad_campaigns')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('campaign_id', campaign_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If approving, also approve the pending creatives
  if (status === 'active') {
    await supabase.from('hc_ad_creatives').update({ status: 'approved' }).eq('campaign_id', campaign_id).eq('status', 'pending_review');
  }

  return NextResponse.json({ ok: true });
}
