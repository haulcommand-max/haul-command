/**
 * GET /api/sponsor/pricing
 *
 * Returns density-driven sponsor pricing for any territory.
 * Pricing reflects real market value: density, pressure, traffic proxy.
 *
 * Query params:
 *   - type: territory|corridor|city|micro_market (default: territory)
 *   - value: territory slug (e.g. i-10, houston-tx, h3-cell-id)
 *   - h3_cell: optional H3 cell for micro-market pricing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isMissingOptionalSupabaseRelation } from '@/lib/supabase/optional-relations';

export const dynamic = 'force-dynamic';

type MarketTier = 'sparse_conquest' | 'forming' | 'active' | 'dense' | 'saturated_premium' | 'surge_corridor';

interface PricingResult {
    market_tier: MarketTier;
    tier_label: string;
    base_price_monthly: number;
    pricing_posture: string;
    messaging: string;
    scarcity_label: string;
    operator_count: number;
    demand_pressure: number;
    surge_active: boolean;
    surge_multiplier: number;
    supply_alert_count: number;
    supply_alerts: Array<{
        id: string;
        label: string;
        message: string;
        alert_type: string | null;
        available_count: number | null;
    }>;
    inventory_class: string;
}

function classifyMarketTier(operatorCount: number, demandPressure: number, surgeActive: boolean): MarketTier {
    if (surgeActive) return 'surge_corridor';
    if (operatorCount > 30) return 'saturated_premium';
    if (operatorCount > 15) return 'dense';
    if (operatorCount > 5) return 'active';
    if (operatorCount > 2) return 'forming';
    return 'sparse_conquest';
}

const TIER_CONFIG: Record<MarketTier, {
    label: string;
    base_price: number;
    posture: string;
    messaging: string;
    scarcity: string;
}> = {
    sparse_conquest: {
        label: 'Conquest Market',
        base_price: 49,
        posture: 'Early ownership — lock this market before it grows',
        messaging: 'Own visibility in a forming market — be the first operator brokers see.',
        scarcity: 'First-mover opportunity',
    },
    forming: {
        label: 'Growth Market',
        base_price: 79,
        posture: 'Growth market — establish presence as supply builds',
        messaging: 'This market is growing. Secure your position before competitors fill it in.',
        scarcity: 'Limited founding slots',
    },
    active: {
        label: 'Active Market',
        base_price: 129,
        posture: 'Established market — premium positioning available',
        messaging: 'Active operator market with real broker traffic. Sponsor to stand out.',
        scarcity: 'Premium inventory available',
    },
    dense: {
        label: 'Dense Market',
        base_price: 199,
        posture: 'Dense market — visibility is competitive',
        messaging: 'High-density market. Sponsorship is the clearest path to standing out.',
        scarcity: 'High-demand inventory',
    },
    saturated_premium: {
        label: 'Premium Market',
        base_price: 299,
        posture: 'Highest-value market — maximum operator density and broker attention',
        messaging: 'This is a premium market with maximum operator density. Limited sponsor slots.',
        scarcity: 'Limited premium inventory',
    },
    surge_corridor: {
        label: 'Surge Corridor',
        base_price: 249,
        posture: 'Urgent corridor — demand is spiking',
        messaging: 'This corridor is surging. Lock premium positioning during peak demand.',
        scarcity: '⚡ Surge pricing — limited slots',
    },
};

export async function GET(req: NextRequest) {
    const supabase = getSupabaseAdmin();
    const sp = req.nextUrl.searchParams;
    const type = sp.get('type') || 'corridor';
    const value = sp.get('value') || '';
    const h3Cell = sp.get('h3_cell') || '';

    if (!value && !h3Cell) {
        return NextResponse.json({ error: 'value or h3_cell required' }, { status: 400 });
    }

    let operatorCount = 0;
    let demandPressure = 0;
    let surgeActive = false;
    let surgeMultiplier = 1.0;
    let inventoryClass = type;
    let supplyAlerts: PricingResult['supply_alerts'] = [];

    // Get density from H3 if provided
    if (h3Cell) {
        const { count } = await supabase
            .from('hc_global_operators')
            .select('*', { count: 'exact', head: true })
            .eq('h3_r7', h3Cell);
        operatorCount = count ?? 0;
        inventoryClass = 'micro_market';
    }

    // Get corridor-level data
    if (value) {
        // Check demand signals
        const { data: demand } = await supabase
            .from('corridor_demand_signals')
            .select('demand_pressure, surge_active, surge_multiplier')
            .eq('corridor_id', value)
            .maybeSingle();

        if (demand) {
            demandPressure = demand.demand_pressure ?? 0;
            surgeActive = demand.surge_active ?? false;
            surgeMultiplier = Math.max(surgeMultiplier, demand.surge_multiplier ?? 1.0);
        }

        // Check supply
        const { data: supply } = await supabase
            .from('corridor_supply_snapshot')
            .select('supply_count, demand_pressure')
            .eq('corridor_slug', value)
            .order('timestamp_bucket', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (supply) {
            operatorCount = Math.max(operatorCount, supply.supply_count ?? 0);
            demandPressure = Math.max(demandPressure, supply.demand_pressure ?? 0);
        }
    }

    const { data: alerts, error: alertsError } = await supabase
        .from('supply_alerts')
        .select('id,city,state_code,corridor_id,alert_type,available_count,message,expires_at')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(12);

    const normalizedValue = (value || h3Cell).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const marketAlerts = alertsError && isMissingOptionalSupabaseRelation(alertsError) ? [] : (alerts ?? []);

    supplyAlerts = marketAlerts
        .filter((alert: any) => {
            const expiresAt = alert.expires_at ? new Date(alert.expires_at).getTime() : null;
            if (expiresAt && expiresAt <= Date.now()) return false;
            if (!normalizedValue) return true;
            const city = typeof alert.city === 'string' ? alert.city.toLowerCase() : '';
            const alertHaystack = [
                alert.city,
                alert.state_code,
                alert.corridor_id,
                alert.message,
            ].filter(Boolean).join(' ').toLowerCase().replace(/[^a-z0-9]+/g, ' ');
            return alertHaystack.includes(normalizedValue) || (city ? normalizedValue.includes(city) : false);
        })
        .slice(0, 3)
        .map((alert: any) => ({
            id: alert.id,
            label: [alert.city, alert.state_code].filter(Boolean).join(', ') || alert.corridor_id || 'Market alert',
            message: alert.message ?? 'Active supply pressure signal for this market.',
            alert_type: alert.alert_type,
            available_count: alert.available_count,
        }));

    // Check existing sponsorship
    const { data: existing } = await supabase
        .from('territory_sponsorships')
        .select('status')
        .eq('territory_value', value || h3Cell)
        .eq('status', 'active')
        .maybeSingle();

    const tier = classifyMarketTier(operatorCount, demandPressure, surgeActive);
    const config = TIER_CONFIG[tier];

    // Adjust price based on demand pressure
    let adjustedPrice = config.base_price;
    if (demandPressure > 0.3) adjustedPrice = Math.round(adjustedPrice * 1.15);
    if (demandPressure > 0.5) adjustedPrice = Math.round(adjustedPrice * 1.25);
    if (surgeActive) adjustedPrice = Math.round(adjustedPrice * 1.3);

    const result: PricingResult = {
        market_tier: tier,
        tier_label: config.label,
        base_price_monthly: adjustedPrice,
        pricing_posture: config.posture,
        messaging: config.messaging,
        scarcity_label: config.scarcity,
        operator_count: operatorCount,
        demand_pressure: demandPressure,
        surge_active: surgeActive,
        surge_multiplier: surgeMultiplier,
        supply_alert_count: supplyAlerts.length,
        supply_alerts: supplyAlerts,
        inventory_class: inventoryClass,
    };

    return NextResponse.json({
        ok: true,
        territory: { type, value: value || h3Cell },
        available: !existing,
        pricing: result,
    }, {
        headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    });
}
