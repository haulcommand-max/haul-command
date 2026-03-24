/**
 * GET  /api/adgrid/admin-stats   — revenue + impression stats for admin dashboard
 * 
 * GET  /api/adgrid/admin-campaigns — list all campaigns
 * PATCH /api/adgrid/admin-campaigns — update campaign status
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createClient();

  // Campaigns with spend rollup
  const { data: campaigns } = await supabase
    .from('ad_campaigns')
    .select(`
      id, name, status, plan_type, plan_monthly_fee, spend_to_date,
      start_date, created_at,
      ad_advertisers!inner(company_name, contact_email)
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  // Impression/click totals per placement
  const { data: placementStats } = await supabase
    .from('hc_ad_events')
    .select('surface, event_type')
    .limit(50000);

  // Aggregate by placement
  const placementMap: Record<string, { impressions: number; clicks: number }> = {};
  for (const ev of (placementStats || [])) {
    if (!placementMap[ev.surface]) placementMap[ev.surface] = { impressions: 0, clicks: 0 };
    if (ev.event_type === 'impression') placementMap[ev.surface].impressions++;
    if (ev.event_type === 'click')      placementMap[ev.surface].clicks++;
  }
  const topPlacements = Object.entries(placementMap).map(([placement, p]) => ({
    placement,
    impressions: p.impressions,
    clicks: p.clicks,
    ctr: p.impressions ? p.clicks / p.impressions : 0,
  })).sort((a, b) => b.impressions - a.impressions).slice(0, 6);

  // Flatten campaigns for response
  const flatCampaigns = (campaigns || []).map((c: Record<string, unknown>) => ({
    ...c,
    company_name: (c.ad_advertisers as { company_name: string } | null)?.company_name || '',
    impressions: 0, // TODO: join with ad_events aggregates
    clicks: 0,
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

  const supabase = await createClient();

  const { error } = await supabase
    .from('ad_campaigns')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', campaign_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If approving, also approve the pending creatives
  if (status === 'active') {
    await supabase.from('ad_creatives').update({ status: 'approved' }).eq('campaign_id', campaign_id).eq('status', 'pending');
  }

  return NextResponse.json({ ok: true });
}
