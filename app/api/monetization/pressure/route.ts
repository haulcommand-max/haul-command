import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FreemiumPressureEngine, AddictionLayerEngine, VirtuousCycleEngine, type UserBehaviorSignals, type CorridorHeatSignals } from '@/lib/platform/freemium-pressure-engine';
import { evaluatePaywallWithFlags, type PaywallContext } from '@/lib/monetization/paywall-gate';

// ══════════════════════════════════════════════════════════════
// /api/monetization/pressure — FREEMIUM PRESSURE EVALUATOR
//
// Input: User behavior signals + optional corridor context
// Output: Per-surface pressure decisions + addiction layer signals
//
// Called by: directory pages, tool pages, app dashboard,
//            notification scheduler, leaderboard renderer
//
// This is the central "should we monetize THIS user NOW?" API.
// ══════════════════════════════════════════════════════════════

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { user, corridor, upgradeCount } = body as {
            user: UserBehaviorSignals;
            corridor?: CorridorHeatSignals;
            upgradeCount?: number;
        };

        if (!user || !user.userId || !user.role) {
            return NextResponse.json({ error: 'Missing user signals' }, { status: 400 });
        }

        // --- FreemiumPressureEngine Auto-Wiring Enhancement ---
        // Wire responseSpeed_p50_hours to real hc_dispatch_matches query
        try {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            
            // Calculate median response time for operator
            if (user.role === 'escort') {
                const { data: matches } = await supabase
                    .from('hc_dispatch_matches')
                    .select('notified_at, accepted_at')
                    .eq('operator_id', user.userId)
                    .not('accepted_at', 'is', null)
                    .not('notified_at', 'is', null)
                    .order('accepted_at', { ascending: false })
                    .limit(10);
                    
                if (matches && matches.length > 0) {
                    const times = matches.map(m => {
                         const diff = new Date(m.accepted_at).getTime() - new Date(m.notified_at).getTime();
                         return diff > 0 ? diff / (1000 * 60 * 60) : 0;
                    }).sort((a,b) => a - b);
                    const p50 = times[Math.floor(times.length / 2)];
                    user.responseSpeed_p50_hours = p50;
                }
            }
        } catch (err) {
            console.error('Failed to wire responseSpeed_p50_hours', err);
        }

        // 1. Compute freemium pressure decision
        const pressure = FreemiumPressureEngine.computePressure(
            user,
            corridor ?? null,
            upgradeCount ?? null,
        );

        // 2. Generate addiction layer signals
        const economicSignals = AddictionLayerEngine.generateEconomicSignals(user);
        const progressMetrics = AddictionLayerEngine.getProgressMetrics(user);
        const showCompetitive = AddictionLayerEngine.shouldShowCompetitiveSurface(user);
        const scarcitySignals = AddictionLayerEngine.generateScarcitySignals(user, corridor ?? null);

        // 3. Compute virtuous cycle stage
        const cycleStage = VirtuousCycleEngine.computeCycleStrength(user);

        // 4. Evaluate DB-enriched paywall (if user has entity context)
        let paywallDecision = null;
        try {
            paywallDecision = await evaluatePaywallWithFlags({
                entity_id: user.userId,
                user_type: user.role === 'escort' ? 'escort' : 'broker',
                current_tier: user.currentTier as any || 'free',
                usage: {
                    searches: 0,
                    leads: 0,
                    routes: 0,
                    daysActive: user.daysSinceSignup,
                },
            });
        } catch {
            // Non-blocking — paywall evaluation can fail without breaking pressure
        }

        return NextResponse.json({
            pressure,
            addictionLayer: {
                economicSignals,
                progressMetrics,
                showCompetitive,
                scarcitySignals,
            },
            cycleStage,
            paywall: paywallDecision,
        });
    } catch (err: any) {
        console.error('[Pressure API] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
