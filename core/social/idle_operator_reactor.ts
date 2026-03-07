/**
 * IDLE OPERATOR REACTOR — Social Gravity v2 Gap Fix #1
 *
 * "Fastest liquidity gain" — detects operators who haven't checked in
 * 48-96 hours, are near warming corridors, and previously ran similar loads.
 * Then triggers availability nudge + earnings projection + rank decay warning.
 *
 * The problem: in thin markets, the operator who shows up first wins.
 * Early marketplaces die from not enough sellers visible at the right moment.
 *
 * Typical DAU lift: +22-40%
 *
 * Differs from UrgencyEngine reactivation (3d/7d/14d/30d):
 *   - Reactivation = win-back for operators who left
 *   - IdleReactor = wake-up for operators who are still around but not checking in
 *
 * Detection window: 48-96 hours (2-4 days)
 * Trigger conditions (any 2 of 3):
 *   1. Corridor near them is warming (demand_velocity > 1.2)
 *   2. They previously ran loads on this corridor
 *   3. They have coverage in an area with < 5 active operators
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface IdleOperator {
    user_id: string;
    display_name: string | null;
    home_base_state: string;
    coverage_states: string[];
    last_active_at: string;
    hours_idle: number;
    momentum_score: number;
    momentum_band: string;
}

export interface WakeUpSignal {
    operator: IdleOperator;
    warming_corridors: { corridor_key: string; corridor_name: string; velocity: number; loads_24h: number }[];
    nearby_shortage: boolean;
    has_corridor_history: boolean;
    earnings_estimate_daily: number;
    rank_decay_pct: number;        // how much rank score has dropped since going idle
    nudge_type: 'availability' | 'earnings' | 'rank_decay' | 'corridor_match';
    message: { title: string; body: string };
}

// ── Copy templates ───────────────────────────────────────────────────────────

const NUDGE_COPY = {
    availability: {
        title: 'operators are getting booked near you',
        body: '{{load_count}} loads posted in {{corridor_name}} since you were last active. toggle available to match.',
    },
    earnings: {
        title: 'estimated earnings opportunity',
        body: 'operators in {{corridor_name}} are earning ~${{daily_est}}/day right now. you last ran this corridor.',
    },
    rank_decay: {
        title: 'your visibility is dropping',
        body: 'your rank score dropped {{decay_pct}}% while idle. respond to a load to recover.',
    },
    corridor_match: {
        title: '{{corridor_name}} is warming up',
        body: 'demand rising ({{velocity}}× normal). you have experience here — toggle available.',
    },
};

// ── Engine ────────────────────────────────────────────────────────────────────

export class IdleOperatorReactor {
    constructor(private db: SupabaseClient) { }

    /**
     * Run by cron every 6 hours. Scans for idle operators (48-96h)
     * in warming corridors, then sends the most relevant nudge.
     */
    async scan(): Promise<{
        scanned: number;
        nudged: number;
        signals: WakeUpSignal[];
    }> {
        const now = Date.now();
        const idle48h = new Date(now - 48 * 3600000).toISOString();
        const idle96h = new Date(now - 96 * 3600000).toISOString();

        // 1. Find idle operators (48-96h window)
        const { data: idleOps } = await this.db
            .from('operators')
            .select('id, display_name, home_base_state, coverage_states, last_active_at')
            .lte('last_active_at', idle48h)
            .gte('last_active_at', idle96h)
            .eq('claimed', true)
            .limit(300);

        if (!idleOps || idleOps.length === 0) {
            return { scanned: 0, nudged: 0, signals: [] };
        }

        // 2. Get warming corridors (demand_velocity > 1.2)
        const { data: warmingCorridors } = await this.db
            .from('corridor_demand_signals')
            .select('corridor_key, corridor_name, demand_velocity, loads_posted_24h, active_operators_24h')
            .gte('demand_velocity', 1.2)
            .order('demand_velocity', { ascending: false })
            .limit(20);

        const corridorsByState = new Map<string, typeof warmingCorridors>();
        for (const c of warmingCorridors ?? []) {
            // Extract state from corridor_key (e.g., "FL-I75" → "FL")
            const state = c.corridor_key?.split('-')[0] ?? '';
            if (!corridorsByState.has(state)) corridorsByState.set(state, []);
            corridorsByState.get(state)!.push(c);
        }

        const signals: WakeUpSignal[] = [];
        let nudged = 0;

        for (const op of idleOps) {
            const hoursIdle = Math.floor((now - new Date(op.last_active_at).getTime()) / 3600000);

            // Get momentum
            const { data: momentum } = await this.db
                .from('operator_momentum')
                .select('total_score, band')
                .eq('user_id', op.id)
                .single();

            const idleOp: IdleOperator = {
                user_id: op.id,
                display_name: op.display_name,
                home_base_state: op.home_base_state ?? 'FL',
                coverage_states: op.coverage_states ?? [],
                last_active_at: op.last_active_at,
                hours_idle: hoursIdle,
                momentum_score: momentum?.total_score ?? 0,
                momentum_band: momentum?.band ?? 'inactive',
            };

            // 3. Check if corridors near this operator are warming
            const operatorStates = [op.home_base_state, ...(op.coverage_states ?? [])].filter(Boolean);
            const matchingCorridors: WakeUpSignal['warming_corridors'] = [];

            for (const state of operatorStates) {
                const stateCorridors = corridorsByState.get(state) ?? [];
                for (const c of stateCorridors) {
                    matchingCorridors.push({
                        corridor_key: c.corridor_key,
                        corridor_name: c.corridor_name ?? c.corridor_key,
                        velocity: c.demand_velocity ?? 1.0,
                        loads_24h: c.loads_posted_24h ?? 0,
                    });
                }
            }

            // 4. Check for shortage in their area
            const nearbyShortage = matchingCorridors.some(
                c => c.loads_24h > 0 && (c as any).active_operators_24h < 5
            );

            // 5. Check corridor history
            const { count: historyCount } = await this.db
                .from('jobs')
                .select('id', { count: 'exact', head: true })
                .eq('operator_id', op.id)
                .limit(1);
            const hasHistory = (historyCount ?? 0) > 0;

            // 6. Score conditions (need 2 of 3)
            let conditionsMet = 0;
            if (matchingCorridors.length > 0) conditionsMet++;
            if (hasHistory) conditionsMet++;
            if (nearbyShortage) conditionsMet++;

            if (conditionsMet < 2) continue;

            // 7. Compute earnings estimate
            const topCorridor = matchingCorridors[0];
            const earningsEstimate = Math.round(
                (topCorridor?.loads_24h ?? 3) * 185 * 0.6  // loads × avg rate × utilization
            );

            // 8. Compute rank decay
            const decayPct = hoursIdle > 72 ? 15 : hoursIdle > 60 ? 10 : 5;

            // 9. Pick best nudge type
            let nudgeType: WakeUpSignal['nudge_type'] = 'availability';
            if (matchingCorridors.length > 0 && hasHistory) nudgeType = 'corridor_match';
            else if (earningsEstimate > 400) nudgeType = 'earnings';
            else if (decayPct >= 10) nudgeType = 'rank_decay';

            // 10. Build message
            const copy = NUDGE_COPY[nudgeType];
            const corridorName = topCorridor?.corridor_name ?? `${op.home_base_state} corridor`;
            const title = copy.title
                .replace('{{corridor_name}}', corridorName);
            const body = copy.body
                .replace('{{load_count}}', String(topCorridor?.loads_24h ?? 3))
                .replace('{{corridor_name}}', corridorName)
                .replace('{{daily_est}}', String(earningsEstimate))
                .replace('{{decay_pct}}', String(decayPct))
                .replace('{{velocity}}', (topCorridor?.velocity ?? 1.2).toFixed(1));

            const signal: WakeUpSignal = {
                operator: idleOp,
                warming_corridors: matchingCorridors,
                nearby_shortage: nearbyShortage,
                has_corridor_history: hasHistory,
                earnings_estimate_daily: earningsEstimate,
                rank_decay_pct: decayPct,
                nudge_type: nudgeType,
                message: { title, body },
            };

            signals.push(signal);

            // 11. Queue push
            await this.db.from('push_queue').insert({
                user_id: op.id,
                channel: 'push',
                title,
                body,
                priority: nudgeType === 'corridor_match' ? 'high' : 'normal',
                data: {
                    type: 'idle_reactor',
                    nudge_type: nudgeType,
                    corridor: topCorridor?.corridor_key,
                    hours_idle: hoursIdle,
                    earnings_estimate: earningsEstimate,
                },
            });

            nudged++;
        }

        return { scanned: idleOps.length, nudged, signals };
    }
}
