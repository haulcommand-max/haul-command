/**
 * ADGRID REVENUE AMPLIFIER — Social Gravity Engine v2, Module 9
 *
 * Fixes the $10.5-35K/mo revenue leak from the audit:
 *   - Dynamic ad pricing based on demand velocity
 *   - High-intent surface inventory (SEO pages have ZERO ads today)
 *   - Surge corridor multipliers
 *   - Intent Harvest Layer (pre-surge ad targeting)
 *
 * Dynamic pricing inputs:
 *   - demand_velocity: load posting rate vs 7d average
 *   - corridor_competition: active operators / loads ratio
 *   - advertiser_ltv: historical spend of this advertiser
 *   - operator_density: supply pressure
 *   - time_of_day: business hours premium
 *   - intent_signals: pre-surge behavior (repeated views, availability scouting)
 *
 * High-intent surfaces that need ad slots:
 *   - /county/[slug] pages
 *   - /available-now/[city-state] pages
 *   - /high-pole-escorts/[state] pages
 *   - corridor heat pages
 *   - operator profile sidebar
 *   - search results (top + inline)
 *   - surge corridor takeover
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdSurface {
    surface_id: string;
    surface_type: 'county_page' | 'available_now' | 'high_pole' | 'corridor_page' |
    'profile_sidebar' | 'search_results' | 'surge_takeover' | 'load_feed';
    placement: 'top' | 'sidebar' | 'inline' | 'banner' | 'takeover';
    base_cpm_usd: number;         // base price per 1000 impressions
    current_multiplier: number;    // dynamic multiplier
    effective_cpm: number;         // base × multiplier
    inventory_available: boolean;
    geo_target?: string;           // state, corridor, or county
}

export interface DemandSignals {
    corridor_id: string;
    loads_24h: number;
    loads_7d_avg: number;
    demand_velocity: number;       // loads_24h / loads_7d_avg
    active_operators: number;
    supply_pressure: number;       // operators / loads
    is_surge: boolean;
    surge_zscore: number;
    unique_brokers_24h: number;
}

export interface IntentSignal {
    user_id: string;
    signal_type: 'repeated_corridor_view' | 'availability_scout' | 'profile_view_no_book' |
    'route_search_repeat' | 'rate_check';
    target_id: string;             // corridor, operator, or route
    count_24h: number;
    first_seen: string;
    last_seen: string;
}

export interface PricingDecision {
    surface: AdSurface;
    demand_signals: DemandSignals | null;
    intent_density: number;        // 0-1, how much pre-surge intent exists
    final_cpm: number;
    floor_enforced: boolean;
    reasoning: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const BASE_CPM: Record<string, number> = {
    county_page: 2.50,    // was $0 — completely unmonetized
    available_now: 4.00,    // highest intent surface — was $0
    high_pole: 3.00,    // niche + high intent — was $0
    corridor_page: 3.50,
    profile_sidebar: 2.00,
    search_results: 5.00,    // highest conversion surface
    surge_takeover: 8.00,    // premium takeover during surge
    load_feed: 1.50,    // inline feed ads
};

const MULTIPLIER_CAPS = {
    surge: 2.5,
    shortage: 2.0,
    broker_spike: 1.8,
    intent: 1.6,
    time_of_day: 1.3,
    evening_rush: 1.2,
};

const CPM_FLOOR = 0.50;  // never go below $0.50 CPM

// ── Surface Inventory Definition ─────────────────────────────────────────────

const SURFACE_INVENTORY: Omit<AdSurface, 'current_multiplier' | 'effective_cpm' | 'inventory_available'>[] = [
    // ── SEO Pages (currently $0 revenue — the big fix) ──
    { surface_id: 'county_sidebar', surface_type: 'county_page', placement: 'sidebar', base_cpm_usd: BASE_CPM.county_page },
    { surface_id: 'county_inline', surface_type: 'county_page', placement: 'inline', base_cpm_usd: BASE_CPM.county_page * 0.8 },
    { surface_id: 'county_sponsor', surface_type: 'county_page', placement: 'banner', base_cpm_usd: BASE_CPM.county_page * 1.5 },

    { surface_id: 'available_now_top', surface_type: 'available_now', placement: 'top', base_cpm_usd: BASE_CPM.available_now },
    { surface_id: 'available_now_side', surface_type: 'available_now', placement: 'sidebar', base_cpm_usd: BASE_CPM.available_now * 0.9 },
    { surface_id: 'available_now_inline', surface_type: 'available_now', placement: 'inline', base_cpm_usd: BASE_CPM.available_now * 0.7 },

    { surface_id: 'high_pole_sidebar', surface_type: 'high_pole', placement: 'sidebar', base_cpm_usd: BASE_CPM.high_pole },
    { surface_id: 'high_pole_inline', surface_type: 'high_pole', placement: 'inline', base_cpm_usd: BASE_CPM.high_pole * 0.8 },

    // ── Existing surfaces (already have inventory, need pricing) ──
    { surface_id: 'corridor_sponsor', surface_type: 'corridor_page', placement: 'banner', base_cpm_usd: BASE_CPM.corridor_page },
    { surface_id: 'corridor_inline', surface_type: 'corridor_page', placement: 'inline', base_cpm_usd: BASE_CPM.corridor_page * 0.7 },

    { surface_id: 'profile_sidebar', surface_type: 'profile_sidebar', placement: 'sidebar', base_cpm_usd: BASE_CPM.profile_sidebar },

    { surface_id: 'search_top', surface_type: 'search_results', placement: 'top', base_cpm_usd: BASE_CPM.search_results },
    { surface_id: 'search_inline', surface_type: 'search_results', placement: 'inline', base_cpm_usd: BASE_CPM.search_results * 0.6 },

    { surface_id: 'surge_takeover', surface_type: 'surge_takeover', placement: 'takeover', base_cpm_usd: BASE_CPM.surge_takeover },

    { surface_id: 'feed_inline', surface_type: 'load_feed', placement: 'inline', base_cpm_usd: BASE_CPM.load_feed },
];

// ── Engine ────────────────────────────────────────────────────────────────────

export class AdGridAmplifier {
    constructor(private db: SupabaseClient) { }

    // ── DYNAMIC PRICING ───────────────────────────────────────────────────

    /**
     * Compute dynamic CPM for a given surface + geo context.
     * Called by AdGrid bid route before serving an ad.
     */
    async computePricing(
        surfaceId: string,
        geoTarget?: string,
    ): Promise<PricingDecision> {
        const surfaceDef = SURFACE_INVENTORY.find(s => s.surface_id === surfaceId);
        if (!surfaceDef) {
            throw new Error(`Unknown surface: ${surfaceId}`);
        }

        const reasons: string[] = [];
        let multiplier = 1.0;

        // 1. Demand velocity
        const demand = geoTarget ? await this.getDemandSignals(geoTarget) : null;
        if (demand) {
            if (demand.is_surge) {
                const surgeMultiplier = Math.min(
                    1 + (demand.surge_zscore * 0.35),
                    MULTIPLIER_CAPS.surge,
                );
                multiplier *= surgeMultiplier;
                reasons.push(`surge detected (z=${demand.surge_zscore.toFixed(1)}, ×${surgeMultiplier.toFixed(2)})`);
            }

            if (demand.supply_pressure < 0.5) {
                const shortageMultiplier = Math.min(
                    1 + ((1 - demand.supply_pressure) * 0.8),
                    MULTIPLIER_CAPS.shortage,
                );
                multiplier *= shortageMultiplier;
                reasons.push(`operator shortage (supply=${demand.supply_pressure.toFixed(2)}, ×${shortageMultiplier.toFixed(2)})`);
            }

            if (demand.unique_brokers_24h > 5) {
                const brokerMultiplier = Math.min(
                    1 + (demand.unique_brokers_24h * 0.04),
                    MULTIPLIER_CAPS.broker_spike,
                );
                multiplier *= brokerMultiplier;
                reasons.push(`broker spike (${demand.unique_brokers_24h} brokers, ×${brokerMultiplier.toFixed(2)})`);
            }
        }

        // 2. Intent density (the Intent Harvest Layer)
        const intentDensity = geoTarget ? await this.getIntentDensity(geoTarget) : 0;
        if (intentDensity > 0.3) {
            const intentMultiplier = Math.min(
                1 + (intentDensity * 0.6),
                MULTIPLIER_CAPS.intent,
            );
            multiplier *= intentMultiplier;
            reasons.push(`pre-surge intent (density=${intentDensity.toFixed(2)}, ×${intentMultiplier.toFixed(2)})`);
        }

        // 3. Time-of-day premium (business hours 7am-7pm)
        const hour = new Date().getHours();
        if (hour >= 7 && hour <= 19) {
            multiplier *= 1.15;
            reasons.push('business hours premium (×1.15)');
        }

        // 4. Floor enforcement
        const rawCpm = surfaceDef.base_cpm_usd * multiplier;
        const finalCpm = Math.max(rawCpm, CPM_FLOOR);
        const floorEnforced = rawCpm < CPM_FLOOR;

        if (floorEnforced) reasons.push(`floor enforced ($${CPM_FLOOR})`);
        if (reasons.length === 0) reasons.push('base pricing');

        const surface: AdSurface = {
            ...surfaceDef,
            current_multiplier: multiplier,
            effective_cpm: finalCpm,
            inventory_available: true,
            geo_target: geoTarget,
        };

        return {
            surface,
            demand_signals: demand,
            intent_density: intentDensity,
            final_cpm: finalCpm,
            floor_enforced: floorEnforced,
            reasoning: reasons,
        };
    }

    // ── INTENT HARVEST LAYER ──────────────────────────────────────────────

    /**
     * Record an intent signal. Called when:
     *   - User views same corridor page again (within 24h)
     *   - User checks availability multiple times
     *   - User opens operator profiles without booking
     *   - User searches same route within 24h
     */
    async recordIntent(
        userId: string,
        signalType: IntentSignal['signal_type'],
        targetId: string,
    ): Promise<void> {
        const dayAgo = new Date(Date.now() - 86400000).toISOString();

        // Check if signal exists within 24h window
        const { data: existing } = await this.db
            .from('intent_signals')
            .select('id, count_24h')
            .eq('user_id', userId)
            .eq('signal_type', signalType)
            .eq('target_id', targetId)
            .gte('first_seen', dayAgo)
            .limit(1);

        if (existing && existing.length > 0) {
            // Increment existing
            await this.db
                .from('intent_signals')
                .update({
                    count_24h: existing[0].count_24h + 1,
                    last_seen: new Date().toISOString(),
                })
                .eq('id', existing[0].id);
        } else {
            // New signal
            await this.db.from('intent_signals').insert({
                user_id: userId,
                signal_type: signalType,
                target_id: targetId,
                count_24h: 1,
                first_seen: new Date().toISOString(),
                last_seen: new Date().toISOString(),
            });
        }
    }

    /**
     * Compute intent density for a geo target (corridor, state, county).
     * Returns 0-1 score representing pre-surge intent activity.
     */
    private async getIntentDensity(geoTarget: string): Promise<number> {
        const dayAgo = new Date(Date.now() - 86400000).toISOString();

        const { count: totalSignals } = await this.db
            .from('intent_signals')
            .select('id', { count: 'exact', head: true })
            .eq('target_id', geoTarget)
            .gte('last_seen', dayAgo);

        const { count: repeatSignals } = await this.db
            .from('intent_signals')
            .select('id', { count: 'exact', head: true })
            .eq('target_id', geoTarget)
            .gte('last_seen', dayAgo)
            .gte('count_24h', 2);

        const total = totalSignals ?? 0;
        const repeats = repeatSignals ?? 0;

        if (total === 0) return 0;

        // Intent density = weighted mix of volume + repeat rate
        const volumeScore = Math.min(total / 20, 1.0);  // saturates at 20 signals
        const repeatRate = repeats / total;
        return volumeScore * 0.4 + repeatRate * 0.6;
    }

    // ── DEMAND SIGNALS ────────────────────────────────────────────────────

    private async getDemandSignals(geoTarget: string): Promise<DemandSignals | null> {
        const { data } = await this.db
            .from('corridor_demand_signals')
            .select('*')
            .eq('corridor_key', geoTarget)
            .single();

        if (!data) return null;

        const loads24h = data.loads_posted_24h ?? 0;
        const loads7dAvg = data.avg_loads_per_day_7d ?? 1;
        const velocity = loads7dAvg > 0 ? loads24h / loads7dAvg : 0;
        const activeOps = data.active_operators_24h ?? 0;
        const supplyPressure = loads24h > 0 ? activeOps / loads24h : 2.0;

        return {
            corridor_id: geoTarget,
            loads_24h: loads24h,
            loads_7d_avg: loads7dAvg,
            demand_velocity: velocity,
            active_operators: activeOps,
            supply_pressure: supplyPressure,
            is_surge: velocity > 1.4,
            surge_zscore: Math.max(0, (velocity - 1.0) / 0.3),
            unique_brokers_24h: data.unique_brokers_24h ?? 0,
        };
    }

    // ── SURFACE INVENTORY ─────────────────────────────────────────────────

    /**
     * Get all available ad surfaces with current dynamic pricing.
     * Used by admin dashboard and AdGrid campaign builder.
     */
    async getInventoryWithPricing(geoTarget?: string): Promise<PricingDecision[]> {
        const results: PricingDecision[] = [];
        for (const surface of SURFACE_INVENTORY) {
            const pricing = await this.computePricing(surface.surface_id, geoTarget);
            results.push(pricing);
        }
        return results;
    }

    /**
     * Get surfaces for a specific page type.
     * Used by page components to know which ad slots to render.
     */
    getSurfacesForPageType(pageType: string): typeof SURFACE_INVENTORY {
        return SURFACE_INVENTORY.filter(s => s.surface_type === pageType);
    }
}
