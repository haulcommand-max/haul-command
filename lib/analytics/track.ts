// lib/analytics/track.ts
// ══════════════════════════════════════════════════════════════
// UNIFIED analytics facade — Haul Command
//
// MERGED: track.ts (lightweight gtag) + ga4.ts (typed gtag) + hc-events.ts (server-side)
//
// Three channels, one import:
//   1. GA4 via window.gtag (client-side, typed, auto-enriched)
//   2. Server-side event journal via /api/events → Supabase
//   3. PostHog via event-pipeline.ts (separate, not duplicated here)
//
// Usage:
//   import { track } from "@/lib/analytics/track";
//   track.searchSubmitted({ search_type: "escort_search", results_count: 12, latency_ms: 340 });
//   track.holdSlotClicked({ escort_id: "uuid", deposit_amount: 200 });
//
// For PostHog:
//   import { HCTrack, captureEvent } from "@/lib/analytics/event-pipeline";
// ══════════════════════════════════════════════════════════════

// ── Global params (set once, merged on every GA4 event) ──────

let _globalParams: Record<string, unknown> = {};

export function setGlobalParams(params: {
    app_env?: "prod" | "staging" | "dev";
    app_version?: string;
    user_role?: "escort" | "broker" | "carrier" | "guest" | "admin";
    is_verified_user?: boolean;
    session_id?: string;
    country_code?: string;
    region_code?: string;
    city_slug?: string;
    page_type?: PageType;
    referrer_type?: ReferrerType;
}): void {
    _globalParams = { ..._globalParams, ...params };
}

// ── Types ─────────────────────────────────────────────────────

export type PageType =
    | "directory_hub" | "directory_search" | "profile"
    | "load_feed" | "leaderboard" | "checkout"
    | "onboarding" | "admin" | "home" | "other";

export type ReferrerType = "seo" | "internal" | "paid" | "direct" | "social" | "email" | "unknown";
export type LoadStatus = "open" | "held" | "booked" | "in_progress" | "completed" | "cancelled" | "expired";
export type AdPlacement = "directory_inline" | "directory_sidebar" | "leaderboard_inline" | "load_feed_inline" | "hub_banner" | "corridor_hero_billboard" | "corridor_inline_billboard" | "provider_sidecar_sponsor";

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

// ── Core GA4 dispatcher ───────────────────────────────────────

function fire(eventName: string, params: Record<string, unknown> = {}): void {
    if (typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;

    const merged = {
        ..._globalParams,
        app_env: (process.env.NEXT_PUBLIC_APP_ENV ?? "prod"),
        app_version: (process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0"),
        ...params,
    };

    window.gtag("event", eventName, merged);
}

// ── Server-side event journal ─────────────────────────────────
// Fires to /api/events → Supabase hc_events table
// Uses requestIdleCallback for zero-UI-block

let _sessionId: string | null = null;

function getSessionId(): string {
    if (_sessionId) return _sessionId;
    if (typeof window === "undefined") return "server";
    try {
        const stored = sessionStorage.getItem('hc_sid');
        if (stored) { _sessionId = stored; return stored; }
        const fresh = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem('hc_sid', fresh);
        _sessionId = fresh;
        return fresh;
    } catch {
        return 'anonymous';
    }
}

export function serverTrack(eventType: string, payload: Record<string, unknown> = {}): void {
    if (typeof window === "undefined") return;
    const body = { event_type: eventType, ...payload, session_id: getSessionId() };

    const send = () => {
        fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            keepalive: true,
        }).catch(() => { /* silently fail */ });
    };

    if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(send, { timeout: 2000 });
    } else {
        setTimeout(send, 0);
    }
}

// ═══════════════════════════════════════════════════════════════
// UNIFIED EVENT CATALOG
// All typed wrappers fire GA4 + (optionally) server journal
// ═══════════════════════════════════════════════════════════════

export const track = {
    /** Raw event — use typed wrappers below when possible */
    event(name: string, params: Record<string, unknown> = {}): void {
        fire(name, params);
    },

    // ── Navigation / SEO ──────────────────────────────────
    pageView(p: { page_path: string; page_title: string; page_type: PageType; hub_depth?: number; is_indexable?: boolean; canonical_path?: string }) {
        fire("page_view", p);
    },

    directoryHubView(p: { hub_depth: 1 | 2 | 3 | 4; hub_key: string; total_listings_visible: number; total_verified_visible: number; total_jobs_last_30d: number; seo_template: string; has_unique_content: boolean }) {
        fire("directory_hub_view", p);
    },

    directoryFacetView(p: { hub_key: string; facet_key: string; facet_group: string; results_count: number; is_indexable: boolean }) {
        fire("directory_facet_view", p);
    },

    // ── Search & filter ────────────────────────────────────
    searchSubmitted(p: { search_type: "escort_search" | "load_search"; origin_city_slug?: string; origin_region_code?: string; dest_city_slug?: string; dest_region_code?: string; date_window?: string; escort_type?: string; query_complexity?: number; results_count: number; latency_ms?: number }) {
        fire("search_submitted", p);
    },

    filterChanged(p: { filter_group: string; filter_key: string; filter_value: string | boolean | number; active_filter_count: number; results_count: number }) {
        fire("filter_changed", p);
    },

    sortChanged(p: { sort_key: string; results_count: number }) {
        fire("sort_changed", p);
    },

    // ── Cards & profiles ───────────────────────────────────
    escortCardImpression(p: { escort_id: string; position_index: number; feed_type: string; ranking_bucket?: "top10" | "top50" | "rest"; is_sponsored?: boolean }) {
        fire("escort_card_impression", p);
    },

    escortCardClick(p: { escort_id: string; position_index: number; feed_type: string; is_sponsored?: boolean }) {
        fire("escort_card_click", p);
    },

    profileView(p: { escort_id: string; profile_completion_pct: number; has_insurance_verified: boolean; has_docs_verified: boolean; reviews_count: number; completed_moves_count: number }) {
        fire("profile_view", p);
    },

    profileStrengthView(p: { profile_completion_pct: number; missing_top_3?: string; next_best_action?: string }) {
        fire("profile_strength_view", p);
    },

    profileStrengthActionClick(p: { action_key: string; from_pct: number; to_target_pct: number }) {
        fire("profile_strength_action_click", p);
    },

    // ── Booking / escrow ───────────────────────────────────
    holdSlotClicked(p: { escort_id: string; job_id?: string; deposit_required?: boolean; deposit_amount?: number; currency?: string; eta_minutes?: number; coverage_confidence?: number }) {
        fire("hold_slot_clicked", p);
    },

    checkoutStarted(p: { escort_id: string; job_id?: string; price_total: number; deposit_amount: number; fee_platform: number; payment_method_offered: string }) {
        fire("checkout_started", p);
    },

    checkoutPaymentSubmitted(p: { payment_method_selected: string; price_total: number; deposit_amount: number; fee_platform: number }) {
        fire("checkout_payment_submitted", p);
    },

    bookingConfirmed(p: { booking_id: string; escort_id: string; job_id?: string; deposit_amount: number; price_total: number; time_to_book_ms?: number }) {
        fire("booking_confirmed", { ...p, value: p.price_total, currency: "USD" });
    },

    bookingFailed(p: { escort_id: string; job_id?: string; failure_stage: "payment" | "availability" | "validation" | "network"; error_code?: string }) {
        fire("booking_failed", p);
    },

    // ── Jobs / load lifecycle ──────────────────────────────
    jobPosted(p: { job_id: string; origin_region_code: string; dest_region_code: string; time_window_hours: number; escort_type_required: string; is_multi_state: boolean }) {
        fire("job_posted", p);
    },

    jobStatusChanged(p: { job_id: string; from_status: LoadStatus; to_status: LoadStatus; fill_time_seconds?: number; reason?: string }) {
        fire("job_status_changed", p);
    },

    jobCardImpression(p: { job_id: string; status: LoadStatus; position_index: number; feed_type: string }) {
        fire("job_card_impression", p);
    },

    jobCardClick(p: { job_id: string; status: LoadStatus; feed_type: string }) {
        fire("job_card_click", p);
    },

    // ── Ads ────────────────────────────────────────────────
    adImpression(p: { ad_id?: string; campaign_id?: string; placement: AdPlacement; variant: "native_card" | "slot_banner" | "hero_billboard" | "inline_billboard" | "sidecar_sponsor" | "sticky_mobile_chip_rail"; position_index: number; ecp_micros?: number; rendered_ok: boolean }) {
        fire("ad_impression", p);
    },

    adClick(p: { ad_id?: string; campaign_id?: string; placement: AdPlacement; variant: string; position_index: number; destination_type?: "external" | "internal"; click_latency_ms?: number }) {
        fire("ad_click", p);
    },

    adConversion(p: { ad_id?: string; campaign_id?: string; conversion_type: "lead" | "purchase" | "signup"; value?: number; currency?: string }) {
        fire("ad_conversion", { ...p, currency: p.currency ?? "USD" });
    },

    // ── Sponsors ───────────────────────────────────────────
    sponsorImpression(p: Record<string, unknown>): void {
        fire("sponsor_impression", p);
    },

    sponsorClick(p: Record<string, unknown>): void {
        fire("sponsor_click", p);
    },

    // ── Corridor signals ───────────────────────────────────
    corridorSignalView(p: Record<string, unknown>): void {
        fire("corridor_signal_view", p);
        serverTrack("corridor_viewed", p);
    },

    // ── Alerts ─────────────────────────────────────────────
    alertSignup(p: Record<string, unknown>): void {
        fire("alert_signup", p);
    },

    // ── Admin ──────────────────────────────────────────────
    adminView(p: { panel_key: string; action_context?: string }) {
        fire("admin_view", p);
    },

    adminAction(p: { panel_key: string; action_key: string; target_id?: string; reason_code?: string }) {
        fire("admin_action", p);
    },

    // ── Onboarding ─────────────────────────────────────────
    onboardingStepCompleted(p: { step_index: number; step_name: string; profile_strength_after: number; skipped?: boolean }) {
        fire("onboarding_step_completed", p);
    },

    onboardingCompleted(p: { role: "escort" | "broker" | "carrier"; steps_completed: number; steps_skipped: number; final_strength: number }) {
        fire("onboarding_completed", p);
    },
};

// ── Backward-compatible re-exports (from old hc-events.ts) ──

export type HCEventType =
    | 'page_view' | 'search_submitted' | 'profile_opened'
    | 'contact_clicked' | 'boost_viewed' | 'boost_purchased'
    | 'port_viewed' | 'corridor_viewed'
    | 'directory_scroll_cta_shown' | 'urgency_banner_shown' | 'urgency_boost_clicked';

export function trackEvent(eventType: HCEventType, payload: Record<string, unknown> = {}): void {
    fire(eventType, payload);
    serverTrack(eventType, payload);
}

export function trackCorridorView(corridorSlug: string, supplyPct?: number): void {
    trackEvent('corridor_viewed', { corridor_slug: corridorSlug, supply_pct: supplyPct, surface: 'corridor_page' });
}

export function trackPortView(portSlug: string): void {
    trackEvent('port_viewed', { port_slug: portSlug, surface: 'port_page' });
}

export default track;
