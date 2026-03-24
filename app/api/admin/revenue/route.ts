import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET /api/admin/revenue
// Returns comprehensive revenue metrics for the admin dashboard
export async function GET(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret');
  if (adminSecret !== process.env.HC_ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0,0,0,0);

  const [
    permitResult,
    insuranceResult,
    certResult,
    sponsorResult,
    contentResult,
    socialResult,
  ] = await Promise.all([
    // Permit filings this month
    supabase.from('permit_filings')
      .select('amount_cents, status')
      .gte('created_at', monthStart.toISOString()),

    // Insurance referrals
    supabase.from('insurance_referrals')
      .select('commission_amount, converted_at, clicked_at'),

    // Certifications this month
    supabase.from('user_certifications')
      .select('certification_tier, status, completed_at')
      .gte('created_at', monthStart.toISOString()),

    // Active sponsors
    supabase.from('sponsors')
      .select('company_name, placement_type, monthly_fee_cents, impressions, clicks'),

    // Content this month
    supabase.from('blog_posts')
      .select('status, published, word_count, views')
      .gte('created_at', monthStart.toISOString()),

    // Social posts this month
    supabase.from('social_posts')
      .select('platform, status, posted_at, engagement')
      .gte('created_at', monthStart.toISOString()),
  ]);

  // Permit revenue calculation
  const permits = permitResult.data || [];
  const permitRevenue = permits
    .filter(p => p.status === 'filed' || p.status === 'delivered')
    .reduce((sum, p) => sum + (p.amount_cents || 0), 0);
  const permitPending = permits.filter(p => p.status === 'pending' || p.status === 'processing').length;

  // Insurance metrics
  const referrals = insuranceResult.data || [];
  const insuranceRevenue = referrals
    .filter(r => r.commission_amount)
    .reduce((sum, r) => sum + Number(r.commission_amount || 0), 0);
  const insuranceConversions = referrals.filter(r => r.converted_at).length;
  const insuranceClicks = referrals.length;

  // Sponsor revenue
  const sponsors = sponsorResult.data || [];
  const sponsorRevenue = sponsors.reduce((sum, s) => sum + (s.monthly_fee_cents || 0), 0);
  const activeSponsorCount = sponsors.length;

  // Cert revenue (estimate — actual via Stripe)
  const certsByTier = (certResult.data || []).reduce((acc, c) => {
    acc[c.certification_tier] = (acc[c.certification_tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const certRevenue = (certsByTier['hc_certified'] || 0) * 4900
    + (certsByTier['av_ready'] || 0) * 14900
    + (certsByTier['elite'] || 0) * 29900;

  // Content metrics
  const contentItems = contentResult.data || [];
  const publishedThisMonth = contentItems.filter(p => p.published).length;
  const totalViews = contentItems.reduce((sum, p) => sum + (p.views || 0), 0);

  // Social metrics
  const socialItems = socialResult.data || [];
  const postedThisMonth = socialItems.filter(s => s.status === 'posted').length;
  const socialByPlatform = socialItems.reduce((acc, s) => {
    acc[s.platform] = (acc[s.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalRevenueCents = permitRevenue + Math.round(insuranceRevenue * 100) + sponsorRevenue + certRevenue;

  return NextResponse.json({
    as_of: new Date().toISOString(),
    month_start: monthStart.toISOString(),

    summary: {
      total_revenue_cents: totalRevenueCents,
      total_revenue_usd: (totalRevenueCents / 100).toFixed(2),
    },

    permit_filing: {
      revenue_cents: permitRevenue,
      revenue_usd: (permitRevenue / 100).toFixed(2),
      filed_count: permits.filter(p => p.status === 'filed' || p.status === 'delivered').length,
      pending_count: permitPending,
      all_filings: permits.length,
    },

    insurance: {
      clicks: insuranceClicks,
      conversions: insuranceConversions,
      conversion_rate_pct: insuranceClicks ? ((insuranceConversions / insuranceClicks) * 100).toFixed(1) : '0',
      estimated_revenue_usd: insuranceRevenue.toFixed(2),
    },

    certifications: {
      by_tier: certsByTier,
      estimated_revenue_cents: certRevenue,
      estimated_revenue_usd: (certRevenue / 100).toFixed(2),
    },

    sponsors: {
      active_count: activeSponsorCount,
      monthly_revenue_cents: sponsorRevenue,
      monthly_revenue_usd: (sponsorRevenue / 100).toFixed(2),
      sponsors: sponsors.map(s => ({
        company: s.company_name,
        placement: s.placement_type,
        fee_usd: ((s.monthly_fee_cents || 0) / 100).toFixed(2),
        impressions: s.impressions,
        clicks: s.clicks,
        ctr: s.impressions ? ((s.clicks / s.impressions) * 100).toFixed(2) + '%' : '0%',
      })),
    },

    content: {
      published_this_month: publishedThisMonth,
      total_views_this_month: totalViews,
    },

    social: {
      posted_this_month: postedThisMonth,
      by_platform: socialByPlatform,
      draft_count: socialItems.filter(s => s.status === 'draft').length,
      scheduled_count: socialItems.filter(s => s.status === 'scheduled').length,
    },
  });
}
