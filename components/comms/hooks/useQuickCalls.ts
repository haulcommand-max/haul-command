'use client';
/**
 * useQuickCalls — Quick-Call Send/Receive
 *
 * Handles sending and receiving quick-call events via Supabase Broadcast.
 * Quick-calls are broadcast for real-time AND persisted to DB for replay.
 */

'use client';

import { useState, useCallback } from 'react';
import type { QuickCall, QuickCallType } from '@/lib/comms/types';
import type { SupabaseSignaling } from '@/lib/comms/supabase-signaling';

interface UseQuickCallsOptions {
    signaling: SupabaseSignaling | null;
}

interface UseQuickCallsReturn {
    recentCalls: QuickCall[];
    lastCall: QuickCall | null;
    sendQuickCall: (type: QuickCallType) => Promise<void>;
    onQuickCallReceived: (qc: QuickCall) => void;
}

const MAX_RECENT_CALLS = 20;

export function useQuickCalls({ signaling }: UseQuickCallsOptions): UseQuickCallsReturn {
    const [recentCalls, setRecentCalls] = useState<QuickCall[]>([]);
    const [lastCall, setLastCall] = useState<QuickCall | null>(null);

    const sendQuickCall = useCallback(async (type: QuickCallType) => {
        if (!signaling) return;
        await signaling.sendQuickCall(type);
    }, [signaling]);

    const onQuickCallReceived = useCallback((qc: QuickCall) => {
        setLastCall(qc);
        setRecentCalls(prev => {
            const next = [qc, ...prev];
            return next.slice(0, MAX_RECENT_CALLS);
        });
    }, []);

    return {
        recentCalls,
        lastCall,
        sendQuickCall,
        onQuickCallReceived,
    };
}
