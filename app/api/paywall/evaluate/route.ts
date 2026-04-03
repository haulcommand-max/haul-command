// ══════════════════════════════════════════════════════════════
// API: /api/paywall/evaluate — Unified Paywall Gate
//
// Merges THREE paywall intelligence sources into ONE decision:
//   1. paywall-gate.ts → DB-driven monetization_flags
//   2. freemium-pressure-engine.ts → behavior-driven pressure
//   3. monetization-engine.ts → tier-based static rules (via gate)
//
// Modes:
//   mode="full"     → DB gate + behavioral pressure (highest fidelity)
//   mode="page"     → Quick page-level check
//   default (none)  → Quick page-level check
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import {
    evaluatePaywallWithFlags,
    evaluatePagePaywall,
} from '@/lib/monetization/paywall-gate';
import {
    FreemiumPressureEngine,
    type UserBehaviorSignals,
    type CorridorHeatSignals,
    type PressureLevel,
} from '@/lib/platform/freemium-pressure-engine';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            entity_id,
            user_type,
            current_tier,
            usage,
            page_type,
            mode,
            behavior,
            corridor,
        } = body as {
            entity_id: string;
            user_type?: 'escort' | 'broker' | 'carrier';
            current_tier?: string;
            usage?: { searches: number; leads: number; routes: number; daysActive: number };
            page_type?: string;
            mode?: 'full' | 'page';
            behavior?: Partial<UserBehaviorSignals>;
            corridor?: CorridorHeatSignals | null;
        };

        if (!entity_id) {
            return NextResponse.json({ error: 'Missing required: entity_id' }, { status: 400 });
        }

        // ── Mode: Full evaluation (DB gate + behavioral pressure) ──
        if (mode === 'full' && usage) {
            const gate = await evaluatePaywallWithFlags({
                entity_id,
                user_type: (user_type || 'escort') as 'escort' | 'broker' | 'carrier',
                current_tier: (current_tier || 'free') as 'free' | 'pro' | 'business' | 'elite' | 'enterprise',
                usage: {
                    searches: usage.searches ?? 0,
                    leads: usage.leads ?? 0,
                    routes: usage.routes ?? 0,
                    daysActive: usage.daysActive ?? 0,
                },
            });

            // Compute behavioral pressure if signals provided
            let pressureLevel: PressureLevel = 'none';
            let pressureMeta: {
                show_upgrade_prompt: boolean;
                discount_offered: number;
                social_proof: string | null;
                urgency_countdown: boolean;
                reasons: string[];
            } = {
                show_upgrade_prompt: false,
                discount_offered: 0,
                social_proof: null,
                urgency_countdown: false,
                reasons: [],
            };

            if (behavior) {
                const role = user_type === 'carrier' ? 'broker' : (user_type ?? 'escort') as 'escort' | 'broker';
                const signals: UserBehaviorSignals = {
                    userId: entity_id,
                    role,
                    countryCode: 'US',
                    profileViews7d: behavior.profileViews7d ?? 0,
                    searchAppearances7d: behavior.searchAppearances7d ?? 0,
                    responseSpeed_p50_hours: behavior.responseSpeed_p50_hours ?? 24,
                    jobAcceptanceRate: behavior.jobAcceptanceRate ?? 0.5,
                    profileCompleteness: behavior.profileCompleteness ?? 0.3,
                    daysSinceSignup: behavior.daysSinceSignup ?? usage.daysActive,
                    lastActiveHoursAgo: behavior.lastActiveHoursAgo ?? 24,
                    dailyOpens7d: behavior.dailyOpens7d ?? 1,
                    notificationOpenRate: behavior.notificationOpenRate ?? 0.3,
                    featureUsageScore: behavior.featureUsageScore ?? 0.2,
                    revenueGenerated: behavior.revenueGenerated ?? 0,
                    missedOpportunities7d: behavior.missedOpportunities7d ?? 0,
                    corridorRank: behavior.corridorRank ?? 100,
                    isPaidUser: current_tier !== 'free',
                    currentTier: (['free', 'starter', 'pro', 'enterprise'].includes(current_tier ?? 'free')
                        ? current_tier : 'free') as 'free' | 'starter' | 'pro' | 'enterprise',
                    trustScore: behavior.trustScore ?? 0.5,
                    verificationLevel: behavior.verificationLevel ?? 'none',
                    reviewCount: behavior.reviewCount ?? 0,
                    avgRating: behavior.avgRating ?? 0,
                };

                const pressure = FreemiumPressureEngine.computePressure(signals, corridor ?? null, null);
                pressureLevel = pressure.overallPressure;
                pressureMeta = {
                    show_upgrade_prompt: pressure.directoryPressure.showUpgradePrompt,
                    discount_offered: pressure.pricingPressure.discountOffered,
                    social_proof: pressure.pricingPressure.socialProof,
                    urgency_countdown: pressure.pricingPressure.urgencyCountdown,
                    reasons: pressure.reasons,
                };
            }

            // Merge: behavioral pressure can override gate decision
            const showPaywall = gate.force_blocked
                ? false
                : (gate.show || pressureLevel === 'hard_gate' || pressureLevel === 'aggressive');

            return NextResponse.json({
                // Core decision
                show: showPaywall,
                pressure_level: pressureLevel,

                // Gate data
                entity_eligible: gate.entity_eligible,
                lifecycle_stage: gate.lifecycle_stage,
                revenue_priority: gate.revenue_priority,
                eligible_surfaces: gate.eligible_surfaces,
                force_blocked: gate.force_blocked,
                force_reason: gate.force_reason,

                // Behavioral pressure data
                pressure: pressureMeta,
            });
        }

        // ── Mode: Page-level quick check ──
        const result = await evaluatePagePaywall({
            entity_id,
            page_type: page_type || 'directory_listing',
            user_type: (user_type || 'escort') as 'escort' | 'broker' | 'carrier',
            current_tier: (current_tier || 'free') as 'free' | 'pro' | 'business' | 'elite' | 'enterprise',
        });

        return NextResponse.json(result);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown';
        console.error('[api/paywall/evaluate] Error:', msg);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
