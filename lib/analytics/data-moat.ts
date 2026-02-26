
/**
 * Data Moat Collectors
 * Purpose: Collect high-value signals for monetization (Rate Indices, Risk Feeds).
 */

export type MetricType =
    | 'RATE_OBSERVATION'
    | 'CORRIDOR_RISK'
    | 'BROKER_PAY_SPEED'
    | 'COVERAGE_GAP';

export async function collectSignal(type: MetricType, payload: any) {
    // In production, this writes to a TimescaleDB or massive analytics store
    // For now, we structure the data for future schema ingestion.

    const timestamp = new Date().toISOString();

    const signal = {
        type,
        timestamp,
        payload,
        // Privacy guard: never store PII in the moat, only aggregates
        anonymized: true
    };

    console.log(`[DataMoat] Collected ${type}`, signal);

    // TODO: Connect to supabase 'analytics_events' table
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
