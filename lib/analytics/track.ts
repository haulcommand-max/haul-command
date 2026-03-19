// lib/analytics/track.ts
// ══════════════════════════════════════════════════════════════
// Lightweight track.* helper — Haul Command
//
// Single function that all UI can call without duplicating gtag logic.
// Works with window.gtag set by any GA4 loader (next/script, GTM, etc).
//
// Usage:
//   import { track } from "@/lib/analytics/track";
//   track.holdSlotClicked({ escort_id: "uuid", deposit_amount: 200 });
// ══════════════════════════════════════════════════════════════

type TrackParams = Record<string, string | number | boolean | null | undefined>;

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

function baseParams(): TrackParams {
    // Lightweight session context. No PII.
    return {
        app_env: (process.env.NEXT_PUBLIC_APP_ENV ?? "prod") as string,
        app_version: (process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0") as string,
    };
}

export const track = {
    /** Core dispatcher — call this or use the typed wrappers below */
    event(name: string, params: TrackParams = {}): void {
        if (typeof window === "undefined") return;
        const gtag = window.gtag;
        if (typeof gtag !== "function") return;
        gtag("event", name, { ...baseParams(), ...params });
    },

    // ── Typed wrappers (use these everywhere — never call event() directly) ──

    searchSubmitted(params: TrackParams): void {
        track.event("search_submitted", params);
    },

    holdSlotClicked(params: TrackParams): void {
        track.event("hold_slot_clicked", params);
    },

    escortCardClick(params: TrackParams): void {
        track.event("escort_card_click", params);
    },

    jobCardClick(params: TrackParams): void {
        track.event("job_card_click", params);
    },

    bookingConfirmed(params: TrackParams): void {
        track.event("booking_confirmed", params);
    },

    bookingFailed(params: TrackParams): void {
        track.event("booking_failed", params);
    },

    onboardingCompleted(params: TrackParams): void {
        track.event("onboarding_completed", params);
    },

    onboardingStepCompleted(params: TrackParams): void {
        track.event("onboarding_step_completed", params);
    },

    filterChanged(params: TrackParams): void {
        track.event("filter_changed", params);
    },

    adClick(params: TrackParams): void {
        track.event("ad_click", params);
    },

    adImpression(params: TrackParams): void {
        track.event("ad_impression", params);
    },

    profileStrengthActionClick(params: TrackParams): void {
        track.event("profile_strength_action_click", params);
    },

    // ── Additional typed events (merged from hub) ──

    pageView(params: TrackParams): void {
        track.event("page_view", params);
    },

    directoryHubView(params: TrackParams): void {
        track.event("directory_hub_view", params);
    },

    directoryFacetView(params: TrackParams): void {
        track.event("directory_facet_view", params);
    },

    sortChanged(params: TrackParams): void {
        track.event("sort_changed", params);
    },

    escortCardImpression(params: TrackParams): void {
        track.event("escort_card_impression", params);
    },

    profileView(params: TrackParams): void {
        track.event("profile_view", params);
    },

    profileStrengthView(params: TrackParams): void {
        track.event("profile_strength_view", params);
    },

    checkoutStarted(params: TrackParams): void {
        track.event("checkout_started", params);
    },

    checkoutPaymentSubmitted(params: TrackParams): void {
        track.event("checkout_payment_submitted", params);
    },

    jobPosted(params: TrackParams): void {
        track.event("job_posted", params);
    },

    jobStatusChanged(params: TrackParams): void {
        track.event("job_status_changed", params);
    },

    jobCardImpression(params: TrackParams): void {
        track.event("job_card_impression", params);
    },

    adConversion(params: TrackParams): void {
        track.event("ad_conversion", params);
    },

    sponsorImpression(params: TrackParams): void {
        track.event("sponsor_impression", params);
    },

    sponsorClick(params: TrackParams): void {
        track.event("sponsor_click", params);
    },

    corridorSignalView(params: TrackParams): void {
        track.event("corridor_signal_view", params);
    },

    alertSignup(params: TrackParams): void {
        track.event("alert_signup", params);
    },

    adminView(params: TrackParams): void {
        track.event("admin_view", params);
    },

    adminAction(params: TrackParams): void {
        track.event("admin_action", params);
    },

    // ── Server event wrappers (22 required events) ──

    viewableImpression(params: TrackParams): void {
        track.event("viewable_impression", params);
    },

    destinationVisit(params: TrackParams): void {
        track.event("destination_visit", params);
    },

    claimStart(params: TrackParams): void {
        track.event("claim_start", params);
    },

    claimSubmit(params: TrackParams): void {
        track.event("claim_submit", params);
    },

    signupStart(params: TrackParams): void {
        track.event("signup_start", params);
    },

    signupComplete(params: TrackParams): void {
        track.event("signup_complete", params);
    },

    leadSubmit(params: TrackParams): void {
        track.event("lead_submit", params);
    },

    contactClick(params: TrackParams): void {
        track.event("contact_click", params);
    },

    callClick(params: TrackParams): void {
        track.event("call_click", params);
    },

    messageClick(params: TrackParams): void {
        track.event("message_click", params);
    },

    sponsorPurchase(params: TrackParams): void {
        track.event("sponsor_purchase", params);
    },

    boostPurchase(params: TrackParams): void {
        track.event("boost_purchase", params);
    },

    dataUnlockPurchase(params: TrackParams): void {
        track.event("data_unlock_purchase", params);
    },

    subscriptionPurchase(params: TrackParams): void {
        track.event("subscription_purchase", params);
    },

    exportRequest(params: TrackParams): void {
        track.event("export_request", params);
    },

    reportView(params: TrackParams): void {
        track.event("report_view", params);
    },

    alertCreate(params: TrackParams): void {
        track.event("alert_create", params);
    },

    creativeGenerated(params: TrackParams): void {
        track.event("creative_generated", params);
    },

    creativeSelected(params: TrackParams): void {
        track.event("creative_selected", params);
    },

    creativeLaunched(params: TrackParams): void {
        track.event("creative_launched", params);
    },

    creativeWon(params: TrackParams): void {
        track.event("creative_won", params);
    },
};

export default track;
