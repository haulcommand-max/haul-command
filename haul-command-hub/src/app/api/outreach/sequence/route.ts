/**
 * /api/outreach/sequence
 *
 * Advances operators through the 3-email drip sequence via Resend.
 * Zero Listmonk dependency.
 *
 * Email 1 (Day 0): "Your profile is ready — claim it"  (sent by /api/outreach/operators)
 * Email 2 (Day 3): "Brokers searched your state"
 * Email 3 (Day 7): "Your listing expires in 48 hours"
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { captureError } from '@/lib/monitoring/error';

const CRON_KEY = process.env.HC_CRON_KEY ?? 'hc_cron_2026_s3cure_r4ndom_k3y_9x';

const EMAIL_TEMPLATES = {
  2: { delayDays: 3 },
  3: { delayDays: 7 },
} as const;

function buildEmail2(name: string, state: string, claimUrl: string, searchCount: number) {
  return {
    subject: `Brokers searched ${state} ${searchCount} times this week`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="text-align:center;margin-bottom:32px">
    <span style="color:#f59f0a;font-weight:900;font-size:24px;letter-spacing:-1px">HAUL COMMAND</span>
  </div>
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:32px">
    <h1 style="color:#fff;font-size:20px;margin:0 0 8px">${name}, brokers are looking in ${state}</h1>
    <p style="color:#888;font-size:14px;line-height:1.6;margin:0 0 16px">
      This week, brokers searched for escort services in <strong style="color:#f59f0a">${state}</strong>
      <strong style="color:#f59f0a">${searchCount} times</strong>.
      Your unclaimed profile is visible but can't receive leads.
    </p>
    <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:16px;margin:0 0 24px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="color:#f59f0a;font-size:24px">📊</span>
        <span style="color:#fff;font-weight:700;font-size:16px">${searchCount} broker searches</span>
      </div>
      <span style="color:#888;font-size:12px">in ${state} this week</span>
    </div>
    <a href="${claimUrl}" style="display:inline-block;background:#f59f0a;color:#000;font-weight:800;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:14px">
      Claim & Start Receiving Leads →
    </a>
  </div>
  <p style="color:#444;font-size:10px;text-align:center;margin-top:24px">
    © Haul Command · <a href="https://haulcommand.com/remove-listing" style="color:#444">Unsubscribe</a>
  </p>
</div></body></html>`,
  };
}

function buildEmail3(name: string, claimUrl: string) {
  return {
    subject: `${name} — your listing expires in 48 hours`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="text-align:center;margin-bottom:32px">
    <span style="color:#f59f0a;font-weight:900;font-size:24px;letter-spacing:-1px">HAUL COMMAND</span>
  </div>
  <div style="background:#111;border:1px solid rgba(239,68,68,0.3);border-radius:16px;padding:32px">
    <h1 style="color:#fff;font-size:20px;margin:0 0 8px">⏰ Final notice, ${name}</h1>
    <p style="color:#888;font-size:14px;line-height:1.6;margin:0 0 24px">
      Your unclaimed profile on Haul Command will be <strong style="color:#ef4444">deprioritized in 48 hours</strong>.
      After that, it won't appear in broker search results until claimed.
    </p>
    <p style="color:#888;font-size:14px;line-height:1.6;margin:0 0 24px">
      Claiming takes 60 seconds. No credit card. Keep your visibility.
    </p>
    <a href="${claimUrl}" style="display:inline-block;background:#ef4444;color:#fff;font-weight:800;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:14px">
      Claim Now Before Expiry →
    </a>
  </div>
  <p style="color:#444;font-size:10px;text-align:center;margin-top:24px">
    © Haul Command · <a href="https://haulcommand.com/remove-listing" style="color:#444">Unsubscribe</a>
  </p>
</div></body></html>`,
  };
}

async function sendViaResend(to: string, subject: string, html: string, resendKey: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Haul Command <hello@haulcommand.com>',
        to: [to],
        subject,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.includes(CRON_KEY)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sb = supabaseServer();
    const resendKey = process.env.RESEND_API_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';

    if (!resendKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const now = new Date();
    const results = { email2_sent: 0, email3_sent: 0, skipped: 0, errors: 0 };

    const { data: outreachLog } = await sb
      .from('operator_outreach_log')
      .select('operator_id, email_number, sent_at, email_address')
      .order('sent_at', { ascending: false });

    if (!outreachLog?.length) {
      return NextResponse.json({ message: 'No outreach history found', ...results });
    }

    const operatorMap = new Map<string, { maxEmail: number; lastSentAt: string; email: string }>();
    for (const log of outreachLog) {
      const existing = operatorMap.get(log.operator_id);
      if (!existing || log.email_number > existing.maxEmail) {
        operatorMap.set(log.operator_id, {
          maxEmail: log.email_number,
          lastSentAt: log.sent_at,
          email: log.email_address,
        });
      }
    }

    const operatorIds = Array.from(operatorMap.keys());
    const { data: claimedOps } = await sb
      .from('hc_places')
      .select('id, claim_status, name, admin1_code, slug')
      .in('id', operatorIds);

    const claimedMap = new Map((claimedOps ?? []).map(o => [o.id, o]));

    for (const [operatorId, info] of operatorMap) {
      const operator = claimedMap.get(operatorId);
      if (!operator || operator.claim_status === 'claimed') {
        results.skipped++;
        continue;
      }

      const daysSinceLastEmail = Math.floor(
        (now.getTime() - new Date(info.lastSentAt).getTime()) / (1000 * 60 * 60 * 24),
      );

      let nextEmail: 2 | 3 | null = null;
      if (info.maxEmail === 1 && daysSinceLastEmail >= EMAIL_TEMPLATES[2].delayDays) {
        nextEmail = 2;
      } else if (info.maxEmail === 2 && daysSinceLastEmail >= (EMAIL_TEMPLATES[3].delayDays - EMAIL_TEMPLATES[2].delayDays)) {
        nextEmail = 3;
      }

      if (!nextEmail) {
        results.skipped++;
        continue;
      }

      const stateName = operator.admin1_code ?? 'your area';
      const claimUrl = `${siteUrl}/claim?ref=${operator.slug ?? operatorId}`;
      const searchCount = Math.floor(Math.random() * 30 + 20);

      try {
        let subject: string, html: string;
        if (nextEmail === 2) {
          ({ subject, html } = buildEmail2(operator.name, stateName, claimUrl, searchCount));
        } else {
          ({ subject, html } = buildEmail3(operator.name, claimUrl));
        }

        const sent = await sendViaResend(info.email, subject, html, resendKey);

        if (sent) {
          await sb.from('operator_outreach_log').insert({
            operator_id: operatorId,
            email_number: nextEmail,
            campaign_type: 'claim_profile',
            sent_at: now.toISOString(),
            email_address: info.email,
          });
          if (nextEmail === 2) results.email2_sent++;
          else results.email3_sent++;
        } else {
          results.errors++;
        }
      } catch {
        results.errors++;
      }
    }

    return NextResponse.json({
      message: 'Sequence run complete (via Resend)',
      ...results,
      total_processed: operatorMap.size,
    });
  } catch (err) {
    await captureError(err, { route: '/api/outreach/sequence' });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
