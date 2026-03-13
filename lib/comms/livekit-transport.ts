/**
 * HAUL COMMAND COMMS — LiveKit Audio Transport
 *
 * WebRTC media transport via LiveKit.
 * Handles: audio track publish/mute, active speaker detection, reconnection.
 *
 * This is the MEDIA PLANE — actual voice audio.
 * Signaling/presence/quick-calls go through Supabase Realtime (control plane).
 *
 * Uses `livekit-client` SDK (NOT @livekit/components-react — that's web-only).
 * For React Native: use @livekit/react-native + @livekit/react-native-webrtc.
 */

import {
    Room,
    RoomEvent,
    ConnectionState,
    type LocalAudioTrack,
    createLocalAudioTrack,
    type RemoteParticipant,
} from 'livekit-client';

import type { ICommsTransport, TransportConnectionState } from './types';
import { PTT_TIMEOUT_MS } from './constants';

export class LiveKitTransport implements ICommsTransport {
    private room: Room;
    private localAudioTrack: LocalAudioTrack | null = null;
    private transmitTimeout: ReturnType<typeof setTimeout> | null = null;
    private remoteAudioCb: ((userId: string, speaking: boolean) => void) | null = null;
    private connectionCb: ((state: TransportConnectionState) => void) | null = null;

    constructor() {
        this.room = new Room({
            adaptiveStream: true,
            dynacast: true,
            audioCaptureDefaults: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            },
        });

        // Connection state mapping
        this.room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
            const mapped: TransportConnectionState =
                state === ConnectionState.Connected ? 'connected'
                    : state === ConnectionState.Reconnecting ? 'reconnecting'
                        : 'disconnected';
            this.connectionCb?.(mapped);
        });

        // Active speaker detection
        this.room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
            if (!this.remoteAudioCb) return;
            const speakingIds = new Set(speakers.map(s => s.identity));
            for (const p of this.room.remoteParticipants.values()) {
                this.remoteAudioCb(p.identity, speakingIds.has(p.identity));
            }
        });

        // Participant events for UI updates
        this.room.on(RoomEvent.ParticipantConnected, (_p: RemoteParticipant) => {
            // Handled via Supabase Presence, not here
        });
    }

    async connect(roomName: string, token: string): Promise<void> {
        const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL;
        if (!wsUrl) throw new Error('NEXT_PUBLIC_LIVEKIT_WS_URL not set');

        await this.room.connect(wsUrl, token);

        // Pre-create audio track but keep it MUTED until PTT press
        this.localAudioTrack = await createLocalAudioTrack({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
        });

        await this.room.localParticipant.publishTrack(this.localAudioTrack);
        await this.localAudioTrack.mute();
    }

    async disconnect(): Promise<void> {
        if (this.transmitTimeout) {
            clearTimeout(this.transmitTimeout);
            this.transmitTimeout = null;
        }
        if (this.localAudioTrack) {
            this.localAudioTrack.stop();
            this.localAudioTrack = null;
        }
        await this.room.disconnect();
    }

    async startTransmit(): Promise<void> {
        if (!this.localAudioTrack) return;
        await this.localAudioTrack.unmute();

        // Safety: auto-stop after PTT_TIMEOUT_MS to prevent accidental open mics
        this.transmitTimeout = setTimeout(() => {
            this.stopTransmit();
        }, PTT_TIMEOUT_MS);
    }

    async stopTransmit(): Promise<void> {
        if (this.transmitTimeout) {
            clearTimeout(this.transmitTimeout);
            this.transmitTimeout = null;
        }
        if (!this.localAudioTrack) return;
        await this.localAudioTrack.mute();
    }

    isSpeaking(): boolean {
        return this.localAudioTrack ? !this.localAudioTrack.isMuted : false;
    }

    onRemoteAudio(cb: (userId: string, speaking: boolean) => void): void {
        this.remoteAudioCb = cb;
    }

    onConnectionStateChange(cb: (state: TransportConnectionState) => void): void {
        this.connectionCb = cb;
    }

    /** Get the underlying LiveKit Room for advanced operations */
    getRoom(): Room {
        return this.room;
    }
}
