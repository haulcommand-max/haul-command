/**
 * Territory Gamification Engine
 * 
 * Features:
 *   - County scarcity counters (X of 3 slots remaining)
 *   - Corridor ownership badges
 *   - Streak bonuses (claimed + active 7 days → bonus boost credits)
 *   - Defense alerts ("someone entered your zone")
 *   - Seasonal leaderboards (quarterly reset)
 *
 * Extends existing GamificationEngine with territory-specific mechanics.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TerritorySlot {
    id: string;
    county_fips: string;
    county_name: string;
    state_code: string;
    max_slots: number;
    claimed_slots: number;
    remaining_slots: number;
    scarcity_level: 'HIGH_DEMAND' | 'FILLING_UP' | 'AVAILABLE';
}

export interface TerritoryClaimResult {
    success: boolean;
    slot_id?: string;
    error?: string;
    remaining_slots: number;
    triggered_defense_alert: boolean;
    streak_bonus_earned: number;
}

export interface CorridorOwnership {
    corridor_slug: string;
    corridor_name: string;
    owner_id: string;
    rank: number;
    score: number;
    badge: 'gold' | 'silver' | 'bronze' | null;
    defended_days: number;
    streak_active: boolean;
}

export interface StreakBonus {
    user_id: string;
    territory_id: string;
    consecutive_days: number;
    bonus_credits: number;
    tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
}

export interface DefenseAlert {
    id: string;
    territory_owner_id: string;
    intruder_id: string;
    intruder_name: string | null;
    county_name: string;
    state_code: string;
    event_type: 'NEW_CLAIM' | 'OUTRANKED' | 'STREAK_BROKEN';
    created_at: string;
}

export interface SeasonalLeaderboard {
    season: string; // e.g., "2026-Q1"
    entries: LeaderboardEntry[];
}

export interface LeaderboardEntry {
    user_id: string;
    display_name: string | null;
    rank: number;
    total_score: number;
    territories_held: number;
    corridors_dominated: number;
    longest_streak: number;
    badges_earned: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_COUNTY_SLOTS = 3;
const STREAK_TIERS = [
    { days: 30, tier: 'DIAMOND' as const, credits: 500, badge: '💎' },
    { days: 14, tier: 'GOLD' as const, credits: 200, badge: '🥇' },
    { days: 7, tier: 'SILVER' as const, credits: 50, badge: '🥈' },
    { days: 3, tier: 'BRONZE' as const, credits: 10, badge: '🥉' },
];

const CORRIDOR_BADGE_THRESHOLDS = {
    gold: 90,   // top 10%
    silver: 75, // top 25%
    bronze: 50, // top 50%
};

// ── Engine ─────────────────────────────────────────────────────────────────────

export class TerritoryEngine {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    /**
     * Get county scarcity data — how many slots remain
     */
    async getCountyScarcity(stateCode: string): Promise<TerritorySlot[]> {
        const { data: counties } = await this.supabase
            .from('county_territories')
            .select('*')
            .eq('state_code', stateCode)
            .order('remaining_slots', { ascending: true });

        if (!counties) return [];

        return counties.map((c: any) => ({
            id: c.id,
            county_fips: c.county_fips,
            county_name: c.county_name,
            state_code: c.state_code,
            max_slots: c.max_slots ?? MAX_COUNTY_SLOTS,
            claimed_slots: c.claimed_slots ?? 0,
            remaining_slots: Math.max(0, (c.max_slots ?? MAX_COUNTY_SLOTS) - (c.claimed_slots ?? 0)),
            scarcity_level:
                (c.max_slots ?? MAX_COUNTY_SLOTS) - (c.claimed_slots ?? 0) <= 0 ? 'HIGH_DEMAND' :
                    (c.max_slots ?? MAX_COUNTY_SLOTS) - (c.claimed_slots ?? 0) <= 1 ? 'FILLING_UP' :
                        'AVAILABLE',
        }));
    }

    /**
     * Claim a territory slot in a county
     */
    async claimTerritory(userId: string, countyFips: string): Promise<TerritoryClaimResult> {
        // 1. Check availability
        const { data: county } = await this.supabase
            .from('county_territories')
            .select('*')
            .eq('county_fips', countyFips)
            .single();

        if (!county) {
            return { success: false, error: 'County not found', remaining_slots: 0, triggered_defense_alert: false, streak_bonus_earned: 0 };
        }

        const remaining = Math.max(0, (county.max_slots ?? MAX_COUNTY_SLOTS) - (county.claimed_slots ?? 0));
        if (remaining <= 0) {
            return { success: false, error: 'No slots remaining — county is at capacity', remaining_slots: 0, triggered_defense_alert: false, streak_bonus_earned: 0 };
        }

        // 2. Check if user already claimed this county
        const { data: existing } = await this.supabase
            .from('territory_claims')
            .select('id')
            .eq('user_id', userId)
            .eq('county_fips', countyFips)
            .eq('status', 'active')
            .single();

        if (existing) {
            return { success: false, error: 'You already have a claim in this county', remaining_slots: remaining, triggered_defense_alert: false, streak_bonus_earned: 0 };
        }

        // 3. Insert claim
        const { data: claim, error: claimErr } = await this.supabase
            .from('territory_claims')
            .insert({
                user_id: userId,
                county_fips: countyFips,
                county_name: county.county_name,
                state_code: county.state_code,
                status: 'active',
                claimed_at: new Date().toISOString(),
                streak_start: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (claimErr) {
            return { success: false, error: 'Failed to claim territory', remaining_slots: remaining, triggered_defense_alert: false, streak_bonus_earned: 0 };
        }

        // 4. Increment claimed_slots
        await this.supabase
            .from('county_territories')
            .update({ claimed_slots: (county.claimed_slots ?? 0) + 1 })
            .eq('county_fips', countyFips);

        // 5. Send defense alerts to existing claimants
        const { data: existingClaims } = await this.supabase
            .from('territory_claims')
            .select('user_id')
            .eq('county_fips', countyFips)
            .eq('status', 'active')
            .neq('user_id', userId);

        let triggeredAlert = false;
        if (existingClaims && existingClaims.length > 0) {
            const { data: intruder } = await this.supabase
                .from('profiles')
                .select('display_name')
                .eq('id', userId)
                .single();

            const alerts = existingClaims.map((c: any) => ({
                user_id: c.user_id,
                channel: 'inapp',
                title: '🚨 Territory Alert!',
                body: `${intruder?.display_name ?? 'A new operator'} just claimed a spot in ${county.county_name}, ${county.state_code}`,
                metadata: {
                    type: 'territory_defense',
                    event_type: 'NEW_CLAIM',
                    intruder_id: userId,
                    county_fips: countyFips,
                },
            }));

            await this.supabase.from('notifications').insert(alerts);
            triggeredAlert = true;
        }

        // 6. Check if this triggers a streak bonus from a previous territory
        const streakBonus = await this.checkStreakBonus(userId);

        return {
            success: true,
            slot_id: claim?.id,
            remaining_slots: remaining - 1,
            triggered_defense_alert: triggeredAlert,
            streak_bonus_earned: streakBonus,
        };
    }

    /**
     * Check and award streak bonuses
     */
    async checkStreakBonus(userId: string): Promise<number> {
        const { data: claims } = await this.supabase
            .from('territory_claims')
            .select('streak_start, streak_days')
            .eq('user_id', userId)
            .eq('status', 'active');

        if (!claims || claims.length === 0) return 0;

        let totalBonus = 0;
        for (const claim of claims) {
            const days = claim.streak_days ?? Math.floor(
                (Date.now() - new Date(claim.streak_start).getTime()) / 86400000
            );

            const tier = STREAK_TIERS.find(t => days >= t.days);
            if (tier) {
                totalBonus += tier.credits;
            }
        }

        return totalBonus;
    }

    /**
     * Get corridor ownership rankings
     */
    async getCorridorOwnership(corridorSlug: string): Promise<CorridorOwnership[]> {
        const { data } = await this.supabase
            .from('corridor_leaderboards')
            .select(`
                corridor_slug, corridor_name,
                user_id, rank, score, defended_days,
                profiles!inner ( display_name )
            `)
            .eq('corridor_slug', corridorSlug)
            .order('rank', { ascending: true })
            .limit(10);

        if (!data) return [];

        return data.map((row: any, i: number) => ({
            corridor_slug: row.corridor_slug,
            corridor_name: row.corridor_name,
            owner_id: row.user_id,
            rank: row.rank ?? i + 1,
            score: row.score ?? 0,
            badge: row.rank === 1 ? 'gold' : row.rank === 2 ? 'silver' : row.rank === 3 ? 'bronze' : null,
            defended_days: row.defended_days ?? 0,
            streak_active: (row.defended_days ?? 0) > 0,
        }));
    }

    /**
     * Get seasonal leaderboard
     */
    async getSeasonalLeaderboard(season?: string): Promise<SeasonalLeaderboard> {
        const currentSeason = season ?? this.getCurrentSeason();

        const { data } = await this.supabase
            .from('seasonal_leaderboards')
            .select(`
                user_id, total_score, territories_held,
                corridors_dominated, longest_streak, badges_earned,
                profiles!inner ( display_name )
            `)
            .eq('season', currentSeason)
            .order('total_score', { ascending: false })
            .limit(50);

        return {
            season: currentSeason,
            entries: (data ?? []).map((row: any, i: number) => ({
                user_id: row.user_id,
                display_name: row.profiles?.display_name ?? null,
                rank: i + 1,
                total_score: row.total_score ?? 0,
                territories_held: row.territories_held ?? 0,
                corridors_dominated: row.corridors_dominated ?? 0,
                longest_streak: row.longest_streak ?? 0,
                badges_earned: row.badges_earned ?? [],
            })),
        };
    }

    private getCurrentSeason(): string {
        const now = new Date();
        const q = Math.ceil((now.getMonth() + 1) / 3);
        return `${now.getFullYear()}-Q${q}`;
    }
}
