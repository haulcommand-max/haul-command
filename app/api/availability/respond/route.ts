/**
 * AVAILABILITY RESPOND — /api/availability/respond
 * 
 * Operator → Accept/Decline hold request
 * 
 * Quick accept/decline workflow — single tap from push notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { trySendNotification } from '@/lib/notifications/fcm';
import { holdResponseTemplate } from '@/lib/notifications/templates';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const { hold_id, action } = await req.json();

    if (!hold_id || !['accept', 'decline'].includes(action)) {
        return NextResponse.json({ error: 'hold_id and action (accept/decline) required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Verify hold exists and belongs to this operator
    const { data: hold, error: fetchErr } = await admin
        .from('hold_requests')
        .select('*')
        .eq('id', hold_id)
        .eq('operator_id', user.id)
        .single();

    if (fetchErr || !hold) {
        return NextResponse.json({ error: 'Hold request not found' }, { status: 404 });
    }

    if (hold.status !== 'pending') {
        return NextResponse.json({ error: `Hold already ${hold.status}` }, { status: 409 });
    }

    // Check if expired
    if (new Date(hold.expires_at) < new Date()) {
        await admin.from('hold_requests').update({
            status: 'expired',
            responded_at: new Date().toISOString(),
        }).eq('id', hold_id);
        return NextResponse.json({ error: 'Hold request expired' }, { status: 410 });
    }

    // Update hold status
    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    await admin.from('hold_requests').update({
        status: newStatus,
        responded_at: new Date().toISOString(),
    }).eq('id', hold_id);

    // FCM push notification to broker (instant delivery)
    const opProfile = await admin.from('profiles').select('display_name').eq('id', user.id).single();
    const fcmResponse = holdResponseTemplate({
        operatorName: opProfile.data?.display_name || 'An operator',
        accepted: action === 'accept',
        holdId: hold_id,
    });
    trySendNotification({ userId: hold.broker_id, ...fcmResponse }).catch(() => {});

    // Notify broker of response (fallback queue)
    try {
        await admin.from('notification_queue').insert({
            user_id: hold.broker_id,
            type: `hold_${newStatus}`,
            title: action === 'accept' ? '✅ Hold Accepted!' : '❌ Hold Declined',
            body: action === 'accept'
                ? `Operator accepted your hold for ${hold.origin} → ${hold.destination}`
                : `Operator declined your hold request. Search for other escorts.`,
            data: {
                hold_id,
                operator_id: user.id,
                status: newStatus,
            },
            channel: 'push',
            created_at: new Date().toISOString(),
        });
    } catch { /* non-blocking */ }

    // If accepted, mark operator as booked
    if (action === 'accept' && hold.date_needed) {
        await admin.from('profiles').update({
            booked_until: hold.date_needed,
            updated_at: new Date().toISOString(),
        }).eq('id', user.id);
    }

    return NextResponse.json({
        ok: true,
        hold_id,
        status: newStatus,
        message: action === 'accept'
            ? 'Hold accepted! Broker has been notified.'
            : 'Hold declined. Broker will search for alternatives.',
    });
}
