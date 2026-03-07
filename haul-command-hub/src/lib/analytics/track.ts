// Haul Command — GA4 Analytics Tracking Infrastructure
// Zero-lag, typed event dispatcher

type TrackParams = Record<string, string | number | boolean | null | undefined>;

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

function baseParams(): TrackParams {
    return {
        app_env: process.env.NEXT_PUBLIC_APP_ENV ?? 'prod',
        app_version: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0',
    };
}

export const track = {
    // ─── Core dispatcher ───
    event(name: string, params: TrackParams = {}) {
        if (typeof window === 'undefined') return;
        const gtag = window.gtag;
        if (!gtag) return;
        gtag('event', name, { ...baseParams(), ...params });
    },

    // ─── Navigation / SEO ───
    pageView(params: {
        page_path: string;
        page_title: string;
        page_type: string;
        hub_depth?: number;
        canonical_path?: string;
        is_indexable?: boolean;
    }) {
        track.event('page_view', params);
    },

    directoryHubView(params: {
        hub_depth: number;
        hub_key: string;
        total_listings_visible: number;
        total_verified_visible: number;
        total_jobs_last_30d?: number;
        seo_template?: string;
        has_unique_content?: boolean;
    }) {
        track.event('directory_hub_view', params);
    },

    directoryFacetView(params: {
        hub_key: string;
        facet_key: string;
        facet_group: string;
        results_count: number;
        is_indexable: boolean;
    }) {
        track.event('directory_facet_view', params);
    },

    // ─── Search & Filter ───
    searchSubmitted(params: {
        search_type: string;
        origin_city_slug?: string;
        origin_region_code?: string;
        dest_city_slug?: string;
        dest_region_code?: string;
        date_window?: string;
        escort_type?: string;
        query_complexity?: number;
        results_count: number;
        latency_ms: number;
    }) {
        track.event('search_submitted', params);
    },

    filterChanged(params: {
        filter_group: string;
        filter_key: string;
        filter_value: string | boolean | number;
        active_filter_count: number;
        results_count: number;
    }) {
        track.event('filter_changed', params);
    },

    sortChanged(params: {
        sort_key: string;
        results_count: number;
    }) {
        track.event('sort_changed', params);
    },

    // ─── Cards & Profiles (Conversion Path) ───
    escortCardImpression(params: {
        escort_id: string;
        position_index: number;
        feed_type: string;
        ranking_bucket?: string;
        is_sponsored?: boolean;
    }) {
        track.event('escort_card_impression', params);
    },

    escortCardClick(params: {
        escort_id: string;
        position_index: number;
        feed_type: string;
        is_sponsored?: boolean;
    }) {
        track.event('escort_card_click', params);
    },

    profileView(params: {
        escort_id: string;
        profile_completion_pct: number;
        has_insurance_verified?: boolean;
        has_docs_verified?: boolean;
        reviews_count?: number;
        completed_moves_count?: number;
    }) {
        track.event('profile_view', params);
    },

    profileStrengthView(params: {
        profile_completion_pct: number;
        missing_top_3?: string;
        next_best_action?: string;
    }) {
        track.event('profile_strength_view', params);
    },

    profileStrengthActionClick(params: {
        action_key: string;
        from_pct: number;
        to_target_pct?: number;
    }) {
        track.event('profile_strength_action_click', params);
    },

    // ─── Booking / Escrow Flow (Money Path) ───
    holdSlotClicked(params: {
        escort_id: string;
        job_id?: string | null;
        deposit_required?: boolean;
        deposit_amount?: number;
        currency?: string;
        eta_minutes?: number | null;
        coverage_confidence?: number | null;
    }) {
        track.event('hold_slot_clicked', params);
    },

    checkoutStarted(params: {
        escort_id: string;
        job_id?: string;
        price_total: number;
        deposit_amount: number;
        fee_platform?: number;
        payment_method_offered?: string;
    }) {
        track.event('checkout_started', params);
    },

    checkoutPaymentSubmitted(params: {
        payment_method_selected: string;
        price_total: number;
        deposit_amount: number;
        fee_platform?: number;
    }) {
        track.event('checkout_payment_submitted', params);
    },

    bookingConfirmed(params: {
        booking_id: string;
        escort_id: string;
        job_id?: string;
        deposit_amount: number;
        price_total: number;
        time_to_book_ms?: number;
    }) {
        track.event('booking_confirmed', params);
    },

    bookingFailed(params: {
        escort_id: string;
        job_id?: string;
        failure_stage: string;
        error_code?: string;
    }) {
        track.event('booking_failed', params);
    },

    // ─── Loads Feed / Job Lifecycle ───
    jobPosted(params: {
        job_id: string;
        origin_region_code: string;
        dest_region_code: string;
        time_window_hours?: number;
        escort_type_required?: string;
        is_multi_state?: boolean;
    }) {
        track.event('job_posted', params);
    },

    jobStatusChanged(params: {
        job_id: string;
        from_status: string;
        to_status: string;
        fill_time_seconds?: number;
        reason?: string;
    }) {
        track.event('job_status_changed', params);
    },

    jobCardImpression(params: {
        job_id: string;
        status: string;
        position_index: number;
        feed_type: string;
    }) {
        track.event('job_card_impression', params);
    },

    jobCardClick(params: {
        job_id: string;
        status: string;
        feed_type: string;
    }) {
        track.event('job_card_click', params);
    },

    // ─── Ads (NativeAdCard / AdSlot) ───
    adImpression(params: {
        ad_id: string;
        campaign_id?: string;
        placement: string;
        variant: string;
        position_index: number;
        ecp_micros?: number;
        rendered_ok?: boolean;
    }) {
        track.event('ad_impression', params);
    },

    adClick(params: {
        ad_id: string;
        campaign_id?: string;
        placement: string;
        variant: string;
        position_index: number;
        destination_type?: string;
        click_latency_ms?: number;
    }) {
        track.event('ad_click', params);
    },

    adConversion(params: {
        ad_id: string;
        campaign_id?: string;
        conversion_type: string;
        value?: number;
        currency?: string;
    }) {
        track.event('ad_conversion', params);
    },

    // ─── Onboarding ───
    onboardingCompleted(params: {
        latency_ms?: number;
        user_role?: string;
    }) {
        track.event('onboarding_completed', params);
    },

    // ─── Admin ───
    adminView(params: {
        panel_key: string;
        action_context?: string;
    }) {
        track.event('admin_view', params);
    },

    adminAction(params: {
        panel_key: string;
        action_key: string;
        target_id?: string;
        reason_code?: string;
    }) {
        track.event('admin_action', params);
    },
};
