import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

/**
 * POST /api/leads/route-check-capture
 *
 * Called after a user submits the Route Check tool.
 * Captures the lead with query context, enrolls them in appropriate
 * email sequence, and notifies admin for high-value leads.
 *
 * This is the primary conversion hook from the inbound machine.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, company, query, state, load_type, source = 'route-check' } = body;

    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    const supabase = createClient();

    // 1. Upsert lead record
    const { data: lead } = await supabase.from('leads').upsert({
      email,
      name: name ?? null,
      company: company ?? null,
      source,
      context: { query, state, load_type },
      lead_score: scoreLeadIntent({ query, load_type, company }),
    }, { onConflict: 'email', ignoreDuplicates: false }).select().single();

    // 2. Mark route_check query as converted (if query_id provided)
    if (body.query_id) {
      await supabase.from('route_check_queries')
        .update({ converted: true })
        .eq('id', body.query_id);
    }

    // 3. Enroll in email sequence based on lead intent
    const sequenceId = detectSequence({ query, load_type, company });
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron/email-sequences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        sequence_id: sequenceId,
        trigger_event: 'route_check_lead',
        context: { name, company, state, query, source },
      }),
    }).then(()=>{}); // non-fatal

    // 4. High-value lead alert (AV operators, large companies)
    const isHighValue = isHighValueLead({ query, company, load_type });
    if (isHighValue && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Haul Command Leads <leads@haulcommand.com>',
        to: ['max@haulcommand.com'],
        subject: `🔥 High-value lead: ${company ?? email}`,
        html: `<p><strong>Email:</strong> ${email}</p>
<p><strong>Company:</strong> ${company ?? '—'}</p>
<p><strong>Query:</strong> ${query}</p>
<p><strong>State:</strong> ${state ?? '—'}</p>
<p><strong>Load type:</strong> ${load_type ?? '—'}</p>
<p><strong>Score:</strong> ${scoreLeadIntent({ query, load_type, company })}</p>`,
      }).then(()=>{});
    }

    return NextResponse.json({
      success: true,
      sequence_enrolled: sequenceId,
      lead_score: (lead as any)?.lead_score,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Scoring and routing logic ───────────────────────────────────────

function scoreLeadIntent(ctx: { query?: string; load_type?: string; company?: string }): number {
  let score = 1;
  const q = (ctx.query ?? '').toLowerCase();
  const co = (ctx.company ?? '').toLowerCase();

  // AV terms = highest value
  if (/autonomous|aurora|kodiak|waymo|av truck|self-driving/.test(q + co)) score += 5;
  // Overweight / superload
  if (/superload|super load|overweight|200k|300k|wide load/.test(q)) score += 3;
  // Multi-state, cross-country
  if (/multiple state|cross.country|interstate|canada|mexico/.test(q)) score += 2;
  // Company name present
  if (ctx.company && ctx.company.length > 2) score += 2;
  // Load type is oversize
  if (ctx.load_type === 'oversize' || ctx.load_type === 'superload') score += 1;

  return Math.min(score, 10);
}

function detectSequence(ctx: { query?: string; load_type?: string; company?: string }): string {
  const q = (ctx.query ?? '').toLowerCase();
  const co = (ctx.company ?? '').toLowerCase();

  if (/autonomous|aurora|kodiak|waymo|av truck|certification|training/.test(q + co)) {
    return 'corporate_training_visitor';
  }
  if (/broker|dispatch|post.*load|find.*escort/.test(q)) {
    return 'broker_no_post';
  }
  return 'new_operator_onboarding';
}

function isHighValueLead(ctx: { query?: string; company?: string; load_type?: string }): boolean {
  const combined = `${ctx.query ?? ''} ${ctx.company ?? ''}`.toLowerCase();
  return /aurora|kodiak|waymo|ryder|swift|schneider|convoy|uber|amazon|walmart|tesla|autonomous|superload|200k|300k|enterprise|corporation|corp|inc\.|llc|logistics/.test(combined);
}
