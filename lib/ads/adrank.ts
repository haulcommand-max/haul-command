/**
 * AdRank Scoring Constants — Single source of truth
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

export const SURFACES = [
    'directory_search',
    'profile',
    'load_board',
    'map',
    'feed',
    'chambers_sidebar',
    'dashboard_banner',
] as const;

export type AdSurface = typeof SURFACES[number];

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
