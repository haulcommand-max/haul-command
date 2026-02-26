/**
 * lib/analytics/hc-events.ts
 *
 * Lightweight analytics event client for Haul Command.
 * Sends to /api/events (which writes to public.hc_events).
 *
 * All calls are fire-and-forget — never block the UI.
 * Batched with requestIdleCallback on capable browsers.
 *
 * Usage:
 *   import { trackEvent } from '@/lib/analytics/hc-events';
 *   trackEvent('corridor_viewed', { corridor_slug: 'i-10', surface: 'corridor_page' });
 */

export type HCEventType =
    | 'page_view'
    | 'search_submitted'
    | 'profile_opened'
    | 'contact_clicked'
    | 'boost_viewed'
    | 'boost_purchased'
    | 'port_viewed'
    | 'corridor_viewed'
    | 'directory_scroll_cta_shown'
    | 'urgency_banner_shown'
    | 'urgency_boost_clicked';

export interface HCEventPayload {
    event_type: HCEventType;
    corridor_slug?: string;
    port_slug?: string;
    operator_id?: string;
    surface?: string;
    geo_region?: string;
    corridor_liquidity_score?: number;
    supply_pct?: number;
    properties?: Record<string, unknown>;
}

let _sessionId: string | null = null;

function getSessionId(): string {
    if (_sessionId) return _sessionId;
    try {
        const stored = sessionStorage.getItem('hc_sid');
        if (stored) { _sessionId = stored; return stored; }
        const fresh = crypto.randomUUID();
        sessionStorage.setItem('hc_sid', fresh);
        _sessionId = fresh;
        return fresh;
    } catch {
        return 'anonymous';
    }
}

export function trackEvent(
    event_type: HCEventType,
    payload: Omit<HCEventPayload, 'event_type'> = {}
): void {
    const body: HCEventPayload = { event_type, ...payload };

    const send = () => {
        fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...body, session_id: getSessionId() }),
            keepalive: true,
        }).catch(() => { /* silently fail — never block UX */ });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(send, { timeout: 2000 });
    } else {
        setTimeout(send, 0);
    }
}

/** Convenience wrapper for corridor page views */
export function trackCorridorView(corridorSlug: string, supplyPct?: number): void {
    trackEvent('corridor_viewed', {
        corridor_slug: corridorSlug,
        supply_pct: supplyPct,
        surface: 'corridor_page',
    });
}

/** Convenience wrapper for port page views */
export function trackPortView(portSlug: string): void {
    trackEvent('port_viewed', { port_slug: portSlug, surface: 'port_page' });
}
