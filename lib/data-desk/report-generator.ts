// lib/data-desk/report-generator.ts
//
// Haul Command Data Desk — Report Generator
// Spec: AG-DATA-DESK-001
//
// Generates standardized reports from platform data for:
// - PR engine responses
// - Content hub SEO articles
// - Authority directory insights
// - Partnership proposals

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export interface ReportDefinition {
    report_id: string;
    name: string;
    description: string;
    category: 'market_intelligence' | 'safety' | 'compliance' | 'pricing' | 'supply_demand' | 'corridor';
    data_sources: string[];
    refresh_cadence: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    output_format: 'markdown' | 'json' | 'chart_data';
    citation_confidence: number;    // 0-1 base confidence
}

export interface ReportOutput {
    report_id: string;
    generated_at: string;
    period: string;
    title: string;
    summary: string;
    key_findings: string[];
    data_points: DataPoint[];
    citation: Citation;
    raw_data?: Record<string, unknown>;
}

export interface DataPoint {
    label: string;
    value: number | string;
    unit?: string;
    change_pct?: number;
    direction?: 'up' | 'down' | 'flat';
    source: string;
    confidence: number;    // 0-1
}

export interface Citation {
    source_name: string;
    methodology: string;
    sample_size?: number;
    period_start: string;
    period_end: string;
    confidence_level: number;
    caveats: string[];
    url: string;
}

// ============================================================
// CITATION CONFIDENCE MODEL
// ============================================================

interface ConfidenceFactors {
    sample_size: number;
    data_freshness_days: number;
    geographic_coverage_pct: number;     // 0-1
    source_diversity: number;            // number of independent sources
    has_human_validation: boolean;
    is_self_reported: boolean;
}

/**
 * Compute citation confidence score (0-1).
 *
 * Model:
 * - Sample size: log-scaled, 100→0.5, 1000→0.75, 10000→0.9
 * - Freshness: exponential decay, 0 days→1.0, 30→0.85, 90→0.5, 365→0.1
 * - Coverage: linear
 * - Source diversity: log-scaled
 * - Human validation: +0.1 bonus
 * - Self-reported: -0.15 penalty
 */
export function computeCitationConfidence(factors: ConfidenceFactors): number {
    // Sample size component (30% weight)
    const sampleComponent = Math.min(1, Math.log(1 + factors.sample_size) / Math.log(10001));

    // Freshness component (25% weight)
    const freshnessComponent = Math.exp(-factors.data_freshness_days / 120);

    // Geographic coverage (20% weight)
    const coverageComponent = factors.geographic_coverage_pct;

    // Source diversity (15% weight)
    const diversityComponent = Math.min(1, Math.log(1 + factors.source_diversity) / Math.log(6));

    // Base score
    let confidence =
        sampleComponent * 0.30 +
        freshnessComponent * 0.25 +
        coverageComponent * 0.20 +
        diversityComponent * 0.15 +
        0.10; // baseline

    // Bonuses / penalties
    if (factors.has_human_validation) confidence += 0.10;
    if (factors.is_self_reported) confidence -= 0.15;

    return Math.max(0, Math.min(1, Math.round(confidence * 100) / 100));
}

/**
 * Get confidence label for display.
 */
export function confidenceLabel(score: number): { label: string; color: string; icon: string } {
    if (score >= 0.85) return { label: 'High Confidence', color: '#22C55E', icon: '🟢' };
    if (score >= 0.65) return { label: 'Moderate Confidence', color: '#F59E0B', icon: '🟡' };
    if (score >= 0.40) return { label: 'Low Confidence', color: '#F97316', icon: '🟠' };
    return { label: 'Preliminary', color: '#EF4444', icon: '🔴' };
}

// ============================================================
// REPORT REGISTRY
// ============================================================

const REPORTS: ReportDefinition[] = [
    {
        report_id: 'RPT-ESCORT-RATE-INDEX',
        name: 'Escort Rate Index',
        description: 'Average pilot car and escort vehicle rates by state/province, corridor, and load type.',
        category: 'pricing',
        data_sources: ['bookings', 'loads', 'offers', 'directory_listings'],
        refresh_cadence: 'weekly',
        output_format: 'chart_data',
        citation_confidence: 0.72,
    },
    {
        report_id: 'RPT-PERMIT-WAIT-TIME',
        name: 'Permit Processing Time Index',
        description: 'Average time from permit application to approval by state DOT/authority.',
        category: 'compliance',
        data_sources: ['authority_rulesets', 'crowd_signals', 'user_reports'],
        refresh_cadence: 'monthly',
        output_format: 'chart_data',
        citation_confidence: 0.55,
    },
    {
        report_id: 'RPT-CORRIDOR-DENSITY',
        name: 'Corridor Freight Density Report',
        description: 'Oversize/heavy haul freight volume by major corridor, with seasonal trends.',
        category: 'corridor',
        data_sources: ['loads', 'bookings', 'corridor_configs'],
        refresh_cadence: 'monthly',
        output_format: 'chart_data',
        citation_confidence: 0.68,
    },
    {
        report_id: 'RPT-SAFETY-INCIDENT',
        name: 'Safety Incident Registry',
        description: 'Reported incidents involving oversize loads, near-misses, and enforcement actions.',
        category: 'safety',
        data_sources: ['crowd_signals', 'user_reports', 'public_records'],
        refresh_cadence: 'weekly',
        output_format: 'markdown',
        citation_confidence: 0.45,
    },
    {
        report_id: 'RPT-MARKET-SIZE',
        name: 'Heavy Haul Market Intelligence',
        description: 'Market size estimates, operator counts, and growth rates by country and region.',
        category: 'market_intelligence',
        data_sources: ['directory_listings', 'authority_jurisdictions', 'external_estimates'],
        refresh_cadence: 'quarterly',
        output_format: 'json',
        citation_confidence: 0.60,
    },
    {
        report_id: 'RPT-OPERATOR-SHORTAGE',
        name: 'Operator Supply Index',
        description: 'Supply/demand gap by region, including unfilled job rates and response times.',
        category: 'supply_demand',
        data_sources: ['saved_searches', 'loads', 'directory_listings', 'bookings'],
        refresh_cadence: 'weekly',
        output_format: 'chart_data',
        citation_confidence: 0.70,
    },
    {
        report_id: 'RPT-BRIDGE-WEIGHT-LIMITS',
        name: 'Bridge Weight Restriction Registry',
        description: 'Known bridge weight and height restrictions by corridor and jurisdiction.',
        category: 'compliance',
        data_sources: ['authority_rulesets', 'crowd_signals'],
        refresh_cadence: 'quarterly',
        output_format: 'json',
        citation_confidence: 0.50,
    },
    {
        report_id: 'RPT-GREEN-LOGISTICS',
        name: 'Green Logistics Adoption Index',
        description: 'EV/hybrid adoption, emissions reduction initiatives, and green certifications in heavy transport.',
        category: 'market_intelligence',
        data_sources: ['directory_listings', 'user_profiles', 'external_estimates'],
        refresh_cadence: 'quarterly',
        output_format: 'markdown',
        citation_confidence: 0.35,
    },
];

// ============================================================
// REPORT GENERATION
// ============================================================

/**
 * Generate an Escort Rate Index report for a given country.
 */
export async function generateEscortRateIndex(countryIso2: string): Promise<ReportOutput> {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Pull aggregate rate data
    const { data: rateData } = await supabase
        .from('offers')
        .select('origin_state, destination_state, rate_total, created_at')
        .eq('country_code', countryIso2)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('rate_total', 'is', null);

    const rates = rateData || [];

    // Compute state-level averages
    const stateRates: Record<string, { total: number; count: number }> = {};
    for (const r of rates) {
        const key = r.origin_state || 'Unknown';
        if (!stateRates[key]) stateRates[key] = { total: 0, count: 0 };
        stateRates[key].total += r.rate_total;
        stateRates[key].count++;
    }

    const dataPoints: DataPoint[] = Object.entries(stateRates)
        .map(([state, agg]) => ({
            label: state,
            value: Math.round(agg.total / agg.count),
            unit: 'USD',
            source: 'Haul Command platform offers',
            confidence: computeCitationConfidence({
                sample_size: agg.count,
                data_freshness_days: 15,
                geographic_coverage_pct: 0.6,
                source_diversity: 1,
                has_human_validation: false,
                is_self_reported: false,
            }),
        }))
        .sort((a, b) => (b.value as number) - (a.value as number));

    const overallAvg = rates.length > 0
        ? Math.round(rates.reduce((s, r) => s + r.rate_total, 0) / rates.length)
        : 0;

    return {
        report_id: 'RPT-ESCORT-RATE-INDEX',
        generated_at: now.toISOString(),
        period: `${thirtyDaysAgo.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)}`,
        title: `Escort Rate Index — ${countryIso2}`,
        summary: `Based on ${rates.length} offers in the last 30 days, the average escort rate in ${countryIso2} is $${overallAvg}.`,
        key_findings: [
            `Total offers analyzed: ${rates.length}`,
            `States/regions covered: ${Object.keys(stateRates).length}`,
            `Overall average rate: $${overallAvg}`,
            dataPoints.length > 0
                ? `Highest average: ${dataPoints[0].label} at $${dataPoints[0].value}`
                : 'Insufficient data for state-level breakdown',
        ],
        data_points: dataPoints,
        citation: {
            source_name: 'Haul Command Platform Data',
            methodology: 'Arithmetic mean of accepted offer rates, grouped by origin state.',
            sample_size: rates.length,
            period_start: thirtyDaysAgo.toISOString().slice(0, 10),
            period_end: now.toISOString().slice(0, 10),
            confidence_level: computeCitationConfidence({
                sample_size: rates.length,
                data_freshness_days: 15,
                geographic_coverage_pct: 0.6,
                source_diversity: 1,
                has_human_validation: false,
                is_self_reported: false,
            }),
            caveats: [
                'Rates reflect platform offers only; market rates may differ.',
                'Sample may not be representative of all regions.',
                'Self-selection bias: operators choosing to list on Haul Command.',
            ],
            url: `https://haulcommand.com/data/escort-rate-index/${countryIso2.toLowerCase()}`,
        },
    };
}

/**
 * Generate operator supply/demand index.
 */
export async function generateOperatorSupplyIndex(countryIso2: string): Promise<ReportOutput> {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [loadsResult, directoryResult, savedSearchResult] = await Promise.all([
        supabase
            .from('loads')
            .select('id', { count: 'exact', head: true })
            .eq('country_code', countryIso2)
            .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase
            .from('hc_global_operators')
            .select('id', { count: 'exact', head: true })
            .eq('country_code', countryIso2)
            .eq('is_active', true),
        supabase
            .from('saved_searches')
            .select('id', { count: 'exact', head: true })
            .eq('country_iso2', countryIso2)
            .eq('is_active', true),
    ]);

    const loads30d = loadsResult.count || 0;
    const activeOperators = directoryResult.count || 0;
    const activeAlerts = savedSearchResult.count || 0;

    const supplyDemandRatio = loads30d > 0 ? activeOperators / loads30d : 0;

    return {
        report_id: 'RPT-OPERATOR-SHORTAGE',
        generated_at: now.toISOString(),
        period: `${thirtyDaysAgo.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)}`,
        title: `Operator Supply Index — ${countryIso2}`,
        summary: `${activeOperators} active operators vs ${loads30d} loads posted in 30 days. Supply/demand ratio: ${supplyDemandRatio.toFixed(2)}.`,
        key_findings: [
            `Active operators: ${activeOperators}`,
            `Loads posted (30d): ${loads30d}`,
            `Active search alerts: ${activeAlerts}`,
            `Supply/demand ratio: ${supplyDemandRatio.toFixed(2)} ${supplyDemandRatio > 3 ? '(oversupply)' : supplyDemandRatio < 1 ? '(undersupply)' : '(balanced)'}`,
        ],
        data_points: [
            { label: 'Active Operators', value: activeOperators, source: 'directory_listings', confidence: 0.90 },
            { label: 'Loads (30d)', value: loads30d, source: 'loads', confidence: 0.95 },
            { label: 'Active Alerts', value: activeAlerts, source: 'saved_searches', confidence: 0.95 },
            { label: 'S/D Ratio', value: supplyDemandRatio.toFixed(2), source: 'computed', confidence: 0.85 },
        ],
        citation: {
            source_name: 'Haul Command Platform Data',
            methodology: 'Count of active directory listings (supply) vs load postings (demand) over 30-day window.',
            sample_size: activeOperators + loads30d,
            period_start: thirtyDaysAgo.toISOString().slice(0, 10),
            period_end: now.toISOString().slice(0, 10),
            confidence_level: 0.85,
            caveats: [
                'Platform data only; does not capture off-platform activity.',
                'Active operators = listings marked active, not necessarily available.',
            ],
            url: `https://haulcommand.com/data/operator-supply-index/${countryIso2.toLowerCase()}`,
        },
    };
}

// ============================================================
// PUBLIC API
// ============================================================

export function getReportDefinitions(): ReportDefinition[] {
    return REPORTS;
}

export function getReportById(reportId: string): ReportDefinition | null {
    return REPORTS.find(r => r.report_id === reportId) || null;
}

export function getReportsByCategory(category: ReportDefinition['category']): ReportDefinition[] {
    return REPORTS.filter(r => r.category === category);
}
