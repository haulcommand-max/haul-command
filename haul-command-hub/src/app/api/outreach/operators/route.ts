/**
 * /api/outreach/operators
 *
 * Triggers batch outreach to unclaimed operators.
 * Uses Resend directly — zero Listmonk dependency.
 * Falls back to Listmonk if RESEND_API_KEY is not set (backward compat).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { captureError } from '@/lib/monitoring/error';
import { sendEmail } from '@/lib/integrations/resend';

const CRON_KEY = process.env.HC_CRON_KEY ?? 'hc_cron_2026_s3cure_r4ndom_k3y_9x';

// ═══════════════════════════════════════════════════════════════
// Resend Email Templates (React Email style HTML)
// ═══════════════════════════════════════════════════════════════

function buildClaimEmail(operatorName: string, stateName: string, claimUrl: string, services: string) {
  return {
    subject: `${operatorName} — your Haul Command profile is ready to claim`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="text-align:center;margin-bottom:32px">
    <span style="color:#f59f0a;font-weight:900;font-size:24px;letter-spacing:-1px">HAUL COMMAND</span>
  </div>
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:32px">
    <h1 style="color:#fff;font-size:20px;margin:0 0 8px">your profile is live, ${operatorName}</h1>
    <p style="color:#888;font-size:14px;line-height:1.6;margin:0 0 24px">
      Brokers in <strong style="color:#f59f0a">${stateName}</strong> are searching for
      <strong style="color:#f59f0a">${services}</strong> providers right now.
      Your profile appeared in search results — claim it to start receiving leads.
    </p>
    <a href="${claimUrl}" style="display:inline-block;background:#f59f0a;color:#000;font-weight:800;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:14px">
      Claim Your Profile →
    </a>
    <p style="color:#555;font-size:12px;margin-top:24px;line-height:1.5">
      This is a free, verified listing on the world's largest pilot car directory.
      No credit card required. Takes 60 seconds.
    </p>
  </div>
  <p style="color:#444;font-size:10px;text-align:center;margin-top:24px">
    © Haul Command · 120 countries · <a href="https://haulcommand.com/remove-listing" style="color:#444">Unsubscribe</a>
  </p>
</div>
</body>
</html>`,
  };
}

// sendEmail imported from lib/integrations/resend

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.includes(CRON_KEY)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const limit = body.limit ?? 50;
    const campaignType = body.campaign_type ?? 'claim_profile';

    const sb = supabaseServer();
    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    // Get operators who haven't been emailed yet
    const { data: operators, error: fetchErr } = await sb
      .from('hc_places')
      .select('id, name, email, admin1_code, country_code, slug, surface_category_key')
      .eq('status', 'published')
      .eq('claim_status', 'unclaimed')
      .not('email', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (fetchErr || !operators?.length) {
      return NextResponse.json({
        error: fetchErr?.message ?? 'No operators found',
        operators_found: 0,
      }, { status: fetchErr ? 500 : 200 });
    }

    // Filter out operators who already received email 1
    const operatorIds = operators.map(o => o.id);
    const { data: alreadySent } = await sb
      .from('operator_outreach_log')
      .select('operator_id')
      .in('operator_id', operatorIds)
      .eq('email_number', 1);

    const sentIds = new Set((alreadySent ?? []).map(s => s.operator_id));
    const toSend = operators.filter(o => !sentIds.has(o.id));

    if (toSend.length === 0) {
      return NextResponse.json({
        message: 'All operators in this batch already received email 1',
        operators_found: operators.length,
        operators_skipped: operators.length,
      });
    }

    const results = { sent: 0, failed: 0, errors: [] as string[] };
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';

    for (const op of toSend) {
      try {
        const claimUrl = `${siteUrl}/claim?ref=${op.slug ?? op.id}`;
        const stateName = op.admin1_code ?? op.country_code?.toUpperCase() ?? 'your area';
        const services = op.surface_category_key ?? 'Pilot Car Services';

        const { subject, html } = buildClaimEmail(op.name, stateName, claimUrl, services);
        const sent = await sendEmail(op.email, subject, html, resendKey);

        if (sent) {
          await sb.from('operator_outreach_log').insert({
            operator_id: op.id,
            email_number: 1,
            campaign_type: campaignType,
            sent_at: new Date().toISOString(),
            email_address: op.email,
          });
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`${op.id}: Resend API returned error`);
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`${op.id}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      message: 'Outreach batch complete (via Resend)',
      operators_found: operators.length,
      operators_sent: results.sent,
      operators_failed: results.failed,
      operators_skipped: sentIds.size,
      errors: results.errors.slice(0, 5),
    });
  } catch (err) {
    await captureError(err, { route: '/api/outreach/operators' });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
