// app/api/pressure/compute/route.ts
// POST /api/pressure/compute
//
// Activates dormant freemium-pressure-engine.ts (689 lines, zero API endpoint)
// Computes real-time pressure decision for a user based on their behavior signals.
//
// Used by:
//  - Dashboard (show upgrade modal when pressure = aggressive)
//  - Directory (throttle visibility for medium+ free users)
//  - Profile pages (show upgrade CTA copy from FreemiumPressureEngine)
//  - Notification scheduler (AddictionLayerEngine.shouldSendNotification)
//  - Leaderboard (VirtuousCycleEngine.computeCycleStrength)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';
import {
    FreemiumPressureEngine,
    AddictionLayerEngine,
    VirtuousCycleEngine,
    type UserBehaviorSignals,
    type CorridorHeatSignals,
} from '@/lib/platform/freemium-pressure-engine';

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'auth_required' }, { status: 401 });
        }

        const admin = getSupabaseAdmin();

        // Fetch user profile signals
        const { data: profile } = await admin
            .from('hc_places')
            .select(`
                id, country_code, trust_score, rank_score, visit_count_30d,
                is_claimed, boost_tier, claimed_at, last_verified_at,
                type, city
            `)
            .eq('claimed_by', user.id)
            .maybeSingle();

        // Fetch user role from role_state
        const { data: roleState } = await admin
            .from('role_state')
            .select('role, intent, tier, days_since_signup, profile_completeness')
            .eq('user_id', user.id)
            .maybeSingle();

        if (!roleState || !profile) {
            return NextResponse.json({
                pressure: 'none',
                message: 'Insufficient data for pressure computation',
                suggestion: 'Complete profile setup',
            });
        }

        // Base behavior signals from DB data
        const daysSinceSignup = roleState.days_since_signup ??
            (profile.claimed_at
                ? Math.floor((Date.now() - new Date(profile.claimed_at).getTime()) / 86400000)
                : 0);

        // Fetch real review count
        const { count: reviewCountResult } = await admin
            .from('hc_reviews')
            .select('*', { count: 'exact', head: true })
            .eq('target_id', profile.id)
            .eq('is_published', true);

        // Fetch dispatch and revenue metrics
        let missedCount = 0;
        let revGen = 0;
        try {
            const { count: oppCount } = await admin
                .from('hc_dispatch_events')
                .select('*', { count: 'exact', head: true })
                .eq('operator_id', profile.id)
                .eq('status', 'missed')
                .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString());
            missedCount = oppCount ?? 0;

            const { data: revData } = await admin
                .from('hc_monetization_events')
                .select('amount')
                .eq('user_id', user.id);
            if (revData) {
                revGen = revData.reduce((acc, row) => acc + (row.amount || 0), 0);
            }
        } catch (e) {
            // Graceful fallback if tables are not fully seeded yet
            console.warn('Dispatch/Monetization table query failed', e);
        }

        const signals: UserBehaviorSignals = {
            userId: user.id,
            role: roleState.role === 'broker' ? 'broker' : 'escort',
            countryCode: profile.country_code ?? 'US',
            profileViews7d: profile.visit_count_30d ? Math.round(profile.visit_count_30d / 4) : 0,
            searchAppearances7d: profile.rank_score ? Math.round(profile.rank_score * 2) : 0,
            responseSpeed_p50_hours: 2.5, // Mocked until full job event stream 
            jobAcceptanceRate: 0.70,      // Mocked until full job event stream
            profileCompleteness: roleState.profile_completeness ?? 0.5,
            daysSinceSignup,
            lastActiveHoursAgo: 4,        // Mocked
            dailyOpens7d: 3,              // Mocked
            notificationOpenRate: 0.25,   // Mocked
            featureUsageScore: roleState.profile_completeness ?? 0.5,
            revenueGenerated: revGen,
            missedOpportunities7d: missedCount,
            corridorRank: profile.rank_score ? Math.max(1, Math.round(100 - profile.rank_score)) : 50,
            isPaidUser: roleState.tier !== 'free',
            currentTier: (roleState.tier as 'free' | 'starter' | 'pro' | 'enterprise') ?? 'free',
            trustScore: profile.trust_score ?? 0,
            verificationLevel: profile.last_verified_at ? 'basic' : 'none',
            reviewCount: reviewCountResult ?? 0,
            avgRating: (reviewCountResult && reviewCountResult > 0) ? 4.5 : 0, // Mock avg rating assuming if they have reviews they are decent
        };

        // Build corridor heat (simplified — no active corridor join yet)
        const corridorSignals: CorridorHeatSignals | null = null;

        // ── Compute Pressure ──
        const pressureDecision = FreemiumPressureEngine.computePressure(
            signals,
            corridorSignals,
            null, // upgradeCount: null until query is available (social proof suppressed)
        );

        // ── Addiction Layer ──
        const economicSignals = AddictionLayerEngine.generateEconomicSignals(signals);
        const scarcitySignals = AddictionLayerEngine.generateScarcitySignals(signals, corridorSignals);
        const progressMetrics = AddictionLayerEngine.getProgressMetrics(signals);

        // ── Virtuous Cycle ──
        const cycleStrength = VirtuousCycleEngine.computeCycleStrength(signals);

        // Log pressure event to swarm_activity_log
        try {
            await admin.from('swarm_activity_log').insert({
                agent_name: 'freemium_pressure_agent',
                trigger_reason: 'pressure_compute:user_request',
                action_taken: `Computed ${pressureDecision.overallPressure} pressure for user ${user.id}`,
                surfaces_touched: ['dashboard', 'directory', 'profile'],
                revenue_impact: pressureDecision.pricingPressure.showMissedRevenue ? 25 : 0,
                trust_impact: null,
                country: signals.countryCode,
                status: 'completed',
            });
        } catch { /* non-blocking */ }

        return NextResponse.json({
            pressure: pressureDecision.overallPressure,
            decision: pressureDecision,
            economic_signals: economicSignals,
            scarcity_signals: scarcitySignals,
            progress: progressMetrics,
            cycle: cycleStrength,
            computed_at: new Date().toISOString(),
        });

    } catch (err) {
        console.error('[/api/pressure/compute]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
