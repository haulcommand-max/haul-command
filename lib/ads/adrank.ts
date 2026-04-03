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

// ─────────────────────────────────────────────────────────────────────────────
// SERVE ADS — main function called by /api/ads/serve and server components
// Falls back to house ads when no paid campaigns available.
// ─────────────────────────────────────────────────────────────────────────────

export interface AuctionContext {
    zone: string;           // AdGrid zone: 'hero_billboard', 'directory_sidebar', etc.
    geo?: string;           // ISO country or US state code
    role?: string;          // user role if known
    page_type?: string;
    session_tier?: string;
    limit?: number;
}

export async function serveAds(ctx: AuctionContext): Promise<ServedAd[]> {
    const limit = ctx.limit ?? 3;

    // Dynamic import to avoid circular dep at build time
    const { getTopHouseAds, getHouseAds } = await import('./house-ads');

    try {
        // Lazy-import admin to avoid bundling on client
        const { getSupabaseAdmin } = await import('@/lib/enterprise/supabase/admin');
        const admin = getSupabaseAdmin();

        const { data: campaigns } = await admin
            .from('ad_campaigns')
            .select('*')
            .eq('status', 'active')
            .lte('start_date', new Date().toISOString());

        if (!campaigns || campaigns.length === 0) {
            return getTopHouseAds(limit);
        }

        // Score each campaign with AdRank formula
        const scored = campaigns
            .filter((c: Record<string, unknown>) => !c.paused)
            .filter((c: Record<string, unknown>) => {
                // Zone filter
                if (!c.target_zone || (c.target_zone as string[]).length === 0) return true;
                return (c.target_zone as string[]).includes(ctx.zone);
            })
            .map((c: Record<string, unknown>) => {
                const bid = Number(c.bid_cpm ?? c.bid_cpc ?? ((c.bid_flat as number) ? (c.bid_flat as number) / 300 : 0));
                const quality = Number(c.quality_score ?? 0.5);
                // Geo relevance
                const geoMatch = !ctx.geo || !(c.target_geo as string[])?.length
                    ? 0.5 : (c.target_geo as string[]).includes(ctx.geo) ? 1.0 : 0.3;
                // Role relevance
                const roleMatch = !ctx.role || !(c.target_role as string[])?.length
                    ? 0.5 : (c.target_role as string[]).includes(ctx.role) ? 1.0 : 0.2;

                const rank = computeAdRank({
                    bid_norm: Math.min(bid / 50, 1),
                    ctr_pred: quality,
                    relevance: (geoMatch + roleMatch) / 2,
                    adv_trust: Number(c.advertiser_trust ?? 0.7),
                    ad_quality: quality,
                    fraud_risk: Number(c.fraud_risk ?? 0),
                });

                return { c, rank, geoMatch, roleMatch };
            })
            .sort((a: { rank: number }, b: { rank: number }) => b.rank - a.rank)
            .slice(0, limit);

        if (scored.length === 0) return getTopHouseAds(limit);

        return scored.map(({ c, rank }: { c: Record<string, unknown>, rank: number }) => ({
            ad_id: `${c.id}-${Date.now()}`,
            campaign_id: String(c.id),
            creative_id: String(c.creative_id ?? c.id),
            headline: String(c.headline ?? ''),
            body: c.body ? String(c.body) : null,
            cta_text: String(c.cta_text ?? 'Learn More'),
            cta_url: String(c.cta_url ?? '/'),
            image_url: c.image_url ? String(c.image_url) : null,
            creative_type: String(c.creative_type ?? 'text'),
            impression_token: `tok_${c.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            price_model: String(c.price_model ?? 'cpm'),
            ad_rank: rank,
        }));

    } catch (err) {
        console.error('[serveAds] error, falling back to house ads:', err);
        return getHouseAds({ limit, surface: ctx.zone });
    }
}

/** Fire-and-forget impression recording */
export async function recordImpression(
    ad: ServedAd,
    ctx: { zone: string; geo?: string; role?: string; user_id?: string },
): Promise<void> {
    try {
        const { getSupabaseAdmin } = await import('@/lib/enterprise/supabase/admin');
        const admin = getSupabaseAdmin();
        await admin.from('ad_impressions').insert({
            campaign_id: ad.campaign_id,
            creative_id: ad.creative_id,
            impression_token: ad.impression_token,
            zone: ctx.zone,
            geo: ctx.geo,
            role: ctx.role,
            user_id: ctx.user_id ?? null,
            price_model: ad.price_model,
            ad_rank: ad.ad_rank,
            served_at: new Date().toISOString(),
        });
    } catch {
        // Best-effort — never block render
    }
}


