import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { see } from '@/lib/ai/brain';
import { tracked } from '@/lib/ai/tracker';

export const dynamic = 'force-dynamic';

/**
 * POST /api/content/match-explain
 * Body: { load_id: string, operator_id: string } OR { load: object, operator: object }
 *
 * Gemini generates a 2-sentence human-readable explanation of why
 * a specific operator was matched to a specific load.
 * Shown in the broker's dispatch view: "Why this operator?"
 *
 * Cost: ~$0.0002 per explanation (Gemini Flash Lite)
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const supabase = createClient();

  let load: any = body.load;
  let operator: any = body.operator;

  // Fetch from DB if IDs provided
  if (body.load_id && !load) {
    const { data } = await supabase.from('loads').select('*').eq('id', body.load_id).single();
    load = data;
  }
  if (body.operator_id && !operator) {
    const { data } = await supabase.from('listings').select('*').eq('id', body.operator_id).single();
    operator = data;
  }

  if (!load || !operator) {
    return NextResponse.json({ error: 'load and operator required' }, { status: 400 });
  }

  const prompt = `Explain in exactly 2 sentences why this escort operator was matched to this load.\n\nLoad:\n- Route: ${load.origin_state ?? '?'} → ${load.destination_state ?? '?'}\n- Width: ${load.width_ft ?? '?'}ft, Height: ${load.height_ft ?? '?'}ft\n- Escorts needed: ${load.escort_count ?? '?'}\n- Special: ${(load.special_requirements ?? []).join(', ') || 'none'}\n\nOperator:\n- Name: ${operator.full_name ?? 'Operator'}\n- Location: ${operator.city ?? ''} ${operator.state ?? ''}\n- Rating: ${operator.rating ?? 'N/A'}/5 (${operator.review_count ?? 0} reviews)\n- Certifications: ${(operator.certifications ?? []).join(', ') || 'Standard escort'}\n- Corridor specialty: ${operator.state ?? '?'}\n\nWrite 2 sentences only. Be specific. Start with the strongest match reason.`;

  try {
    const res = await tracked('match_explain', () =>
      see(prompt, {
        tier: 'nano',
        maxTokens: 120,
        system: 'Write brief, factual match explanations for a dispatch platform.',
      })
    );

    return NextResponse.json({
      explanation: res.text.trim(),
      model: res.model,
      latency_ms: res.latency_ms,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
