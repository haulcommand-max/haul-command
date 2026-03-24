import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { see } from '@/lib/ai/brain';
import { tracked } from '@/lib/ai/tracker';

export const dynamic = 'force-dynamic';

/**
 * GET /api/route-check?q=...&state=TX&load_type=oversize
 *
 * UPGRADED:
 * - Saves query to route_check_queries table and returns query_id
 * - load_type added as a parameter (oversize | overweight | superload | autonomous | rig_move)
 * - Better system prompt for load_type-specific answers
 * - Returns query_id for lead capture attribution
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const state = searchParams.get('state') ?? undefined;
  const loadType = searchParams.get('load_type') ?? 'oversize';

  if (!q) return NextResponse.json({ error: 'q parameter required' }, { status: 400 });

  const supabase = createClient();
  const start = Date.now();

  // Get auth user if logged in (optional)
  const { data: { user } } = await supabase.auth.getUser();

  const systemPrompt = `You are a heavy haul regulation expert for Haul Command (haulcommand.com).
Specialization: ${loadType} loads${state ? ` in ${state}` : ' across the US'}.
Answer clearly and specifically. Include:
- Specific dimensional/weight thresholds
- Escort/pilot car requirements (count, type)
- Permit requirements
- Time restrictions (curfews, weekends, holidays)
- Any recent regulatory changes
End every answer with: "Find certified escort operators at haulcommand.com/directory"`;

  try {
    const res = await tracked('route_check', () =>
      see(q, {
        tier: 'fast',
        grounding: true,
        system: systemPrompt,
        maxTokens: 800,
      })
    );

    const latency = Date.now() - start;

    // Save query for analytics + lead attribution
    const { data: savedQuery } = await supabase
      .from('route_check_queries')
      .insert({
        query: q,
        state: state ?? null,
        load_type: loadType,
        answer_length: res.text.length,
        model: res.model,
        latency_ms: latency,
        user_id: user?.id ?? null,
      })
      .select('id')
      .single();

    return NextResponse.json({
      answer: res.text,
      model: res.model,
      latency_ms: latency,
      query_id: savedQuery?.id,
      state,
      load_type: loadType,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
