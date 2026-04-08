'use client';
/**
 * components/ui/RealtimeToastProvider.tsx
 * Haul Command — In-App Realtime Toast Notification Center
 *
 * Connects to /api/notifications/realtime-stream (SSE).
 * Renders toast stack in bottom-right corner.
 * Supports: load_match, assignment_confirmed, payment_released, urgent alerts
 *
 * Wire into NativeBootstrap.tsx or root layout:
 *   <RealtimeToastProvider />
 */

import { useEffect, useState, useCallback } from 'react';

interface ToastNotif {
  id: string;
  title: string;
  body?: string;
  type?: string;
  url?: string;
  urgency: 'info' | 'success' | 'warning' | 'critical';
  ts: number;
}

const URGENCY_BY_TYPE: Record<string, ToastNotif['urgency']> = {
  'load.match_found': 'success',
  'assignment.confirmed': 'success',
  'assignment.cancelled_urgent': 'critical',
  'escrow.payment_released': 'success',
  'escrow.payment_failed': 'critical',
  'no_show_recovery': 'critical',
  'profile.suspended': 'critical',
  'insurance.expired': 'warning',
  'credential_nudge': 'warning',
  'operator_briefing': 'info',
  'broker_briefing': 'info',
};

const URGENCY_STYLES: Record<ToastNotif['urgency'], { bg: string; border: string; icon: string }> = {
  info:     { bg: '#0d1117', border: '#374151', icon: '🔔' },
  success:  { bg: '#064e3b', border: '#059669', icon: '✓' },
  warning:  { bg: '#1c1400', border: '#d97706', icon: '⚠️' },
  critical: { bg: '#200a0a', border: '#dc2626', icon: '🔴' },
};

const AUTO_DISMISS_MS: Record<ToastNotif['urgency'], number> = {
  info: 5000,
  success: 6000,
  warning: 8000,
  critical: 0,  // critical must be manually dismissed
};

export default function RealtimeToastProvider() {
  const [toasts, setToasts] = useState<ToastNotif[]>([]);
  const [connected, setConnected] = useState(false);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastNotif, 'ts'>) => {
    const full = { ...toast, ts: Date.now() };
    setToasts((prev) => [full, ...prev].slice(0, 5)); // max 5 visible

    const dismissMs = AUTO_DISMISS_MS[toast.urgency];
    if (dismissMs > 0) {
      setTimeout(() => dismiss(toast.id), dismissMs);
    }
  }, [dismiss]);

  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let mounted = true;

    const connect = () => {
      if (!mounted) return;
      es = new EventSource('/api/notifications/realtime-stream');

      es.onopen = () => setConnected(true);
      es.onerror = () => {
        setConnected(false);
        es.close();
        if (mounted) {
          retryTimeout = setTimeout(connect, 5000);
        }
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'heartbeat') return;

          if (data.type === 'notification') {
            const notifType = data.data?.type ?? 'info';
            const urgency = URGENCY_BY_TYPE[notifType] ?? 'info';
            addToast({
              id: data.id ?? `notif-${Date.now()}`,
              title: data.title,
              body: data.body,
              type: notifType,
              url: data.data?.url,
              urgency,
            });
          }

          if (data.type === 'event') {
            const urgency = URGENCY_BY_TYPE[data.event_type] ?? 'info';
            addToast({
              id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              title: data.payload?.title ?? data.event_type,
              body: data.payload?.body,
              type: data.event_type,
              url: data.payload?.url,
              urgency,
            });
          }
        } catch {
          // malformed event
        }
      };
    };

    // Delay on mount to not race with page load
    const init = setTimeout(connect, 1000);

    return () => {
      mounted = false;
      clearTimeout(init);
      clearTimeout(retryTimeout);
      es?.close();
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9998] flex flex-col-reverse gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const style = URGENCY_STYLES[toast.urgency];
        return (
          <div
            key={toast.id}
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
            }}
            className="pointer-events-auto flex items-start gap-3 rounded-xl p-4 w-80 shadow-2xl animate-slide-in-right"
            role="alert"
          >
            <span className="text-lg flex-shrink-0 mt-0.5">{style.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">{toast.title}</p>
              {toast.body && (
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{toast.body}</p>
              )}
              {toast.url && (
                <a
                  href={toast.url}
                  className="inline-block mt-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  View →
                </a>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="flex-shrink-0 text-gray-600 hover:text-gray-400 transition-colors text-lg leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        );
      })}

      {/* Connection indicator (only shown offline) */}
      {!connected && (
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-gray-900 border border-gray-700 px-3 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse" />
          <span className="text-xs text-gray-500">Reconnecting…</span>
        </div>
      )}
    </div>
  );
}
