// lib/monetization/data-product-engine.ts
// ══════════════════════════════════════════════════════════════
// SELF-SERVE DATA PRODUCT ENGINE
//
// Manages the complete data monetization lifecycle:
//   browse → preview (teaser) → purchase → unlock → export → track
//
// Products:
//   - Corridor snapshots (demand, supply, rates)
//   - Market reports (city/state/country level)
//   - Rate benchmark reports
//   - Competitor tracking
//   - Claim gap analysis
//   - CSV/Excel exports (metered)
//   - API access tiers
//   - Alert subscriptions
//
// Integrates with:
//   - enterprise_api_keys (API access)
//   - enterprise_product_catalog (product definitions)
//   - Stripe for checkout
//   - server-events for tracking
// ══════════════════════════════════════════════════════════════

import type { SupabaseClient } from '@supabase/supabase-js';

// ── Types ───────────────────────────────────────────────────

export type DataProductType =
    | 'corridor_snapshot'
    | 'market_report'
    | 'rate_benchmark'
    | 'competitor_tracking'
    | 'claim_gap_report'
    | 'csv_export'
    | 'api_access'
    | 'alert_subscription'
    | 'enterprise_feed';

export type PurchaseType = 'one_time' | 'subscription' | 'metered';

export interface DataProduct {
    id: string;
    type: DataProductType;
    name: string;
    description: string;
    price_usd: number;
    purchase_type: PurchaseType;
    tier_required: 'free' | 'pro' | 'enterprise';
    preview_fields: string[];      // Fields shown in teaser
    full_fields: string[];         // Fields unlocked after purchase
    refresh_frequency: string;     // hourly, daily, weekly
    country_scope: string[];       // Which countries this covers
    active: boolean;
}

export interface DataPurchase {
    id: string;
    user_id: string;
    product_id: string;
    product_type: DataProductType;
    country_code: string;
    corridor_code?: string;
    stripe_session_id?: string;
    status: 'pending' | 'active' | 'expired' | 'cancelled';
    purchased_at: string;
    expires_at?: string;
    metadata: Record<string, unknown>;
}

export interface TeaserData {
    product: DataProduct;
    preview: Record<string, unknown>;    // Limited preview data
    unlock_price: number;
    unlock_cta: string;
    is_unlocked: boolean;
}

// ── Product Catalog ────────────────────────────────────────

export const DATA_PRODUCT_CATALOG: DataProduct[] = [
    {
        id: 'corridor-snapshot',
        type: 'corridor_snapshot',
        name: 'Corridor Demand Snapshot',
        description: 'Real-time demand, supply, and rate data for any corridor. Updated hourly.',
        price_usd: 29,
        purchase_type: 'subscription',
        tier_required: 'pro',
        preview_fields: ['corridor_name', 'demand_trend', 'supply_status'],
        full_fields: ['demand_score', 'fill_rate', 'avg_rate_per_mile', 'time_to_fill', 'operator_count', 'load_count_24h', 'rate_volatility', 'top_origins', 'top_destinations'],
        refresh_frequency: 'hourly',
        country_scope: ['US', 'CA', 'AU', 'GB'],
        active: true,
    },
    {
        id: 'market-report',
        type: 'market_report',
        name: 'Market Intelligence Report',
        description: 'Comprehensive market analysis for a city, state, or country. Supply/demand dynamics, competitor landscape, opportunity scoring.',
        price_usd: 49,
        purchase_type: 'subscription',
        tier_required: 'pro',
        preview_fields: ['market_name', 'overall_score', 'trend_direction'],
        full_fields: ['operator_density', 'demand_velocity', 'avg_rates', 'top_corridors', 'growth_forecast', 'competitor_count', 'opportunity_score', 'seasonal_patterns'],
        refresh_frequency: 'daily',
        country_scope: ['US', 'CA', 'AU', 'GB', 'DE', 'NL', 'AE', 'BR', 'ZA', 'NZ'],
        active: true,
    },
    {
        id: 'rate-benchmark',
        type: 'rate_benchmark',
        name: 'Rate Benchmark Report',
        description: 'Rate benchmarks by corridor, equipment type, and season. Know exactly what to charge.',
        price_usd: 19,
        purchase_type: 'one_time',
        tier_required: 'pro',
        preview_fields: ['corridor_name', 'rate_range'],
        full_fields: ['p25_rate', 'p50_rate', 'p75_rate', 'p90_rate', 'trend_30d', 'trend_90d', 'by_equipment_type', 'by_season', 'by_day_of_week'],
        refresh_frequency: 'daily',
        country_scope: ['US', 'CA'],
        active: true,
    },
    {
        id: 'competitor-tracking',
        type: 'competitor_tracking',
        name: 'Competitor Tracker',
        description: 'Track operator activity in your corridors. Get alerts when new competitors enter your market.',
        price_usd: 39,
        purchase_type: 'subscription',
        tier_required: 'pro',
        preview_fields: ['competitor_count', 'new_entrants_30d'],
        full_fields: ['competitor_profiles', 'activity_timeline', 'rate_comparison', 'market_share_estimate', 'growth_trajectories'],
        refresh_frequency: 'daily',
        country_scope: ['US', 'CA', 'AU', 'GB'],
        active: true,
    },
    {
        id: 'claim-gap-report',
        type: 'claim_gap_report',
        name: 'Claim Gap Analysis',
        description: 'Find unclaimed profiles in your market. See where the supply gaps are.',
        price_usd: 9,
        purchase_type: 'one_time',
        tier_required: 'free',
        preview_fields: ['total_unclaimed', 'top_city'],
        full_fields: ['unclaimed_by_city', 'unclaimed_by_corridor', 'demand_vs_supply_gap', 'opportunity_ranking'],
        refresh_frequency: 'weekly',
        country_scope: ['US', 'CA', 'AU', 'GB', 'DE', 'NL'],
        active: true,
    },
    {
        id: 'csv-export',
        type: 'csv_export',
        name: 'Data Export (CSV/Excel)',
        description: 'Export directory, rate, and demand data in CSV or Excel format. Free tier: 100 rows. Pro: unlimited.',
        price_usd: 0,  // Free for Pro, $4.99 per export for free tier
        purchase_type: 'metered',
        tier_required: 'free',
        preview_fields: ['row_count', 'data_types'],
        full_fields: ['all_fields'],
        refresh_frequency: 'realtime',
        country_scope: ['ALL'],
        active: true,
    },
    {
        id: 'api-access',
        type: 'api_access',
        name: 'API Access',
        description: 'Programmatic access to Haul Command data. Rate-limited based on tier.',
        price_usd: 99,
        purchase_type: 'subscription',
        tier_required: 'enterprise',
        preview_fields: ['endpoints_available', 'rate_limit'],
        full_fields: ['all_endpoints', 'full_rate_limit', 'export_limit', 'webhook_access'],
        refresh_frequency: 'realtime',
        country_scope: ['ALL'],
        active: true,
    },
    {
        id: 'alert-subscription',
        type: 'alert_subscription',
        name: 'Premium Alerts',
        description: 'Real-time alerts for corridor demand spikes, rate changes, and new load postings. Free: 3/day. Pro: unlimited.',
        price_usd: 0,  // Included with Pro
        purchase_type: 'subscription',
        tier_required: 'pro',
        preview_fields: ['alert_types', 'sample_alert'],
        full_fields: ['all_alert_types', 'custom_filters', 'push_channels', 'digest_modes'],
        refresh_frequency: 'realtime',
        country_scope: ['ALL'],
        active: true,
    },
];

// ── Engine ──────────────────────────────────────────────────

export class DataProductEngine {
    constructor(private db: SupabaseClient) {}

    // ── CATALOG ──────────────────────────────────────────────

    getProduct(productId: string): DataProduct | undefined {
        return DATA_PRODUCT_CATALOG.find(p => p.id === productId);
    }

    getActiveProducts(): DataProduct[] {
        return DATA_PRODUCT_CATALOG.filter(p => p.active);
    }

    getProductsByCountry(countryCode: string): DataProduct[] {
        return DATA_PRODUCT_CATALOG.filter(p =>
            p.active && (p.country_scope.includes(countryCode) || p.country_scope.includes('ALL'))
        );
    }

    // ── TEASER / PREVIEW ───────────────────────────────────

    async getTeaser(
        productId: string,
        userId: string,
        countryCode: string,
        corridorCode?: string,
    ): Promise<TeaserData | null> {
        const product = this.getProduct(productId);
        if (!product) return null;

        // Check if user already has this product unlocked
        const isUnlocked = await this.isUnlocked(userId, productId, countryCode, corridorCode);

        // Build preview data (limited)
        const preview = await this.buildPreviewData(product, countryCode, corridorCode);

        return {
            product,
            preview,
            unlock_price: product.price_usd,
            unlock_cta: isUnlocked ? 'View Full Report' : `Unlock — $${product.price_usd}${product.purchase_type === 'subscription' ? '/mo' : ''}`,
            is_unlocked: isUnlocked,
        };
    }

    // ── PURCHASE ────────────────────────────────────────────

    async purchaseProduct(
        userId: string,
        productId: string,
        countryCode: string,
        corridorCode?: string,
        stripeSessionId?: string,
    ): Promise<{ ok: boolean; purchase_id?: string; error?: string }> {
        const product = this.getProduct(productId);
        if (!product) return { ok: false, error: 'Product not found' };

        const expiresAt = product.purchase_type === 'subscription'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : product.purchase_type === 'one_time'
                ? null  // Never expires
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h for metered

        const { data, error } = await this.db
            .from('data_purchases')
            .insert({
                user_id: userId,
                product_id: productId,
                product_type: product.type,
                country_code: countryCode,
                corridor_code: corridorCode || null,
                stripe_session_id: stripeSessionId || null,
                status: 'active',
                purchased_at: new Date().toISOString(),
                expires_at: expiresAt,
                metadata: { price_usd: product.price_usd, purchase_type: product.purchase_type },
            })
            .select('id')
            .single();

        if (error) return { ok: false, error: error.message };

        // Track event
        await this.db.from('hc_events').insert({
            event_type: 'data_unlock_purchase',
            properties: {
                user_id: userId,
                product_id: productId,
                product_type: product.type,
                country_code: countryCode,
                corridor_code: corridorCode,
                price_usd: product.price_usd,
            },
        });

        return { ok: true, purchase_id: data.id };
    }

    // ── ACCESS CHECK ───────────────────────────────────────

    async isUnlocked(
        userId: string,
        productId: string,
        countryCode: string,
        corridorCode?: string,
    ): Promise<boolean> {
        let query = this.db
            .from('data_purchases')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .eq('country_code', countryCode)
            .eq('status', 'active');

        if (corridorCode) {
            query = query.eq('corridor_code', corridorCode);
        }

        const { data } = await query.limit(1);
        if (data && data.length > 0) return true;

        // Check if expires_at is in the future
        const { data: active } = await this.db
            .from('data_purchases')
            .select('id, expires_at')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .eq('status', 'active')
            .limit(1);

        if (active && active.length > 0) {
            const purchase = active[0] as any;
            if (!purchase.expires_at) return true; // No expiry = permanent
            return new Date(purchase.expires_at) > new Date();
        }

        return false;
    }

    // ── EXPORT ─────────────────────────────────────────────

    async processExport(
        userId: string,
        exportType: string,
        countryCode: string,
        filters: Record<string, unknown>,
    ): Promise<{ ok: boolean; rows?: number; download_url?: string; error?: string }> {
        // Check export limits
        const userTier = await this.getUserTier(userId);
        const freeExportLimit = 100;
        const proExportLimit = Infinity;
        const limit = userTier === 'pro' || userTier === 'elite' ? proExportLimit : freeExportLimit;

        // Track export request event
        await this.db.from('hc_events').insert({
            event_type: 'export_request',
            properties: {
                user_id: userId,
                export_type: exportType,
                country_code: countryCode,
                user_tier: userTier,
                filters,
            },
        });

        // If free tier and exceeds limit, return paywall
        if (limit === freeExportLimit) {
            return {
                ok: false,
                rows: freeExportLimit,
                error: `Free tier limited to ${freeExportLimit} rows. Upgrade to Pro for unlimited exports.`,
            };
        }

        return {
            ok: true,
            rows: 0,  // Would be populated by the actual export logic
            download_url: `/api/export/download?type=${exportType}&country=${countryCode}`,
        };
    }

    // ── HELPERS ─────────────────────────────────────────────

    private async buildPreviewData(
        product: DataProduct,
        countryCode: string,
        corridorCode?: string,
    ): Promise<Record<string, unknown>> {
        // Build limited preview based on product type
        switch (product.type) {
            case 'corridor_snapshot':
                return {
                    corridor_name: corridorCode || 'Select a corridor',
                    demand_trend: 'rising',    // Preview only
                    supply_status: 'moderate', // Preview only
                    _redacted: product.full_fields.filter(f => !product.preview_fields.includes(f)),
                };

            case 'market_report':
                return {
                    market_name: countryCode,
                    overall_score: '7.5/10', // Preview
                    trend_direction: 'growing',
                    _redacted: product.full_fields.filter(f => !product.preview_fields.includes(f)),
                };

            case 'rate_benchmark':
                return {
                    corridor_name: corridorCode || 'Select a corridor',
                    rate_range: '$2.50 - $4.50/mi', // Preview
                    _redacted: product.full_fields.filter(f => !product.preview_fields.includes(f)),
                };

            case 'claim_gap_report':
                return {
                    total_unclaimed: 150,
                    top_city: 'View full report',
                    _redacted: product.full_fields.filter(f => !product.preview_fields.includes(f)),
                };

            default:
                return { _notice: 'Preview not available for this product type' };
        }
    }

    private async getUserTier(userId: string): Promise<string> {
        const { data } = await this.db
            .from('profiles')
            .select('subscription_tier')
            .eq('id', userId)
            .single();

        return (data as any)?.subscription_tier || 'free';
    }
}
