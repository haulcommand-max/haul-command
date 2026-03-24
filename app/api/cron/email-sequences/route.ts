import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { see } from '@/lib/ai/brain';
import { tracked } from '@/lib/ai/tracker';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/email-sequences
 * Vercel cron: 0 9 * * * (9am UTC daily)
 *
 * Processes email sequence enrollments.
 * All email copy is NOW AI-personalized via Gemini Flash Lite.
 * Static hardcoded templates replaced with dynamic generation.
 * Cost: ~$0.0003/email × estimated 50/day = ~$0.015/day = $0.45/month
 *
 * POST /api/cron/email-sequences — enroll a user in a sequence
 * Body: { email, sequence_id, user_id?, trigger_event?, context? }
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const results: any[] = [];
  const errors: any[] = [];

  // Get all active enrollments needing next step
  const { data: enrollments } = await supabase
    .from('email_sequence_enrollments')
    .select('*, profiles(full_name, company_name, role, state, city)')
    .eq('completed', false)
    .eq('unsubscribed', false)
    .limit(100);

  if (!enrollments?.length) return NextResponse.json({ processed: 0 });

  for (const enrollment of enrollments) {
    const stepConfig = getStepConfig(enrollment.sequence_id, enrollment.current_step);
    if (!stepConfig) {
      await supabase.from('email_sequence_enrollments')
        .update({ completed: true })
        .eq('id', enrollment.id);
      continue;
    }

    // Check delay
    const lastSent = enrollment.last_sent_at
      ? new Date(enrollment.last_sent_at)
      : new Date(enrollment.enrolled_at);
    if (Date.now() - lastSent.getTime() < stepConfig.delay_hours * 3600000) continue;

    try {
      // Build user context from profile
      const profile = enrollment.profiles ?? {};
      const userContext = {
        name: profile.full_name ?? enrollment.email.split('@')[0],
        company: profile.company_name ?? enrollment.context?.company ?? 'your company',
        role: profile.role ?? enrollment.context?.role ?? 'operator',
        state: profile.state ?? enrollment.context?.state ?? 'your state',
        ...enrollment.context,
      };

      // Generate personalized email via Gemini Flash Lite
      const emailRes = await tracked('email_sequence', () =>
        see(
          buildEmailPrompt(enrollment.sequence_id, enrollment.current_step, userContext),
          { tier: 'nano', json: true, maxTokens: 500 }
        )
      );

      let emailData: any = {};
      try { emailData = JSON.parse(emailRes.text); } catch {
        // Fallback to static template if Gemini parse fails
        emailData = getStaticFallback(enrollment.sequence_id, enrollment.current_step, userContext);
      }

      await resend.emails.send({
        from: 'Haul Command <hello@haulcommand.com>',
        to: [enrollment.email],
        subject: emailData.subject ?? stepConfig.fallback_subject,
        html: emailData.body_html ?? emailData.body ?? stepConfig.fallback_html,
        tags: [{ name: 'sequence', value: enrollment.sequence_id }, { name: 'step', value: String(enrollment.current_step) }],
      });

      await supabase.from('email_sequence_enrollments').update({
        current_step: enrollment.current_step + 1,
        last_sent_at: new Date().toISOString(),
      }).eq('id', enrollment.id);

      results.push({
        email: enrollment.email,
        sequence: enrollment.sequence_id,
        step: enrollment.current_step,
        subject: emailData.subject,
      });
    } catch (err: any) {
      errors.push({ email: enrollment.email, error: err.message });
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    processed: results.length,
    errors: errors.length,
    results,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, sequence_id, user_id, trigger_event, context } = await req.json();
    if (!email || !sequence_id) {
      return NextResponse.json({ error: 'email and sequence_id required' }, { status: 400 });
    }

    const supabase = createClient();
    // Upsert: if already enrolled, don't re-enroll (no duplicate sequences)
    const { error } = await supabase.from('email_sequence_enrollments').upsert({
      email,
      sequence_id,
      user_id: user_id ?? null,
      trigger_event: trigger_event ?? 'manual',
      context: context ?? {},
      enrolled_at: new Date().toISOString(),
    }, { onConflict: 'email,sequence_id', ignoreDuplicates: true });

    if (error) throw error;
    return NextResponse.json({ success: true, enrolled: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── Sequence step configs (delay only, copy is AI-generated) ─────────

const STEP_CONFIGS: Record<string, Array<{
  delay_hours: number;
  fallback_subject: string;
  fallback_html: string;
}>> = {
  corporate_training_visitor: [
    {
      delay_hours: 24,
      fallback_subject: 'How companies are certifying their escort networks',
      fallback_html: '<p>AV corridors are expanding. The operators certified now get first call when Aurora needs escorts. <a href="https://haulcommand.com/training/corporate">See how →</a></p>',
    },
    {
      delay_hours: 96,
      fallback_subject: 'The Aurora escort problem — and how companies solve it',
      fallback_html: '<p>Aurora’s trucks still need human escorts when carrying oversize loads. Companies already certified on Haul Command get preferred vendor status. <a href="https://haulcommand.com/training/corporate">Details →</a></p>',
    },
    {
      delay_hours: 168,
      fallback_subject: 'Last thing',
      fallback_html: '<p>When operator certification matters: <a href="https://haulcommand.com/training/corporate">haulcommand.com/training/corporate</a></p>',
    },
  ],
  broker_no_post: [
    {
      delay_hours: 48,
      fallback_subject: 'Post your first load in 90 seconds',
      fallback_html: '<p>Median fill time: 47 minutes. Most operators respond in under 15. <a href="https://haulcommand.com/loads/new">Post now →</a></p>',
    },
    {
      delay_hours: 120,
      fallback_subject: '3 loads were posted on your corridor this week',
      fallback_html: '<p>3 loads on corridors near you. Through Haul Command, loads get filled faster with verified operators and escrow payment. <a href="https://haulcommand.com/loads/new">Post a load →</a></p>',
    },
  ],
  operator_inactive_30d: [
    {
      delay_hours: 0,
      fallback_subject: "You're missing loads on your corridor",
      fallback_html: '<p>Loads are being posted on your corridor. Update your availability and start matching. <a href="https://haulcommand.com/dashboard">Open dashboard →</a></p>',
    },
    {
      delay_hours: 72,
      fallback_subject: 'Quick update: demand in your state',
      fallback_html: '<p>High escort demand this week. Add your availability for next 30 days. <a href="https://haulcommand.com/dashboard">Open →</a></p>',
    },
  ],
  new_operator_onboarding: [
    {
      delay_hours: 0,
      fallback_subject: 'Welcome to Haul Command — 3 things to do first',
      fallback_html: '<p>1. Add a photo 2. Set your corridor 3. Upload your cert. Operators with complete profiles get 3× more contacts. <a href="https://haulcommand.com/dashboard">Finish setup →</a></p>',
    },
    {
      delay_hours: 48,
      fallback_subject: 'One profile tip that triples contacts',
      fallback_html: '<p>Operators with a clear profile photo get 3× more contacts. Add yours: <a href="https://haulcommand.com/settings">haulcommand.com/settings</a></p>',
    },
    {
      delay_hours: 96,
      fallback_subject: 'Set your first load alert',
      fallback_html: '<p>Get notified the moment a load matches your corridor. 30 seconds to set up: <a href="https://haulcommand.com/settings">Set alert →</a></p>',
    },
    {
      delay_hours: 168,
      fallback_subject: 'Ready for your first load?',
      fallback_html: '<p>Your profile is up. Loads are posting. <a href="https://haulcommand.com/loads">Browse open loads →</a></p>',
    },
  ],
};

function getStepConfig(sequenceId: string, step: number) {
  return STEP_CONFIGS[sequenceId]?.[step] ?? null;
}

function buildEmailPrompt(sequenceId: string, step: number, ctx: any): string {
  const briefs: Record<string, Record<number, string>> = {
    corporate_training_visitor: {
      0: `Day-1 email to ${ctx.company} about AV escort operator certification on Haul Command. Frame it as competitive advantage (first call from Aurora/Kodiak). Not salesy.`,
      1: `Day-4 email: share the Aurora escort problem — human escorts needed for AV oversize loads, most operators don’t know AV protocols. Companies certified on HC get preferred vendor status.`,
      2: `Day-7 final: low-pressure close. Leave the door open. One link.`,
    },
    broker_no_post: {
      0: `Broker ${ctx.name} signed up but never posted a load. Day-2 email: remove friction, emphasize speed (90 sec to post, 47 min fill time). Specific and encouraging.`,
      1: `Day-5 follow-up: 3 loads posted on their corridor this week. Create FOMO. CTA: post a load now.`,
    },
    operator_inactive_30d: {
      0: `${ctx.name} in ${ctx.state} hasn’t logged in for 30+ days. They’re missing loads. Reactivation email. Show demand data for their state.`,
      1: `Day-3: high demand context for ${ctx.state} this week. One action item: update availability.`,
    },
    new_operator_onboarding: {
      0: `Welcome email for ${ctx.name}, new escort operator. 3 first actions. Warm, specific, action-oriented.`,
      1: `Day-2: profile photo tip. Operators with photos get 3× contacts. One tip only.`,
      2: `Day-4: load alert setup walk-through. 30 seconds to configure. Drives engagement.`,
      3: `Day-7: confidence builder. Ready for first load? Links to /loads and /directory.`,
    },
  };

  const brief = briefs[sequenceId]?.[step] ?? `Email step ${step} for ${sequenceId} sequence.`;

  return `You write B2B emails for Haul Command (haulcommand.com), the global heavy haul escort platform.

Email brief: ${brief}
Recipient: ${ctx.name ?? 'there'} at ${ctx.company ?? 'their company'}
Role: ${ctx.role}
State: ${ctx.state}

Rules:
- Subject: max 50 chars, specific and curious, no clickbait
- Body: 120–180 words. One CTA. Peer-to-peer voice.
- Sign off: "— The Haul Command Team"

Output JSON only: {"subject": string, "preview_text": string, "body_html": string, "cta_text": string, "cta_url": string}`;
}

function getStaticFallback(sequenceId: string, step: number, ctx: any) {
  const config = getStepConfig(sequenceId, step);
  return {
    subject: config?.fallback_subject ?? 'Haul Command',
    body_html: config?.fallback_html ?? '<p>Hi, checking in from the Haul Command team. <a href="https://haulcommand.com">Visit haulcommand.com →</a></p>',
  };
}
