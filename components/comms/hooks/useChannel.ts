/**
 * useChannel — Channel join/leave/state management
 *
 * Fetches token from server, connects LiveKit transport + Supabase signaling.
 * Handles auto-join for active jobs.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type { CommsChannel, CommsPresenceMember, CommsTokenResponse } from '@/lib/comms/types';
import { LiveKitTransport } from '@/lib/comms/livekit-transport';
import { SupabaseSignaling, type SignalingCallbacks } from '@/lib/comms/supabase-signaling';
import type { SupabaseClient } from '@supabase/supabase-js';

interface UseChannelOptions {
    supabase: SupabaseClient;
    userId: string;
    displayName: string;
}

interface UseChannelReturn {
    channel: CommsChannel | null;
    members: CommsPresenceMember[];
    transport: LiveKitTransport | null;
    signaling: SupabaseSignaling | null;
    isConnected: boolean;
    isConnecting: boolean;
    joinChannel: (channelId: string) => Promise<void>;
    leaveChannel: () => Promise<void>;
    createAndJoin: (sourceId: string, displayName: string, channelType?: string) => Promise<void>;
}

export function useChannel({ supabase, userId, displayName }: UseChannelOptions): UseChannelReturn {
    const [channel, setChannel] = useState<CommsChannel | null>(null);
    const [members, setMembers] = useState<CommsPresenceMember[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    const transportRef = useRef<LiveKitTransport | null>(null);
    const signalingRef = useRef<SupabaseSignaling | null>(null);

    const joinChannel = useCallback(async (channelId: string) => {
        if (isConnecting) return;
        setIsConnecting(true);

        try {
            // Fetch token from server
            const tokenRes = await fetch('/api/comms/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel_id: channelId }),
            });

            if (!tokenRes.ok) throw new Error('Token fetch failed');
            const tokenData: CommsTokenResponse = await tokenRes.json();

            // Fetch channel details
            const { data: channelData } = await supabase
                .from('comms_channels')
                .select('*')
                .eq('id', channelId)
                .single();

            if (!channelData) throw new Error('Channel not found');

            // Create transport and connect
            const transport = new LiveKitTransport();
            await transport.connect(tokenData.room, tokenData.token);

            transport.onConnectionStateChange((state) => {
                setIsConnected(state === 'connected');
            });

            transportRef.current = transport;

            // Create signaling and join
            const signaling = new SupabaseSignaling(supabase, channelId, userId, displayName);

            const callbacks: SignalingCallbacks = {
                onPresenceSync: (m) => setMembers(m),
            };

            await signaling.join(callbacks);
            signalingRef.current = signaling;

            setChannel(channelData as CommsChannel);
            setIsConnected(true);

            // Log join event
            await signaling.logEvent('channel_joined');
        } catch (error) {
            console.error('[useChannel] Join error:', error);
            setIsConnected(false);
        } finally {
            setIsConnecting(false);
        }
    }, [supabase, userId, displayName, isConnecting]);

    const leaveChannel = useCallback(async () => {
        if (signalingRef.current) {
            await signalingRef.current.logEvent('channel_left');
            await signalingRef.current.leave();
            signalingRef.current = null;
        }

        if (transportRef.current) {
            await transportRef.current.disconnect();
            transportRef.current = null;
        }

        if (channel) {
            await supabase
                .from('comms_members')
                .update({ left_at: new Date().toISOString() })
                .eq('channel_id', channel.id)
                .eq('user_id', userId);
        }

        setChannel(null);
        setMembers([]);
        setIsConnected(false);
    }, [channel, supabase, userId]);

    const createAndJoin = useCallback(async (
        sourceId: string,
        chanDisplayName: string,
        channelType = 'job_channel',
    ) => {
        const res = await fetch('/api/comms/channel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source_id: sourceId,
                display_name: chanDisplayName,
                channel_type: channelType,
            }),
        });

        if (!res.ok) throw new Error('Channel creation failed');
        const { channel_id } = await res.json();
        await joinChannel(channel_id);
    }, [joinChannel]);

    return {
        channel,
        members,
        transport: transportRef.current,
        signaling: signalingRef.current,
        isConnected,
        isConnecting,
        joinChannel,
        leaveChannel,
        createAndJoin,
    };
}
