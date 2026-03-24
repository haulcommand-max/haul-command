import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { see } from '@/lib/ai/brain';
import { tracked } from '@/lib/ai/tracker';

export const dynamic = 'force-dynamic';

/**
 * POST /api/content/push-copy
 * Body: { event: string, user_id?: string, context?: object }
 *
 * Generates personalized push notification copy using Gemini Flash Lite.
 * Replaces static hardcoded strings with dynamic, context-aware copy.
 * Cost: ~$0.0002 per notification
 *
 * Events:
 *   new_load_match   — "3 loads match your corridor"
 *   operator_bid     — "Sarah accepted your load"
 *   payment_received — "$340 payment confirmed"
 *   profile_expiring — "Your certification expires in 7 days"
 *   corridor_surge   — "High demand on your corridor right now"
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { event, context = {} } = body;

  const EVENT_TEMPLATES: Record<string, string> = {
    new_load_match: `Write a push notification for an escort operator who has a new load match.\nContext: ${JSON.stringify(context)}\nRules: Max 40 chars title, max 100 chars body. Be specific (use numbers). Urgent but friendly.`,
    operator_bid: `Write a push notification telling a load broker that an operator accepted their load.\nContext: ${JSON.stringify(context)}\nRules: Max 40 chars title, max 100 chars body. Confirm action, build confidence.`,
    payment_received: `Write a push notification confirming payment was processed.\nContext: ${JSON.stringify(context)}\nRules: Max 40 chars title, max 80 chars body. Include amount. Positive, reassuring.`,
    profile_expiring: `Write a push notification reminding an operator their certification is expiring.\nContext: ${JSON.stringify(context)}\nRules: Max 40 chars title, max 100 chars body. Urgent but helpful. Link action: tap to renew.`,
    corridor_surge: `Write a push notification about high load demand on an operator's configured corridor.\nContext: ${JSON.stringify(context)}\nRules: Max 40 chars title, max 100 chars body. Exciting, opportunity-framing. Drive them to open app.`,
    partner_inquiry: `Write a push notification for a Haul Command admin: new enterprise partner inquiry.\nContext: ${JSON.stringify(context)}\nRules: Max 40 chars title, max 100 chars body. Urgency + company/use case.`,
  };

  const promptTemplate = EVENT_TEMPLATES[event];
  if (!promptTemplate) {
    return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 });
  }

  const fullPrompt = `${promptTemplate}\n\nOutput JSON: {"title": string, "body": string, "data": {"event": "${event}"}}`;

  try {
    const res = await tracked('push_copy', () =>
      see(fullPrompt, {
        tier: 'nano',
        json: true,
        maxTokens: 150,
        system: 'Write push notification copy for a heavy haul marketplace. Be specific, direct, and action-oriented.',
      })
    );

    let parsed: any = {};
    try { parsed = JSON.parse(res.text); } catch { parsed = { title: 'Haul Command', body: res.text }; }

    return NextResponse.json({
      title: parsed.title ?? 'Haul Command',
      body: parsed.body ?? '',
      data: parsed.data ?? { event },
      model: res.model,
      latency_ms: res.latency_ms,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
