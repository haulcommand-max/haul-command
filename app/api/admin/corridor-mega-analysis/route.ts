import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import { tracked } from '@/lib/ai/tracker';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/corridor-mega-analysis
 * Body: { corridor_state?: string, limit?: number }
 *
 * Uses Gemini 2.5 Pro's 1M TOKEN CONTEXT WINDOW to analyze
 * ALL listings on a specific corridor simultaneously.
 *
 * This is the analysis you cannot do with Claude or GPT-4:
 *   - Feed ALL 7,745 listings at once
 *   - Find patterns across the entire operator database
 *   - Identify supply gaps by state, corridor, certification tier
 *   - Price intelligence from all posted loads
 *
 * Cost: ~$0.015/1k tokens (Gemini 2.5 Pro) — but 1M context = 1 call
 * Use case: Monthly competitive/market intelligence report
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { corridor_state, limit = 500 } = body;

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  const supabase = createClient();

  // Fetch large batch of listings for analysis
  let query = supabase
    .from('listings')
    .select('id, full_name, state, city, services, equipment, certifications, rating, review_count, claimed, active')
    .eq('active', true)
    .limit(limit);

  if (corridor_state) {
    query = query.eq('state', corridor_state);
  }

  const { data: listings } = await query;

  if (!listings?.length) {
    return NextResponse.json({ error: 'No listings found' }, { status: 404 });
  }

  // Fetch recent loads for market data
  const { data: loads } = await supabase
    .from('loads')
    .select('origin_state, destination_state, rate_per_mile, escort_count, width_ft, height_ft, created_at')
    .gte('created_at', new Date(Date.now() - 90 * 86400000).toISOString())
    .limit(200);

  // Compress listings for 1M context (reduce token usage)
  const compressedListings = (listings ?? []).map((l: any) => ({
    id: l.id,
    state: l.state,
    city: l.city,
    services: l.services,
    certs: l.certifications,
    rating: l.rating,
    reviews: l.review_count,
    claimed: l.claimed,
  }));

  const prompt = `You are analyzing the complete Haul Command operator database for market intelligence.\n\nOPERATOR DATABASE (${compressedListings.length} active listings):\n${JSON.stringify(compressedListings, null, 0)}\n\nRECENT LOAD ACTIVITY (90 days, ${loads?.length ?? 0} loads):\n${JSON.stringify(loads ?? [], null, 0)}\n\nAnalyze this data and generate a MARKET INTELLIGENCE REPORT:\n\n1. SUPPLY GAPS: Which states/corridors have the most loads but fewest operators? (Top 10)
2. CERTIFICATION GAPS: What certifications are most demanded vs. least covered?
3. PRICE INTELLIGENCE: Rate per mile ranges by corridor (high/median/low)
4. UNCLAIMED LISTINGS: % unclaimed by state — where are the biggest reclaim opportunities?
5. QUALITY DISTRIBUTION: Rating distribution, % with 10+ reviews
6. DEMAND FORECAST: Based on 90-day load trend, which corridors are growing fastest?
7. COMPETITIVE MOAT: What would it take for a competitor to replicate this network?
8. TOP 5 OPPORTUNITIES: Specific, actionable growth opportunities for Haul Command\n\nFormat: Executive summary (200 words) + detailed sections. Be specific, use numbers from the data.`;

  try {
    const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const start = Date.now();

    const res = await gemini.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        maxOutputTokens: 4096,
        temperature: 0.2,
      },
    });

    const text = res.text ?? '';
    const latency = Date.now() - start;
    const inputTokens = res.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = res.usageMetadata?.candidatesTokenCount ?? 0;
    const costCents = ((inputTokens + outputTokens) / 1000) * 1.5; // $0.015/1k

    // Save report to DB
    await supabase.from('market_intelligence_reports').upsert({
      report_type: 'corridor_mega_analysis',
      corridor_state: corridor_state ?? 'ALL',
      listing_count: listings.length,
      load_count: loads?.length ?? 0,
      report_content: text,
      model: 'gemini-2.5-pro',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_cents: costCents,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'report_type,corridor_state' }).catch(() => {});

    return NextResponse.json({
      report: text,
      meta: {
        listings_analyzed: listings.length,
        loads_analyzed: loads?.length ?? 0,
        model: 'gemini-2.5-pro',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: (costCents / 100).toFixed(4),
        latency_ms: latency,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
