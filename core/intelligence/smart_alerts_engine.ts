/**
 * Smart Alerts Engine
 * 
 * "Most apps spam. We send signal-aware alerts only."
 *
 * ESCORT ALERTS:
 *   - Nearby hot load in preferred lane
 *   - Preferred load type posted
 *   - Broker you've worked with before posted a load
 *   - Rate above your lane median
 *
 * BROKER ALERTS:
 *   - Supply shortage in your corridor
 *   - Hard-fill risk on posted load
 *   - Rate too low vs. current competition
 *   - Competitor fill speed benchmark for your lane
 *
 * Architecture:
 *   - Evaluates signals at load creation time
 *   - Only fires alerts that pass signal-aware filters
 *   - Anti-spam: max 3 alerts per user per hour
 *   - Deduplication: same signal type suppressed for 4 hours
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── Types ──────────────────────────────────────────────────────────────────────

export type AlertType =
    // Escort alerts
    | 'HOT_LOAD_NEARBY'
    | 'PREFERRED_LOAD_TYPE'
    | 'REPEAT_BROKER_LOAD'
    | 'ABOVE_MEDIAN_RATE'
    // Broker alerts
    | 'SUPPLY_SHORTAGE'
    | 'HARD_FILL_RISK'
    | 'RATE_TOO_LOW'
    | 'COMPETITOR_FILL_SPEED';

export interface SmartAlert {
    type: AlertType;
    user_id: string;
    title: string;
    body: string;
    channels: ('inapp' | 'push' | 'email')[];
    priority: 'high' | 'medium' | 'low';
    metadata: Record<string, unknown>;
}

export interface AlertPreferences {
    user_id: string;
    preferred_corridors: string[];
    preferred_load_types: string[];
    preferred_states: string[];
    min_rate_per_mile: number;
    alert_channels: ('inapp' | 'push' | 'email')[];
    quiet_hours_start?: number; // 0-23
    quiet_hours_end?: number;
    max_alerts_per_hour: number;
}

interface LoadContext {
    load_id: string;
    broker_id: string;
    origin_state: string;
    dest_state: string;
    origin_lat: number | null;
    origin_lng: number | null;
    load_type: string;
    rate_per_mile: number | null;
    urgency: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_ALERTS_PER_HOUR = 3;
const DEDUP_WINDOW_HOURS = 4;
const NEARBY_RADIUS_MILES = 100;

// ── Engine ─────────────────────────────────────────────────────────────────────

export class SmartAlertsEngine {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    /**
     * Evaluate and send alerts when a new load is created.
     * Called from the load creation flow or a postgres trigger.
     */
    async evaluateLoadCreated(load: LoadContext): Promise<SmartAlert[]> {
        const alerts: SmartAlert[] = [];

        // Fetch all potential recipients in parallel
        const [escortAlerts, brokerAlerts] = await Promise.all([
            this.evaluateEscortAlerts(load),
            this.evaluateBrokerAlerts(load),
        ]);

        alerts.push(...escortAlerts, ...brokerAlerts);

        // Apply anti-spam and dedup filters
        const filtered = await this.applyFilters(alerts);

        // Dispatch filtered alerts
        await this.dispatchAlerts(filtered);

        return filtered;
    }

    /**
     * Evaluate escort-targeted alerts for a new load
     */
    private async evaluateEscortAlerts(load: LoadContext): Promise<SmartAlert[]> {
        const alerts: SmartAlert[] = [];

        // 1. Fetch nearby available escorts
        const { data: escorts } = await this.supabase
            .from('driver_profiles')
            .select(`
                user_id, base_lat, base_lng, service_radius_miles,
                availability_status, equipment_tags,
                profiles!inner ( display_name, home_state )
            `)
            .in('availability_status', ['available', 'busy'])
            .limit(200);

        if (!escorts) return [];

        // 2. Fetch past job relationships with this broker
        const escortIds = escorts.map((e: any) => e.user_id);
        const { data: pastJobs } = await this.supabase
            .from('jobs')
            .select('driver_id, broker_id')
            .eq('broker_id', load.broker_id)
            .eq('status', 'completed')
            .in('driver_id', escortIds);

        const repeatDrivers = new Set((pastJobs ?? []).map((j: any) => j.driver_id));

        // 3. Lane rate median (approximate)
        const { data: laneRates } = await this.supabase
            .from('loads')
            .select('base_rate_per_mile')
            .eq('origin_state', load.origin_state)
            .not('base_rate_per_mile', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50);

        const rates = (laneRates ?? []).map((l: any) => l.base_rate_per_mile).filter(Boolean).sort((a: number, b: number) => a - b);
        const medianRate = rates.length > 0 ? rates[Math.floor(rates.length / 2)] : null;

        for (const escort of escorts as any[]) {
            const profile = escort.profiles;
            const driverId = escort.user_id;

            // Distance check
            let nearbyMatch = false;
            if (escort.base_lat && escort.base_lng && load.origin_lat && load.origin_lng) {
                const dist = this.haversineMiles(escort.base_lat, escort.base_lng, load.origin_lat, load.origin_lng);
                nearbyMatch = dist <= (escort.service_radius_miles ?? NEARBY_RADIUS_MILES);
            }

            // ALERT: Hot Load Nearby
            if (nearbyMatch && load.urgency === 'emergency') {
                alerts.push({
                    type: 'HOT_LOAD_NEARBY',
                    user_id: driverId,
                    title: '🔥 Hot Load Nearby!',
                    body: `Emergency load posted from ${load.origin_state} to ${load.dest_state}. You're in range.`,
                    channels: ['push', 'inapp'],
                    priority: 'high',
                    metadata: { load_id: load.load_id, distance: 'nearby' },
                });
            }

            // ALERT: Repeat Broker
            if (repeatDrivers.has(driverId) && nearbyMatch) {
                alerts.push({
                    type: 'REPEAT_BROKER_LOAD',
                    user_id: driverId,
                    title: '🤝 Your broker just posted!',
                    body: `A broker you've worked with before posted a load: ${load.origin_state} → ${load.dest_state}`,
                    channels: ['push', 'inapp'],
                    priority: 'high',
                    metadata: { load_id: load.load_id, broker_id: load.broker_id },
                });
            }

            // ALERT: Above Median Rate
            if (medianRate && load.rate_per_mile && load.rate_per_mile > medianRate * 1.1 && nearbyMatch) {
                alerts.push({
                    type: 'ABOVE_MEDIAN_RATE',
                    user_id: driverId,
                    title: '💰 Above-market rate!',
                    body: `New load at $${load.rate_per_mile.toFixed(2)}/mi (${Math.round((load.rate_per_mile / medianRate - 1) * 100)}% above lane median)`,
                    channels: ['inapp'],
                    priority: 'medium',
                    metadata: { load_id: load.load_id, rate: load.rate_per_mile, median: medianRate },
                });
            }
        }

        return alerts;
    }

    /**
     * Evaluate broker-targeted alerts for a new load
     */
    private async evaluateBrokerAlerts(load: LoadContext): Promise<SmartAlert[]> {
        const alerts: SmartAlert[] = [];

        // Supply check: how many escorts are available in the origin state?
        const { count: supplyCount } = await this.supabase
            .from('driver_profiles')
            .select('user_id', { count: 'exact', head: true })
            .eq('availability_status', 'available')
            .eq('profiles.home_state', load.origin_state);

        // Active load count in same lane
        const { count: demandCount } = await this.supabase
            .from('loads')
            .select('id', { count: 'exact', head: true })
            .eq('origin_state', load.origin_state)
            .in('status', ['open', 'posted']);

        const supply = supplyCount ?? 0;
        const demand = demandCount ?? 0;

        // ALERT: Supply Shortage
        if (supply < 3 && demand > 2) {
            alerts.push({
                type: 'SUPPLY_SHORTAGE',
                user_id: load.broker_id,
                title: '⚠️ Supply Shortage',
                body: `Only ${supply} escorts available in ${load.origin_state}. Consider widening your pickup window or increasing rate.`,
                channels: ['inapp'],
                priority: 'high',
                metadata: { supply, demand, state: load.origin_state },
            });
        }

        // ALERT: Hard-Fill Risk
        if (supply === 0 || (demand > 0 && supply / demand < 0.5)) {
            alerts.push({
                type: 'HARD_FILL_RISK',
                user_id: load.broker_id,
                title: '🚨 Hard-Fill Risk',
                body: `This load may struggle to fill. Supply/demand ratio: ${supply}:${demand} in ${load.origin_state}`,
                channels: ['push', 'inapp'],
                priority: 'high',
                metadata: { supply, demand, load_id: load.load_id },
            });
        }

        // ALERT: Rate Too Low
        const { data: laneRates } = await this.supabase
            .from('loads')
            .select('base_rate_per_mile')
            .eq('origin_state', load.origin_state)
            .eq('status', 'filled')
            .not('base_rate_per_mile', 'is', null)
            .order('created_at', { ascending: false })
            .limit(30);

        const filledRates = (laneRates ?? []).map((l: any) => l.base_rate_per_mile).filter(Boolean).sort((a: number, b: number) => a - b);
        const p25Rate = filledRates.length >= 4 ? filledRates[Math.floor(filledRates.length * 0.25)] : null;

        if (p25Rate && load.rate_per_mile && load.rate_per_mile < p25Rate) {
            alerts.push({
                type: 'RATE_TOO_LOW',
                user_id: load.broker_id,
                title: '📉 Rate Below Market',
                body: `Your rate ($${load.rate_per_mile.toFixed(2)}/mi) is below the 25th percentile ($${p25Rate.toFixed(2)}/mi) for ${load.origin_state} loads. May attract fewer escorts.`,
                channels: ['inapp'],
                priority: 'medium',
                metadata: { load_id: load.load_id, rate: load.rate_per_mile, p25: p25Rate },
            });
        }

        return alerts;
    }

    /**
     * Anti-spam + dedup filter
     */
    private async applyFilters(alerts: SmartAlert[]): Promise<SmartAlert[]> {
        const filtered: SmartAlert[] = [];

        for (const alert of alerts) {
            // Check recent alert count for this user
            const hourAgo = new Date(Date.now() - 3600000).toISOString();
            const { count: recentCount } = await this.supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', alert.user_id)
                .gte('created_at', hourAgo);

            if ((recentCount ?? 0) >= MAX_ALERTS_PER_HOUR) continue;

            // Dedup: same alert type in last N hours
            const dedupWindow = new Date(Date.now() - DEDUP_WINDOW_HOURS * 3600000).toISOString();
            const { count: dupCount } = await this.supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', alert.user_id)
                .contains('metadata', { type: alert.type })
                .gte('created_at', dedupWindow);

            if ((dupCount ?? 0) > 0) continue;

            filtered.push(alert);
        }

        return filtered;
    }

    /**
     * Dispatch alerts to notification channels
     */
    private async dispatchAlerts(alerts: SmartAlert[]): Promise<void> {
        if (alerts.length === 0) return;

        const records = alerts.map(a => ({
            user_id: a.user_id,
            channel: a.channels[0] ?? 'inapp',
            title: a.title,
            body: a.body,
            metadata: {
                type: a.type,
                priority: a.priority,
                ...a.metadata,
            },
        }));

        await this.supabase.from('notifications').insert(records);

        // For push alerts, also queue for push delivery
        const pushAlerts = alerts.filter(a => a.channels.includes('push'));
        if (pushAlerts.length > 0) {
            await this.supabase.from('push_queue').insert(
                pushAlerts.map(a => ({
                    user_id: a.user_id,
                    title: a.title,
                    body: a.body,
                    data: a.metadata,
                    priority: a.priority,
                }))
            );
        }
    }

    private haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 3958.8;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
