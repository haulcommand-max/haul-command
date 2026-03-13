/**
 * useCommsStatus — Computed Connection Status
 *
 * Returns ephemeral status: 'online' | 'nearby_only' | 'no_comms'
 * NEVER persisted in Postgres. Computed from transport health.
 */

'use client';

import { useState, useEffect } from 'react';
import type { CommsStatus, TransportConnectionState } from '@/lib/comms/types';

interface UseCommsStatusOptions {
    transportState: TransportConnectionState | null;
    hasInternetConnection: boolean;
}

export function useCommsStatus({
    transportState,
    hasInternetConnection,
}: UseCommsStatusOptions): CommsStatus {
    const [status, setStatus] = useState<CommsStatus>('no_comms');

    useEffect(() => {
        if (transportState === 'connected') {
            setStatus('online');
        } else if (hasInternetConnection && transportState === 'reconnecting') {
            setStatus('online'); // Still technically online, reconnecting
        } else if (!hasInternetConnection) {
            // Phase 2: nearby_only when nearby transport is available
            setStatus('no_comms');
        } else {
            setStatus('no_comms');
        }
    }, [transportState, hasInternetConnection]);

    return status;
}
