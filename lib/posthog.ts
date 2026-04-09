// ============================================================
// PostHog Analytics — Canonical analytics, experiments, flags
// Replaces: GA4, Plausible, GrowthBook, Formbricks
// ============================================================
import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let initialized = false;

export function initPostHog() {
    if (typeof window === 'undefined' || initialized || !POSTHOG_KEY) return;

    posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
        session_recording: {
            maskAllInputs: true,
            maskTextSelector: '[data-ph-mask]',
        },
    });

    initialized = true;
}

// ── Claim Flow Events ──
export const ClaimEvents = {
    viewedUnclaimedListing: (props: { surface_id: string; country: string; category?: string }) =>
        posthog.capture('viewed_unclaimed_listing', props),

    clickedClaim: (props: { surface_id: string; source: string }) =>
        posthog.capture('clicked_claim', props),

    claimStarted: (props: { surface_id: string; route: string; risk_bucket?: string }) =>
        posthog.capture('claim_started', props),

    otpSent: (props: { surface_id: string; method: 'phone' | 'email' }) =>
        posthog.capture('otp_sent', props),

    otpVerified: (props: { surface_id: string; method: 'phone' | 'email' }) =>
        posthog.capture('otp_verified', props),

    duplicateFound: (props: { surface_id: string; match_type: string }) =>
        posthog.capture('duplicate_found', props),

    ownershipGranted: (props: { surface_id: string; country: string; verification_route: string }) =>
        posthog.capture('ownership_granted', props),

    profileCompletionChanged: (props: { surface_id: string; completion_pct: number }) =>
        posthog.capture('profile_completion_changed', props),

    profileMilestone: (props: { surface_id: string; milestone: 25 | 50 | 70 | 90 | 100 }) =>
        posthog.capture(`profile_${props.milestone}_reached`, props),

    documentUploaded: (props: { surface_id: string; doc_type: string }) =>
        posthog.capture('document_uploaded', props),

    documentVerified: (props: { surface_id: string; doc_type: string }) =>
        posthog.capture('document_verified', props),

    trustScoreActivated: (props: { surface_id: string; score: number; tier: string }) =>
        posthog.capture('trust_score_activated', props),

    listingLive: (props: { surface_id: string; country: string; trust_tier: string }) =>
        posthog.capture('listing_live', props),
};

// ── Search & Discovery Events ──
export const DiscoveryEvents = {
    firstSearchImpression: (props: { surface_id: string; query: string; position: number }) =>
        posthog.capture('first_search_impression', props),

    firstCompare: (props: { surface_ids: string[]; country: string }) =>
        posthog.capture('first_compare', props),

    firstLoadMatchCandidate: (props: { surface_id: string; load_id: string }) =>
        posthog.capture('first_load_match_candidate', props),
};

// ── Monetization Events ──
export const MonetizationEvents = {
    trialStarted: (props: { surface_id: string; plan: string }) =>
        posthog.capture('trial_started', props),

    premiumConverted: (props: { surface_id: string; plan: string; amount: number }) =>
        posthog.capture('premium_converted', props),

    partnerOfferSeen: (props: { offer_id: string; partner: string; context: string }) =>
        posthog.capture('partner_offer_seen', props),

    partnerOfferClicked: (props: { offer_id: string; partner: string }) =>
        posthog.capture('partner_offer_clicked', props),

    adSlotViewed: (props: { slot_id: string; placement: string; advertiser?: string }) =>
        posthog.capture('ad_slot_viewed', props),

    adSlotClicked: (props: { slot_id: string; placement: string }) =>
        posthog.capture('ad_slot_clicked', props),

    sponsorshipInquiryStarted: (props: { corridor?: string; territory?: string }) =>
        posthog.capture('sponsorship_inquiry_started', props),
};

// ── Reactivation Events ──
export const ReactivationEvents = {
    reactivationStarted: (props: { surface_id: string; trigger: string }) =>
        posthog.capture('reactivation_started', props),

    reactivationCompleted: (props: { surface_id: string }) =>
        posthog.capture('reactivation_completed', props),
};

// ── QuickPay Events ──
export const QuickPayEvents = {
    ctaViewed: (props: { job_id: string; amount: number }) =>
        posthog.capture('quickpay_cta_view', props),

    ctaClicked: (props: { job_id: string; amount: number; source?: string }) =>
        posthog.capture('quickpay_cta_click', props),

    advanceSuccess: (props: { job_id: string; amount: number; advance_id: string }) =>
        posthog.capture('quickpay_advance_success', props),
};

// ── User Identification ──
export function identifyUser(userId: string, traits: Record<string, unknown> = {}) {
    posthog.identify(userId, traits);
}

export function resetUser() {
    posthog.reset();
}

// ── Feature Flags ──
export function isFeatureEnabled(flag: string): boolean {
    return posthog.isFeatureEnabled(flag) ?? false;
}

export function getFeatureFlag(flag: string): string | boolean | undefined {
    return posthog.getFeatureFlagPayload(flag) as string | boolean | undefined;
}

export { posthog };
