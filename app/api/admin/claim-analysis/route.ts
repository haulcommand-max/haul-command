import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { see, think } from '@/lib/ai/brain';
import { tracked } from '@/lib/ai/tracker';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/claim-analysis
 * Body: { listing_id?: string, batch_limit?: number, min_risk?: number }
 *
 * UPGRADED: Hybrid 2-brain approach
 *   - 👁️ Gemini SEE (nano) → generate email/SMS copy (fast + cheap: $0.0003/call)
 *   - 🧠 Claude THINK (nano) → risk assessment reasoning only ($0.0002/call)
 *   - Combined cost: ~$0.0005/listing vs. $0.003 Claude-only = 6× cheaper
 *   - Full 7,745 sweep: ~$3.87 total (vs. ~$23 Claude-only)
 *
 * Single listing: { listing_id: "uuid" }
 * Batch sweep:    { batch_limit: 50, min_review_count: 5 } — prioritizes high-traffic unclaimed
 *
 * GET ?limit=50&min_risk=7 → Returns pre-computed outreach sorted by steal_risk_score
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const supabase = createClient();

  // ── Single listing mode ──
  if (body.listing_id) {
    return await analyzeSingleListing(supabase, body.listing_id);
  }

  // ── Batch sweep mode ──
  const batchLimit = Math.min(body.batch_limit ?? 50, 100);
  const minReviews = body.min_review_count ?? 0;

  // Prioritize: most review count (most visible => highest steal risk)
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, full_name, state, city, services, rating, review_count, view_count, contact_count')
    .eq('active', true)
    .eq('claimed', false)
    .gte('review_count', minReviews)
    // Skip already processed ones
    .not('id', 'in', `(SELECT listing_id FROM listing_claim_assets WHERE generated_at > now() - interval '30 days')`)
    .order('review_count', { ascending: false })
    .limit(batchLimit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!listings?.length) return NextResponse.json({ message: 'No unclaimed listings to process', processed: 0 });

  const results: any[] = [];
  const errors: any[] = [];
  const CONCURRENCY = 5;

  for (let i = 0; i < listings.length; i += CONCURRENCY) {
    const batch = listings.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map(async (listing) => {
        const result = await analyzeSingleListing(supabase, listing.id, listing);
        return result;
      })
    );
    for (const s of settled) {
      if (s.status === 'fulfilled') results.push(await (s.value as any).json?.() ?? s.value);
      else errors.push(s.reason?.message ?? 'Unknown error');
    }
    // Respect rate limits
    if (i + CONCURRENCY < listings.length) await new Promise(r => setTimeout(r, 500));
  }

  return NextResponse.json({
    mode: 'batch',
    processed: results.length,
    errors: errors.length,
    estimated_cost_usd: ((results.length * 0.0005) / 100).toFixed(4),
    message: `${results.length} listings analyzed. ${errors.length} errors.`,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);
  const minRisk = parseInt(searchParams.get('min_risk') ?? '0', 10);
  const state = searchParams.get('state');
  const format = searchParams.get('format') ?? 'json';

  const supabase = createClient();

  let query = supabase
    .from('listing_claim_assets')
    .select('*, listings(id, full_name, state, city, rating, review_count, view_count)')
    .gte('steal_risk_score', minRisk)
    .order('steal_risk_score', { ascending: false })
    .limit(limit);

  if (state) {
    query = query.eq('listings.state', state);
  }

  const { data } = await query;

  // CSV export for outreach campaigns
  if (format === 'csv') {
    const rows = (data ?? []).map((r: any) => ([
      r.listings?.full_name ?? '',
      r.listings?.state ?? '',
      r.listings?.city ?? '',
      r.steal_risk_score ?? '',
      r.email_subject ?? '',
      // Escape newlines in email body for CSV
      `"${(r.email_body ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(r.sms_text ?? '').replace(/"/g, '""')}"`,
      `https://haulcommand.com/claim/${r.listing_id}`,
    ].join(',')));

    const csv = [
      'Name,State,City,Risk Score,Email Subject,Email Body,SMS Text,Claim URL',
      ...rows,
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="claim-outreach-risk${minRisk}+.csv"`,
      },
    });
  }

  return NextResponse.json({
    listings: data ?? [],
    count: data?.length ?? 0,
    filters: { min_risk: minRisk, state, limit },
  });
}

// ── Core analysis function ─────────────────────────────────────

async function analyzeSingleListing(supabase: any, listingId: string, preloadedListing?: any) {
  let listing = preloadedListing;

  if (!listing) {
    const { data, error } = await supabase
      .from('listings')
      .select('id, full_name, state, city, services, rating, review_count, view_count, contact_count, claimed')
      .eq('id', listingId)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    if (data.claimed) return NextResponse.json({ message: 'Already claimed', claimed: true });
    listing = data;
  }

  const listingContext = `
Name: ${listing.full_name}
Location: ${listing.city ?? ''}, ${listing.state ?? ''}
Services: ${JSON.stringify(listing.services ?? [])}
Rating: ${listing.rating ?? 'none'} (${listing.review_count ?? 0} reviews)
Views: ${listing.view_count ?? 'unknown'}/month
Contact attempts: ${listing.contact_count ?? 0}
Claim URL: https://haulcommand.com/claim/${listing.id}`;

  // Run Gemini (copy) and Claude (risk) in parallel — saves time + cost
  const [copyRes, riskRes] = await Promise.allSettled([
    // 👁️ Gemini SEE: Generate email + SMS copy (nano — $0.0003)
    tracked('claim_copy_gemini', () => see(
      `You write B2B outreach for Haul Command (haulcommand.com), a platform for heavy haul escort operators.\n\nUnclaimed listing:\n${listingContext}\n\nGenerate personalized claim outreach:\n1. EMAIL_SUBJECT: Max 45 chars. Specific to their name/location.
2. EMAIL_BODY: 120-150 words. Peer tone. Specific to their services. End: 'Claim free at https://haulcommand.com/claim/${listing.id}'
3. SMS_TEXT: Max 160 chars. Direct.\n4. OUTREACH_REASON: 1 sentence. Why claim NOW.\n\nOutput JSON: { email_subject, email_body, sms_text, outreach_reason }`,
      { tier: 'nano', json: true }
    )),
    // 🧠 Claude THINK: Risk reasoning only (nano — $0.0002)
    tracked('claim_risk_claude', () => think(
      `Rate steal risk (1-10) for this unclaimed escort operator listing.\n${listingContext}\n\nConsider: competitor poaching likelihood, visibility, revenue at risk.\nOutput JSON: { steal_risk_score: number, risk_explanation: string }`,
      { tier: 'nano', json: true }
    )),
  ]);

  // Parse results
  let copyData: any = {};
  let riskData: any = { steal_risk_score: 5, risk_explanation: 'Unable to assess' };

  if (copyRes.status === 'fulfilled') {
    try { copyData = JSON.parse(copyRes.value.text); } catch { copyData = {}; }
  }
  if (riskRes.status === 'fulfilled') {
    try { riskData = JSON.parse(riskRes.value.text); } catch { riskData = { steal_risk_score: 5 }; }
  }

  const analysis = {
    listing_id: listing.id,
    outreach_reason: copyData.outreach_reason ?? riskData.risk_explanation,
    steal_risk_score: riskData.steal_risk_score ?? 5,
    risk_explanation: riskData.risk_explanation ?? '',
    email_subject: copyData.email_subject ?? `Claim your Haul Command profile, ${listing.full_name?.split(' ')[0]}`,
    email_body: copyData.email_body ?? '',
    sms_text: copyData.sms_text ?? `Your profile on Haul Command has activity. Claim it free: haulcommand.com/claim/${listing.id}`,
    generated_at: new Date().toISOString(),
  };

  // Upsert to DB
  await supabase.from('listing_claim_assets').upsert(analysis, { onConflict: 'listing_id' }).catch(() => {});

  return NextResponse.json(analysis);
}
