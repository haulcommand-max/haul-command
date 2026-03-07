'use client';

/**
 * usePresenceChannel — Real-Time Presence via Supabase Realtime
 *
 * Signals:
 *   - Last heartbeat age badge ("2 min ago")
 *   - Available-now count per state (live)
 *   - Live radius rings on map (future)
 *   - Ghost mode (privacy toggle)
 *   - Idle detection (auto-offline after X min no heartbeat)
 *
 * Architecture:
 *   - Each escort joins a "presence:escorts" channel on mount
 *   - Shares: { user_id, state, lat, lng, status, last_heartbeat }
 *   - Host (broker/map) subscribes and gets live presenceState
 *   - Heartbeat interval: 30s (configurable)
 *   - Auto-offline: after 5 min no heartbeat
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PresenceUser {
    user_id: string;
    display_name?: string;
    state?: string;
    lat?: number;
    lng?: number;
    status: 'available' | 'busy' | 'offline';
    last_heartbeat: string; // ISO
    ghost_mode?: boolean;
}

export interface PresenceState {
    /** All currently tracked escorts */
    users: PresenceUser[];
    /** Count of available escorts per state */
    countByState: Record<string, number>;
    /** Total online count */
    totalOnline: number;
    /** Whether the channel is connected */
    connected: boolean;
}

interface UsePresenceOptions {
    /** If true, this client is an escort and will BROADCAST its own presence */
    broadcast?: boolean;
    /** Escort's own state code (e.g. "FL") */
    myState?: string;
    /** Escort's lat/lng */
    myLat?: number;
    myLng?: number;
    /** Escort's current status */
    myStatus?: 'available' | 'busy' | 'offline';
    /** If true, hides from public presence list */
    ghostMode?: boolean;
    /** Heartbeat interval in ms (default 30s) */
    heartbeatMs?: number;
    /** Auto-offline threshold in ms (default 5 min) */
    autoOfflineMs?: number;
}

const CHANNEL_NAME = 'presence:escorts';
const DEFAULT_HEARTBEAT_MS = 30_000;
const DEFAULT_AUTO_OFFLINE_MS = 300_000; // 5 min

// ── Hook ───────────────────────────────────────────────────────────────────────

export function usePresenceChannel(options: UsePresenceOptions = {}): PresenceState {
    const {
        broadcast = false,
        myState, myLat, myLng,
        myStatus = 'available',
        ghostMode = false,
        heartbeatMs = DEFAULT_HEARTBEAT_MS,
        autoOfflineMs = DEFAULT_AUTO_OFFLINE_MS,
    } = options;

    const [presence, setPresence] = useState<PresenceState>({
        users: [],
        countByState: {},
        totalOnline: 0,
        connected: false,
    });

    const channelRef = useRef<RealtimeChannel | null>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Derive counts from user list
    const deriveState = useCallback((users: PresenceUser[]): PresenceState => {
        const now = Date.now();
        // Filter out stale users (no heartbeat in autoOfflineMs)
        const active = users.filter(u => {
            const age = now - new Date(u.last_heartbeat).getTime();
            return age < autoOfflineMs && !u.ghost_mode;
        });

        const countByState: Record<string, number> = {};
        for (const u of active) {
            if (u.state && u.status === 'available') {
                countByState[u.state] = (countByState[u.state] ?? 0) + 1;
            }
        }

        return {
            users: active,
            countByState,
            totalOnline: active.length,
            connected: true,
        };
    }, [autoOfflineMs]);

    useEffect(() => {
        const supabase = createClient();

        const channel = supabase.channel(CHANNEL_NAME, {
            config: { presence: { key: 'escorts' } },
        });

        // Subscribe to presence sync events
        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState<PresenceUser>();
                // Flatten: state is { escorts: [...] }
                const allUsers: PresenceUser[] = [];
                for (const key of Object.keys(state)) {
                    const entries = state[key] as any[];
                    for (const entry of entries) {
                        allUsers.push(entry);
                    }
                }
                setPresence(deriveState(allUsers));
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                // Join event — individual users
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                // Leave event — user disconnected
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    setPresence(prev => ({ ...prev, connected: true }));

                    // If broadcasting, track own presence
                    if (broadcast && !ghostMode) {
                        await channel.track({
                            user_id: (await supabase.auth.getUser()).data.user?.id ?? 'anon',
                            display_name: undefined,
                            state: myState,
                            lat: myLat,
                            lng: myLng,
                            status: myStatus,
                            last_heartbeat: new Date().toISOString(),
                            ghost_mode: false,
                        });

                        // Heartbeat: re-track every N seconds to keep presence alive
                        heartbeatRef.current = setInterval(async () => {
                            await channel.track({
                                user_id: (await supabase.auth.getUser()).data.user?.id ?? 'anon',
                                state: myState,
                                lat: myLat,
                                lng: myLng,
                                status: myStatus,
                                last_heartbeat: new Date().toISOString(),
                                ghost_mode: false,
                            });
                        }, heartbeatMs);
                    }
                } else if (status === 'CHANNEL_ERROR') {
                    setPresence(prev => ({ ...prev, connected: false }));
                }
            });

        channelRef.current = channel;

        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            channel.unsubscribe();
        };
    }, [broadcast, myState, myLat, myLng, myStatus, ghostMode, heartbeatMs, deriveState]);

    return presence;
}

// ── PresenceBadge Component ────────────────────────────────────────────────────

export function PresenceBadge({ lastHeartbeat }: { lastHeartbeat: string }) {
    const [age, setAge] = useState('');

    useEffect(() => {
        function update() {
            const sec = Math.floor((Date.now() - new Date(lastHeartbeat).getTime()) / 1000);
            if (sec < 60) setAge('Just now');
            else if (sec < 3600) setAge(`${Math.floor(sec / 60)}m ago`);
            else setAge(`${Math.floor(sec / 3600)}h ago`);
        }
        update();
        const timer = setInterval(update, 10_000);
        return () => clearInterval(timer);
    }, [lastHeartbeat]);

    const sec = (Date.now() - new Date(lastHeartbeat).getTime()) / 1000;
    const color = sec < 120 ? '#22c55e' : sec < 600 ? '#fbbf24' : '#64748b';

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 8px', borderRadius: 6,
            background: `${color}15`, border: `1px solid ${color}30`,
            fontSize: 10, fontWeight: 700, color,
        }}>
            <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: color,
                boxShadow: sec < 120 ? `0 0 6px ${color}` : 'none',
            }} />
            {age}
        </span>
    );
}

// ── PresenceCounter — shows "X available in [State]" ───────────────────────────

export function PresenceCounter({ stateCode, className = '' }: { stateCode: string; className?: string }) {
    const presence = usePresenceChannel();
    const count = presence.countByState[stateCode] ?? 0;

    return (
        <div className={className} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            background: count > 0 ? 'rgba(34,197,94,0.08)' : 'rgba(100,116,139,0.08)',
            border: `1px solid ${count > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(100,116,139,0.15)'}`,
        }}>
            <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: count > 0 ? '#22c55e' : '#475569',
                animation: count > 0 ? 'pulse 2s ease-in-out infinite' : 'none',
            }} />
            <span style={{
                fontSize: 12, fontWeight: 800,
                color: count > 0 ? '#22c55e' : '#64748b',
                fontFeatureSettings: '"tnum"',
            }}>
                {count} available in {stateCode}
            </span>
            {presence.connected && (
                <span style={{ fontSize: 8, color: '#22c55e' }}>● LIVE</span>
            )}
            <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }`}</style>
        </div>
    );
}
