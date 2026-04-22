/**
 * GET /api/claim/pressure
 *
 * Returns density-driven claim urgency messaging for a given market or profile.
 * Used by directory cards, profile pages, and claim CTAs to show context-aware
 * claim pressure that varies by market state.
 *
 * Query params:
 *   - h3_cell: H3 r7 cell ID (for local market context)
 *   - corridor: corridor slug (for corridor context)
 *   - profile_id: specific listing ID (for per-profile context)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type MarketState = 'sparse' | 'forming' | 'active' | 'dense' | 'saturated';

interface ClaimPressure {
    market_state: MarketState;
    operator_count: number;
    claimed_count: number;
    unclaimed_count: number;
    claim_rate: number; // percentage claimed
    urgency: 'low' | 'medium' | 'high' | 'critical';
    headline: string;
    subtext: string;
    cta: string;
    badge: string | null;
}

function classifyMarket(count: number): MarketState {
    if (count > 30) return 'saturated';
    if (count > 15) return 'dense';
    if (count > 5) return 'active';
    if (count > 2) return 'forming';
    return 'sparse';
}

function buildPressure(
    state: MarketState,
    operatorCount: number,
    claimedCount: number,
    unclaimedCount: number
): ClaimPressure {
    const claimRate = operatorCount > 0 ? Math.round((claimedCount / operatorCount) * 100) : 0;

    const configs: Record<MarketState, {
        urgency: ClaimPressure['urgency'];
        headline: string;
        subtext: string;
        cta: string;
        badge: string | null;
    }> = {
        sparse: {
            urgency: 'medium',
            headline: 'Be the first visible operator here',
            subtext: `Only ${operatorCount} operator${operatorCount !== 1 ? 's' : ''} listed in this area. Claim early to own local visibility.`,
            cta: 'Claim your profile — be first',
            badge: '🏁 First-mover advantage',
        },
        forming: {
            urgency: 'medium',
            headline: 'This market is forming — claim early',
            subtext: `${operatorCount} operators listed, ${unclaimedCount} profiles still unclaimed. Establish your presence before the market fills in.`,
            cta: 'Claim before competitors do',
            badge: '📈 Growing market',
        },
        active: {
            urgency: 'high',
            headline: 'Competitors are already visible',
            subtext: `${claimedCount} of ${operatorCount} operators have claimed their profiles. Unclaimed profiles get buried.`,
            cta: 'Claim to stay in contention',
            badge: claimRate > 50 ? '⚠️ Most profiles claimed' : '🔵 Active market',
        },
        dense: {
            urgency: 'high',
            headline: 'High-competition market — unclaimed means invisible',
            subtext: `${operatorCount} operators in this area. ${claimedCount} already claimed. Without claiming, brokers won't find you.`,
            cta: 'Claim now — visibility is competitive',
            badge: '🔴 Dense market',
        },
        saturated: {
            urgency: 'critical',
            headline: 'Saturated market — ranking and trust matter here',
            subtext: `${operatorCount} operators competing for attention. Claim to avoid being buried. Trust score drives visibility.`,
            cta: 'Claim to stand out — upgrade available',
            badge: '🔥 Saturated — claim urgently',
        },
    };

    const config = configs[state];
    return {
        market_state: state,
        operator_count: operatorCount,
        claimed_count: claimedCount,
        unclaimed_count: unclaimedCount,
        claim_rate: claimRate,
        ...config,
    };
}

export async function GET(req: NextRequest) {
    const supabase = getSupabaseAdmin();
    const sp = req.nextUrl.searchParams;
    const h3Cell = sp.get('h3_cell') || '';
    const corridor = sp.get('corridor') || '';
    const profileId = sp.get('profile_id') || '';

    let operatorCount = 0;
    let claimedCount = 0;

    if (h3Cell) {
        // Local market from H3
        const { count: total } = await supabase
            .from('hc_global_operators')
            .select('*', { count: 'exact', head: true })
            .eq('h3_r7', h3Cell);

        const { count: claimed } = await supabase
            .from('hc_global_operators')
            .select('*', { count: 'exact', head: true })
            .eq('h3_r7', h3Cell)
            .eq('claim_status', 'claimed');

        operatorCount = total ?? 0;
        claimedCount = claimed ?? 0;
    } else if (corridor) {
        // Corridor-level from supply snapshot
        const { data: supply } = await supabase
            .from('corridor_supply_snapshot')
            .select('supply_count')
            .eq('corridor_slug', corridor)
            .order('timestamp_bucket', { ascending: false })
            .limit(1)
            .maybeSingle();

        operatorCount = supply?.supply_count ?? 0;
        // Approximate claim rate — use overall rate
        const { count: totalClaimed } = await supabase
            .from('hc_global_operators')
            .select('*', { count: 'exact', head: true })
            .eq('claim_status', 'claimed');
        const { count: totalAll } = await supabase
            .from('hc_global_operators')
            .select('*', { count: 'exact', head: true });
        const overallRate = (totalAll ?? 1) > 0 ? (totalClaimed ?? 0) / (totalAll ?? 1) : 0;
        claimedCount = Math.round(operatorCount * overallRate);
    } else if (profileId) {
        // Per-profile: get the H3 cell of this profile and use that
        const { data: profile } = await supabase
            .from('hc_global_operators')
            .select('h3_r7, claim_status')
            .eq('id', profileId)
            .maybeSingle();

        if (profile?.h3_r7) {
            const { count: total } = await supabase
                .from('hc_global_operators')
                .select('*', { count: 'exact', head: true })
                .eq('h3_r7', profile.h3_r7);

            const { count: claimed } = await supabase
                .from('hc_global_operators')
                .select('*', { count: 'exact', head: true })
                .eq('h3_r7', profile.h3_r7)
                .eq('claim_status', 'claimed');

            operatorCount = total ?? 0;
            claimedCount = claimed ?? 0;
        }
    }

    const unclaimedCount = Math.max(0, operatorCount - claimedCount);
    const state = classifyMarket(operatorCount);
    const pressure = buildPressure(state, operatorCount, claimedCount, unclaimedCount);

    return NextResponse.json({
        ok: true,
        pressure,
    }, {
        headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    });
}
