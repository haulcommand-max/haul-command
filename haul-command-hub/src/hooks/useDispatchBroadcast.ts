'use client';

import { useCallback } from 'react';
import type { DispatchEventType } from './useDispatchStream';

/**
 * useDispatchBroadcast — Push events to the SSE dispatch stream
 *
 * Companion to useDispatchStream. Used by admin/operator components
 * to broadcast typed events to all connected listeners.
 *
 * Usage:
 *   const { broadcast } = useDispatchBroadcast();
 *   await broadcast('load:new', { origin: 'Dallas, TX', destination: 'Houston, TX' }, 'southeast');
 */

interface BroadcastResult {
  success: boolean;
  eventId?: string;
  broadcastTo?: number;
  error?: string;
}

export function useDispatchBroadcast() {
  const broadcast = useCallback(async (
    type: DispatchEventType,
    payload: Record<string, any>,
    region?: string,
  ): Promise<BroadcastResult> => {
    try {
      const res = await fetch('/api/dispatch/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload, region }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || `HTTP ${res.status}` };
      }

      return {
        success: true,
        eventId: data.eventId,
        broadcastTo: data.broadcastTo,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  return { broadcast };
}
