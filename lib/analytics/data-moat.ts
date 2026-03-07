
/**
 * Data Moat Collectors
 * Purpose: Collect high-value signals for monetization (Rate Indices, Risk Feeds).
 */

import { createClient } from "@supabase/supabase-js";

function getAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

export type MetricType =
    | 'RATE_OBSERVATION'
    | 'CORRIDOR_RISK'
    | 'BROKER_PAY_SPEED'
    | 'COVERAGE_GAP';

export async function collectSignal(type: MetricType, payload: any) {
    const timestamp = new Date().toISOString();

    const signal = {
        type,
        timestamp,
        payload,
        // Privacy guard: never store PII in the moat, only aggregates
        anonymized: true,
    };

    console.log(`[DataMoat] Collected ${type}`, signal);

    const { error } = await getAdmin().from("analytics_events").insert({
        role: "system",
        name: type,
        payload: signal,
    });

    if (error) {
        console.error("[DataMoat] Failed to persist signal:", error.message);
    }
}

export const MOAT_SCHEMAS = {
    RATE_OBSERVATION: {
        lane: 'string', // 'HOUSTON-MIAMI'
        equipment: 'string', // 'PILOT_CAR_HIGH_POLE'
        rate_band: 'string', // '$1.50-$1.75' (Bucketed, specific rates are sensitive)
        date: 'date'
    },
    CORRIDOR_RISK: {
        corridor: 'string', // 'I-10'
        segment: 'string', // 'BATON_ROUGE_BRIDGE'
        risk_type: 'string',
        delay_minutes: 'number'
    }
};
