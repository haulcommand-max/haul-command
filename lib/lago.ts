// ============================================================
// Lago — Usage-Based Billing & Metering
// Use for: AI tool metering, API billing, metered premium features
// Feature flag: LAGO (disabled by default — scaffold only)
// ============================================================

import { isEnabled } from '@/lib/feature-flags';

const LAGO_API_KEY = process.env.LAGO_API_KEY || '';
const LAGO_API_URL = process.env.LAGO_API_URL || 'https://api.getlago.com/api/v1';

interface UsageEvent {
    transactionId: string;
    externalCustomerId: string;
    code: string; // billable metric code
    timestamp?: string;
    properties?: Record<string, string | number>;
}

// ── Report a metered usage event ──
export async function reportUsage(event: UsageEvent): Promise<boolean> {
    if (!isEnabled('LAGO') || !LAGO_API_KEY) {
        return false;
    }

    const res = await fetch(`${LAGO_API_URL}/events`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${LAGO_API_KEY}`,
        },
        body: JSON.stringify({
            event: {
                transaction_id: event.transactionId,
                external_customer_id: event.externalCustomerId,
                code: event.code,
                timestamp: event.timestamp || Math.floor(Date.now() / 1000),
                properties: event.properties || {},
            },
        }),
    });

    return res.ok;
}

// ── Pre-built usage reporters ──
export const HaulMetering = {
    /** Track AI agent usage */
    aiAgentCall: (userId: string, agent: string, tokens: number) =>
        reportUsage({
            transactionId: `ai-${userId}-${Date.now()}`,
            externalCustomerId: userId,
            code: 'ai_agent_call',
            properties: { agent, tokens },
        }),

    /** Track API usage */
    apiCall: (apiKeyId: string, endpoint: string) =>
        reportUsage({
            transactionId: `api-${apiKeyId}-${Date.now()}`,
            externalCustomerId: apiKeyId,
            code: 'api_call',
            properties: { endpoint },
        }),

    /** Track search queries beyond free tier */
    searchQuery: (userId: string) =>
        reportUsage({
            transactionId: `search-${userId}-${Date.now()}`,
            externalCustomerId: userId,
            code: 'search_query',
        }),

    /** Track territory claims beyond free tier */
    territoryClaim: (userId: string, surfaceId: string) =>
        reportUsage({
            transactionId: `territory-${userId}-${surfaceId}`,
            externalCustomerId: userId,
            code: 'territory_claim',
            properties: { surface_id: surfaceId },
        }),

    /** Track premium document verifications  */
    docVerification: (userId: string, docType: string) =>
        reportUsage({
            transactionId: `docver-${userId}-${Date.now()}`,
            externalCustomerId: userId,
            code: 'doc_verification',
            properties: { doc_type: docType },
        }),

    /** Track profile boost usage */
    profileBoost: (userId: string, days: number) =>
        reportUsage({
            transactionId: `boost-${userId}-${Date.now()}`,
            externalCustomerId: userId,
            code: 'profile_boost',
            properties: { days },
        }),
};
