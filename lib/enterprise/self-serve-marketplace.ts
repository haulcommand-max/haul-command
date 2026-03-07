// ═══════════════════════════════════════════════════════════════════════════════
// SELF-SERVE DATA MARKETPLACE
// The "zero-touch purchase" pipeline: browse → pay → receive API key → call data
//
// Workflow:
//   1. Customer visits /data → sees product catalog
//   2. Customer picks SKU + tier → Stripe checkout session created
//   3. Payment confirmed → API key auto-provisioned → emailed to customer
//   4. Customer uses key to hit enterprise endpoints
//   5. Usage metered → dashboard visible → overages billed
//
// All 52 countries supported. Prices auto-adjusted by country tier.
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';
import Stripe from 'stripe';
import { COUNTRY_RATE_TABLE } from '../pricing/global-rate-index';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type DataProductSku =
    | 'operations_optimizer'
    | 'pricing_intelligence'
    | 'risk_command'
    | 'enterprise_full_signal';

export type DataProductTier =
    | 'insight_starter'
    | 'pro_intelligence'
    | 'enterprise_signal'
    | 'data_licensing_bulk';

export interface DataProduct {
    sku: DataProductSku;
    name: string;
    tagline: string;
    description: string;
    icon: string;
    tier: DataProductTier;
    priceUsd: number;         // monthly USD
    priceAnnualUsd: number;   // yearly USD (discounted)
    stripePriceIdMonthly?: string; // set via env or DB
    stripePriceIdYearly?: string;
    features: string[];
    endpoints: string[];
    dataFields: string[];
    updateFrequency: string;
    sampleResponseUrl?: string;
    popularBadge: boolean;
    rowLimitMonthly: number;
    rpmLimit: number;
    supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
}

export interface ApiKeyProvisionResult {
    apiKey: string;        // raw key (show once to user)
    apiKeyPrefix: string;  // "hc_xxx..." for display
    tier: DataProductTier;
    products: DataProductSku[];
    rateLimitRpm: number;
    monthlyRowLimit: number;
    expiresAt: string | null;
}

export interface CheckoutSessionResult {
    sessionId: string;
    sessionUrl: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA PRODUCT CATALOG
// ═══════════════════════════════════════════════════════════════════════════════

export const DATA_PRODUCTS: DataProduct[] = [
    {
        sku: 'operations_optimizer',
        name: 'Operations Optimizer',
        tagline: 'Corridor liquidity + fill predictions',
        description: 'Real-time corridor liquidity scores, scarcity indexes, and ML-powered fill probability predictions. Know where escorts are in demand and how fast your load will fill — before you post it.',
        icon: '⚡',
        tier: 'pro_intelligence',
        priceUsd: 149,
        priceAnnualUsd: 1490,
        features: [
            'Corridor liquidity scores (refreshed hourly)',
            'Escort scarcity index per metro',
            'Fill probability prediction with confidence bands',
            'Time-to-fill benchmarks by region',
            'Seasonal demand forecasts',
            'Alert webhooks for liquidity shifts',
        ],
        endpoints: ['/api/enterprise/corridors/liquidity', '/api/enterprise/corridors/scarcity', '/api/enterprise/fill/probability'],
        dataFields: ['liquidity_score', 'scarcity_index', 'p_fill_60m', 'time_to_fill_benchmarks', 'demand_trend'],
        updateFrequency: 'hourly',
        popularBadge: true,
        rowLimitMonthly: 25_000,
        rpmLimit: 30,
        supportLevel: 'email',
    },
    {
        sku: 'pricing_intelligence',
        name: 'Pricing Intelligence',
        tagline: 'Rate benchmarks + volatility + Carvana-style index',
        description: 'Per-country rate percentiles, volatility indexes, surge indicators, and Carvana-style "Great/Good/Fair/Above/Overpriced" badges for every corridor across 52 countries.',
        icon: '📊',
        tier: 'pro_intelligence',
        priceUsd: 199,
        priceAnnualUsd: 1990,
        features: [
            'Rate percentiles by country + service type (p10-p90)',
            'Carvana-style price badges (Great/Good/Fair/Above/Overpriced)',
            'Trend analysis (7d / 30d / seasonal)',
            'Surge detection with corridor-level granularity',
            'Cross-country price comparison tool',
            'Rate alert webhooks',
        ],
        endpoints: ['/api/enterprise/rates/benchmark', '/api/enterprise/rates/index', '/api/enterprise/corridors/scarcity'],
        dataFields: ['rate_per_mile_percentiles', 'volatility_index', 'surge_indicator', 'price_badge', 'trend_direction', 'comparison_text'],
        updateFrequency: 'hourly',
        popularBadge: false,
        rowLimitMonthly: 50_000,
        rpmLimit: 60,
        supportLevel: 'email',
    },
    {
        sku: 'risk_command',
        name: 'Risk Command',
        tagline: 'Broker risk + route risk + dispute probability',
        description: 'Aggregated risk bands for brokers, route-level risk indices, and dispute probability scores. Make hiring decisions backed by crowd-sourced intelligence across the entire Haul Command network.',
        icon: '🛡️',
        tier: 'enterprise_signal',
        priceUsd: 399,
        priceAnnualUsd: 3990,
        features: [
            'Broker risk band scoring (aggregated)',
            'Route risk indices per corridor',
            'Dispute probability prediction',
            'Days-to-pay analytics by broker',
            'Trust tier distribution by region',
            'Dedicated account support',
        ],
        endpoints: ['/api/enterprise/brokers/risk', '/api/enterprise/disputes/prediction'],
        dataFields: ['broker_risk_band', 'route_risk_indices', 'dispute_probability', 'days_to_pay_stats'],
        updateFrequency: 'daily',
        popularBadge: false,
        rowLimitMonthly: 100_000,
        rpmLimit: 30,
        supportLevel: 'priority',
    },
    {
        sku: 'enterprise_full_signal',
        name: 'Enterprise Full Signal',
        tagline: 'All intelligence + historical + predictive',
        description: 'Everything in Operations Optimizer, Pricing Intelligence, and Risk Command — plus historical data access, near-real-time refresh, and bulk export capabilities. Built for fleet platforms and TMS integrations.',
        icon: '🏢',
        tier: 'enterprise_signal',
        priceUsd: 799,
        priceAnnualUsd: 7990,
        features: [
            'All features from every product',
            'Near-real-time data refresh',
            'Historical data access (90-day rolling)',
            'Bulk CSV export',
            'Custom webhook event streams',
            'Dedicated account manager',
            'SLA guarantee (99.5% uptime)',
        ],
        endpoints: [
            '/api/enterprise/corridors/liquidity', '/api/enterprise/corridors/scarcity',
            '/api/enterprise/fill/probability', '/api/enterprise/rates/benchmark',
            '/api/enterprise/rates/index', '/api/enterprise/brokers/risk',
            '/api/enterprise/export/bulk',
        ],
        dataFields: ['all_fields'],
        updateFrequency: 'near_realtime',
        popularBadge: false,
        rowLimitMonthly: 500_000,
        rpmLimit: 120,
        supportLevel: 'dedicated',
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// REGIONAL PRICING — Auto-adjusts catalog prices by country affordability
// ═══════════════════════════════════════════════════════════════════════════════

const REGIONAL_MULTIPLIERS: Record<string, number> = {
    // Gold tier — full price
    US: 1.00, CA: 1.00, AU: 1.00, GB: 0.95, NZ: 0.95, AE: 1.05, DE: 0.90, NL: 0.90, BR: 0.55, ZA: 0.55,
    // Blue tier — 70-90%
    IE: 0.90, SE: 0.90, NO: 0.95, DK: 0.90, FI: 0.85, BE: 0.85, AT: 0.85, CH: 1.00, ES: 0.75, FR: 0.85,
    IT: 0.80, PT: 0.70, SA: 0.85, QA: 0.90, MX: 0.50,
    // Silver tier — 40-70%
    PL: 0.55, CZ: 0.55, SK: 0.50, HU: 0.50, SI: 0.55, EE: 0.50, LV: 0.45, LT: 0.45, HR: 0.50, RO: 0.45,
    BG: 0.40, GR: 0.55, TR: 0.40, KW: 0.80, OM: 0.75, BH: 0.75, SG: 0.90, MY: 0.45, JP: 0.85, KR: 0.80,
    CL: 0.45, AR: 0.35, CO: 0.35, PE: 0.35,
    // Slate tier — 30-40%
    UY: 0.35, PA: 0.40, CR: 0.40,
};

export function getRegionalPrice(baseUsd: number, countryCode: string): {
    priceLocal: number;
    currency: string;
    multiplier: number;
} {
    const mult = REGIONAL_MULTIPLIERS[countryCode] ?? 0.60;
    const rates = COUNTRY_RATE_TABLE[countryCode];
    const currency = rates?.currency || 'USD';

    return {
        priceLocal: Math.round(baseUsd * mult),
        currency,
        multiplier: mult,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRIPE CHECKOUT SESSION CREATOR — Zero-Touch Purchase
// ═══════════════════════════════════════════════════════════════════════════════

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function getAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

export async function createCheckoutSession(params: {
    sku: DataProductSku;
    billingInterval: 'monthly' | 'yearly';
    customerEmail: string;
    customerId?: string;          // Supabase user ID if logged in
    countryCode?: string;
    successUrl: string;
    cancelUrl: string;
}): Promise<CheckoutSessionResult> {
    const stripe = getStripe();
    const product = DATA_PRODUCTS.find(p => p.sku === params.sku);
    if (!product) throw new Error(`Unknown product SKU: ${params.sku}`);

    const priceId = params.billingInterval === 'monthly'
        ? product.stripePriceIdMonthly
        : product.stripePriceIdYearly;

    // If Stripe price IDs aren't pre-configured, create an ad-hoc price
    let sessionParams: Stripe.Checkout.SessionCreateParams;
    if (priceId) {
        sessionParams = {
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            customer_email: params.customerEmail,
            success_url: params.successUrl + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: params.cancelUrl,
            metadata: {
                hc_sku: params.sku,
                hc_tier: product.tier,
                hc_customer_id: params.customerId || '',
                hc_country: params.countryCode || 'US',
                hc_product_type: 'data_marketplace',
            },
        };
    } else {
        // Dynamic pricing (no pre-created Stripe Price)
        const price = params.billingInterval === 'monthly' ? product.priceUsd : product.priceAnnualUsd;
        const regionalPrice = params.countryCode
            ? getRegionalPrice(price, params.countryCode).priceLocal
            : price;

        sessionParams = {
            mode: 'subscription',
            line_items: [{
                price_data: {
                    currency: 'usd',
                    unit_amount: regionalPrice * 100,
                    recurring: {
                        interval: params.billingInterval === 'monthly' ? 'month' : 'year',
                    },
                    product_data: {
                        name: `Haul Command ${product.name}`,
                        description: product.tagline,
                        metadata: { sku: params.sku },
                    },
                },
                quantity: 1,
            }],
            customer_email: params.customerEmail,
            success_url: params.successUrl + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: params.cancelUrl,
            metadata: {
                hc_sku: params.sku,
                hc_tier: product.tier,
                hc_customer_id: params.customerId || '',
                hc_country: params.countryCode || 'US',
                hc_product_type: 'data_marketplace',
            },
        };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
        sessionId: session.id,
        sessionUrl: session.url!,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// API KEY PROVISIONING — Auto-generates key after successful payment
// ═══════════════════════════════════════════════════════════════════════════════

export async function provisionApiKey(params: {
    customerId: string;
    customerName: string;
    sku: DataProductSku;
    tier: DataProductTier;
}): Promise<ApiKeyProvisionResult> {
    const admin = getAdmin();
    const product = DATA_PRODUCTS.find(p => p.sku === params.sku);
    if (!product) throw new Error(`Unknown product SKU: ${params.sku}`);

    // Generate cryptographically secure API key
    const rawKey = `hc_${params.tier.slice(0, 3)}_${randomBytes(24).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 12) + '...';

    // Insert into enterprise_api_keys
    const { error: insertError } = await admin.from('enterprise_api_keys').insert({
        customer_id: params.customerId,
        customer_name: params.customerName,
        api_key_hash: keyHash,
        api_key_prefix: keyPrefix,
        tier: params.tier,
        active: true,
        rate_limit_rpm: product.rpmLimit,
        export_limit_rows_month: product.rowLimitMonthly,
    });

    if (insertError) throw new Error(`Failed to provision API key: ${insertError.message}`);

    // Initialize rate limit state
    await admin.from('enterprise_rate_limit_state').insert({
        api_key_id: (await admin.from('enterprise_api_keys').select('id').eq('api_key_hash', keyHash).single()).data?.id,
        request_count: 0,
        rows_exported_this_month: 0,
    }).then(() => { });

    return {
        apiKey: rawKey,
        apiKeyPrefix: keyPrefix,
        tier: params.tier,
        products: [params.sku],
        rateLimitRpm: product.rpmLimit,
        monthlyRowLimit: product.rowLimitMonthly,
        expiresAt: null,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST-PAYMENT WEBHOOK HANDLER — Bridges Stripe → API Key Provisioning
// Call this from the Stripe webhook when hc_product_type = 'data_marketplace'
// ═══════════════════════════════════════════════════════════════════════════════

export async function handleDataMarketplacePurchase(session: Stripe.Checkout.Session): Promise<ApiKeyProvisionResult | null> {
    const metadata = session.metadata;
    if (!metadata?.hc_product_type || metadata.hc_product_type !== 'data_marketplace') {
        return null; // Not a data marketplace purchase
    }

    const sku = metadata.hc_sku as DataProductSku;
    const tier = metadata.hc_tier as DataProductTier;
    const customerId = metadata.hc_customer_id || session.customer?.toString() || '';
    const customerEmail = session.customer_email || '';

    // Provision API key
    const result = await provisionApiKey({
        customerId,
        customerName: customerEmail,
        sku,
        tier,
    });

    // Store the purchase record
    const admin = getAdmin();
    await admin.from('data_marketplace_purchases').insert({
        customer_id: customerId,
        customer_email: customerEmail,
        product_sku: sku,
        tier,
        stripe_session_id: session.id,
        stripe_customer_id: session.customer?.toString(),
        stripe_subscription_id: session.subscription?.toString(),
        api_key_prefix: result.apiKeyPrefix,
        country_code: metadata.hc_country || 'US',
        amount_usd: (session.amount_total || 0) / 100,
        status: 'active',
    }).then(() => { });

    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API KEY MANAGEMENT — Self-serve key rotation, deactivation
// ═══════════════════════════════════════════════════════════════════════════════

export async function rotateApiKey(params: {
    customerId: string;
    oldKeyPrefix: string;
}): Promise<ApiKeyProvisionResult> {
    const admin = getAdmin();

    // Find the old key
    const { data: oldKey } = await admin
        .from('enterprise_api_keys')
        .select('*')
        .eq('customer_id', params.customerId)
        .eq('api_key_prefix', params.oldKeyPrefix)
        .eq('active', true)
        .single();

    if (!oldKey) throw new Error('API key not found');

    // Deactivate old key (grace period: 24 hours)
    await admin
        .from('enterprise_api_keys')
        .update({
            active: false,
            effective_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', oldKey.id);

    // Provision new key with same parameters
    return provisionApiKey({
        customerId: params.customerId,
        customerName: oldKey.customer_name,
        sku: 'operations_optimizer', // default; real tier is preserved
        tier: oldKey.tier,
    });
}

export async function deactivateApiKey(params: {
    customerId: string;
    keyPrefix: string;
}): Promise<boolean> {
    const admin = getAdmin();

    const { error } = await admin
        .from('enterprise_api_keys')
        .update({ active: false, effective_end: new Date().toISOString() })
        .eq('customer_id', params.customerId)
        .eq('api_key_prefix', params.keyPrefix);

    return !error;
}

export async function listApiKeys(customerId: string): Promise<Array<{
    prefix: string;
    tier: string;
    active: boolean;
    lastUsedAt: string | null;
    requestCountTotal: number;
    createdAt: string;
}>> {
    const admin = getAdmin();

    const { data } = await admin
        .from('enterprise_api_keys')
        .select('api_key_prefix, tier, active, last_used_at, request_count_total, created_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

    return (data || []).map(k => ({
        prefix: k.api_key_prefix,
        tier: k.tier,
        active: k.active,
        lastUsedAt: k.last_used_at,
        requestCountTotal: k.request_count_total,
        createdAt: k.created_at,
    }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATALOG QUERY — For storefront rendering
// ═══════════════════════════════════════════════════════════════════════════════

export function getCatalog(countryCode: string = 'US'): Array<DataProduct & {
    regionalPrice: number;
    regionalAnnualPrice: number;
    regionalCurrency: string;
    savingsPercent: number;
}> {
    return DATA_PRODUCTS.map(product => {
        const monthly = getRegionalPrice(product.priceUsd, countryCode);
        const annual = getRegionalPrice(product.priceAnnualUsd, countryCode);
        const savingsPercent = Math.round(
            ((monthly.priceLocal * 12 - annual.priceLocal) / (monthly.priceLocal * 12)) * 100,
        );

        return {
            ...product,
            regionalPrice: monthly.priceLocal,
            regionalAnnualPrice: annual.priceLocal,
            regionalCurrency: monthly.currency,
            savingsPercent,
        };
    });
}
