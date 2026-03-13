/**
 * HAUL COMMAND COMMS — Channel Management API
 *
 * POST /api/comms/channel - Create channel from job, or rejoin existing
 * GET  /api/comms/channel - List user's active channels
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { CHANNEL_EXPIRE_HOURS } from '@/lib/comms/constants';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            source_id,
            display_name,
            channel_type = 'job_channel',
            role = 'escort',
        } = await req.json();

        const livekit_room_name = `hc_${channel_type}_${source_id ?? crypto.randomUUID()}`;

        // If source_id provided, check for existing active channel
        if (source_id) {
            const { data: existing } = await supabase
                .from('comms_channels')
                .select('id')
                .eq('source_id', source_id)
                .eq('is_active', true)
                .single();

            if (existing) {
                // Auto-join existing channel
                await supabase.from('comms_members').upsert(
                    {
                        channel_id: existing.id,
                        user_id: user.id,
                        display_name: display_name ?? 'Operator',
                        role,
                        left_at: null,
                    },
                    { onConflict: 'channel_id,user_id' },
                );

                return NextResponse.json({
                    channel_id: existing.id,
                    created: false,
                });
            }
        }

        const expires_at = new Date(
            Date.now() + CHANNEL_EXPIRE_HOURS * 60 * 60 * 1000,
        ).toISOString();

        // Create new channel
        const { data: channel, error } = await supabase
            .from('comms_channels')
            .insert({
                channel_type,
                source_id: source_id ?? null,
                display_name: display_name ?? 'Job Channel',
                livekit_room_name,
                expires_at,
            })
            .select('id')
            .single();

        if (error) {
            console.error('[comms/channel] Create error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Auto-add creator as first member (defaults to lead if creating)
        await supabase.from('comms_members').insert({
            channel_id: channel.id,
            user_id: user.id,
            display_name: display_name ?? 'Operator',
            role: 'lead',
        });

        return NextResponse.json(
            { channel_id: channel.id, created: true },
            { status: 201 },
        );
    } catch (error) {
        console.error('[comms/channel] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('comms_members')
            .select(`
                channel_id,
                role,
                joined_at,
                comms_channels (
                    id,
                    display_name,
                    channel_type,
                    is_active,
                    created_at,
                    source_id
                )
            `)
            .eq('user_id', user.id)
            .is('left_at', null);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Filter to only active channels
        const channels = (data ?? []).filter(
            (m: Record<string, unknown>) =>
                (m.comms_channels as Record<string, unknown>)?.is_active === true,
        );

        return NextResponse.json({ channels });
    } catch (error) {
        console.error('[comms/channel] GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
