/**
 * HAUL COMMAND COMMS — Emergency Broadcast API
 *
 * POST /api/comms/emergency
 * Body: { channel_id: string }
 *
 * Broadcasts emergency event to all channel members.
 * Persists event for audit trail.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { channel_id } = await req.json();

        if (!channel_id) {
            return NextResponse.json(
                { error: 'channel_id is required' },
                { status: 400 },
            );
        }

        // Verify membership
        const { data: member } = await supabase
            .from('comms_members')
            .select('display_name')
            .eq('channel_id', channel_id)
            .eq('user_id', user.id)
            .is('left_at', null)
            .single();

        if (!member) {
            return NextResponse.json(
                { error: 'Not a channel member' },
                { status: 403 },
            );
        }

        // Log emergency event
        await supabase.from('comms_events').insert({
            event_type: 'emergency_broadcast_sent',
            channel_id,
            user_id: user.id,
            metadata: {
                sender_name: member.display_name,
                timestamp: new Date().toISOString(),
            },
        });

        return NextResponse.json({ sent: true });
    } catch (error) {
        console.error('[comms/emergency] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
