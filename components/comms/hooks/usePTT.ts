/**
 * usePTT — Push-to-Talk State Machine
 *
 * State flow: IDLE → (press) → REQUESTING → (granted) → TALKING → (release) → IDLE
 *                                ↓ (denied)
 *                             BLOCKED (someone else talking)
 *
 * Coordinates LiveKit transport mute/unmute + Supabase talking broadcast.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { PTTState } from '@/lib/comms/types';
import type { LiveKitTransport } from '@/lib/comms/livekit-transport';
import type { SupabaseSignaling } from '@/lib/comms/supabase-signaling';
import { PTT_TIMEOUT_MS } from '@/lib/comms/constants';

interface UsePTTOptions {
    transport: LiveKitTransport | null;
    signaling: SupabaseSignaling | null;
    enabled: boolean;
}

interface UsePTTReturn {
    state: PTTState;
    startTalking: () => void;
    stopTalking: () => void;
    isTalking: boolean;
}

export function usePTT({ transport, signaling, enabled }: UsePTTOptions): UsePTTReturn {
    const [state, setState] = useState<PTTState>('idle');
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startTalking = useCallback(async () => {
        if (!enabled || !transport || !signaling || state !== 'idle') return;

        setState('requesting');

        try {
            await transport.startTransmit();
            await signaling.broadcastTalking(true);
            await signaling.logEvent('ptt_started');
            setState('talking');

            // Safety timeout
            timeoutRef.current = setTimeout(() => {
                stopTalkingInternal();
            }, PTT_TIMEOUT_MS);
        } catch {
            setState('idle');
        }
    }, [enabled, transport, signaling, state]);

    const stopTalkingInternal = useCallback(async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        try {
            await transport?.stopTransmit();
            await signaling?.broadcastTalking(false);
            await signaling?.logEvent('ptt_stopped');
        } catch {
            // Best effort
        }

        setState('idle');
    }, [transport, signaling]);

    const stopTalking = useCallback(() => {
        if (state === 'talking' || state === 'requesting') {
            stopTalkingInternal();
        }
    }, [state, stopTalkingInternal]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return {
        state,
        startTalking,
        stopTalking,
        isTalking: state === 'talking',
    };
}
