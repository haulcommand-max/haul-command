// app/api/v1/marketplace/jobs/[jobId]/complete/route.ts
//
// POST /api/v1/marketplace/jobs/{jobId}/complete
// P0 Gap #6: Job completion flow
// confirmed → in_progress → completed → payout_ready → review_requested
// ============================================================

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { captureBookingPayment, createPayoutRecords } from '@/lib/marketplace/booking-payment';
import { notifyJobCompleted, requestReviews } from '@/lib/marketplace/booking-notifications';
import MARKETPLACE_JOBS from '@/lib/marketplace/trigger-jobs';
import BookingEvents from '@/lib/analytics/booking-events';
import { deactivateJobTracking } from '@/lib/telematics/job-tracking';

export const runtime = 'nodejs';

interface CompleteBody {
  completed_by: 'broker' | 'operator' | 'system';
  notes?: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const supabase = getSupabaseAdmin();
  const { jobId } = await params;

  let body: CompleteBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Fetch job
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('*')
    .eq('job_id', jobId)
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const jobData = job as any;

  // Validate state transition
  if (!['confirmed', 'in_progress'].includes(jobData.status)) {
    return NextResponse.json(
      { error: `Cannot complete job in status '${jobData.status}'` },
      { status: 409 }
    );
  }

  // ── 1. Capture payment ──
  let paymentCaptured = false;
  if (jobData.stripe_payment_intent_id && jobData.payment_status === 'authorized') {
    const captureResult = await captureBookingPayment(jobId);
    paymentCaptured = captureResult.success;
    if (!captureResult.success) {
      console.error(`[JobComplete] Payment capture failed for job ${jobId}:`, captureResult.error);
      // Don't block completion — payment can be retried manually
    }
  } else if (jobData.payment_status === 'captured') {
    paymentCaptured = true;
  }

  // ── 2. Update job status to completed ──
  await supabase
    .from('jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      audit_trail: [
        ...(jobData.audit_trail ?? []),
        {
          action: 'job_completed',
          ts: new Date().toISOString(),
          actor: body.completed_by,
          details: {
            notes: body.notes ?? null,
            payment_captured: paymentCaptured,
          },
        },
      ],
    })
    .eq('job_id', jobId);

  // ── 3. Create payout records ──
  const payouts = await createPayoutRecords(jobId);

  // ── 4. Release operators ──
  const escorts = jobData.assigned_escort_ids ?? [];
  if (escorts.length) {
    await supabase
      .from('operator_availability')
      .update({
        availability_status: 'available',
        updated_at: new Date().toISOString(),
      })
      .in('operator_id', escorts);

    // Decrement active job count
    try {
      await supabase.rpc('decrement_active_job_count', {
        operator_ids: escorts,
      });
    } catch {
      console.warn('[JobComplete] decrement_active_job_count RPC not available');
    }
  }

  // ── 5. Notify all parties ──
  const brokerId = jobData.broker_id;
  if (brokerId) {
    await notifyJobCompleted({
      job_id: jobId,
      broker_id: brokerId,
      escort_ids: escorts,
      payment_captured: paymentCaptured,
    }).then(()=>{});
  }

  // ── 6. Deactivate tracking ──
  deactivateJobTracking(jobId).catch(() => {});

  // ── 7. Request reviews via Trigger.dev (1hr delay) ──
  if (brokerId) {
    const triggerResult = await MARKETPLACE_JOBS.scheduleReviewRequest(jobId, brokerId, escorts)
      .catch(() => ({ jobId: 'fallback' }));

    // Fallback: if Trigger.dev is not available, fire immediately
    if (triggerResult.jobId.startsWith('local-') || triggerResult.jobId.startsWith('failed-')) {
      requestReviews({
        job_id: jobId,
        broker_id: brokerId,
        escort_ids: escorts,
      }).catch((err) => console.error('[JobComplete] Review request failed:', err));
    }

    // Schedule payout check (72h)
    MARKETPLACE_JOBS.schedulePayoutCheck(jobId).catch(() => {});
  }

  // ── 8. PostHog analytics ──
  BookingEvents.jobCompleted(brokerId || 'system', {
    job_id: jobId,
    payment_captured: paymentCaptured,
  }).then(()=>{});

  for (const escortId of escorts) {
    BookingEvents.payoutReady(escortId, {
      job_id: jobId,
      amount_cents: (jobData.net_payout_cents || 0) / escorts.length,
    }).then(()=>{});
  }

  return NextResponse.json({
    ok: true,
    job_id: jobId,
    status: 'completed',
    payment_captured: paymentCaptured,
    payouts_created: payouts.length,
    payout_status: 'payout_ready',
    review_requested: !!brokerId,
    escorts_released: escorts.length,
  });
}
