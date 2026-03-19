// lib/ads/server-events.ts
// ══════════════════════════════════════════════════════════════
// SERVER EVENT SYSTEM — Unified event dispatcher
//
// All 22 required server events in one module.
// Every surface, every action, every conversion — tracked.
// Sends to: hc_events (Supabase) + GA4 (via gtag) + hc_ad_events
// ══════════════════════════════════════════════════════════════

type EventPayload = Record<string, string | number | boolean | null | undefined>;

// ── Event Types ──────────────────────────────────────────────

export type ServerEventType =
    // Ad events
    | 'ad_impression'
    | 'viewable_impression'
    | 'ad_click'
    | 'ad_conversion'
    // Navigation / funnel events
    | 'destination_visit'
    | 'claim_start'
    | 'claim_submit'
    | 'signup_start'
    | 'signup_complete'
    // Lead / contact events
    | 'lead_submit'
    | 'contact_click'
    | 'call_click'
    | 'message_click'
    // Purchase events
    | 'sponsor_purchase'
    | 'boost_purchase'
    | 'data_unlock_purchase'
    | 'subscription_purchase'
    // Content events
    | 'export_request'
    | 'report_view'
    | 'alert_create'
    // Creative lifecycle
    | 'creative_generated'
    | 'creative_selected'
    | 'creative_launched'
    | 'creative_won';

// ── Server-side tracker (API routes, server components) ────

export async function trackServerEvent(
    eventType: ServerEventType,
    payload: EventPayload & {
        session_id?: string;
        corridor_slug?: string;
        port_slug?: string;
        operator_id?: string;
        country_code?: string;
        geo_region?: string;
        surface?: string;
        role?: string;
        device?: string;
        revenue_usd?: number;
    },
): Promise<boolean> {
    try {
        // Fire to the internal events API (non-blocking)
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

        const response = await fetch(`${baseUrl}/api/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_type: eventType,
                session_id: payload.session_id ?? null,
                corridor_slug: payload.corridor_slug ?? null,
                port_slug: payload.port_slug ?? null,
                operator_id: payload.operator_id ?? null,
                geo_region: payload.geo_region ?? null,
                surface: payload.surface ?? null,
                properties: {
                    ...payload,
                    _tracked_at: new Date().toISOString(),
                    _source: 'server',
                },
            }),
        });

        return response.ok;
    } catch {
        // Event tracking should never crash the calling code
        return false;
    }
}

// ── Client-side tracker (browser context) ──────────────────

export function trackClientEvent(
    eventType: ServerEventType,
    payload: EventPayload = {},
): void {
    if (typeof window === 'undefined') return;

    // Fire to API
    fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event_type: eventType,
            session_id: getSessionId(),
            properties: {
                ...payload,
                _tracked_at: new Date().toISOString(),
                _source: 'client',
                _url: window.location.pathname,
                _referrer: document.referrer || null,
            },
        }),
    }).catch(() => { /* non-critical */ });

    // Also fire to GA4 if available
    if (typeof window.gtag === 'function') {
        window.gtag('event', eventType, payload);
    }
}

// ── Convenience wrappers for common events ─────────────────

export const serverEvents = {
    // Ad events
    adImpression: (p: EventPayload) => trackClientEvent('ad_impression', p),
    viewableImpression: (p: EventPayload) => trackClientEvent('viewable_impression', p),
    adClick: (p: EventPayload) => trackClientEvent('ad_click', p),
    adConversion: (p: EventPayload) => trackClientEvent('ad_conversion', p),

    // Funnel events
    destinationVisit: (p: EventPayload) => trackClientEvent('destination_visit', p),
    claimStart: (p: EventPayload) => trackClientEvent('claim_start', p),
    claimSubmit: (p: EventPayload) => trackClientEvent('claim_submit', p),
    signupStart: (p: EventPayload) => trackClientEvent('signup_start', p),
    signupComplete: (p: EventPayload) => trackClientEvent('signup_complete', p),

    // Lead / contact events
    leadSubmit: (p: EventPayload) => trackClientEvent('lead_submit', p),
    contactClick: (p: EventPayload) => trackClientEvent('contact_click', p),
    callClick: (p: EventPayload) => trackClientEvent('call_click', p),
    messageClick: (p: EventPayload) => trackClientEvent('message_click', p),

    // Purchase events
    sponsorPurchase: (p: EventPayload) => trackClientEvent('sponsor_purchase', p),
    boostPurchase: (p: EventPayload) => trackClientEvent('boost_purchase', p),
    dataUnlockPurchase: (p: EventPayload) => trackClientEvent('data_unlock_purchase', p),
    subscriptionPurchase: (p: EventPayload) => trackClientEvent('subscription_purchase', p),

    // Content events
    exportRequest: (p: EventPayload) => trackClientEvent('export_request', p),
    reportView: (p: EventPayload) => trackClientEvent('report_view', p),
    alertCreate: (p: EventPayload) => trackClientEvent('alert_create', p),

    // Creative lifecycle
    creativeGenerated: (p: EventPayload) => trackServerEvent('creative_generated', p),
    creativeSelected: (p: EventPayload) => trackServerEvent('creative_selected', p),
    creativeLaunched: (p: EventPayload) => trackServerEvent('creative_launched', p),
    creativeWon: (p: EventPayload) => trackServerEvent('creative_won', p),
};

// ── Helpers ────────────────────────────────────────────────

function getSessionId(): string {
    if (typeof window === 'undefined') return '';
    try {
        let sid = sessionStorage.getItem('hc_session_id');
        if (!sid) {
            sid = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            sessionStorage.setItem('hc_session_id', sid);
        }
        return sid;
    } catch {
        return '';
    }
}

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}
