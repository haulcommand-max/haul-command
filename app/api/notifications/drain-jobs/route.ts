import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToUser, broadcastPush } from '@/lib/notifications/push-service';
import type { NotifEventType } from '@/lib/notifications/push-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/notifications/drain-jobs
 * Drains pending notification jobs from hc_notif_jobs.
 * Called by Vercel cron (vercel.json) every 2 minutes.
 * Also callable manually via admin key.
 *
 * Architecture:
 *   DB trigger → hc_notif_jobs (pending)
 *   └─ this worker → push-service → Firebase FCM
 *
 * Decouples DB writes from HTTP calls, prevents trigger timeouts.
 */
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key');
  const isCron = req.headers.get('x-vercel-cron') === '1';
  if (!isCron && adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const BATCH_SIZE = 50;
  let processed = 0, failed = 0;

  // Claim a batch atomically
  const { data: jobs, error } = await supabase
    .from('hc_notif_jobs')
    .select('id,event_type,mode,payload')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at')
    .limit(BATCH_SIZE);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!jobs?.length) return NextResponse.json({ ok: true, processed: 0 });

  // Mark as processing
  const jobIds = jobs.map(j => j.id);
  await supabase
    .from('hc_notif_jobs')
    .update({ status: 'processing', attempts: 1 })
    .in('id', jobIds);

  for (const job of jobs) {
    try {
      const p = job.payload as any;
      if (job.mode === 'broadcast') {
        await broadcastPush({
          eventType: p.eventType as NotifEventType,
          roleKey: p.roleKey,
          countryCode: p.countryCode,
          corridorSlug: p.corridorSlug,
          title: p.title,
          body: p.body,
          deepLink: p.deepLink,
          dataPayload: p.dataPayload,
          dedupKey: p.dedupKey,
          dedupWindowHrs: p.dedupWindowHrs,
        });
      } else {
        // single user
        if (!p.userId) throw new Error('single mode requires userId');
        await sendPushToUser({
          userId: p.userId,
          eventType: p.eventType as NotifEventType,
          title: p.title,
          body: p.body,
          deepLink: p.deepLink,
          dataPayload: p.dataPayload,
          dedupKey: p.dedupKey,
          dedupWindowHrs: p.dedupWindowHrs,
          corridorSlug: p.corridorSlug,
          countryCode: p.countryCode,
          roleKey: p.roleKey,
        });
      }

      await supabase
        .from('hc_notif_jobs')
        .update({ status: 'done', processed_at: new Date().toISOString() })
        .eq('id', job.id);
      processed++;
    } catch (err: any) {
      await supabase
        .from('hc_notif_jobs')
        .update({ status: 'failed', last_error: err.message })
        .eq('id', job.id);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, processed, failed });
}
