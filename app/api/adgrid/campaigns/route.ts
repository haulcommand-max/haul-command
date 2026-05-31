import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  createCanonicalAdgridCampaign,
  createCanonicalAdgridCreative,
  ensureCanonicalAdgridAdvertiser,
} from '@/lib/monetization/adgrid-campaigns'

export async function POST(req: NextRequest) {
  try {
    const { advertiser, goal, targeting, creative, budget } = await req.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const admin = getSupabaseAdmin()

    if (!advertiser?.company_name || !advertiser?.contact_email) {
      return NextResponse.json(
        { ok: false, error: 'advertiser.company_name and advertiser.contact_email required' },
        { status: 400 },
      )
    }

    const countries = [targeting?.target_country, ...(targeting?.target_countries ?? [])].filter(Boolean)
    const placements = targeting?.placements ?? targeting?.target_categories ?? []
    const corridors = targeting?.target_corridors ?? []

    const adv = await ensureCanonicalAdgridAdvertiser(admin, {
      companyName: advertiser.company_name,
      contactEmail: advertiser.contact_email,
      contactPhone: advertiser.contact_phone,
      userId: user?.id ?? null,
    })

    const campaign = await createCanonicalAdgridCampaign(admin, {
      advertiserId: adv.id,
      advertiserName: advertiser.company_name,
      name: goal?.campaign_name || `${advertiser.company_name} AdGrid campaign`,
      campaignType: goal?.campaign_type || 'sponsored_listing',
      status: 'pending_review',
      billingModel: budget?.billing_model || 'cpc',
      bidCents: budget?.bid_cents ?? null,
      dailyBudgetCents: budget?.daily_budget_cents ?? null,
      totalBudgetCents: budget?.total_budget_cents ?? null,
      countries,
      corridors,
      placements,
      targeting: {
        target_states: targeting?.target_states ?? [],
        target_cities: targeting?.target_cities ?? [],
        target_categories: targeting?.target_categories ?? [],
        created_by_user_id: user?.id ?? null,
      },
      startsAt: budget?.starts_at ?? null,
      endsAt: budget?.ends_at ?? null,
    })

    const creativeResult = await createCanonicalAdgridCreative(admin, {
      campaignId: campaign.campaignId,
      advertiserId: adv.id,
      advertiserName: advertiser.company_name,
      headline: creative?.headline,
      body: creative?.body,
      description: creative?.description,
      ctaLabel: creative?.cta_label,
      ctaText: creative?.cta_text,
      ctaUrl: creative?.cta_url,
      pageTypes: placements,
      countrySlugs: countries,
      corridorSlugs: corridors,
      serviceSlugs: targeting?.target_categories ?? [],
      startsAt: budget?.starts_at ?? null,
      endsAt: budget?.ends_at ?? null,
    })

    return NextResponse.json({
      ok: true,
      campaign_id: campaign.campaignId,
      creative_id: creativeResult.creativeId,
      advertiser_id: adv.id,
      message: 'Campaign created. Pending review - typically approved within 2 hours.',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create campaign'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
