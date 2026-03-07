/**
 * Momentum Scoring Engine
 *
 * Composite score reflecting operator engagement health.
 *
 * Components (from YAML spec):
 *   - Profile completeness:    25%
 *   - Response speed:          25%
 *   - Recent activity:         30%
 *   - Availability uptime:     20%
 *
 * Bands:
 *   - RISING    (75–100): "On fire — brokers see you first"
 *   - STEADY    (50–74):  "Consistent — keep it up"
 *   - COOLING   (25–49):  "Slipping — you're losing visibility"
 *   - INACTIVE  (0–24):   "Dormant — brokers can't find you"
 *
 * Visibility multiplier:
 *   - RISING  → 1.3x search rank boost
 *   - STEADY  → 1.0x (baseline)
 *   - COOLING → 0.7x penalty
 *   - INACTIVE → 0.3x (nearly invisible)
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ── Types ──────────────────────────────────────────────────────────────────────

export type MomentumBand = 'rising' | 'steady' | 'cooling' | 'inactive';

export interface ProfileStrength {
    total_percent: number;
    sections: ProfileSection[];
    next_best_step: { field: string; label: string; visibility_boost: number } | null;
    visibility_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'HIDDEN';
    peer_comparison: { avg_in_state: number; your_pct: number } | null;
}

export interface ProfileSection {
    key: string;
    label: string;
    complete: boolean;
    weight: number;
    visibility_impact: string;
}

export interface MomentumScore {
    total: number;              // 0–100
    band: MomentumBand;
    band_label: string;
    band_emoji: string;
    visibility_multiplier: number;
    components: {
        profile_completeness: number;
        response_speed: number;
        recent_activity: number;
        availability_uptime: number;
    };
    trend: 'up' | 'flat' | 'down';
    weekly_delta: number;
}

export interface OpportunityRadar {
    jobs_near_you: number;
    hot_corridors: { name: string; demand_level: string; loads_this_week: number }[];
    missed_opportunities: { load_id: string; corridor: string; posted_ago: string; reason: string }[];
    demand_forecast: { region: string; trend: 'rising' | 'flat' | 'falling'; confidence: number }[];
}

export interface WeeklyReport {
    user_id: string;
    period: string;
    profile_views: number;
    search_appearances: number;
    loads_matched: number;
    response_speed_avg_min: number;
    momentum_score: number;
    momentum_band: MomentumBand;
    momentum_trend: 'up' | 'flat' | 'down';
    demand_near_you: { corridor: string; loads: number }[];
    peer_rank_in_state: number;
    peer_total_in_state: number;
    next_best_step: string | null;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const WEIGHTS = {
    profile_completeness: 0.25,
    response_speed: 0.25,
    recent_activity: 0.30,
    availability_uptime: 0.20,
};

const BAND_CONFIG: Record<MomentumBand, { label: string; emoji: string; multiplier: number; min: number }> = {
    rising: { label: 'Rising', emoji: '🔥', multiplier: 1.3, min: 75 },
    steady: { label: 'Steady', emoji: '✅', multiplier: 1.0, min: 50 },
    cooling: { label: 'Cooling', emoji: '❄️', multiplier: 0.7, min: 25 },
    inactive: { label: 'Inactive', emoji: '💤', multiplier: 0.3, min: 0 },
};

const PROFILE_SECTIONS: Omit<ProfileSection, 'complete'>[] = [
    { key: 'contact_verified', label: 'Contact Verified', weight: 15, visibility_impact: '+15% broker trust' },
    { key: 'coverage_areas', label: 'Coverage Areas', weight: 20, visibility_impact: '+20% search matches' },
    { key: 'equipment', label: 'Equipment Details', weight: 15, visibility_impact: '+15% load matching' },
    { key: 'availability', label: 'Availability Set', weight: 15, visibility_impact: '+15% dispatch speed' },
    { key: 'documents', label: 'Documents Uploaded', weight: 15, visibility_impact: '+15% verified status' },
    { key: 'photos', label: 'Photos / Logo', weight: 10, visibility_impact: '+10% broker clicks' },
    { key: 'display_name', label: 'Display Name', weight: 5, visibility_impact: '+5% recognition' },
    { key: 'bio', label: 'Bio / Description', weight: 5, visibility_impact: '+5% trustworthiness' },
];

// ── Engine ─────────────────────────────────────────────────────────────────────

export class HabitEngine {
    constructor(private supabase: SupabaseClient) { }

    // ─────────────────────────────────────────────────────────────────
    // PROFILE STRENGTH METER
    // ─────────────────────────────────────────────────────────────────

    async getProfileStrength(userId: string): Promise<ProfileStrength> {
        const [profileRes, driverRes, docsRes, certsRes] = await Promise.all([
            this.supabase.from('profiles').select('*').eq('id', userId).single(),
            this.supabase.from('driver_profiles').select('*').eq('user_id', userId).single(),
            this.supabase.from('documents').select('id').eq('owner_id', userId).limit(1),
            this.supabase.from('certifications').select('id').eq('user_id', userId).limit(1),
        ]);

        const profile = profileRes.data;
        const driver = driverRes.data;

        const completionMap: Record<string, boolean> = {
            contact_verified: !!(profile?.email_verified || profile?.phone_verified),
            coverage_areas: !!(driver?.coverage_states && driver.coverage_states.length > 0),
            equipment: !!(driver?.equipment_tags && driver.equipment_tags.length > 0),
            availability: !!(driver?.availability_status && driver.availability_status !== 'unknown'),
            documents: !!(docsRes.data && docsRes.data.length > 0),
            photos: !!(profile?.avatar_url),
            display_name: !!(profile?.display_name && profile.display_name.trim().length > 2),
            bio: !!(profile?.bio && profile.bio.trim().length > 10),
        };

        const sections: ProfileSection[] = PROFILE_SECTIONS.map(s => ({
            ...s,
            complete: completionMap[s.key] ?? false,
        }));

        const totalPercent = sections.reduce((sum, s) => sum + (s.complete ? s.weight : 0), 0);

        // Next-best-step: find the incomplete section with highest weight
        const incomplete = sections.filter(s => !s.complete).sort((a, b) => b.weight - a.weight);
        const nextStep = incomplete.length > 0
            ? { field: incomplete[0].key, label: incomplete[0].label, visibility_boost: incomplete[0].weight }
            : null;

        // Visibility level
        const visibility: ProfileStrength['visibility_level'] =
            totalPercent >= 80 ? 'HIGH' : totalPercent >= 50 ? 'MEDIUM' : totalPercent >= 25 ? 'LOW' : 'HIDDEN';

        // Peer comparison
        const state = profile?.home_state ?? driver?.home_state;
        let peerComparison: ProfileStrength['peer_comparison'] = null;
        if (state) {
            // Approximate: count profiles and avg their likely completeness
            const { count } = await this.supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('home_state', state)
                .eq('role', 'driver');

            peerComparison = {
                avg_in_state: 62, // Will be computed from real data in production
                your_pct: totalPercent,
            };
        }

        return { total_percent: totalPercent, sections, next_best_step: nextStep, visibility_level: visibility, peer_comparison: peerComparison };
    }

    // ─────────────────────────────────────────────────────────────────
    // MOMENTUM SCORING
    // ─────────────────────────────────────────────────────────────────

    async getMomentumScore(userId: string): Promise<MomentumScore> {
        const [profileStrength, responseScore, activityScore, uptimeScore, prevScore] = await Promise.all([
            this.computeProfileComponent(userId),
            this.computeResponseComponent(userId),
            this.computeActivityComponent(userId),
            this.computeAvailabilityComponent(userId),
            this.getPreviousScore(userId),
        ]);

        const total = Math.round(
            profileStrength * WEIGHTS.profile_completeness +
            responseScore * WEIGHTS.response_speed +
            activityScore * WEIGHTS.recent_activity +
            uptimeScore * WEIGHTS.availability_uptime
        );

        const band: MomentumBand = total >= 75 ? 'rising' : total >= 50 ? 'steady' : total >= 25 ? 'cooling' : 'inactive';
        const config = BAND_CONFIG[band];

        const weeklyDelta = total - (prevScore ?? total);
        const trend: 'up' | 'flat' | 'down' = weeklyDelta > 3 ? 'up' : weeklyDelta < -3 ? 'down' : 'flat';

        // Persist score for trend tracking
        await this.supabase.from('operator_momentum').upsert({
            user_id: userId,
            score: total,
            band,
            components: { profile_completeness: profileStrength, response_speed: responseScore, recent_activity: activityScore, availability_uptime: uptimeScore },
            computed_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        return {
            total,
            band,
            band_label: config.label,
            band_emoji: config.emoji,
            visibility_multiplier: config.multiplier,
            components: {
                profile_completeness: profileStrength,
                response_speed: responseScore,
                recent_activity: activityScore,
                availability_uptime: uptimeScore,
            },
            trend,
            weekly_delta: weeklyDelta,
        };
    }

    private async computeProfileComponent(userId: string): Promise<number> {
        const ps = await this.getProfileStrength(userId);
        return ps.total_percent;
    }

    private async computeResponseComponent(userId: string): Promise<number> {
        // Median response time from last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
        const { data: offers } = await this.supabase
            .from('offers')
            .select('sent_at, responded_at')
            .eq('driver_id', userId)
            .gte('sent_at', thirtyDaysAgo)
            .not('responded_at', 'is', null);

        if (!offers || offers.length === 0) return 40; // baseline for no data

        const responseTimes = offers
            .map((o: any) => (new Date(o.responded_at).getTime() - new Date(o.sent_at).getTime()) / 60000)
            .sort((a: number, b: number) => a - b);

        const median = responseTimes[Math.floor(responseTimes.length / 2)];

        // Under 5 min = 100, under 15 min = 80, under 30 min = 60, under 60 = 40, else 20
        if (median <= 5) return 100;
        if (median <= 15) return 80;
        if (median <= 30) return 60;
        if (median <= 60) return 40;
        return 20;
    }

    private async computeActivityComponent(userId: string): Promise<number> {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

        // Count recent actions: logins, responses, profile updates
        const [auditRes, offersRes] = await Promise.all([
            this.supabase
                .from('audit_events')
                .select('id', { count: 'exact', head: true })
                .eq('actor_id', userId)
                .gte('created_at', sevenDaysAgo),
            this.supabase
                .from('offers')
                .select('id', { count: 'exact', head: true })
                .eq('driver_id', userId)
                .gte('created_at', sevenDaysAgo),
        ]);

        const events = (auditRes.count ?? 0) + (offersRes.count ?? 0);

        // 10+ actions = 100, 5+ = 75, 2+ = 50, 1 = 25, 0 = 0
        if (events >= 10) return 100;
        if (events >= 5) return 75;
        if (events >= 2) return 50;
        if (events >= 1) return 25;
        return 0;
    }

    private async computeAvailabilityComponent(userId: string): Promise<number> {
        const { data: driver } = await this.supabase
            .from('driver_profiles')
            .select('availability_status, last_active_at')
            .eq('user_id', userId)
            .single();

        if (!driver) return 0;

        const isAvailable = driver.availability_status === 'available';
        const lastActive = driver.last_active_at ? new Date(driver.last_active_at) : null;
        const hoursSinceActive = lastActive ? (Date.now() - lastActive.getTime()) / 3600000 : 999;

        if (isAvailable && hoursSinceActive < 1) return 100;
        if (isAvailable && hoursSinceActive < 24) return 80;
        if (isAvailable) return 60;
        if (hoursSinceActive < 24) return 40;
        if (hoursSinceActive < 72) return 20;
        return 0;
    }

    private async getPreviousScore(userId: string): Promise<number | null> {
        const { data } = await this.supabase
            .from('operator_momentum')
            .select('score')
            .eq('user_id', userId)
            .single();
        return data?.score ?? null;
    }

    // ─────────────────────────────────────────────────────────────────
    // OPPORTUNITY RADAR
    // ─────────────────────────────────────────────────────────────────

    async getOpportunityRadar(userId: string): Promise<OpportunityRadar> {
        const { data: driver } = await this.supabase
            .from('driver_profiles')
            .select('base_lat, base_lng, coverage_states, service_radius_miles')
            .eq('user_id', userId)
            .single();

        const homeStates = driver?.coverage_states ?? [];

        // Jobs near you: open loads in coverage states
        const { count: jobCount } = await this.supabase
            .from('loads')
            .select('id', { count: 'exact', head: true })
            .in('origin_state', homeStates.length > 0 ? homeStates : ['__none__'])
            .in('status', ['open', 'posted']);

        // Hot corridors
        const { data: corridors } = await this.supabase
            .from('corridor_demand_signals')
            .select('corridor_label, demand_level')
            .in('origin_region', homeStates.length > 0 ? homeStates : ['__none__'])
            .order('demand_level')
            .limit(5);

        const hotCorridors = (corridors ?? []).map((c: any) => ({
            name: c.corridor_label,
            demand_level: c.demand_level,
            loads_this_week: Math.floor(Math.random() * 15) + 1, // Will be computed from real data
        }));

        // Missed opportunities: loads that posted + filled near them
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000).toISOString();
        const { data: filledLoads } = await this.supabase
            .from('loads')
            .select('id, origin_state, dest_state, created_at')
            .in('origin_state', homeStates.length > 0 ? homeStates : ['__none__'])
            .eq('status', 'filled')
            .gte('created_at', twentyFourHoursAgo)
            .limit(5);

        const missed = (filledLoads ?? []).map((l: any) => ({
            load_id: l.id,
            corridor: `${l.origin_state} → ${l.dest_state}`,
            posted_ago: timeSince(new Date(l.created_at)),
            reason: 'Filled before you could respond',
        }));

        return {
            jobs_near_you: jobCount ?? 0,
            hot_corridors: hotCorridors,
            missed_opportunities: missed,
            demand_forecast: [],
        };
    }

    // ─────────────────────────────────────────────────────────────────
    // WEEKLY OPERATOR REPORT
    // ─────────────────────────────────────────────────────────────────

    async generateWeeklyReport(userId: string): Promise<WeeklyReport> {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

        const [momentum, profileStrength, viewsRes, matchesRes, offersRes, profileRes] = await Promise.all([
            this.getMomentumScore(userId),
            this.getProfileStrength(userId),
            this.supabase.from('audit_events').select('id', { count: 'exact', head: true })
                .eq('subject_id', userId).eq('event_type', 'profile_viewed').gte('created_at', sevenDaysAgo),
            this.supabase.from('offers').select('id', { count: 'exact', head: true })
                .eq('driver_id', userId).gte('created_at', sevenDaysAgo),
            this.supabase.from('offers').select('sent_at, responded_at')
                .eq('driver_id', userId).gte('sent_at', sevenDaysAgo).not('responded_at', 'is', null),
            this.supabase.from('profiles').select('home_state').eq('id', userId).single(),
        ]);

        // Response speed avg
        const responses = (offersRes.data ?? []) as any[];
        const avgSpeed = responses.length > 0
            ? responses.reduce((sum: number, o: any) =>
                sum + (new Date(o.responded_at).getTime() - new Date(o.sent_at).getTime()) / 60000, 0) / responses.length
            : 0;

        // Demand near user
        const state = profileRes.data?.home_state;
        const { data: nearbyLoads } = await this.supabase
            .from('loads')
            .select('origin_state, dest_state')
            .eq('origin_state', state ?? '__none__')
            .in('status', ['open', 'posted'])
            .limit(20);

        const corridorCounts = new Map<string, number>();
        for (const l of (nearbyLoads ?? []) as any[]) {
            const key = `${l.origin_state} → ${l.dest_state}`;
            corridorCounts.set(key, (corridorCounts.get(key) ?? 0) + 1);
        }

        return {
            user_id: userId,
            period: `${new Date(Date.now() - 7 * 86400000).toLocaleDateString()} – ${new Date().toLocaleDateString()}`,
            profile_views: viewsRes.count ?? 0,
            search_appearances: (viewsRes.count ?? 0) * 3, // approximate
            loads_matched: matchesRes.count ?? 0,
            response_speed_avg_min: Math.round(avgSpeed),
            momentum_score: momentum.total,
            momentum_band: momentum.band,
            momentum_trend: momentum.trend,
            demand_near_you: Array.from(corridorCounts.entries())
                .map(([corridor, loads]) => ({ corridor, loads }))
                .sort((a, b) => b.loads - a.loads)
                .slice(0, 5),
            peer_rank_in_state: 0, // will be computed
            peer_total_in_state: 0,
            next_best_step: profileStrength.next_best_step?.label ?? null,
        };
    }

    // ─────────────────────────────────────────────────────────────────
    // AVAILABILITY TOGGLE HOOKS
    // ─────────────────────────────────────────────────────────────────

    async onAvailabilityToggle(userId: string, status: 'available' | 'busy' | 'offline'): Promise<{
        new_status: string;
        visibility_boost: boolean;
        matching_brokers_notified: number;
    }> {
        // 1. Update driver profile
        await this.supabase
            .from('driver_profiles')
            .update({
                availability_status: status,
                last_active_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

        // 2. If toggling to available, apply temporary search rank boost
        let boostApplied = false;
        if (status === 'available') {
            await this.supabase.from('search_boosts').upsert({
                user_id: userId,
                boost_type: 'availability_toggle',
                multiplier: 1.2,
                expires_at: new Date(Date.now() + 2 * 3600000).toISOString(), // 2 hour boost
            }, { onConflict: 'user_id,boost_type' });
            boostApplied = true;
        }

        // 3. Log presence event
        await this.supabase.from('audit_events').insert({
            event_type: 'availability_toggled',
            actor_id: userId,
            subject_type: 'presence',
            subject_id: userId,
            payload: { status, boost_applied: boostApplied },
        });

        // 4. Notify brokers who have matching loads
        let brokersNotified = 0;
        if (status === 'available') {
            const { data: driver } = await this.supabase
                .from('driver_profiles')
                .select('coverage_states')
                .eq('user_id', userId)
                .single();

            const states = driver?.coverage_states ?? [];
            if (states.length > 0) {
                const { data: activeLoads } = await this.supabase
                    .from('loads')
                    .select('broker_id')
                    .in('origin_state', states)
                    .in('status', ['open', 'posted'])
                    .limit(10);

                const brokerIds = [...new Set((activeLoads ?? []).map((l: any) => l.broker_id))];
                brokersNotified = brokerIds.length;

                if (brokerIds.length > 0) {
                    const alerts = brokerIds.map(brokerId => ({
                        user_id: brokerId,
                        channel: 'inapp',
                        title: '🟢 Escort now available',
                        body: `An operator in your load area just came online.`,
                        metadata: { type: 'escort_available', escort_id: userId },
                    }));
                    await this.supabase.from('notifications').insert(alerts);
                }
            }
        }

        return { new_status: status, visibility_boost: boostApplied, matching_brokers_notified: brokersNotified };
    }

    // ─────────────────────────────────────────────────────────────────
    // ON APP OPEN HOOKS
    // ─────────────────────────────────────────────────────────────────

    async onAppOpen(userId: string): Promise<{
        momentum: MomentumScore;
        opportunities: number;
        missed: number;
    }> {
        // Update last active
        await this.supabase
            .from('driver_profiles')
            .update({ last_active_at: new Date().toISOString() })
            .eq('user_id', userId);

        const [momentum, radar] = await Promise.all([
            this.getMomentumScore(userId),
            this.getOpportunityRadar(userId),
        ]);

        return {
            momentum,
            opportunities: radar.jobs_near_you,
            missed: radar.missed_opportunities.length,
        };
    }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeSince(date: Date): string {
    const sec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
}
