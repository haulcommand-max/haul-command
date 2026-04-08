// lib/analytics/unified-event-bus.ts
// ══════════════════════════════════════════════════════════════
// UNIFIED EVENT BUS — SINGLE DISPATCH FOR ALL EVENT SYSTEMS
//
// PROBLEM: We had 5 separate event systems:
//   1. lib/analytics/track.ts         → Supabase hc_events + GA4
//   2. lib/analytics/event-pipeline.ts → PostHog (marketplace taxonomy)
//   3. lib/analytics/booking-events.ts → PostHog server-side
//   4. lib/telemetry.ts               → Supabase log_telemetry RPC
//   5. lib/ads/server-events.ts       → Supabase hc_events + GA4
//
// SOLUTION: This bus wraps all 5 into a single dispatch.
//   - Every event fires to ALL active sinks (Supabase, GA4, PostHog)
//   - Typed event catalog covers all 22 server events + marketplace + booking
//   - Fire-and-forget: never throws
//   - Client vs server detection for proper SDK usage
//
// Usage:
//   import { bus } from '@/lib/analytics/unified-event-bus';
//   bus.fire('ad_impression', { slot_id: '...', country_code: 'US' });
//   bus.fire('booking_created', { job_id: '...', total_rate: 500 });
// ══════════════════════════════════════════════════════════════

import { getPostHog } from './posthog-provider';

// ── Sink: Supabase (hc_events table) ───────────────────────

async function sinkSupabase(eventType: string, props: Record<string, unknown>) {
    try {
        if (typeof window !== 'undefined') {
            // Client: use browser client
            const { createClient } = await import('@/utils/supabase/client');
            const sb = createClient();
            await sb.from('hc_events').insert({ event_type: eventType, properties: props });
        } else {
            // Server: use admin
            const { getSupabaseAdmin } = await import('@/lib/supabase/admin');
            const sb = getSupabaseAdmin();
            await sb.from('hc_events').insert({ event_type: eventType, properties: props });
        }
    } catch {
        // Never throw from analytics
    }
}

// ── Sink: Supabase Telemetry RPC ───────────────────────────

async function sinkTelemetry(eventType: string, props: Record<string, unknown>) {
    try {
        if (typeof window !== 'undefined') {
            const { createBrowserClient } = await import('@supabase/ssr');
            const sb = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            );
            const { data: { user } } = await sb.auth.getUser();
            await sb.rpc('log_telemetry', {
                p_action: eventType,
                p_user_id: user?.id ?? props.user_id ?? null,
                p_role: (user?.user_metadata?.role as string) ?? props.role ?? null,
                p_entity_type: props.entity_type ?? null,
                p_entity_id: props.entity_id ?? null,
                p_latency_ms: props.latency_ms ?? null,
                p_client: props.client ?? 'web',
                p_route: props.route ?? (typeof window !== 'undefined' ? window.location.pathname : null),
                p_status_code: props.status_code ?? null,
                p_metadata: props,
            });
        }
    } catch {
        // Never throw
    }
}

// ── Sink: GA4 ──────────────────────────────────────────────

function sinkGA4(eventType: string, props: Record<string, unknown>) {
    if (typeof window === 'undefined') return;
    try {
        const gtag = (window as any).gtag;
        if (typeof gtag === 'function') {
            gtag('event', eventType, {
                ...props,
                event_category: props.category || 'hc',
                send_to: process.env.NEXT_PUBLIC_GA4_ID || undefined,
            });
        }
    } catch {
        // GA4 not loaded
    }
}

// ── Sink: PostHog ──────────────────────────────────────────

function sinkPostHog(eventType: string, props: Record<string, unknown>) {
    try {
        const ph = getPostHog();
        if (ph) {
            ph.capture(`hc_${eventType}`, {
                ...props,
                hc_ts: Date.now(),
                hc_page: typeof window !== 'undefined' ? window.location.pathname : undefined,
            });
        }
    } catch {
        // PostHog not loaded
    }
}

// ── Sink: Firebase Analytics ───────────────────────────────

async function sinkFirebase(eventType: string, props: Record<string, unknown>) {
    if (typeof window === 'undefined') return;
    try {
        const { trackEvent: fbTrack } = await import('@/lib/firebase');
        fbTrack(eventType, props);
    } catch {
        // Firebase not loaded
    }
}

// ── Sink: Market Signal Engine ─────────────────────────────

async function sinkMarketSignalEngine(eventType: string, props: Record<string, unknown>) {
    try {
        const payload = {
            event_name: eventType,
            object_type: typeof props.entity_type === 'string' ? props.entity_type : 'event',
            object_id: typeof props.entity_id === 'string' ? props.entity_id : 'system',
            country_code: typeof props.country_code === 'string' ? props.country_code : null,
            region_code: typeof props.region_code === 'string' ? props.region_code : null,
            city_slug: typeof props.city_slug === 'string' ? props.city_slug : null,
            corridor_id: typeof props.corridor_id === 'string' ? props.corridor_id : null,
            payload_json: props,
        };

        if (typeof window !== 'undefined') {
            fetch('/api/events/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true
            }).catch(() => {});
        } else {
            const internalUrl = process.env.INTERNAL_APP_BASE_URL || 'http://localhost:3000';
            fetch(`${internalUrl}/api/events/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(() => {});
        }
    } catch {
        // Non-blocking
    }
}

// ── Event Categories ───────────────────────────────────────

const REVENUE_EVENTS = new Set([
    'sponsor_purchase', 'boost_purchase', 'data_unlock_purchase',
    'subscription_purchase', 'match_fee_charged', 'featured_slot_purchased',
    'booking_created', 'payment_captured', 'ad_click', 'ad_conversion',
]);

const TELEMETRY_EVENTS = new Set([
    'page_view', 'api_call', 'api_error', 'search_query', 'search_result_clicked',
    'heartbeat', 'push_sent', 'push_delivered', 'push_failed',
    'user_signup', 'profile_activation', 'availability_toggled',
    'load_posted', 'offer_sent', 'offer_accepted', 'assignment_created',
]);

// ── Unified Bus ────────────────────────────────────────────

export const bus = {
    /**
     * Fire an event to all active sinks.
     * Completely fire-and-forget — never throws, never blocks.
     */
    fire(eventType: string, props: Record<string, unknown> = {}) {
        const enriched = {
            ...props,
            _ts: new Date().toISOString(),
            _url: typeof window !== 'undefined' ? window.location.href : undefined,
        };

        // Always fire to Supabase hc_events + GA4
        sinkSupabase(eventType, enriched);
        sinkGA4(eventType, enriched);
        sinkPostHog(eventType, enriched);

        // Revenue events go to Firebase too (money events)
        if (REVENUE_EVENTS.has(eventType)) {
            sinkFirebase(eventType, enriched);
        }

        // Telemetry events go to the telemetry RPC
        if (TELEMETRY_EVENTS.has(eventType)) {
            sinkTelemetry(eventType, enriched);
        }

        // Send to Market Signal Engine
        sinkMarketSignalEngine(eventType, enriched);
    },

    /**
     * Fire a server-side event (from API routes, Edge Functions).
     * Only dispatches to Supabase + PostHog server (no GA4/Firebase on server).
     */
    async fireServer(eventType: string, props: Record<string, unknown> = {}) {
        const enriched = {
            ...props,
            _ts: new Date().toISOString(),
            _server: true,
        };

        sinkSupabase(eventType, enriched);

        // PostHog server-side capture
        const POSTHOG_KEY = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
        const POSTHOG_HOST = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
        if (POSTHOG_KEY) {
            try {
                await fetch(`${POSTHOG_HOST}/capture/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        api_key: POSTHOG_KEY,
                        event: `hc_${eventType}`,
                        distinct_id: (props.user_id as string) || 'system',
                        properties: {
                            ...enriched,
                            $lib: 'haul-command-server',
                        },
                    }),
                });
            } catch {
                // Non-blocking
            }
        }

        // Send to Market Signal Engine
        sinkMarketSignalEngine(eventType, enriched);
    },

    // ── Convenience Wrappers ──────────────────────────────

    // Revenue
    revenue(action: string, revenueUsd: number, productId: string, currency: string = 'USD') {
        bus.fire(action, { revenue_usd: revenueUsd, product_id: productId, currency });
    },

    // Ad events
    adImpression(slotId: string, countryCode: string, surface: string) {
        bus.fire('ad_impression', { slot_id: slotId, country_code: countryCode, surface });
    },

    adClick(slotId: string, countryCode: string, campaignId: string) {
        bus.fire('ad_click', { slot_id: slotId, country_code: countryCode, campaign_id: campaignId });
    },

    // Funnel
    signupStart(source: string) { bus.fire('signup_start', { source }); },
    signupComplete(userId: string) { bus.fire('signup_complete', { user_id: userId }); },
    claimStart(providerId: string) { bus.fire('claim_start', { provider_id: providerId }); },
    claimSubmit(providerId: string) { bus.fire('claim_submit', { provider_id: providerId }); },

    // Creative lifecycle
    creativeGenerated(countryCode: string, model: string, count: number) {
        bus.fire('creative_generated', { country_code: countryCode, model, count });
    },
    creativeWon(variantId: string) {
        bus.fire('creative_won', { variant_id: variantId });
    },

    // Data products
    dataUnlock(productId: string, countryCode: string, priceUsd: number) {
        bus.fire('data_unlock_purchase', { product_id: productId, country_code: countryCode, price_usd: priceUsd });
    },
};

export default bus;
