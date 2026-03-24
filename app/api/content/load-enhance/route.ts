import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { see } from '@/lib/ai/brain';
import { tracked } from '@/lib/ai/tracker';

export const dynamic = 'force-dynamic';

/**
 * POST /api/content/load-enhance
 * Body: { description: string, load_type?: string, origin?: string, destination?: string }
 *
 * Called from the load posting form as operator types.
 * Gemini auto-completes: required certifications, escort count, special requirements.
 * Cost: ~$0.0003 per request (Gemini 2.0 Flash Lite)
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { description, load_type, origin, destination } = body;

  if (!description || description.length < 10) {
    return NextResponse.json({ error: 'Description too short' }, { status: 400 });
  }

  const prompt = `A broker is posting this oversize/overweight load:\n"${description}"${origin ? `\nOrigin: ${origin}` : ''}${destination ? `\nDestination: ${destination}` : ''}${load_type ? `\nLoad type: ${load_type}` : ''}\n\nUsing US DOT regulations, complete the load posting details:\n\nOutput JSON only:\n{
  "title": string (professional load title, max 80 chars),
  "full_description": string (expanded professional description, 100-200 words),
  "required_certifications": string[] (e.g. ["TXDOT Escort", "OSHA 10"]),
  "escort_count_min": number,
  "escort_count_max": number,
  "special_requirements": string[] (e.g. ["Overwidth flag", "Height pole"]),
  "permit_required": boolean,
  "permit_states": string[] (state codes likely needing permits),
  "estimated_duration_hrs": number,
  "load_category": "oversize" | "overweight" | "oversize+overweight" | "superload",
  "curfew_risk": "low" | "medium" | "high"
}`;

  try {
    const res = await tracked('load_enhance', () =>
      see(prompt, {
        tier: 'nano',
        json: true,
        system: 'You are a heavy haul load posting specialist with expertise in DOT regulations across all 50 US states. Always be specific about certification requirements.',
        maxTokens: 600,
      })
    );

    let parsed: any = {};
    try { parsed = JSON.parse(res.text); } catch { parsed = { full_description: res.text }; }

    return NextResponse.json({
      ...parsed,
      model: res.model,
      latency_ms: res.latency_ms,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
