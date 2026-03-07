export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

/**
 * GET /api/enterprise/openapi.json
 *
 * Returns the OpenAPI 3.1 specification for Haul Command Enterprise Data API.
 * Publicly accessible for developer documentation tools.
 */
export async function GET() {
    return NextResponse.json(OPENAPI_SPEC, {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
            'Access-Control-Allow-Origin': '*',
        },
    });
}

const OPENAPI_SPEC = {
    openapi: '3.1.0',
    info: {
        title: 'Haul Command Enterprise Data API',
        version: '1.0.0',
        description:
            'Enterprise-grade intelligence API for the oversize load ecosystem. ' +
            'Access corridor liquidity, fill probability predictions, pricing benchmarks, ' +
            'and risk intelligence via authenticated API keys.',
        contact: {
            name: 'Haul Command Developer Support',
            url: 'https://haulcommand.com/developers',
            email: 'api@haulcommand.com',
        },
        'x-logo': { url: '/haul-command-logo.svg' },
    },
    servers: [
        {
            url: 'https://haulcommand.com',
            description: 'Production',
        },
    ],
    security: [{ ApiKeyAuth: [] }],
    components: {
        securitySchemes: {
            ApiKeyAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key',
                description:
                    'Enterprise API key. Obtain from /api/enterprise/keys or the developer dashboard. ' +
                    'Format: hc_<64 hex characters>. Can also be sent as Authorization: Bearer hc_...',
            },
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    error: { type: 'string', description: 'Error message' },
                    retry_after: { type: 'string', format: 'date-time', description: 'When to retry (for rate-limited responses)' },
                    current_tier: { type: 'string' },
                    required_product: { type: 'string' },
                },
                required: ['error'],
            },
            CorridorLiquidity: {
                type: 'object',
                properties: {
                    corridor_id: { type: 'string', example: 'US-TX-I10-W' },
                    liquidity_score: { type: 'number', format: 'float', example: 72.5 },
                    liquidity_band: { type: 'string', enum: ['high', 'medium', 'low', 'critical'] },
                    fill_rate: { type: 'number', format: 'float', example: 0.82 },
                    fill_rate_band: { type: 'string', enum: ['high', 'medium', 'low'] },
                    median_time_to_fill_minutes: { type: 'integer', example: 45 },
                    p90_time_to_fill_minutes: { type: 'integer', example: 120 },
                    response_rate: { type: 'number', format: 'float', example: 0.73 },
                    response_rate_band: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
                    corridor_rate_per_mile_median: { type: 'number', format: 'float', example: 3.25 },
                    corridor_rate_volatility: { type: 'number', format: 'float' },
                    volatility_band: { type: 'string', enum: ['high', 'moderate', 'stable'] },
                    updated_at: { type: 'string', format: 'date-time' },
                },
            },
            FillProbabilityRequest: {
                type: 'object',
                properties: {
                    corridor_id: { type: 'string', description: 'Target corridor identifier', example: 'US-TX-I10-W' },
                    escorts_required: { type: 'integer', default: 1, minimum: 1, maximum: 10, example: 2 },
                    urgency_level: { type: 'integer', default: 0, minimum: 0, maximum: 3, example: 1 },
                    time_to_start_hours: { type: 'number', default: 48, example: 24 },
                    miles: { type: 'number', default: 100, example: 250 },
                },
                required: ['corridor_id'],
            },
            FillProbabilityResponse: {
                type: 'object',
                properties: {
                    p_fill_60m: { type: 'number', format: 'float', description: 'Probability of fill within 60 minutes', example: 0.78 },
                    p_fill_120m: { type: 'number', format: 'float', description: 'Probability of fill within 120 minutes', example: 0.91 },
                    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                    recommended_lead_time_hours: { type: 'number', example: 6 },
                    corridor_status: { type: 'string', example: 'active' },
                },
            },
            ApiKey: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    prefix: { type: 'string', example: 'hc_a1b2c3' },
                    label: { type: 'string', example: 'Production Key' },
                    tier: { type: 'string', enum: ['insight_starter', 'pro_intelligence', 'enterprise_signal', 'data_licensing_bulk'] },
                    rpm_limit: { type: 'integer', example: 60 },
                    created_at: { type: 'string', format: 'date-time' },
                },
            },
            QuotaStatus: {
                type: 'object',
                properties: {
                    plan: { type: 'string', example: 'growth_api' },
                    quota: { type: 'integer', description: 'Monthly row quota, -1 for unlimited', example: 5000000 },
                    used: { type: 'integer', example: 1250000 },
                    remaining: { type: 'integer', example: 3750000 },
                    pct: { type: 'number', format: 'float', example: 25.0 },
                    status: { type: 'string', enum: ['ok', 'warning', 'critical', 'exceeded', 'unlimited'] },
                },
            },
            UsageDashboard: {
                type: 'object',
                properties: {
                    quota: { $ref: '#/components/schemas/QuotaStatus' },
                    daily: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                rollup_date: { type: 'string', format: 'date' },
                                total_requests: { type: 'integer' },
                                total_rows_served: { type: 'integer' },
                                total_compute_units: { type: 'number' },
                            },
                        },
                    },
                    keys: { type: 'array', items: { $ref: '#/components/schemas/ApiKey' } },
                },
            },
            ResponseMeta: {
                type: 'object',
                properties: {
                    tier: { type: 'string' },
                    product: { type: 'string' },
                },
            },
        },
        headers: {
            'X-RateLimit-Limit': {
                description: 'Requests allowed per minute',
                schema: { type: 'integer' },
            },
            'X-RateLimit-Remaining': {
                description: 'Requests remaining in current window',
                schema: { type: 'integer' },
            },
            'X-RateLimit-Reset': {
                description: 'UTC epoch seconds when the rate limit window resets',
                schema: { type: 'integer' },
            },
            'X-Quota-Used': {
                description: 'Rows used this billing period',
                schema: { type: 'integer' },
            },
            'X-Quota-Remaining': {
                description: 'Rows remaining this billing period',
                schema: { type: 'integer' },
            },
        },
    },
    paths: {
        '/api/enterprise/corridors/liquidity': {
            get: {
                operationId: 'getCorridorLiquidity',
                summary: 'Get corridor liquidity intelligence',
                description:
                    'Returns aggregated liquidity scores, fill rates, response rates, and pricing volatility ' +
                    'for oversize load corridors. Data is updated hourly.',
                tags: ['Corridor Intelligence'],
                parameters: [
                    { name: 'corridor_id', in: 'query', schema: { type: 'string' }, description: 'Filter by corridor ID' },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 }, description: 'Max results' },
                ],
                responses: {
                    '200': {
                        description: 'Corridor liquidity data',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        corridors: { type: 'array', items: { $ref: '#/components/schemas/CorridorLiquidity' } },
                                        count: { type: 'integer' },
                                        meta: { $ref: '#/components/schemas/ResponseMeta' },
                                    },
                                },
                            },
                        },
                    },
                    '401': { description: 'Invalid or missing API key', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    '403': { description: 'Insufficient tier for this product', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    '429': { description: 'Rate limit exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/api/enterprise/fill/probability': {
            post: {
                operationId: 'predictFillProbability',
                summary: 'Predict escort fill probability',
                description:
                    'ML-scored prediction of the probability that an escort request will be filled ' +
                    'within a given time window, based on corridor liquidity, demand patterns, and supply signals.',
                tags: ['Predictive Analytics'],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/FillProbabilityRequest' } } },
                },
                responses: {
                    '200': {
                        description: 'Fill probability prediction',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/FillProbabilityResponse' } } },
                    },
                    '400': { description: 'Missing corridor_id', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    '401': { description: 'Invalid API key', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    '403': { description: 'Plan does not include this product', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/api/enterprise/keys': {
            post: {
                operationId: 'createApiKey',
                summary: 'Create a new API key',
                description:
                    'Self-serve API key provisioning. Requires an active subscription. ' +
                    'The raw API key is returned ONCE in the response body — store it securely.',
                tags: ['Key Management'],
                security: [{}], // Uses session auth, not API key
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    label: { type: 'string', default: 'Default', example: 'Production Key' },
                                    org_id: { type: 'string', format: 'uuid', description: 'Optional org binding' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Key created',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        key: { $ref: '#/components/schemas/ApiKey' },
                                        api_key: { type: 'string', description: '⚠️ Shown once. Store securely.' },
                                        warning: { type: 'string' },
                                        plan: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    '401': { description: 'Not authenticated' },
                    '403': { description: 'No active subscription' },
                    '409': { description: 'Key limit reached' },
                },
            },
            get: {
                operationId: 'listApiKeys',
                summary: 'List your API keys',
                description: 'Returns all API keys for the authenticated user, with quota status.',
                tags: ['Key Management'],
                security: [{}],
                responses: {
                    '200': {
                        description: 'Key list with quota',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        keys: { type: 'array', items: { $ref: '#/components/schemas/ApiKey' } },
                                        count: { type: 'integer' },
                                        quota: { $ref: '#/components/schemas/QuotaStatus' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/enterprise/keys/revoke': {
            post: {
                operationId: 'revokeApiKey',
                summary: 'Revoke an API key',
                description: 'Permanently revokes an API key. This action cannot be undone.',
                tags: ['Key Management'],
                security: [{}],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: { key_id: { type: 'string', format: 'uuid' } },
                                required: ['key_id'],
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Key revoked' },
                    '404': { description: 'Key not found' },
                    '403': { description: 'Not authorized' },
                },
            },
        },
        '/api/enterprise/usage': {
            get: {
                operationId: 'getUsageDashboard',
                summary: 'Get usage dashboard data',
                description: 'Returns quota status, 30-day usage rollups, key inventory, and anomaly alerts.',
                tags: ['Usage & Billing'],
                security: [{}],
                responses: {
                    '200': {
                        description: 'Usage dashboard',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/UsageDashboard' } } },
                    },
                },
            },
        },
        '/api/enterprise/billing/usage/ledger': {
            get: {
                operationId: 'getBillingLedger',
                summary: 'Get usage ledger for metered billing',
                description: 'Customer-facing ledger returning daily rollups, billed quantities, and rollup hashes used for dispute prevention.',
                tags: ['Usage & Billing'],
                security: [{ ApiKeyAuth: [] }],
                responses: {
                    '200': {
                        description: 'Immutable ledger records for the current billing cycle.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        ledger_entries: { type: 'array', items: { type: 'object' } },
                                        disputes_active: { type: 'boolean' },
                                    },
                                },
                            },
                        },
                    },
                    '401': { description: 'Unauthorized' },
                    '403': { description: 'Enterprise tier required' },
                },
            },
        },
        '/api/enterprise/billing/stripe/webhook': {
            post: {
                operationId: 'stripeWebhook',
                summary: 'Stripe Webhook Receiver (Internal)',
                description: 'Processes Stripe events (subscriptions, invoices) exactly-once. Requires Stripe signature verification.',
                tags: ['Usage & Billing'],
                requestBody: { content: { 'application/json': {} } },
                responses: {
                    '200': { description: 'Webhook acknowledged and processed (or deduplicated).' },
                    '400': { description: 'Invalid signature or payload.' },
                },
            },
        },
    },
    tags: [
        { name: 'Corridor Intelligence', description: 'Corridor liquidity, scarcity, and market metrics' },
        { name: 'Predictive Analytics', description: 'ML-powered fill probability and demand prediction' },
        { name: 'Key Management', description: 'Self-serve API key provisioning and management' },
        { name: 'Usage & Billing', description: 'Usage tracking, quotas, and billing data' },
    ],
};
