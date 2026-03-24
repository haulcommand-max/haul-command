import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { think } from '@/lib/ai/brain';
import { tracked } from '@/lib/ai/tracker';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/claim-analysis
 * Body: { listing_id: string }
 *
 * Uses Claude to analyze an unclaimed listing and generate:
 *  1. A prioritized outreach reason (why they should claim NOW)
 *  2. Personalized claim invite email copy
 *  3. Risk score (how likely they are to be stolen by competitor)
 *
 * This is the claim conversion engine.
 * Run against all unclaimed high-traffic listings.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { listing_id } = body;

  if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });

  const supabase = createClient();

  const { data: listing, error } = await supabase
    .from('listings')
    .select('id, full_name, state, city, services, rating, review_count, claimed, view_count, contact_count')
    .eq('id', listing_id)
    .single();

  if (error || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  if (listing.claimed) return NextResponse.json({ message: 'Already claimed', claimed: true });

  const prompt = `You are a B2B sales analyst writing claim conversion materials for Haul Command (haulcommand.com).

Unclaimed listing to analyze:
- Name: ${listing.full_name}
- Location: ${listing.city}, ${listing.state}
- Services: ${JSON.stringify(listing.services)}
- Rating: ${listing.rating ?? 'none'} (${listing.review_count ?? 0} reviews)
- Profile views this month: ${listing.view_count ?? 'unknown'}
- Contact attempts: ${listing.contact_count ?? 0}

Generate:

1. OUTREACH_REASON (1 sentence): Why they should claim their Haul Command profile RIGHT NOW. Specific, urgent, not generic.

2. STEAL_RISK_SCORE (1-10): How likely a competitor could poach their business if they stay unclaimed. Explain briefly.

3. EMAIL_SUBJECT (max 45 chars): Compelling subject for a cold claim invite email.

4. EMAIL_BODY (120-150 words): Personalized claim invite. Peer-to-peer tone. Specific to their location and service type. CTA: 'Claim your profile at haulcommand.com/claim/${listing_id}'

5. SMS_TEXT (max 160 chars): Text message version of the claim invite.

Output JSON only: { outreach_reason, steal_risk_score, risk_explanation, email_subject, email_body, sms_text }`;

  try {
    const res = await tracked('claim_analysis', () =>
      think(prompt, {
        model: 'claude-3-5-haiku-20241022',
        maxTokens: 600,
        json: true,
      })
    );

    let analysis: any = {};
    try { analysis = JSON.parse(res.text); } catch {
      analysis = { raw: res.text };
    }

    // Save to listing for easy lookup
    await supabase.from('listing_claim_assets').upsert({
      listing_id,
      outreach_reason: analysis.outreach_reason,
      steal_risk_score: analysis.steal_risk_score,
      risk_explanation: analysis.risk_explanation,
      email_subject: analysis.email_subject,
      email_body: analysis.email_body,
      sms_text: analysis.sms_text,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'listing_id' }).catch(() => {});

    return NextResponse.json({
      listing_id,
      ...analysis,
      model: res.model,
      cost_cents: res.cost_cents,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/admin/claim-analysis?limit=50&min_risk=7
 * Returns unclaimed listings with pre-computed claim assets, sorted by risk score.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);
  const minRisk = parseInt(searchParams.get('min_risk') ?? '0', 10);

  const supabase = createClient();

  const { data } = await supabase
    .from('listing_claim_assets')
    .select('*, listings(full_name, state, city, rating, review_count, view_count)')
    .gte('steal_risk_score', minRisk)
    .order('steal_risk_score', { ascending: false })
    .limit(limit);

  return NextResponse.json({ listings: data ?? [], count: data?.length ?? 0 });
}
