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
};

export default track;
