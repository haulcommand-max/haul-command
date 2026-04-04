import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { advertiser, goal, targeting, creative, budget } = await req.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: adv, error: advErr } = await supabase
      .from('hc_adgrid_advertiser')
      .upsert({ company_name: advertiser.company_name, contact_email: advertiser.contact_email, contact_phone: advertiser.contact_phone, billing_status: 'pending', monthly_budget_cents: 0, total_spent_cents: 0, ...(user ? { entity_id: user.id } : {}) }, { onConflict: 'contact_email' })
      .select('id').single()
    if (advErr || !adv) throw new Error('Failed to create advertiser account')

    const { data: campaign, error: campErr } = await supabase
      .from('hc_adgrid_campaign')
      .insert({ advertiser_id: adv.id, campaign_name: goal.campaign_name, campaign_type: goal.campaign_type, target_country: targeting.target_country, target_corridors: targeting.target_corridors, target_cities: targeting.target_states, target_categories: targeting.target_categories, bid_cents: budget.bid_cents, daily_budget_cents: budget.daily_budget_cents, status: 'pending_review', impressions: 0, clicks: 0, conversions: 0, spent_cents: 0, starts_at: budget.starts_at, ends_at: budget.ends_at })
      .select('id').single()
    if (campErr || !campaign) throw new Error('Failed to create campaign')

    await supabase.from('hc_ad_creatives').insert({ campaign_id: campaign.id, headline: creative.headline, body: creative.body, cta_label: creative.cta_label, cta_url: creative.cta_url, status: 'pending_review' }).catch(()=>{})

    return NextResponse.json({ ok: true, campaign_id: campaign.id, advertiser_id: adv.id, message: 'Campaign created. Pending review — typically approved within 2 hours.' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
