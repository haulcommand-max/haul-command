import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { see } from '@/lib/ai/brain';
import { tracked } from '@/lib/ai/tracker';

export const dynamic = 'force-dynamic';

/**
 * POST /api/content/email-personalize
 * Body: { sequence: string, step: number, user_id: string, context: object }
 *
 * Personalizes email sequence copy using Gemini Flash Lite.
 * Context includes: user role, corridor, load history, company name, etc.
 * Cost: ~$0.0003 per email
 *
 * Sequences:
 *   corporate_training_visitor — aurora/kodiak/ryder visitor drip
 *   broker_no_post            — broker who signed up but never posted a load
 *   operator_inactive_30d     — operator not logged in for 30 days
 *   new_operator_onboarding   — first 7-day welcome sequence
 *   partner_inquiry_followup  — enterprise partner warm-up
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { sequence, step, user_id, context = {} } = body;

  if (!sequence || step === undefined) {
    return NextResponse.json({ error: 'sequence and step required' }, { status: 400 });
  }

  // Fetch user profile for extra personalization
  let userProfile: any = context;
  if (user_id) {
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role, state, city, company_name, load_count, operator_count')
      .eq('id', user_id)
      .single();
    if (data) userProfile = { ...context, ...data };
  }

  const name = userProfile.full_name?.split(' ')[0] ?? 'there';
  const company = userProfile.company_name ?? userProfile.company ?? 'your company';
  const role = userProfile.role ?? 'user';
  const state = userProfile.state ?? 'your state';

  const SEQUENCE_BRIEFS: Record<string, Record<number, string>> = {
    corporate_training_visitor: {
      0: `Subject + email body for day-1 touchpoint. They visited our AV/Corporate Training page but didn't inquire. Company: ${company}. Frame Haul Command as the only platform that trains escort operators specifically for AV truck corridors.`,
      1: `Subject + email body for day-3 follow-up. Share a specific stat: e.g. "Aurora's Texas Triangle needs 3 escorts per truck". Add case study angle.`,
      2: `Subject + email body for day-7 value send. Share a free resource: link to /route-check for their state. Low pressure. Soft CTA: "Reply if you'd like a demo."`,
    },
    broker_no_post: {
      0: `Subject + email body for broker who signed up but hasn't posted a load yet. Name: ${name}. Acknowledge they're busy. Remove friction: "takes 90 seconds" angle.`,
      1: `Subject + email body for day-5 follow-up. "Your corridor: ${state}" — show them available escorts nearby. Urgency: "3 brokers posted loads on this route this week."`,
    },
    operator_inactive_30d: {
      0: `Subject + email body for operator inactive 30+ days. Name: ${name}, State: ${state}. They're missing loads. Show specific demand data for their state.`,
      1: `Subject + email body day-3. "Operators in ${state} earned $X this week" — reactivation hook. CTA: update availability.`,
    },
    new_operator_onboarding: {
      0: `Welcome email for new escort operator. Name: ${name}. Get them to complete their profile (the #1 thing stopping matches). Action-oriented, warm, specific steps.`,
      1: `Day-2: Profile tips. "Operators with photos get 3× more contacts." One tip per email.`,
      2: `Day-4: First load alert setup. Walk them through setting state/corridor preferences.`,
      3: `Day-7: "Are you ready for your first load?" — confidence builder. Links to /loads and /directory.`,
    },
    partner_inquiry_followup: {
      0: `Internal email to Haul Command team: new enterprise inquiry from ${company}. Include summary, suggested talking points, and recommended response within 24h.`,
    },
  };

  const brief = SEQUENCE_BRIEFS[sequence]?.[step];
  if (!brief) {
    return NextResponse.json({ error: `Unknown sequence/step: ${sequence} step ${step}` }, { status: 400 });
  }

  const prompt = `Write a high-converting B2B email for Haul Command (haulcommand.com) — the global heavy haul escort operating system.\n\nEmail brief: ${brief}\n\nRules:\n- Subject line: max 50 chars, no clickbait, specific + curiosity\n- Body: 120-200 words max\n- One clear CTA per email\n- Voice: direct, knowledgeable peer — NOT corporate\n- Sign off: "— The Haul Command Team"\n\nOutput JSON: {"subject": string, "preview_text": string (40 chars), "body_html": string (HTML allowed), "cta_text": string, "cta_url": string}`;

  try {
    const res = await tracked('email_personalize', () =>
      see(prompt, {
        tier: 'nano',
        json: true,
        maxTokens: 600,
        system: 'You write high-converting B2B emails for logistics and transportation companies. Be direct, specific, and peer-to-peer.',
      })
    );

    let parsed: any = {};
    try { parsed = JSON.parse(res.text); } catch { parsed = { body_html: res.text }; }

    return NextResponse.json({
      subject: parsed.subject ?? '',
      preview_text: parsed.preview_text ?? '',
      body_html: parsed.body_html ?? res.text,
      cta_text: parsed.cta_text ?? 'Open Haul Command',
      cta_url: parsed.cta_url ?? 'https://haulcommand.com',
      model: res.model,
      latency_ms: res.latency_ms,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
