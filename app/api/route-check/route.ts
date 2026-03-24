import { NextRequest, NextResponse } from 'next/server';
import { see } from '@/lib/ai/brain';
import { cacheGet, cacheSet, CACHE_TTL } from '@/lib/ai/cache';
import { tracked } from '@/lib/ai/tracker';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/route-check?q=query&state=TX&load_type=oversize
 * 
 * AI-powered route check using Gemini with Google Search grounding.
 * Answers: "Can I move an 18ft wide load on US-287 in Texas this weekend?"
 * 
 * This is the free SEO tool that drives inbound.
 * Every query is organic search intent: "oversize load TX regulations"
 * Cost per query: ~$0.001 (Gemini 2.5 Flash with grounding)
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  const state = req.nextUrl.searchParams.get('state') ?? '';
  const loadType = req.nextUrl.searchParams.get('load_type') ?? 'oversize';

  if (!q || q.length < 5) {
    return NextResponse.json({ error: 'Query too short. Ask a specific question.' }, { status: 400 });
  }

  // Rate limit: check Upstash Redis (via cache)
  const cacheKey = `route_check:${q.toLowerCase().trim()}`;
  const cached = await cacheGet('gemini', 'gemini-2.5-flash', cacheKey);
  if (cached) {
    return NextResponse.json({
      answer: cached.text,
      source: 'cache',
      model: cached.model,
    });
  }

  const prompt = `A heavy haul transport professional asks: "${q}"

Context:
- State/region: ${state || 'not specified'}
- Load type: ${loadType}

Answer this question specifically for heavy haul / oversize / overweight transport.
Include:
1. Direct answer (yes/no/depends) in the first sentence
2. Specific regulation details (dimensions, escorting requirements, permit contacts)
3. Any time restrictions, curfews, weekend rules
4. Recommended next step (permit office, phone number, or haulcommand.com link)

If you don't have current data, say so and point them to the relevant DOT authority.
Be direct and operational — this person is in the field, not a lawyer.`;

  try {
    const result = await tracked('route_check', () =>
      see(prompt, {
        tier: 'fast',
        grounding: true, // Google Search grounding for live regulation data
        system: 'You are a heavy haul route intelligence specialist for Haul Command. You have access to current DOT regulations and permit requirements across 57 countries.',
        maxTokens: 800,
      })
    );

    // Log query to Supabase for analytics
    const supabase = createClient();
    await supabase.from('route_check_queries').insert({
      query: q,
      state: state || null,
      load_type: loadType,
      answer_length: result.text.length,
      model: result.model,
      latency_ms: result.latency_ms,
    }).catch(() => {}); // non-fatal

    // Cache for 24 hours (regulations are stable daily)
    await cacheSet('gemini', 'gemini-2.5-flash', cacheKey, result, CACHE_TTL.regulation);

    return NextResponse.json({
      answer: result.text,
      source: 'live',
      model: result.model,
      latency_ms: result.latency_ms,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
