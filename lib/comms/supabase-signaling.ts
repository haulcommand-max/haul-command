/**
 * HAUL COMMAND COMMS — Supabase Signaling (Control Plane)
 *
 * This is the CONTROL PLANE — NOT the media plane.
 * Handles: presence, who's talking, quick-calls, emergency broadcasts, channel state.
 *
 * NEVER stream audio through Supabase Broadcast.
 * Audio goes through LiveKit WebRTC media (see livekit-transport.ts).
 */

import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { QuickCall, QuickCallType, CommsEventType, CommsPresenceMember } from './types';
import { SUPABASE_COMMS_CHANNEL_PREFIX } from './constants';

export interface SignalingCallbacks {
    onQuickCall?: (qc: QuickCall) => void;
    onTalkingChanged?: (userId: string, talking: boolean) => void;
    onEmergency?: (senderId: string, senderName: string) => void;
    onPresenceSync?: (members: CommsPresenceMember[]) => void;
}

export class SupabaseSignaling {
    private channel: RealtimeChannel | null = null;
    private supabase: SupabaseClient;
    private channelId: string;
    private userId: string;
    private displayName: string;

    constructor(
        supabase: SupabaseClient,
        channelId: string,
        userId: string,
        displayName: string,
    ) {
        this.supabase = supabase;
        this.channelId = channelId;
        this.userId = userId;
        this.displayName = displayName;
    }

    async join(callbacks: SignalingCallbacks): Promise<void> {
        const name = `${SUPABASE_COMMS_CHANNEL_PREFIX}${this.channelId}`;

        this.channel = this.supabase.channel(name, {
            config: { presence: { key: this.userId } },
        });

        this.channel
            .on('broadcast', { event: 'quick_call' }, ({ payload }) => {
                callbacks.onQuickCall?.(payload as QuickCall);
            })
            .on('broadcast', { event: 'talking' }, ({ payload }) => {
                callbacks.onTalkingChanged?.(payload.user_id, payload.talking);
            })
            .on('broadcast', { event: 'emergency' }, ({ payload }) => {
                callbacks.onEmergency?.(payload.sender_id, payload.sender_name);
            })
            .on('presence', { event: 'sync' }, () => {
                if (!this.channel) return;
                const state = this.channel.presenceState();
                const members: CommsPresenceMember[] = [];
                for (const entries of Object.values(state)) {
                    for (const e of entries as Record<string, unknown>[]) {
                        members.push({
                            user_id: e.user_id as string,
                            display_name: e.display_name as string,
                            talking: (e.talking as boolean) ?? false,
                        });
                    }
                }
                callbacks.onPresenceSync?.(members);
            });

        await this.channel.subscribe();
        await this.channel.track({
            user_id: this.userId,
            display_name: this.displayName,
            talking: false,
        });
    }

    /** Broadcast talking state change (ephemeral, via Supabase Broadcast + Presence) */
    async broadcastTalking(talking: boolean): Promise<void> {
        if (!this.channel) return;
        await this.channel.send({
            type: 'broadcast',
            event: 'talking',
            payload: { user_id: this.userId, talking },
        });
        await this.channel.track({
            user_id: this.userId,
            display_name: this.displayName,
            talking,
        });
    }

    /** Send a quick-call — broadcast for real-time + persist for replay */
    async sendQuickCall(callType: QuickCallType): Promise<void> {
        const qc = {
            channel_id: this.channelId,
            sender_id: this.userId,
            sender_name: this.displayName,
            call_type: callType,
            sent_at: new Date().toISOString(),
        };

        // Broadcast for instant delivery (control plane)
        await this.channel?.send({
            type: 'broadcast',
            event: 'quick_call',
            payload: qc,
        });

        // Persist to DB for replay (async, don't block)
        this.supabase.from('comms_quick_calls').insert(qc).then();
    }

    /** Emergency broadcast — high priority event */
    async sendEmergency(): Promise<void> {
        await this.channel?.send({
            type: 'broadcast',
            event: 'emergency',
            payload: {
                sender_id: this.userId,
                sender_name: this.displayName,
                sent_at: new Date().toISOString(),
            },
        });
        await this.logEvent('emergency_broadcast_sent');
    }

    /** Log a comms event to the analytics pipeline */
    async logEvent(
        eventType: CommsEventType,
        metadata: Record<string, unknown> = {},
    ): Promise<void> {
        this.supabase.from('comms_events').insert({
            event_type: eventType,
            channel_id: this.channelId,
            user_id: this.userId,
            metadata,
        }).then();
    }

    async leave(): Promise<void> {
        if (!this.channel) return;
        await this.channel.untrack();
        await this.channel.unsubscribe();
        this.channel = null;
    }

    getChannel(): RealtimeChannel | null {
        return this.channel;
    }
}
