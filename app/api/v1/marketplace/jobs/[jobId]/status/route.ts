// app/api/v1/marketplace/jobs/[jobId]/status/route.ts
//
// PATCH /api/v1/marketplace/jobs/{jobId}/status
// Handles state transitions: confirmed → in_progress, cancellation, etc.
// ============================================================

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { cancelBookingPayment } from '@/lib/marketplace/booking-payment';

export const runtime = 'nodejs';

const VALID_TRANSITIONS: Record<string, string[]> = {
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
};

interface StatusBody {
  status: 'in_progress' | 'cancelled';
  reason?: string;
  actor_id?: string;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const supabase = getSupabaseAdmin();
  const { jobId } = await params;

  let body: StatusBody;
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
  const currentStatus = jobData.status;
  const allowed = VALID_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(body.status)) {
    return NextResponse.json(
      { error: `Cannot transition from '${currentStatus}' to '${body.status}'` },
      { status: 409 }
    );
  }

  // Handle cancellation
  if (body.status === 'cancelled') {
    const cancelResult = await cancelBookingPayment(jobId, body.reason ?? 'cancelled');

    await supabase
      .from('jobs')
      .update({
        status: 'cancelled',
        audit_trail: [
          ...(jobData.audit_trail ?? []),
          {
            action: 'job_cancelled',
            ts: new Date().toISOString(),
            actor: body.actor_id ?? 'system',
            details: { reason: body.reason, payment_result: cancelResult },
          },
        ],
      })
      .eq('job_id', jobId);

    // Release operators
    const escorts = jobData.assigned_escort_ids ?? [];
    if (escorts.length) {
      await supabase
        .from('operator_availability')
        .update({ availability_status: 'available', updated_at: new Date().toISOString() })
        .in('operator_id', escorts);
    }

    return NextResponse.json({
      ok: true,
      job_id: jobId,
      status: 'cancelled',
      payment_cancelled: cancelResult.success,
    });
  }

  // Handle in_progress transition
  await supabase
    .from('jobs')
    .update({
      status: body.status,
      audit_trail: [
        ...(jobData.audit_trail ?? []),
        {
          action: `status_${body.status}`,
          ts: new Date().toISOString(),
          actor: body.actor_id ?? 'system',
        },
      ],
    })
    .eq('job_id', jobId);

  return NextResponse.json({
    ok: true,
    job_id: jobId,
    status: body.status,
  });
}
