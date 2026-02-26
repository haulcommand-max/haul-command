// lib/analytics/ga4.ts
// ══════════════════════════════════════════════════════════════
// GA4 Analytics Layer — Haul Command
//
// Single source of truth for all GA4 custom events.
// Uses window.gtag() — works with @next/third-parties/google
// and with standard gtag.js.
//
// Convention:
//   - event names: lowercase_snake_case, ≤40 chars
//   - all params: snake_case, no PII
//   - numeric params: numbers (not strings)
//   - every event gets global_params automatically merged
//
// Usage:
//   import { track } from "@/lib/analytics/ga4";
//
//   track.searchSubmitted({ search_type: "escort_search", results_count: 12, latency_ms: 340 });
//   track.holdSlotClicked({ escort_id: "uuid", deposit_amount: 200 });
// ══════════════════════════════════════════════════════════════

// ── Global params (set once, merged on every event) ──────────

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
export type AdPlacement = "directory_inline" | "directory_sidebar" | "leaderboard_inline" | "load_feed_inline" | "hub_banner";

// ── Core fire() ───────────────────────────────────────────────

function fire(eventName: string, params: Record<string, unknown> = {}): void {
    if (typeof window === "undefined") return;
    if (typeof (window as any).gtag !== "function") return;

    const merged = {
        ..._globalParams,
        ...params,
    };

    (window as any).gtag("event", eventName, merged);
}

// ── Event catalog ─────────────────────────────────────────────

export const track = {

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
    adImpression(p: { ad_id?: string; campaign_id?: string; placement: AdPlacement; variant: "native_card" | "slot_banner"; position_index: number; ecp_micros?: number; rendered_ok: boolean }) {
        fire("ad_impression", p);
    },

    adClick(p: { ad_id?: string; campaign_id?: string; placement: AdPlacement; variant: "native_card" | "slot_banner"; position_index: number; destination_type?: "external" | "internal"; click_latency_ms?: number }) {
        fire("ad_click", p);
    },

    adConversion(p: { ad_id?: string; campaign_id?: string; conversion_type: "lead" | "purchase" | "signup"; value?: number; currency?: string }) {
        fire("ad_conversion", { ...p, currency: p.currency ?? "USD" });
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

export default track;
