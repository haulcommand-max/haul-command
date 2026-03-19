/**
 * AdRank Scoring Constants — Single source of truth
 * 
 * UPGRADED: Merged root's bid+fraud model with hub's billboard surfaces + feed interleaving.
 * 
 * AdRank = (0.55 × bid) + (0.20 × ctr) + (0.10 × relevance)
 *        + (0.08 × trust) + (0.07 × quality) - (0.35 × fraud)
 */

export const ADRANK_WEIGHTS = {
    bid_norm: 0.55,
    ctr_pred: 0.20,
    relevance: 0.10,
    adv_trust: 0.08,
    ad_quality: 0.07,
    fraud_risk_penalty: 0.35,
} as const;

export const THRESHOLDS = {
    fraud_block: 0.85,
    fraud_soft: 0.65,
    click_dedupe_seconds: 45,
    impression_ttl_minutes: 10,
    dwell_ms_billable: 800,
    frequency_cap_daily: 3,
    frequency_cap_hourly: 1,
    pacing_throttle_ratio: 1.25,
    exploration_rate: 0.10,
} as const;

// ─── Surfaces (merged: original + billboard slots from hub) ──

export const SURFACES = [
    'directory_search',
    'profile',
    'load_board',
    'map',
    'feed',
    'chambers_sidebar',
    'dashboard_banner',
    // Billboard surfaces (from hub)
    'hero_billboard',
    'inline_billboard',
    'sidecar_sponsor',
    'sticky_mobile_chip_rail',
    'alert_gate_offer',
    // Corridor-specific
    'corridor_hero',
    'corridor_inline',
    'provider_sidecar',
] as const;

export type AdSurface = typeof SURFACES[number];

// ─── Placement Constants (from hub, for GA4 tracking) ──

export const AD_PLACEMENTS = {
    DIRECTORY_INLINE: 'directory_inline',
    DIRECTORY_SIDEBAR: 'directory_sidebar',
    LEADERBOARD_INLINE: 'leaderboard_inline',
    LOAD_FEED_INLINE: 'load_feed_inline',
    HUB_BANNER: 'hub_banner',
    COUNTRY_HUB: 'country_hub_banner',
    SERVICE_PAGE: 'service_page_banner',
    GUIDE_PAGE: 'guide_page_banner',
    CORRIDOR_HERO: 'corridor_hero_billboard',
    CORRIDOR_INLINE: 'corridor_inline_billboard',
    PROVIDER_SIDECAR: 'provider_sidecar_sponsor',
} as const;

export const AD_VARIANTS = {
    NATIVE_CARD: 'native_card',
    SLOT_BANNER: 'slot_banner',
    HERO_BILLBOARD: 'hero_billboard',
    INLINE_BILLBOARD: 'inline_billboard',
    SIDECAR: 'sidecar_sponsor',
    CHIP_RAIL: 'sticky_mobile_chip_rail',
} as const;

export const FRAUD_SIGNAL_WEIGHTS = {
    rapid_clicks: 0.20,
    high_click_rate: 0.15,
    ad_hopping: 0.15,
    geo_jumps: 0.12,
    ip_reuse: 0.20,
    ua_anomaly: 0.10,
    burst: 0.08,
} as const;

export interface ServedAd {
    ad_id: string;
    campaign_id: string;
    creative_id: string;
    headline: string;
    body: string | null;
    cta_text: string;
    cta_url: string;
    image_url: string | null;
    creative_type: string;
    impression_token: string;
    price_model: string;
    ad_rank: number;
}

export interface AdRankComponents {
    bid_norm: number;
    ctr_pred: number;
    relevance: number;
    adv_trust: number;
    ad_quality: number;
    fraud_risk: number;
    final_rank: number;
}

/** Compute AdRank from components */
export function computeAdRank(components: Omit<AdRankComponents, 'final_rank'>): number {
    return (
        ADRANK_WEIGHTS.bid_norm * components.bid_norm +
        ADRANK_WEIGHTS.ctr_pred * components.ctr_pred +
        ADRANK_WEIGHTS.relevance * components.relevance +
        ADRANK_WEIGHTS.adv_trust * components.adv_trust +
        ADRANK_WEIGHTS.ad_quality * components.ad_quality -
        ADRANK_WEIGHTS.fraud_risk_penalty * components.fraud_risk
    );
}

// ─── Feed Interleaving (from hub's ad-engine, merged here) ──

export type FeedRow<T> =
    | { kind: 'item'; item: T }
    | { kind: 'ad'; placement: string; slotIndex: number };

/**
 * Interleaves NativeAdCard slots into a feed of items.
 * Works for directory listings, load board rows, corridor cards, etc.
 */
export function interleaveNativeAds<T>(
    items: T[],
    opts: {
        everyNth: number;
        placement: string;
        startAfter?: number;
        maxAds?: number;
    }
): FeedRow<T>[] {
    const { everyNth, placement, startAfter = everyNth, maxAds = 999 } = opts;
    const out: FeedRow<T>[] = [];
    let adCount = 0;

    for (let i = 0; i < items.length; i++) {
        out.push({ kind: 'item', item: items[i] });
        const itemIndex1 = i + 1;
        if (itemIndex1 >= startAfter && itemIndex1 % everyNth === 0 && adCount < maxAds) {
            out.push({ kind: 'ad', placement, slotIndex: adCount });
            adCount++;
        }
    }
    return out;
}

