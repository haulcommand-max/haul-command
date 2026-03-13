/**
 * HAUL COMMAND COMMS — Token API Route
 *
 * POST /api/comms/token
 * Body: { channel_id: string }
 *
 * Verifies:
 * 1. User is authenticated
 * 2. User is a current member of the channel (left_at IS NULL)
 * 3. Channel is active
 *
 * Returns: { token, room, wsUrl }
 *
 * Tokens are SHORT-LIVED (1h). Server-issued only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { mintRoomToken } from '@/lib/comms/token-server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { channel_id } = body;

        if (!channel_id) {
            return NextResponse.json(
                { error: 'channel_id is required' },
                { status: 400 }
            );
        }

        // Verify membership (must be an active member with no left_at)
        const { data: member, error: memberError } = await supabase
            .from('comms_members')
            .select('channel_id, display_name')
            .eq('channel_id', channel_id)
            .eq('user_id', user.id)
            .is('left_at', null)
            .single();

        if (memberError || !member) {
            return NextResponse.json(
                { error: 'Not a channel member' },
                { status: 403 }
            );
        }

        // Get channel's LiveKit room name and verify active
        const { data: channel, error: channelError } = await supabase
            .from('comms_channels')
            .select('livekit_room_name, is_active')
            .eq('id', channel_id)
            .single();

        if (channelError || !channel) {
            return NextResponse.json(
                { error: 'Channel not found' },
                { status: 404 }
            );
        }

        if (!channel.is_active) {
            return NextResponse.json(
                { error: 'Channel is no longer active' },
                { status: 410 }
            );
        }

        // Mint server-issued token
        const token = await mintRoomToken(
            channel.livekit_room_name,
            user.id,
            member.display_name,
        );

        return NextResponse.json({
            token,
            room: channel.livekit_room_name,
            wsUrl: process.env.LIVEKIT_WS_URL || process.env.NEXT_PUBLIC_LIVEKIT_WS_URL,
        });

    } catch (error) {
        console.error('[comms/token] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
