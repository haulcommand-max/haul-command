'use client';
/**
 * CommsProvider — Root Context for Haul Command Comms
 *
 * Wraps LiveKit transport + Supabase signaling + hooks into a single
 * React context for any page to consume.
 *
 * Usage:
 * <CommsProvider supabase={supabase} userId={user.id} displayName={user.name}>
 *   <CommsFAB {...} />
 * </CommsProvider>
 */

'use client';

import React, { createContext, useContext, useMemo, useCallback, useState } from 'react';
import type {
    CommsChannel,
    CommsStatus,
    CommsPresenceMember,
    QuickCallType,
    PTTState,
} from '@/lib/comms/types';
import type { LiveKitTransport } from '@/lib/comms/livekit-transport';
import type { SupabaseSignaling } from '@/lib/comms/supabase-signaling';
import type { SupabaseClient } from '@supabase/supabase-js';

import { useChannel } from './hooks/useChannel';
import { usePTT } from './hooks/usePTT';
import { useQuickCalls } from './hooks/useQuickCalls';
import { useCommsStatus } from './hooks/useCommsStatus';
import { useAudioDevice } from './hooks/useAudioDevice';

// ── Context Type ─────────────────────────────────────────────────────────────

interface CommsContextType {
    // Channel
    channel: CommsChannel | null;
    members: CommsPresenceMember[];
    isConnected: boolean;
    isConnecting: boolean;
    joinChannel: (channelId: string) => Promise<void>;
    leaveChannel: () => Promise<void>;
    createAndJoin: (sourceId: string, displayName: string, channelType?: string) => Promise<void>;

    // PTT
    pttState: PTTState;
    startTalking: () => void;
    stopTalking: () => void;

    // Quick-calls
    sendQuickCall: (type: QuickCallType) => Promise<void>;
    lastQuickCall: import('@/lib/comms/types').QuickCall | null;

    // Status
    status: CommsStatus;

    // Audio device
    currentAudioRoute: import('@/lib/comms/types').DeviceRoute;
    setAudioRoute: (route: import('@/lib/comms/types').DeviceRoute) => void;
    hasWiredHeadset: boolean;

    // Emergency
    sendEmergency: () => Promise<void>;

    // Raw refs (for advanced usage)
    transport: LiveKitTransport | null;
    signaling: SupabaseSignaling | null;
}

const CommsContext = createContext<CommsContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

interface CommsProviderProps {
    supabase: SupabaseClient;
    userId: string;
    displayName: string;
    children: React.ReactNode;
}

export function CommsProvider({ supabase, userId, displayName, children }: CommsProviderProps) {
    const [hasInternet] = useState(true); // Phase 2: detect network state

    // Channel management
    const channelHook = useChannel({ supabase, userId, displayName });

    // PTT state machine
    const pttHook = usePTT({
        transport: channelHook.transport,
        signaling: channelHook.signaling,
        enabled: channelHook.isConnected,
    });

    // Quick-calls
    const quickCallsHook = useQuickCalls({
        signaling: channelHook.signaling,
    });

    // Connection status (ephemeral)
    const status = useCommsStatus({
        transportState: channelHook.isConnected ? 'connected' : null,
        hasInternetConnection: hasInternet,
    });

    // Audio device routing
    const audioHook = useAudioDevice();

    // Emergency
    const sendEmergency = useCallback(async () => {
        await channelHook.signaling?.sendEmergency();
    }, [channelHook.signaling]);

    const value = useMemo<CommsContextType>(() => ({
        // Channel
        channel: channelHook.channel,
        members: channelHook.members,
        isConnected: channelHook.isConnected,
        isConnecting: channelHook.isConnecting,
        joinChannel: channelHook.joinChannel,
        leaveChannel: channelHook.leaveChannel,
        createAndJoin: channelHook.createAndJoin,

        // PTT
        pttState: pttHook.state,
        startTalking: pttHook.startTalking,
        stopTalking: pttHook.stopTalking,

        // Quick-calls
        sendQuickCall: quickCallsHook.sendQuickCall,
        lastQuickCall: quickCallsHook.lastCall,

        // Status
        status,

        // Audio
        currentAudioRoute: audioHook.currentRoute,
        setAudioRoute: audioHook.setRoute,
        hasWiredHeadset: audioHook.hasWiredHeadset,

        // Emergency
        sendEmergency,

        // Raw refs
        transport: channelHook.transport,
        signaling: channelHook.signaling,
    }), [channelHook, pttHook, quickCallsHook, status, audioHook, sendEmergency]);

    return (
        <CommsContext.Provider value={value}>
            {children}
        </CommsContext.Provider>
    );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useComms(): CommsContextType {
    const ctx = useContext(CommsContext);
    if (!ctx) throw new Error('useComms must be used within a <CommsProvider>');
    return ctx;
}
