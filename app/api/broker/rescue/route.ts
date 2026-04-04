import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Broker Rescue API — Band B Rank 1
 * 
 * Analyzes a load post against corridor context and returns:
 *  - health_status: 'healthy' | 'at_risk' | 'hard_fill'
 *  - recommended_actions: context-aware rescue recommendations
 *  - corridor_context: live supply/demand data for the lane
 *  - urgency_signals: what's making this load hard to fill
 */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface RescueAction {
    action_id: string;
    label: string;
    description: string;
    priority: 'primary' | 'secondary' | 'tertiary';
    type: 'raise_rate' | 'widen_radius' | 'expand_service_type' | 'alert_specialists' | 'repost_boost' | 'find_operators';
    estimated_impact: string;
    href?: string;
}

interface CorridorContext {
    lane_load_count: number;
    verified_operator_density: number;
    service_type_mix: string[];
    rate_band: { low: number; mid: number; high: number } | null;
    market_mode: string;
}

type HealthStatus = 'healthy' | 'at_risk' | 'hard_fill';

function detectHealth(inputs: {
    age_hours: number;
    corridor_supply: number;
    rate_vs_market: 'below' | 'at' | 'above' | 'unknown';
    service_type_coverage: number; // 0-100
    response_count: number;
}): { status: HealthStatus; reasons: string[] } {
    const reasons: string[] = [];
    let score = 100;

    // Age decay
    if (inputs.age_hours > 48) { score -= 40; reasons.push('Post is over 48 hours old'); }
    else if (inputs.age_hours > 24) { score -= 20; reasons.push('Post aging — over 24 hours'); }
    else if (inputs.age_hours > 8) { score -= 10; reasons.push('No response in 8+ hours'); }

    // Supply density
    if (inputs.corridor_supply < 3) { score -= 35; reasons.push('Very low operator density on this corridor'); }
    else if (inputs.corridor_supply < 10) { score -= 15; reasons.push('Limited operator coverage'); }

    // Rate position
    if (inputs.rate_vs_market === 'below') { score -= 25; reasons.push('Rate is below current lane average'); }

    // Service type gap
    if (inputs.service_type_coverage < 30) { score -= 20; reasons.push('Service type coverage is thin for this lane'); }

    // Response signals
    if (inputs.response_count === 0 && inputs.age_hours > 4) { score -= 15; reasons.push('No operator responses yet'); }

    const status: HealthStatus = score >= 70 ? 'healthy' : score >= 40 ? 'at_risk' : 'hard_fill';
    return { status, reasons };
}

function buildRescueActions(
    status: HealthStatus,
    reasons: string[],
    context: CorridorContext,
): RescueAction[] {
    const actions: RescueAction[] = [];

    if (status === 'healthy') {
        // Only light suggestions
        actions.push({
            action_id: 'find_operators',
            label: 'Browse Verified Operators',
            description: `${context.verified_operator_density} verified operators on this corridor`,
            priority: 'secondary',
            type: 'find_operators',
            estimated_impact: 'Connect directly with available operators',
            href: '/directory',
        });
        return actions;
    }

    // At-risk or hard-fill actions
    const hasRateIssue = reasons.some(r => r.includes('Rate'));
    const hasSupplyIssue = reasons.some(r => r.includes('density') || r.includes('coverage'));
    const hasAgeIssue = reasons.some(r => r.includes('hours') || r.includes('aging'));
    const hasServiceGap = reasons.some(r => r.includes('Service type'));

    if (hasRateIssue && context.rate_band) {
        actions.push({
            action_id: 'raise_rate',
            label: 'Raise Rate to Market Band',
            description: `Current lane rates: $${context.rate_band.low}–$${context.rate_band.high}. Raising to $${context.rate_band.mid}+ significantly increases fill speed.`,
            priority: 'primary',
            type: 'raise_rate',
            estimated_impact: 'Expected 2-3x faster fill',
        });
    }

    if (hasSupplyIssue) {
        actions.push({
            action_id: 'widen_radius',
            label: 'Widen Search Radius',
            description: 'Expand to nearby corridors to reach more operators. Supply may be stronger 50-100mi away.',
            priority: status === 'hard_fill' ? 'primary' : 'secondary',
            type: 'widen_radius',
            estimated_impact: 'Reaches 30-60% more operators',
        });
    }

    if (hasServiceGap) {
        actions.push({
            action_id: 'expand_service',
            label: 'Expand Service Types',
            description: `Available types on this lane: ${context.service_type_mix.join(', ') || 'Unknown'}. Consider accepting alternate service configurations.`,
            priority: 'secondary',
            type: 'expand_service_type',
            estimated_impact: 'Opens supply from additional operators',
        });
    }

    if (status === 'hard_fill') {
        actions.push({
            action_id: 'alert_specialists',
            label: 'Alert Corridor Specialists',
            description: 'Send direct notifications to verified operators with high-fill history on this corridor.',
            priority: 'primary',
            type: 'alert_specialists',
            estimated_impact: 'Targeted outreach to best-fit operators',
        });
    }

    if (hasAgeIssue) {
        actions.push({
            action_id: 'repost_boost',
            label: 'Repost with Boost',
            description: 'Refresh your listing and get priority placement in operator feeds for 24 hours.',
            priority: 'secondary',
            type: 'repost_boost',
            estimated_impact: '4x more visibility',
        });
    }

    // Always offer find operators
    actions.push({
        action_id: 'find_operators',
        label: 'Find Verified Operators Now',
        description: `${context.verified_operator_density} verified operators active on this corridor`,
        priority: actions.length === 0 ? 'primary' : 'tertiary',
        type: 'find_operators',
        estimated_impact: 'Direct connection to verified supply',
        href: '/directory',
    });

    return actions;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const origin_state = searchParams.get('origin_state');
    const destination_state = searchParams.get('destination_state');
    const rate = searchParams.get('rate') ? parseFloat(searchParams.get('rate')!) : null;
    const age_hours = searchParams.get('age_hours') ? parseFloat(searchParams.get('age_hours')!) : 0;
    const service_type = searchParams.get('service_type') || '';
    const response_count = searchParams.get('responses') ? parseInt(searchParams.get('responses')!) : 0;

    try {
        // 1. Get corridor supply data
        let corridorSupply = 0;
        let verifiedDensity = 0;
        let serviceTypeMix: string[] = [];
        let rateBand: { low: number; mid: number; high: number } | null = null;
        let marketMode = 'seeding';
        let laneLoads = 0;

        // Check heartbeat API for lane context
        const heartbeatParams = new URLSearchParams();
        if (origin_state) heartbeatParams.set('origin_state', origin_state);
        if (destination_state) heartbeatParams.set('destination_state', destination_state);

        try {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';
            const hbRes = await fetch(`${baseUrl}/api/market/heartbeat?${heartbeatParams}`);
            if (hbRes.ok) {
                const hbData = await hbRes.json();
                corridorSupply = hbData.total_operators || 0;
                verifiedDensity = hbData.verified_operators || 0;
                serviceTypeMix = hbData.service_type_mix || [];
                rateBand = hbData.rate_band || null;
                marketMode = hbData.market_mode || 'seeding';
                laneLoads = hbData.active_loads || 0;
            }
        } catch { /* heartbeat unavailable */ }

        // 2. Determine rate position
        let ratePosition: 'below' | 'at' | 'above' | 'unknown' = 'unknown';
        if (rate && rateBand) {
            if (rate < rateBand.low) ratePosition = 'below';
            else if (rate > rateBand.high) ratePosition = 'above';
            else ratePosition = 'at';
        }

        // 3. Calculate service type coverage
        const serviceTypeCoverage = serviceTypeMix.length > 0
            ? (service_type && serviceTypeMix.includes(service_type) ? 80 : 40)
            : 50; // unknown

        // 4. Detect health
        const { status, reasons } = detectHealth({
            age_hours,
            corridor_supply: corridorSupply,
            rate_vs_market: ratePosition,
            service_type_coverage: serviceTypeCoverage,
            response_count,
        });

        // 5. Build corridor context
        const corridorContext: CorridorContext = {
            lane_load_count: laneLoads,
            verified_operator_density: verifiedDensity,
            service_type_mix: serviceTypeMix,
            rate_band: rateBand,
            market_mode: marketMode,
        };

        // 6. Build rescue actions
        const rescueActions = buildRescueActions(status, reasons, corridorContext);

        return NextResponse.json({
            health_status: status,
            urgency_reasons: reasons,
            recommended_actions: rescueActions,
            corridor_context: corridorContext,
            meta: {
                origin_state,
                destination_state,
                rate_position: ratePosition,
                age_hours,
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Rescue analysis failed', details: error?.message },
            { status: 500 },
        );
    }
}
