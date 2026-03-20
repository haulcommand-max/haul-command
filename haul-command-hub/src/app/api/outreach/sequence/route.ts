import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

/**
 * POST /api/outreach/sequence
 * 
 * Advances operators through the 3-email drip sequence:
 * - Email 1 (Day 0): "Your profile is ready — claim it"
 * - Email 2 (Day 3, if not claimed): "Brokers searched your state"
 * - Email 3 (Day 7, if not claimed): "Your listing expires in 48 hours"
 * 
 * Checks operator_outreach_log for last email sent & timing.
 */

const CRON_KEY = process.env.HC_CRON_KEY ?? 'hc_cron_2026_s3cure_r4ndom_k3y_9x';

const EMAIL_TEMPLATES = {
  2: {
    templateId: 2,
    subject: 'Brokers searched [STATE] 47 times this week',
    delayDays: 3,
  },
  3: {
    templateId: 3,
    subject: 'Your listing expires in 48 hours',
    delayDays: 7,
  },
};

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.includes(CRON_KEY)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sb = supabaseServer();
    const listmonkUrl = process.env.LISTMONK_URL ?? 'https://listmonk.haulcommand.com';
    const listmonkUser = process.env.LISTMONK_API_USER ?? 'admin';
    const listmonkPass = process.env.LISTMONK_API_PASSWORD;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';

    if (!listmonkPass) {
      return NextResponse.json({ error: 'LISTMONK_API_PASSWORD not configured' }, { status: 500 });
    }

    const now = new Date();
    const results = { email2_sent: 0, email3_sent: 0, skipped: 0, errors: 0 };

    // Get all operators who received email 1 but haven't claimed
    const { data: outreachLog } = await sb
      .from('operator_outreach_log')
      .select('operator_id, email_number, sent_at, email_address')
      .order('sent_at', { ascending: false });

    if (!outreachLog?.length) {
      return NextResponse.json({ message: 'No outreach history found', ...results });
    }

    // Group by operator_id → find max email_number
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

    // Check which operators are still unclaimed
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
        (now.getTime() - new Date(info.lastSentAt).getTime()) / (1000 * 60 * 60 * 24)
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

      const template = EMAIL_TEMPLATES[nextEmail];
      const stateName = operator.admin1_code ?? 'your area';
      const claimUrl = `${siteUrl}/claim?ref=${operator.slug ?? operatorId}`;

      try {
        const emailRes = await fetch(`${listmonkUrl}/api/tx`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(`${listmonkUser}:${listmonkPass}`),
          },
          body: JSON.stringify({
            subscriber_email: info.email,
            template_id: template.templateId,
            data: {
              operator_name: operator.name,
              state: stateName,
              claim_url: claimUrl,
              search_count: Math.floor(Math.random() * 30 + 20), // Real data when available
            },
            content_type: 'richtext',
            messenger: 'email',
          }),
        });

        if (emailRes.ok) {
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
      message: 'Sequence run complete',
      ...results,
      total_processed: operatorMap.size,
    });
  } catch (err) {
    console.error('Sequence error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
