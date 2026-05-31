/**
 * POST /api/adgrid/campaign-create
 * Self-serve campaign creation from /advertise/dashboard.
 */
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  createCanonicalAdgridCampaign,
  createCanonicalAdgridCreative,
  ensureCanonicalAdgridAdvertiser,
} from '@/lib/monetization/adgrid-campaigns'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      company_name,
      contact_email,
      contact_phone,
      plan_code,
      plan_monthly_fee,
      target_audience_segment,
      placements,
      target_corridors,
      target_states,
      target_countries,
      creative,
    } = body

    if (!company_name || !contact_email || !plan_code) {
      return NextResponse.json({ error: 'company_name, contact_email, plan_code required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const advertiser = await ensureCanonicalAdgridAdvertiser(supabase, {
      companyName: company_name,
      contactEmail: contact_email,
      contactPhone: contact_phone ?? null,
    })

    const dailyBudgetCents = Math.round(Number(plan_monthly_fee || 19) * 100 / 30)
    const campaign = await createCanonicalAdgridCampaign(supabase, {
      advertiserId: advertiser.id,
      advertiserName: company_name,
      name: `${company_name} - ${plan_code}`,
      campaignType: plan_code,
      status: 'pending_review',
      billingModel: 'cpm',
      dailyBudgetCents,
      totalBudgetCents: Math.round(Number(plan_monthly_fee || 19) * 100),
      countries: target_countries ?? [],
      corridors: target_corridors ?? [],
      placements: placements ?? ['load_board'],
      targeting: {
        target_audience_segment: target_audience_segment || 'all',
        target_states: target_states ?? [],
        plan_code,
      },
    })

    let creativeId: string | null = null
    if (creative?.headline || creative?.cta_url) {
      const result = await createCanonicalAdgridCreative(supabase, {
        campaignId: campaign.campaignId,
        advertiserId: advertiser.id,
        advertiserName: company_name,
        headline: creative?.headline,
        body: creative?.body,
        ctaText: creative?.cta_text,
        ctaLabel: creative?.cta_text,
        ctaUrl: creative?.cta_url,
        pageTypes: placements ?? ['load_board'],
        countrySlugs: target_countries ?? [],
        corridorSlugs: target_corridors ?? [],
      })
      creativeId = result.creativeId
    }

    return NextResponse.json({
      ok: true,
      campaign_id: campaign.campaignId,
      creative_id: creativeId,
      advertiser_id: advertiser.id,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not create campaign'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
