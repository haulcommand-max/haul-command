/**
 * AVAILABILITY HOLD REQUEST — /api/availability/hold
 * 
 * Broker → Operator: "I want you for this job"
 * 
 * Flow:
 *  1. Broker submits hold request (origin, destination, date, position)
 *  2. System creates hold record in `hold_requests` table
 *  3. Push notification sent to operator
 *  4. Operator has 30 min to accept/decline via /api/availability/respond
 *  5. Auto-expires if no response
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { sendRoutedNotification } from '@/lib/notifications/channelRouter';
import { holdRequestTemplate } from '@/lib/notifications/templates';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const body = await req.json();
    const { operator_id, origin, destination, date_needed, position, load_type, notes } = body;

    if (!operator_id) {
        return NextResponse.json({ error: 'operator_id required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

    // Create hold record
    const { data: hold, error } = await admin.from('hold_requests').insert({
        broker_id: user.id,
        operator_id,
        origin: origin || '',
        destination: destination || '',
        date_needed: date_needed || null,
        position: position || 'chase',
        load_type: load_type || 'oversize',
        notes: notes || '',
        status: 'pending',
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
    }).select('id').single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger Smart Channel Router (SMS/Push/Email depending on urgency & availability)
    await sendRoutedNotification(operator_id, {
        type: 'dispatch_urgent',
        urgency: 'critical',
        title: '🔒 Urgent Hold Request',
        body: `A broker wants to book you: ${origin || '?'} → ${destination || '?'} on ${date_needed || 'TBD'}`,
        url: `/dashboard/operator/holds/${hold.id}`,
        data: {
            hold_id: hold.id,
            broker_id: user.id,
            origin,
            destination,
            position,
            expires_at: expiresAt,
        }
    }).catch(() => { /* best effort */ });

    return NextResponse.json({
        ok: true,
        hold_id: hold.id,
        status: 'pending',
        expires_at: expiresAt,
        message: 'Hold request sent. Operator has 30 minutes to respond.',
    });
}
