/**
 * /api/outreach/sequence — 3-Email Drip Sequence for Operator Acquisition
 *
 * Tracks which email each operator has received in operator_outreach_log
 * and advances them through the sequence:
 *   Email 1 (Day 0): "Your profile is ready to claim"
 *   Email 2 (Day 3): "Brokers are searching [STATE]"
 *   Email 3 (Day 7): "Keep your profile accurate"
 *
 * POST: Execute sequence for a batch of operators (called by cron)
 * GET:  Dry-run preview showing who would get which email
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const RESEND_KEY = process.env.RESEND_API_KEY ?? '';

// ── Email Templates ──────────────────────────────────────────────
interface EmailTemplate {
  step: number;
  subject: (name: string, state: string) => string;
  html: (name: string, state: string, claimUrl: string) => string;
  delayDays: number;
}

const SEQUENCE: EmailTemplate[] = [
  {
    step: 1,
    delayDays: 0,
    subject: (name) => `${name}, your Haul Command profile is ready to claim`,
    html: (name, state, claimUrl) => `
      <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #0a0f16; color: #f0f4f8; border-radius: 16px;">
        <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #C6923A; margin-bottom: 20px;">HAUL COMMAND</div>
        <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 16px; color: #fff;">Your profile is ready to claim</h1>
        <p style="font-size: 14px; color: #8fa3b8; line-height: 1.7; margin: 0 0 16px;">
          Hey ${name}, we've created a directory profile for you based on public licensing records in <strong style="color: #f5b942;">${state}</strong>.
        </p>
        <p style="font-size: 14px; color: #8fa3b8; line-height: 1.7; margin: 0 0 8px;">Your profile includes:</p>
        <ul style="font-size: 14px; color: #8fa3b8; line-height: 1.8; padding-left: 20px; margin: 0 0 20px;">
          <li>Your company name and service area</li>
          <li>Corridor coverage based on ${state}</li>
          <li>Contact visibility for brokers searching your area</li>
        </ul>
        <p style="font-size: 14px; color: #8fa3b8; line-height: 1.7; margin: 0 0 24px;">
          <strong style="color: #fff;">Claim it free</strong> to add your public contact path, services, proof details, and service-area corrections so brokers can evaluate the record with better source context.
        </p>
        <a href="${claimUrl}" style="display: inline-block; padding: 14px 32px; border-radius: 12px; background: linear-gradient(135deg, #C6923A, #8A6428); color: #000; font-weight: 800; font-size: 14px; text-decoration: none;">
          Claim Your Profile →
        </a>
        <p style="font-size: 11px; color: #556070; margin-top: 24px;">
          You're receiving this because your business is listed in the ${state} pilot car/escort operator registry. 
          <a href="https://haulcommand.com/unsubscribe" style="color: #556070;">Unsubscribe</a>
        </p>
      </div>`,
  },
  {
    step: 2,
    delayDays: 3,
    subject: (_, state) => `Brokers are searching ${state} — make sure your profile is accurate`,
    html: (name, state, claimUrl) => `
      <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #0a0f16; color: #f0f4f8; border-radius: 16px;">
        <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #C6923A; margin-bottom: 20px;">HAUL COMMAND</div>
        <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 16px; color: #fff;">Brokers are searching ${state}</h1>
        <p style="font-size: 14px; color: #8fa3b8; line-height: 1.7; margin: 0 0 16px;">
          ${name}, brokers use Haul Command to compare escort and heavy-haul support options in ${state}. Unclaimed profiles may be missing service areas, proof details, and preferred contact paths.
        </p>
        <div style="background: rgba(245,185,66,0.06); border: 1px solid rgba(245,185,66,0.2); border-radius: 12px; padding: 16px; margin: 0 0 20px;">
          <div style="font-size: 12px; color: #C6923A; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Profile fields brokers check</div>
          <div style="display: flex; gap: 16px;">
            <div style="text-align: center;"><div style="font-size: 18px; font-weight: 900; color: #f5b942;">Services</div><div style="font-size: 10px; color: #8fa3b8;">Listed clearly</div></div>
            <div style="text-align: center;"><div style="font-size: 18px; font-weight: 900; color: #27d17f;">Proof</div><div style="font-size: 10px; color: #8fa3b8;">Source-backed</div></div>
            <div style="text-align: center;"><div style="font-size: 18px; font-weight: 900; color: #3ba4ff;">Contact</div><div style="font-size: 10px; color: #8fa3b8;">Current path</div></div>
          </div>
        </div>
        <p style="font-size: 14px; color: #8fa3b8; line-height: 1.7; margin: 0 0 24px;">
          Claimed profiles can be corrected, completed, and reviewed with better public context. It takes about a minute to start.
        </p>
        <a href="${claimUrl}" style="display: inline-block; padding: 14px 32px; border-radius: 12px; background: linear-gradient(135deg, #C6923A, #8A6428); color: #000; font-weight: 800; font-size: 14px; text-decoration: none;">
          Claim Now — Free →
        </a>
        <p style="font-size: 11px; color: #556070; margin-top: 24px;">
          <a href="https://haulcommand.com/unsubscribe" style="color: #556070;">Unsubscribe</a>
        </p>
      </div>`,
  },
  {
    step: 3,
    delayDays: 7,
    subject: (_, state) => `Keep your ${state} Haul Command profile accurate`,
    html: (name, state, claimUrl) => `
      <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #0a0f16; color: #f0f4f8; border-radius: 16px;">
        <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #C6923A; margin-bottom: 20px;">HAUL COMMAND</div>
        <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 16px; color: #fff;">Your ${state} profile still needs review</h1>
        <p style="font-size: 14px; color: #8fa3b8; line-height: 1.7; margin: 0 0 16px;">
          ${name}, your listing may be missing service areas, equipment, proof details, or a current public contact path. Claiming lets you correct the record instead of leaving brokers to interpret incomplete data.
        </p>
        <p style="font-size: 14px; color: #8fa3b8; line-height: 1.7; margin: 0 0 16px;">
          Claimed operators can add:
        </p>
        <ul style="font-size: 14px; color: #8fa3b8; line-height: 1.8; padding-left: 20px; margin: 0 0 20px;">
          <li><strong style="color: #fff;">Claim status</strong> — show who can maintain the profile</li>
          <li><strong style="color: #fff;">Service areas</strong> — correct the markets and corridors you actually serve</li>
          <li><strong style="color: #fff;">Contact path</strong> — give brokers a safer way to request support</li>
          <li><strong style="color: #fff;">Proof details</strong> — add evidence that can be reviewed before dispatch</li>
        </ul>
        <p style="font-size: 14px; color: #f87171; line-height: 1.7; margin: 0 0 24px;">
          This is the last reminder in this sequence. Your unclaimed profile may remain incomplete until you or our team corrects it.
        </p>
        <a href="${claimUrl}" style="display: inline-block; padding: 14px 32px; border-radius: 12px; background: linear-gradient(135deg, #C6923A, #8A6428); color: #000; font-weight: 800; font-size: 14px; text-decoration: none;">
          Claim Your Profile — Last Chance →
        </a>
        <p style="font-size: 11px; color: #556070; margin-top: 24px;">
          <a href="https://haulcommand.com/unsubscribe" style="color: #556070;">Unsubscribe</a>
        </p>
      </div>`,
  },
];

// ── POST: Execute sequence ────────────────────────────────────────
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  const validTokens = [process.env.CRON_SECRET, process.env.HC_ADMIN_SECRET].filter(Boolean);
  if (!validTokens.includes(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Number(body.limit ?? 30), 100);
  const dryRun = body.dry_run === true;

  const sb = getSupabaseAdmin();

  // Get all operators with contact info
  const { data: operators } = await sb
    .from('hc_global_operators')
    .select('id, name, city, region_code, country_code')
    .not('id', 'is', null)
    .neq('claim_status', 'claimed')
    .neq('claim_status', 'verified')
    .order('rank_score', { ascending: false, nullsFirst: false })
    .limit(limit * 3);

  // Get outreach log to see who's been sent what
  const { data: logs } = await sb
    .from('operator_outreach_log')
    .select('operator_id, campaign_type, sent_at')
    .eq('campaign_type', 'claim_sequence');

  // Build a map: operator_id → { maxStep, lastSentAt }
  const sentMap = new Map<string, { maxStep: number; lastSentAt: Date }>();
  for (const log of (logs ?? [])) {
    const opId = log.operator_id;
    // Parse step from campaign type like "claim_sequence_step_2"
    const existing = sentMap.get(opId);
    if (!existing) {
      sentMap.set(opId, { maxStep: 1, lastSentAt: new Date(log.sent_at) });
    } else {
      existing.maxStep++;
      const logDate = new Date(log.sent_at);
      if (logDate > existing.lastSentAt) existing.lastSentAt = logDate;
    }
  }

  const actions: { operator: string; state: string; step: number; status: string }[] = [];
  const now = Date.now();

  for (const op of (operators ?? []).slice(0, limit)) {
    const sent = sentMap.get(op.id);
    const state = op.region_code || 'US';
    const name = op.name || 'Operator';
    const claimUrl = `https://haulcommand.com/claim?id=${op.id}`;

    let nextStep: EmailTemplate | undefined;

    if (!sent) {
      // Never emailed — send step 1
      nextStep = SEQUENCE[0];
    } else if (sent.maxStep < 3) {
      // Check if enough days have passed for the next step
      const nextTemplate = SEQUENCE[sent.maxStep];
      const daysSinceLastSend = (now - sent.lastSentAt.getTime()) / 86400000;
      if (daysSinceLastSend >= nextTemplate.delayDays) {
        nextStep = nextTemplate;
      }
    }
    // If maxStep >= 3, sequence is complete

    if (!nextStep) continue;

    if (dryRun) {
      actions.push({ operator: name, state, step: nextStep.step, status: 'would_send' });
      continue;
    }

    // Send via Resend
    if (RESEND_KEY) {
      try {
        // We need the operator's email - query profiles for it
        const { data: profile } = await sb
          .from('profiles')
          .select('email')
          .eq('id', op.id)
          .single();

        const email = profile?.email;
        if (!email) {
          actions.push({ operator: name, state, step: nextStep.step, status: 'no_email' });
          continue;
        }

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Haul Command <noreply@haulcommand.com>',
            to: email,
            subject: nextStep.subject(name, state),
            html: nextStep.html(name, state, claimUrl),
          }),
        });

        // Log the send
        await sb.from('operator_outreach_log').insert({
          operator_id: op.id,
          operator_name: name,
          email,
          campaign_type: 'claim_sequence',
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

        actions.push({ operator: name, state, step: nextStep.step, status: 'sent' });
      } catch (err: any) {
        actions.push({ operator: name, state, step: nextStep.step, status: `error: ${err.message?.slice(0, 50)}` });
      }
    } else {
      // Log without sending
      await sb.from('operator_outreach_log').insert({
        operator_id: op.id,
        operator_name: name,
        campaign_type: 'claim_sequence',
        status: 'queued',
        sent_at: new Date().toISOString(),
      });
      actions.push({ operator: name, state, step: nextStep.step, status: 'queued_no_resend' });
    }
  }

  return NextResponse.json({
    ok: true,
    dry_run: dryRun,
    processed: actions.length,
    by_step: {
      step_1: actions.filter(a => a.step === 1).length,
      step_2: actions.filter(a => a.step === 2).length,
      step_3: actions.filter(a => a.step === 3).length,
    },
    actions: actions.slice(0, 20), // Preview first 20
    resend_configured: !!RESEND_KEY,
  });
}

// ── GET: Dry-run preview ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  const validTokens = [process.env.CRON_SECRET, process.env.HC_ADMIN_SECRET].filter(Boolean);
  if (!validTokens.includes(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Redirect to POST with dry_run flag by providing preview data
  const sb = getSupabaseAdmin();

  const { count: totalUnclaimed } = await sb
    .from('hc_global_operators')
    .select('*', { count: 'exact', head: true })
    .neq('claim_status', 'claimed')
    .neq('claim_status', 'verified');

  const { count: totalLogged } = await sb
    .from('operator_outreach_log')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_type', 'claim_sequence');

  return NextResponse.json({
    total_unclaimed_operators: totalUnclaimed ?? 0,
    total_sequence_emails_sent: totalLogged ?? 0,
    resend_configured: !!RESEND_KEY,
    sequence: SEQUENCE.map(s => ({
      step: s.step,
      delay_days: s.delayDays,
      subject_template: s.subject('{name}', '{state}'),
    })),
    usage: 'POST /api/outreach/sequence with { limit: 30, dry_run: true } for preview',
  });
}
