/**
 * POST /api/adgrid/campaign-create
 * Self-serve campaign creation from /advertise/dashboard
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.json();
  const {
    company_name, contact_email, plan_code, plan_monthly_fee,
    target_audience_segment, placements, target_corridors, target_states,
    creative,
  } = body;

  if (!company_name || !contact_email || !plan_code) {
    return NextResponse.json({ error: 'company_name, contact_email, plan_code required' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  // Upsert advertiser
  const { data: advertiser, error: advErr } = await supabase
    .from('ad_advertisers')
    .upsert({ company_name, contact_email, billing_email: contact_email }, { onConflict: 'contact_email' })
    .select('id')
    .single();

  if (advErr || !advertiser) {
    return NextResponse.json({ error: advErr?.message || 'Could not create advertiser' }, { status: 500 });
  }

  // Create campaign
  const { data: campaign, error: campErr } = await supabase
    .from('ad_campaigns')
    .insert({
      advertiser_id: advertiser.id,
      name: `${company_name} — ${plan_code}`,
      status: 'pending_review',
      plan_type: plan_code === 'ron' ? 'run_of_network' : plan_code === 'corridor' ? 'corridor_targeted' : 'corridor_exclusive',
      target_audience_segment: target_audience_segment || 'all',
      placements: placements || ['load_board'],
      target_corridors: target_corridors || [],
      target_states: target_states || [],
      monthly_budget: plan_monthly_fee || 19,
      plan_monthly_fee: plan_monthly_fee || 19,
      start_date: new Date().toISOString().split('T')[0],
    })
    .select('id')
    .single();

  if (campErr || !campaign) {
    return NextResponse.json({ error: campErr?.message || 'Could not create campaign' }, { status: 500 });
  }

  // Create creative
  if (creative?.headline && creative?.cta_url) {
    await supabase.from('ad_creatives').insert({
      campaign_id: campaign.id,
      creative_type: 'native_card',
      headline: creative.headline,
      body_copy: creative.body || '',
      cta_text: creative.cta_text || 'Learn More',
      cta_url: creative.cta_url,
      ai_generated: creative.ai_generate || false,
      status: 'pending',
    });
  }

  return NextResponse.json({ ok: true, campaign_id: campaign.id, advertiser_id: advertiser.id });
}
