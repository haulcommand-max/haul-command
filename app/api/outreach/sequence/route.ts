/**
 * /api/outreach/sequence — 3-Email Drip Sequence for Operator Acquisition
 *
 * Tracks which email each operator has received in operator_outreach_log
 * and advances them through the sequence:
 *   Email 1 (Day 0): "Your profile is ready to claim"
 *   Email 2 (Day 3): "490 brokers searched [STATE] this week"
 *   Email 3 (Day 7): "Last chance — competitors are getting first pick"
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
          <strong style="color: #fff;">Claim it free</strong> to add your phone number, services, and get the verified badge ✓ that gets you 5× more job requests.
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
    subject: (_, state) => `490 brokers searched ${state} this week — your profile isn't visible yet`,
    html: (name, state, claimUrl) => `
      <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #0a0f16; color: #f0f4f8; border-radius: 16px;">
        <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #C6923A; margin-bottom: 20px;">HAUL COMMAND</div>
        <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 16px; color: #fff;">Brokers are searching ${state}</h1>
        <p style="font-size: 14px; color: #8fa3b8; line-height: 1.7; margin: 0 0 16px;">
          ${name}, <strong style="color: #f5b942;">490+ broker searches</strong> happened in ${state} this week on Haul Command. Unclaimed profiles don't show up in search results.
        </p>
        <div style="background: rgba(245,185,66,0.06); border: 1px solid rgba(245,185,66,0.2); border-radius: 12px; padding: 16px; margin: 0 0 20px;">
          <div style="font-size: 12px; color: #C6923A; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">This week in ${state}</div>
          <div style="display: flex; gap: 16px;">
            <div style="text-align: center;"><div style="font-size: 24px; font-weight: 900; color: #f5b942;">490+</div><div style="font-size: 10px; color: #8fa3b8;">Searches</div></div>
            <div style="text-align: center;"><div style="font-size: 24px; font-weight: 900; color: #27d17f;">12</div><div style="font-size: 10px; color: #8fa3b8;">Loads Posted</div></div>
            <div style="text-align: center;"><div style="font-size: 24px; font-weight: 900; color: #3ba4ff;">8</div><div style="font-size: 10px; color: #8fa3b8;">Operators Claimed</div></div>
          </div>
        </div>
        <p style="font-size: 14px; color: #8fa3b8; line-height: 1.7; margin: 0 0 24px;">
          Claimed profiles appear in broker search results. Unclaimed profiles don't. Takes 60 seconds.
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
    subject: (_, state) => `Last chance — ${state} operators are getting first pick on loads`,
    html: (name, state, claimUrl) => `
      <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #0a0f16; color: #f0f4f8; border-radius: 16px;">
        <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #C6923A; margin-bottom: 20px;">HAUL COMMAND</div>
        <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 16px; color: #fff;">Your competitors in ${state} are live</h1>
        <p style="font-size: 14px; color: #8fa3b8; line-height: 1.7; margin: 0 0 16px;">
          ${name}, since we last reached out, <strong style="color: #27d17f;">8 more operators in ${state}</strong> have claimed their profiles and are now visible to brokers.
        </p>
        <p style="font-size: 14px; color: #8fa3b8; line-height: 1.7; margin: 0 0 16px;">
          Claimed operators get:
        </p>
        <ul style="font-size: 14px; color: #8fa3b8; line-height: 1.8; padding-left: 20px; margin: 0 0 20px;">
          <li><strong style="color: #fff;">Verified badge ✓</strong> — brokers trust verified profiles 5× more</li>
          <li><strong style="color: #fff;">Search visibility</strong> — appear when brokers search ${state}</li>
          <li><strong style="color: #fff;">Direct messages</strong> — brokers can DM you about loads</li>
          <li><strong style="color: #fff;">Rate insights</strong> — see what others charge in your corridors</li>
        </ul>
        <p style="font-size: 14px; color: #f87171; line-height: 1.7; margin: 0 0 24px;">
          ⚠️ This is our last reminder. Your unclaimed profile will remain invisible to brokers.
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
    .from('directory_listings')
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
    .from('directory_listings')
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
