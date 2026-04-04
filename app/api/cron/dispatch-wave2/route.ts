import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { trySendBulkNotification, dispatchWaveTemplate } from '@/lib/notifications/fcm';

export const runtime = 'nodejs';

/**
 * GET /api/cron/dispatch-wave2
 *
 * Runs every 5 minutes.
 * Finds dispatch_requests that are stuck in wave 1 (matching for > 15 mins).
 * Upgrades them to wave 2, sets wave2_at = now(), and notifies the next 5 candidates.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Optional cron secret guard (if configured)
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('Authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); // uncomment when CRON_SECRET is fully enforced
    }

    const admin = getSupabaseAdmin();
    // 15 minutes ago
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    // 2. Fetch stale wave-1 dispatches
    // Using the index: idx_dispatch_requests_wave_status_created
    const { data: staleDispatches, error: fetchErr } = await admin
      .from('dispatch_requests')
      .select('id, origin, destination, load_type, candidates, broker_id, load_id')
      .eq('status', 'matching')
      .eq('wave', 1)
      .is('wave2_at', null)
      .lte('created_at', fifteenMinsAgo);

    if (fetchErr) {
      console.error('[cron/dispatch-wave2] fetch error:', fetchErr.message);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!staleDispatches || staleDispatches.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, message: 'No stale wave-1 dispatches.' });
    }

    let processedCount = 0;

    // 3. Process each dispatch sequentially
    for (const dispatch of staleDispatches) {
      const candidates: string[] = dispatch.candidates || [];
      const wave2Candidates = candidates.slice(5, 10); // next 5

      // Escalate to wave 2 unconditionally (even if 0 candidates left, we mark it so we don't process it over and over)
      const { error: updateErr } = await admin
        .from('dispatch_requests')
        .update({
          wave: 2,
          wave2_at: new Date().toISOString(),
          fill_probability: Math.max(0, candidates.length > 5 ? 0.35 : 0.05),
          updated_at: new Date().toISOString(),
        })
        .eq('id', dispatch.id);

      if (updateErr) {
        console.error(`[cron/dispatch-wave2] Error updating dispatch ${dispatch.id}:`, updateErr.message);
        continue;
      }

      processedCount++;

      if (wave2Candidates.length > 0) {
        // FCM push to candidates
        const fcmTemplate = dispatchWaveTemplate({
          origin: dispatch.origin,
          destination: dispatch.destination,
          waveNumber: 2,
          loadType: dispatch.load_type,
          requestId: dispatch.id,
        });
        
        trySendBulkNotification(wave2Candidates, fcmTemplate)
          .catch(err => console.warn('[cron/dispatch-wave2] FCM error:', err));

        // Queue notifications fallback
        for (const candidateId of wave2Candidates) {
          try {
            await admin.from('notification_queue').insert({
              user_id: candidateId,
              type: 'dispatch_match',
              title: `⚡ URGENT: Wave 2 Load Match`,
              body: `${dispatch.load_type}: ${dispatch.origin} → ${dispatch.destination}`,
              data: {
                dispatch_id: dispatch.id,
                load_id: dispatch.load_id,
                screen: '/dispatch',
              },
              channel: 'push',
              created_at: new Date().toISOString(),
            });
          } catch { /* skip */ }
        }
      } else {
        // No candidates left, notify broker
        try {
          await admin.from('notification_queue').insert({
            user_id: dispatch.broker_id,
            type: 'dispatch_alert',
            title: `⚠️ No Match for ${dispatch.load_type}`,
            body: `Wave 1 and 2 completed. No remaining compatible operators. Use the 'Available Now' feed to find alternatives.`,
            data: {
              dispatch_id: dispatch.id,
              screen: '/dashboard/broker/loads',
            },
            channel: 'push',
            created_at: new Date().toISOString(),
          });
        } catch { /* skip */ }
      }
    }

    return NextResponse.json({
      ok: true,
      processed: processedCount,
    });
  } catch (err: any) {
    console.error('[cron/dispatch-wave2] fatal error:', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
