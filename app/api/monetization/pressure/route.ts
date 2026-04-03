import { NextResponse } from 'next/server';
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
