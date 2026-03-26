'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useDispatchStream — Real-Time SSE Hook for Dispatch Events
 *
 * Connects to /api/dispatch/realtime and provides:
 *   - Typed event stream with auto-reconnect
 *   - Region filtering
 *   - Connection state management
 *   - Event history buffer (configurable depth)
 *   - Typed callbacks per event type
 *
 * Usage:
 *   const { events, isConnected, surgeState, latestLoad } = useDispatchStream({
 *     regions: ['southeast', 'northeast'],
 *     onLoadNew: (payload) => toast(`New load: ${payload.origin}`),
 *     onSurgeUpdated: (payload) => setSurge(payload),
 *     maxHistory: 50,
 *   });
 */

// ─── Event Types ─────────────────────────────────────────────

export type DispatchEventType =
  | 'load:new'
  | 'load:matched'
  | 'load:accepted'
  | 'load:completed'
  | 'load:cancelled'
  | 'surge:updated'
  | 'dispatch:alert'
  | 'operator:online'
  | 'system:maintenance'
  | 'connection:established';

export interface DispatchEvent {
  type: DispatchEventType;
  payload: Record<string, any>;
  region?: string;
  timestamp: string;
  eventId: string;
}

export interface DispatchStreamOptions {
  /** Region codes to filter events (empty = all regions) */
  regions?: string[];
  /** Enable auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Max events to keep in history buffer (default: 100) */
  maxHistory?: number;
  /** Reconnect delay in ms after disconnect (default: 3000) */
  reconnectDelay?: number;
  /** Max reconnect attempts before giving up (default: 10) */
  maxReconnectAttempts?: number;

  // ─── Typed Event Callbacks ───────────────────────────────
  onLoadNew?: (payload: Record<string, any>) => void;
  onLoadMatched?: (payload: Record<string, any>) => void;
  onLoadAccepted?: (payload: Record<string, any>) => void;
  onLoadCompleted?: (payload: Record<string, any>) => void;
  onLoadCancelled?: (payload: Record<string, any>) => void;
  onSurgeUpdated?: (payload: Record<string, any>) => void;
  onDispatchAlert?: (payload: Record<string, any>) => void;
  onOperatorOnline?: (payload: Record<string, any>) => void;
  onAnyEvent?: (event: DispatchEvent) => void;
}

export interface DispatchStreamState {
  /** All received events (newest first) */
  events: DispatchEvent[];
  /** Whether the SSE connection is active */
  isConnected: boolean;
  /** Current connection status */
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
  /** Subscriber ID assigned by server */
  subscriberId: string | null;
  /** Number of reconnect attempts */
  reconnectAttempts: number;
  /** Latest load event payload */
  latestLoad: Record<string, any> | null;
  /** Latest surge state payload */
  latestSurge: Record<string, any> | null;
  /** Latest alert payload */
  latestAlert: Record<string, any> | null;
  /** Manually connect */
  connect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
  /** Clear event history */
  clearHistory: () => void;
}

// ─── Callback map for event routing ──────────────────────────

const EVENT_CALLBACK_MAP: Record<string, keyof DispatchStreamOptions> = {
  'load:new': 'onLoadNew',
  'load:matched': 'onLoadMatched',
  'load:accepted': 'onLoadAccepted',
  'load:completed': 'onLoadCompleted',
  'load:cancelled': 'onLoadCancelled',
  'surge:updated': 'onSurgeUpdated',
  'dispatch:alert': 'onDispatchAlert',
  'operator:online': 'onOperatorOnline',
};

// ─── Hook ────────────────────────────────────────────────────

export function useDispatchStream(options: DispatchStreamOptions = {}): DispatchStreamState {
  const {
    regions = [],
    autoConnect = true,
    maxHistory = 100,
    reconnectDelay = 3000,
    maxReconnectAttempts = 10,
  } = options;

  const [events, setEvents] = useState<DispatchEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<DispatchStreamState['connectionStatus']>('disconnected');
  const [subscriberId, setSubscriberId] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [latestLoad, setLatestLoad] = useState<Record<string, any> | null>(null);
  const [latestSurge, setLatestSurge] = useState<Record<string, any> | null>(null);
  const [latestAlert, setLatestAlert] = useState<Record<string, any> | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const isConnected = connectionStatus === 'connected';

  // ─── Process incoming event ──────────────────────────────

  const handleEvent = useCallback((event: DispatchEvent) => {
    // Add to history
    setEvents(prev => [event, ...prev].slice(0, maxHistory));

    // Update convenience state
    if (event.type.startsWith('load:')) {
      setLatestLoad(event.payload);
    } else if (event.type === 'surge:updated') {
      setLatestSurge(event.payload);
    } else if (event.type === 'dispatch:alert') {
      setLatestAlert(event.payload);
    }

    // Fire typed callback
    const callbackKey = EVENT_CALLBACK_MAP[event.type];
    if (callbackKey) {
      const callback = optionsRef.current[callbackKey] as ((p: Record<string, any>) => void) | undefined;
      callback?.(event.payload);
    }

    // Fire universal callback
    optionsRef.current.onAnyEvent?.(event);
  }, [maxHistory]);

  // ─── Connect ─────────────────────────────────────────────

  const connect = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    setConnectionStatus('connecting');

    const params = new URLSearchParams();
    if (regions.length > 0) {
      params.set('regions', regions.join(','));
    }

    const url = `/api/dispatch/realtime${params.toString() ? `?${params}` : ''}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    // ── Connection established ──
    es.addEventListener('connection:established', (e) => {
      try {
        const data: DispatchEvent = JSON.parse(e.data);
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        setSubscriberId(data.payload?.subscriberId || null);
        handleEvent(data);
      } catch {}
    });

    // ── Typed event listeners ──
    const eventTypes: DispatchEventType[] = [
      'load:new', 'load:matched', 'load:accepted', 'load:completed', 'load:cancelled',
      'surge:updated', 'dispatch:alert', 'operator:online', 'system:maintenance',
    ];

    for (const type of eventTypes) {
      es.addEventListener(type, (e) => {
        try {
          const data: DispatchEvent = JSON.parse(e.data);
          handleEvent(data);
        } catch {}
      });
    }

    // ── Error / disconnect handling ──
    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;

      setReconnectAttempts(prev => {
        const next = prev + 1;
        if (next >= maxReconnectAttempts) {
          setConnectionStatus('failed');
          return next;
        }

        setConnectionStatus('reconnecting');
        const delay = Math.min(reconnectDelay * Math.pow(1.5, next - 1), 30_000); // Exponential backoff, max 30s
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, delay);

        return next;
      });
    };
  }, [regions, reconnectDelay, maxReconnectAttempts, handleEvent]);

  // ─── Disconnect ──────────────────────────────────────────

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    setConnectionStatus('disconnected');
    setSubscriberId(null);
    setReconnectAttempts(0);
  }, []);

  // ─── Clear history ───────────────────────────────────────

  const clearHistory = useCallback(() => {
    setEvents([]);
    setLatestLoad(null);
    setLatestSurge(null);
    setLatestAlert(null);
  }, []);

  // ─── Lifecycle ───────────────────────────────────────────

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
    // Only reconnect if regions change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, regions.join(',')]);

  return {
    events,
    isConnected,
    connectionStatus,
    subscriberId,
    reconnectAttempts,
    latestLoad,
    latestSurge,
    latestAlert,
    connect,
    disconnect,
    clearHistory,
  };
}
