// ═══════════════════════════════════════════════════════════════════════════════
// POSTHOG SERVER-SIDE ANALYTICS
// For edge functions, API routes, cron jobs — events that happen server-side
// ═══════════════════════════════════════════════════════════════════════════════

import { PostHog } from 'posthog-node';

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

let _client: PostHog | null = null;

function getServerPostHog(): PostHog | null {
    if (_client) return _client;

    const key = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return null;

    _client = new PostHog(key, {
        host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
        flushAt: 20,
        flushInterval: 10000, // 10s batch
    });

    return _client;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER-SIDE EVENT CAPTURE
// ═══════════════════════════════════════════════════════════════════════════════

export function serverCapture(params: {
    distinctId: string;
    event: string;
    properties?: Record<string, unknown>;
}) {
    const ph = getServerPostHog();
    if (!ph) return;

    ph.capture({
        distinctId: params.distinctId,
        event: params.event,
        properties: {
            ...params.properties,
            $source: 'server',
            hc_ts: Date.now(),
        },
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER-SIDE MARKETPLACE EVENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const HCServerTrack = {

    // ── Match Events (server-generated) ──────────────────────────────────────

    matchGenerated(params: {
        brokerId: string;
        operatorId: string;
        loadId: string;
        matchId: string;
        matchScore: number;
        corridorId: string;
        countryCode: string;
    }) {
        serverCapture({
            distinctId: params.brokerId,
            event: 'hc_load_board_match_generated',
            properties: {
                hc_category: 'load_board',
                hc_action: 'match_generated',
                operator_id: params.operatorId,
                load_id: params.loadId,
                match_id: params.matchId,
                match_score: params.matchScore,
                hc_corridor: params.corridorId,
                hc_country: params.countryCode,
            },
        });
    },

    // ── Payment Events (webhook-generated) ───────────────────────────────────

    paymentReceived(params: {
        userId: string;
        amount: number;
        currency: string;
        productId: string;
        stripeEventId: string;
        countryCode: string;
    }) {
        serverCapture({
            distinctId: params.userId,
            event: 'hc_revenue_payment_received',
            properties: {
                hc_category: 'revenue',
                hc_action: 'payment_received',
                $revenue: params.amount,
                currency: params.currency,
                product_id: params.productId,
                stripe_event_id: params.stripeEventId,
                hc_country: params.countryCode,
            },
        });
    },

    // ── Trust Events (cron/edge function generated) ──────────────────────────

    trustScoreRecalculated(params: {
        operatorId: string;
        oldScore: number;
        newScore: number;
        tier: string;
        countryCode: string;
    }) {
        serverCapture({
            distinctId: params.operatorId,
            event: 'hc_trust_score_recalculated',
            properties: {
                hc_category: 'trust',
                hc_action: 'trust_score_changed',
                old_score: params.oldScore,
                new_score: params.newScore,
                score_delta: params.newScore - params.oldScore,
                trust_tier: params.tier,
                hc_country: params.countryCode,
            },
        });
    },

    // ── Corridor Health (cron-generated) ─────────────────────────────────────

    corridorHealthSnapshot(params: {
        corridorId: string;
        countryCode: string;
        liquidityRatio: number;
        fillRate: number;
        activeOperators: number;
        loadVolume24h: number;
        medianFillTimeHours: number;
    }) {
        serverCapture({
            distinctId: `corridor_${params.corridorId}`,
            event: 'hc_corridor_health_snapshot',
            properties: {
                hc_category: 'corridor',
                hc_action: 'health_snapshot',
                corridor_id: params.corridorId,
                hc_country: params.countryCode,
                liquidity_ratio: params.liquidityRatio,
                fill_rate: params.fillRate,
                active_operators: params.activeOperators,
                load_volume_24h: params.loadVolume24h,
                median_fill_time_hours: params.medianFillTimeHours,
            },
        });
    },

    // ── Data Marketplace (API call tracking) ─────────────────────────────────

    apiCallTracked(params: {
        apiKeyId: string;
        customerId: string;
        endpoint: string;
        tier: string;
        responseTimeMs: number;
        rowsReturned: number;
        countryCode: string;
    }) {
        serverCapture({
            distinctId: params.customerId,
            event: 'hc_data_marketplace_api_call_made',
            properties: {
                hc_category: 'data_marketplace',
                hc_action: 'api_call_made',
                api_key_id: params.apiKeyId,
                endpoint: params.endpoint,
                tier: params.tier,
                response_time_ms: params.responseTimeMs,
                rows_returned: params.rowsReturned,
                hc_country: params.countryCode,
            },
        });
    },

    // ── Pricing Anomaly (server-detected) ────────────────────────────────────

    pricingAnomalyDetected(params: {
        countryCode: string;
        corridorId: string;
        anomalyType: string;
        expectedRate: number;
        actualRate: number;
        severity: 'low' | 'medium' | 'high';
    }) {
        serverCapture({
            distinctId: `system_pricing_guard`,
            event: 'hc_pricing_anomaly_detected',
            properties: {
                hc_category: 'pricing',
                hc_action: 'price_anomaly_detected',
                hc_country: params.countryCode,
                corridor_id: params.corridorId,
                anomaly_type: params.anomalyType,
                expected_rate: params.expectedRate,
                actual_rate: params.actualRate,
                severity: params.severity,
            },
        });
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHUTDOWN (call on server shutdown / edge function completion)
// ═══════════════════════════════════════════════════════════════════════════════

export async function flushServerAnalytics() {
    if (_client) {
        await _client.shutdown();
        _client = null;
    }
}
