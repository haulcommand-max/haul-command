// ═══════════════════════════════════════════════════════════════════════════════
// HAUL COMMAND CUSTOM EVENT PIPELINE
// Type-safe marketplace event taxonomy + enrichment + routing
//
// Every event flows: capture → enrich → PostHog + internal sinks
// All events tagged with country, corridor, role, tier for 120-country analytics
// ═══════════════════════════════════════════════════════════════════════════════

import { getPostHog } from './posthog-provider';

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT TAXONOMY — Marketplace-Specific
// ═══════════════════════════════════════════════════════════════════════════════

export type HCEventCategory =
    | 'directory'
    | 'load_board'
    | 'leaderboard'
    | 'trust'
    | 'matching'
    | 'revenue'
    | 'corridor'
    | 'profile'
    | 'notification'
    | 'data_marketplace'
    | 'pricing'
    | 'onboarding'
    | 'growth';

export interface HCBaseEvent {
    category: HCEventCategory;
    action: string;
    // Auto-enriched
    country_code?: string;
    corridor_id?: string;
    user_role?: 'operator' | 'broker' | 'admin' | 'anonymous';
    subscription_tier?: string;
    session_page?: string;
}

// ── Directory Events ─────────────────────────────────────────────────────────

export interface DirectorySearchEvent extends HCBaseEvent {
    category: 'directory';
    action: 'search';
    query: string;
    filters: Record<string, string>;
    results_count: number;
    response_time_ms: number;
}

export interface DirectoryViewProfileEvent extends HCBaseEvent {
    category: 'directory';
    action: 'view_profile';
    provider_id: string;
    source: 'search' | 'map' | 'leaderboard' | 'direct' | 'featured';
    is_claimed: boolean;
    trust_tier: string;
}

export interface DirectoryClaimEvent extends HCBaseEvent {
    category: 'directory';
    action: 'start_claim' | 'complete_claim' | 'abandon_claim';
    provider_id: string;
    step?: string;
}

export interface DirectoryContactEvent extends HCBaseEvent {
    category: 'directory';
    action: 'click_phone' | 'click_email' | 'click_website';
    provider_id: string;
}

// ── Load Board Events ────────────────────────────────────────────────────────

export interface LoadPostEvent extends HCBaseEvent {
    category: 'load_board';
    action: 'post_load' | 'edit_load' | 'cancel_load' | 'expire_load';
    load_id: string;
    load_type: string;
    pickup_country: string;
    delivery_country: string;
    is_boosted: boolean;
}

export interface LoadMatchEvent extends HCBaseEvent {
    category: 'load_board';
    action: 'match_generated' | 'match_accepted' | 'match_rejected' | 'match_expired';
    load_id: string;
    match_id: string;
    match_score?: number;
    time_to_accept_minutes?: number;
}

export interface LoadSearchEvent extends HCBaseEvent {
    category: 'load_board';
    action: 'search_loads';
    origin_region: string;
    destination_region?: string;
    results_count: number;
}

// ── Revenue Events ───────────────────────────────────────────────────────────

export interface RevenueEvent extends HCBaseEvent {
    category: 'revenue';
    action: 'subscription_started' | 'subscription_upgraded' | 'subscription_cancelled'
    | 'boost_purchased' | 'match_fee_charged' | 'featured_slot_purchased'
    | 'data_product_purchased' | 'api_key_created';
    revenue_usd: number;
    currency: string;
    product_id: string;
    payment_method?: string;
}

// ── Corridor Events ──────────────────────────────────────────────────────────

export interface CorridorEvent extends HCBaseEvent {
    category: 'corridor';
    action: 'view_corridor' | 'save_corridor' | 'unsave_corridor'
    | 'corridor_surge_detected' | 'corridor_shortage_detected';
    corridor_id: string;
    liquidity_ratio?: number;
    heat_score?: number;
}

// ── Trust Events ─────────────────────────────────────────────────────────────

export interface TrustEvent extends HCBaseEvent {
    category: 'trust';
    action: 'review_submitted' | 'review_flagged' | 'review_disputed'
    | 'verification_started' | 'verification_completed'
    | 'trust_score_changed';
    target_id: string;
    trust_tier?: string;
    score_delta?: number;
}

// ── Data Marketplace Events ──────────────────────────────────────────────────

export interface DataMarketplaceEvent extends HCBaseEvent {
    category: 'data_marketplace';
    action: 'view_catalog' | 'view_product' | 'start_checkout' | 'complete_purchase'
    | 'download_report' | 'api_key_requested' | 'api_call_made';
    product_sku: string;
    revenue_usd?: number;
    format?: 'json' | 'csv' | 'pdf' | 'api';
}

// ── Pricing Events ───────────────────────────────────────────────────────────

export interface PricingEvent extends HCBaseEvent {
    category: 'pricing';
    action: 'rate_viewed' | 'rate_compared' | 'rate_alert_triggered'
    | 'price_index_viewed' | 'price_anomaly_detected';
    service_type: string;
    rate_usd: number;
    rate_index_score?: number; // -1 to 1 (below/above market)
}

// ── Growth Events ────────────────────────────────────────────────────────────

export interface GrowthEvent extends HCBaseEvent {
    category: 'growth';
    action: 'referral_sent' | 'referral_converted' | 'streak_achieved'
    | 'upgrade_prompt_shown' | 'upgrade_prompt_clicked' | 'upgrade_prompt_dismissed'
    | 'feature_gate_hit';
    feature_name?: string;
    pressure_level?: string;
}

// ── Notification Events ──────────────────────────────────────────────────────

export interface NotificationEvent extends HCBaseEvent {
    category: 'notification';
    action: 'sent' | 'opened' | 'dismissed' | 'opted_out' | 'opted_in';
    notification_type: string;
    delivery_channel: 'push' | 'email' | 'in_app' | 'sms';
}

// ── Union Type ───────────────────────────────────────────────────────────────

export type HCEvent =
    | DirectorySearchEvent
    | DirectoryViewProfileEvent
    | DirectoryClaimEvent
    | DirectoryContactEvent
    | LoadPostEvent
    | LoadMatchEvent
    | LoadSearchEvent
    | RevenueEvent
    | CorridorEvent
    | TrustEvent
    | DataMarketplaceEvent
    | PricingEvent
    | GrowthEvent
    | NotificationEvent;

// ═══════════════════════════════════════════════════════════════════════════════
// ENRICHMENT CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

interface EnrichmentContext {
    userId?: string;
    role?: 'operator' | 'broker' | 'admin' | 'anonymous';
    countryCode?: string;
    corridorId?: string;
    subscriptionTier?: string;
    sessionStartedAt?: number;
}

let _enrichment: EnrichmentContext = {};

export function setEnrichmentContext(ctx: Partial<EnrichmentContext>) {
    _enrichment = { ..._enrichment, ...ctx };
}

export function clearEnrichmentContext() {
    _enrichment = {};
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAPTURE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export function captureEvent(event: HCEvent) {
    const ph = getPostHog();
    if (!ph) return;

    // Build enriched properties
    const enrichedProps: Record<string, unknown> = {
        // Event classification
        hc_category: event.category,
        hc_action: event.action,

        // Global context (auto-enriched for every event)
        hc_country: event.country_code || _enrichment.countryCode || 'unknown',
        hc_corridor: event.corridor_id || _enrichment.corridorId,
        hc_role: event.user_role || _enrichment.role || 'anonymous',
        hc_tier: event.subscription_tier || _enrichment.subscriptionTier || 'free',
        hc_page: typeof window !== 'undefined' ? window.location.pathname : undefined,

        // Timestamp
        hc_ts: Date.now(),
    };

    // Spread event-specific properties
    const { category, action, country_code, corridor_id, user_role,
        subscription_tier, session_page, ...eventSpecific } = event;
    Object.assign(enrichedProps, eventSpecific);

    // PostHog event name format: "hc_{category}_{action}"
    const eventName = `hc_${event.category}_${event.action}`;
    ph.capture(eventName, enrichedProps);

    // Revenue events get special PostHog revenue tracking
    if (event.category === 'revenue' && 'revenue_usd' in event) {
        ph.capture('$revenue', {
            ...enrichedProps,
            $revenue: (event as RevenueEvent).revenue_usd,
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE WRAPPERS — Common marketplace flows
// ═══════════════════════════════════════════════════════════════════════════════

export const HCTrack = {

    // ── Directory ────────────────────────────────────────────────────────────

    directorySearch(query: string, filters: Record<string, string>, resultsCount: number, responseMs: number) {
        captureEvent({
            category: 'directory', action: 'search',
            query, filters, results_count: resultsCount, response_time_ms: responseMs,
        });
    },

    viewProfile(providerId: string, source: DirectoryViewProfileEvent['source'], isClaimed: boolean, trustTier: string) {
        captureEvent({
            category: 'directory', action: 'view_profile',
            provider_id: providerId, source, is_claimed: isClaimed, trust_tier: trustTier,
        });
    },

    startClaim(providerId: string) {
        captureEvent({ category: 'directory', action: 'start_claim', provider_id: providerId });
    },

    completeClaim(providerId: string) {
        captureEvent({ category: 'directory', action: 'complete_claim', provider_id: providerId });
    },

    contactClick(providerId: string, type: 'click_phone' | 'click_email' | 'click_website') {
        captureEvent({ category: 'directory', action: type, provider_id: providerId });
    },

    // ── Load Board ───────────────────────────────────────────────────────────

    postLoad(loadId: string, loadType: string, pickupCountry: string, deliveryCountry: string, isBoosted: boolean) {
        captureEvent({
            category: 'load_board', action: 'post_load',
            load_id: loadId, load_type: loadType,
            pickup_country: pickupCountry, delivery_country: deliveryCountry,
            is_boosted: isBoosted,
        });
    },

    matchAccepted(loadId: string, matchId: string, matchScore: number, timeToAcceptMin: number) {
        captureEvent({
            category: 'load_board', action: 'match_accepted',
            load_id: loadId, match_id: matchId,
            match_score: matchScore, time_to_accept_minutes: timeToAcceptMin,
        });
    },

    // ── Revenue ──────────────────────────────────────────────────────────────

    revenueEvent(action: RevenueEvent['action'], revenueUsd: number, currency: string, productId: string) {
        captureEvent({
            category: 'revenue', action,
            revenue_usd: revenueUsd, currency, product_id: productId,
        });
    },

    // ── Data Marketplace ─────────────────────────────────────────────────────

    dataPurchase(sku: string, revenueUsd: number, format: 'json' | 'csv' | 'pdf' | 'api') {
        captureEvent({
            category: 'data_marketplace', action: 'complete_purchase',
            product_sku: sku, revenue_usd: revenueUsd, format,
        });
    },

    // ── Pricing ──────────────────────────────────────────────────────────────

    viewPriceIndex(serviceType: string, rateUsd: number, indexScore: number) {
        captureEvent({
            category: 'pricing', action: 'price_index_viewed',
            service_type: serviceType, rate_usd: rateUsd, rate_index_score: indexScore,
        });
    },

    // ── Growth ───────────────────────────────────────────────────────────────

    upgradePromptShown(pressureLevel: string, featureName?: string) {
        captureEvent({
            category: 'growth', action: 'upgrade_prompt_shown',
            pressure_level: pressureLevel, feature_name: featureName,
        });
    },

    featureGateHit(featureName: string) {
        captureEvent({
            category: 'growth', action: 'feature_gate_hit',
            feature_name: featureName,
        });
    },
};
