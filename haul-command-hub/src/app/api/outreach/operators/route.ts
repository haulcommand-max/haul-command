import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

/**
 * POST /api/outreach/operators
 * 
 * Triggers batch outreach to operators who haven't been contacted.
 * Sends Email 1 (claim profile invitation) via Listmonk.
 * 
 * Headers: Authorization: Bearer hc_cron_2026_s3cure_r4ndom_k3y_9x
 * Body: { limit?: number, campaign_type?: string }
 */

const CRON_KEY = process.env.HC_CRON_KEY ?? 'hc_cron_2026_s3cure_r4ndom_k3y_9x';

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.includes(CRON_KEY)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const limit = body.limit ?? 50;
    const campaignType = body.campaign_type ?? 'claim_profile';

    const sb = supabaseServer();
    const listmonkUrl = process.env.LISTMONK_URL ?? 'https://listmonk.haulcommand.com';
    const listmonkUser = process.env.LISTMONK_API_USER ?? 'admin';
    const listmonkPass = process.env.LISTMONK_API_PASSWORD;

    if (!listmonkPass) {
      return NextResponse.json({ error: 'LISTMONK_API_PASSWORD not configured' }, { status: 500 });
    }

    // Get operators who haven't been emailed yet
    // Assumes hc_places table has: email, name, admin1_code, claim_status
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

        // Send via Listmonk transactional API
        const emailRes = await fetch(`${listmonkUrl}/api/tx`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(`${listmonkUser}:${listmonkPass}`),
          },
          body: JSON.stringify({
            subscriber_email: op.email,
            template_id: 1, // Email 1 template
            data: {
              operator_name: op.name,
              state: stateName,
              claim_url: claimUrl,
              services: op.surface_category_key ?? 'Pilot Car Services',
            },
            content_type: 'richtext',
            messenger: 'email',
          }),
        });

        if (emailRes.ok) {
          // Log the send
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
          const errText = await emailRes.text().catch(() => 'unknown');
          results.errors.push(`${op.id}: ${errText}`);
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`${op.id}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      message: `Outreach batch complete`,
      operators_found: operators.length,
      operators_sent: results.sent,
      operators_failed: results.failed,
      operators_skipped: sentIds.size,
      errors: results.errors.slice(0, 5), // Limit error output
    });
  } catch (err) {
    console.error('Outreach error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
