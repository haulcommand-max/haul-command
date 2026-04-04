import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * POST /api/dispatch/milestone
 *
 * Operator updates their active assignment status (e.g., active -> in_transit).
 * Notifies the broker.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    }

    const { assignment_id, new_status } = await req.json();

    if (!assignment_id || !new_status) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // 1. Verify ownership and current status
    const { data: assignment, error: fetchErr } = await admin
      .from('dispatch_assignments')
      .select('id, operator_user_id, status, broker_user_id, load_id')
      .eq('id', assignment_id)
      .single();

    if (fetchErr || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.operator_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this assignment' }, { status: 403 });
    }

    // Example valid transition: active -> in_transit -> completed
    const allowedTransitions: Record<string, string[]> = {
      'active': ['in_transit', 'cancelled'],
      'in_transit': ['completed', 'disputed'],
      'completed': [],
      'cancelled': [],
      'disputed': ['completed']
    };

    if (!allowedTransitions[assignment.status]?.includes(new_status)) {
      return NextResponse.json({ error: `Invalid transition from ${assignment.status} to ${new_status}` }, { status: 400 });
    }

    // 2. Perform the update
    const updatePayload: any = { status: new_status };
    if (new_status === 'in_transit') updatePayload.started_at = new Date().toISOString();
    if (new_status === 'completed') updatePayload.completed_at = new Date().toISOString();
    if (new_status === 'cancelled') updatePayload.cancelled_at = new Date().toISOString();

    const { error: updateErr } = await admin
      .from('dispatch_assignments')
      .update(updatePayload)
      .eq('id', assignment_id);

    if (updateErr) {
      console.error('[milestone] Update failed:', updateErr.message);
      return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
    }

    // 3. Notify the broker via FCM
    try {
      let title = `Assignment Update: ${new_status.toUpperCase()}`;
      let body = `The operator updated the assignment status.`;

      if (new_status === 'in_transit') {
        title = `🚚 Operator In Transit`;
        body = `Your assigned pilot car is now en route for Load ${assignment.load_id?.substring(0, 8)}.`;
      } else if (new_status === 'completed') {
        title = `✅ Route Completed`;
        body = `The operator marked the route complete. Escrow release is now eligible.`;
      }

      await admin.from('notification_queue').insert({
        user_id: assignment.broker_user_id,
        type: 'assignment_milestone',
        title,
        body,
        data: {
          assignment_id,
          load_id: assignment.load_id,
          screen: `/dashboard/broker/assignments/${assignment_id}`
        },
        channel: 'push',
        created_at: new Date().toISOString()
      });
    } catch { /* fire and forget */ }

    return NextResponse.json({ ok: true, status: new_status });

  } catch (error: any) {
    console.error('[milestone] fatal err:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
