import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { see } from '@/lib/ai/brain';
import { tracked } from '@/lib/ai/tracker';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/batch/claim-sweep
 *
 * Full-platform claim conversion sweep.
 * Runs claim-analysis in smart priority order, then sends outreach for risk >= threshold.
 *
 * Phase 1: Analyze all unclaimed listings (Gemini + Claude parallel, 5 concurrent)
 * Phase 2: Send outreach emails for listings with steal_risk_score >= min_risk
 *
 * Body: {
 *   analyze_limit?: number     (default: 100 per run — call repeatedly for full sweep)
 *   send_outreach?: boolean    (default: false — set true to actually send emails)
 *   min_risk?: number          (default: 7 — only email high-risk)
 *   dry_run?: boolean          (default: true — preview without sending)
 * }
 *
 * Full 7,745 sweep = 78 API calls (100/batch) at 5 concurrent = ~$3.87 total
 * High-risk threshold 7+ ≈ ~30% of listings ≈ 2,300 outreach emails
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const analyzeLimit = Math.min(body.analyze_limit ?? 100, 200);
  const sendOutreach = body.send_outreach ?? false;
  const minRisk = body.min_risk ?? 7;
  const dryRun = body.dry_run ?? true;

  const supabase = createClient();
  const resend = sendOutreach && !dryRun ? new Resend(process.env.RESEND_API_KEY) : null;

  // ── Phase 1: Analyze unclaimed listings ──
  const analyzeRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/claim-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.CRON_SECRET ? { Authorization: `Bearer ${process.env.CRON_SECRET}` } : {}),
    },
    body: JSON.stringify({ batch_limit: analyzeLimit }),
  });
  const analyzeData = await analyzeRes.json();

  let outreachSent = 0;
  let outreachPreviewed: any[] = [];

  // ── Phase 2: Send outreach for high-risk listings ──
  if (sendOutreach) {
    const { data: highRisk } = await supabase
      .from('listing_claim_assets')
      .select('*, listings(id, full_name, state, city, rating, review_count)')
      .gte('steal_risk_score', minRisk)
      .is('outreach_sent_at', null) // Only unsent
      .order('steal_risk_score', { ascending: false })
      .limit(50); // Max 50 emails per run

    for (const asset of highRisk ?? []) {
      if (!asset.listings) continue;

      // Look up email from existing contacts or profiles
      const { data: contact } = await supabase
        .from('listing_contacts')
        .select('email')
        .eq('listing_id', asset.listing_id)
        .single();

      const email = contact?.email;

      if (!email) {
        outreachPreviewed.push({ listing: asset.listings.full_name, note: 'no email on file' });
        continue;
      }

      if (dryRun) {
        outreachPreviewed.push({
          to: email,
          listing: asset.listings.full_name,
          risk_score: asset.steal_risk_score,
          subject: asset.email_subject,
          body_preview: asset.email_body?.slice(0, 100) + '...',
        });
        continue;
      }

      // Live send
      try {
        await resend!.emails.send({
          from: 'Haul Command <hello@haulcommand.com>',
          to: [email],
          subject: asset.email_subject,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <p>${asset.email_body?.replace(/\n/g, '<br/>')}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
            <p style="font-size:12px;color:#888">Haul Command — haulcommand.com | <a href="https://haulcommand.com/unsubscribe">Unsubscribe</a></p>
          </div>`,
          tags: [
            { name: 'campaign', value: 'claim_sweep' },
            { name: 'risk_score', value: String(asset.steal_risk_score) },
          ],
        });

        await supabase.from('listing_claim_assets')
          .update({ outreach_sent_at: new Date().toISOString() })
          .eq('listing_id', asset.listing_id);

        outreachSent++;
      } catch { /* non-fatal per email */ }
    }
  }

  return NextResponse.json({
    phase_1_analyze: analyzeData,
    phase_2_outreach: {
      enabled: sendOutreach,
      dry_run: dryRun,
      min_risk_threshold: minRisk,
      sent: outreachSent,
      previewed: outreachPreviewed,
    },
    instructions: dryRun
      ? 'This was a DRY RUN. Set dry_run: false and send_outreach: true to send real emails.'
      : `Sent ${outreachSent} outreach emails to listings with risk score >= ${minRisk}.`,
  });
}
