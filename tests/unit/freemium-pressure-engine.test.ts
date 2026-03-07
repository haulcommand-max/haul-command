import { describe, it, expect } from "vitest";
import {
    FreemiumPressureEngine,
    AddictionLayerEngine,
    VirtuousCycleEngine,
    type UserBehaviorSignals,
    type CorridorHeatSignals,
} from "@/lib/platform/freemium-pressure-engine";

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeEscort(overrides: Partial<UserBehaviorSignals> = {}): UserBehaviorSignals {
    return {
        userId: "user-1",
        role: "escort",
        countryCode: "US",
        profileViews7d: 0,
        searchAppearances7d: 0,
        responseSpeed_p50_hours: 1,
        jobAcceptanceRate: 0.8,
        profileCompleteness: 0.9,
        daysSinceSignup: 30,
        lastActiveHoursAgo: 1,
        dailyOpens7d: 5,
        notificationOpenRate: 0.4,
        featureUsageScore: 0.5,
        revenueGenerated: 0,
        missedOpportunities7d: 0,
        corridorRank: 5,
        isPaidUser: false,
        currentTier: "free",
        trustScore: 0.7,
        verificationLevel: "basic",
        reviewCount: 3,
        avgRating: 4.5,
        ...overrides,
    };
}

function makeBroker(overrides: Partial<UserBehaviorSignals> = {}): UserBehaviorSignals {
    return makeEscort({ role: "broker", ...overrides });
}

function makeCorridor(overrides: Partial<CorridorHeatSignals> = {}): CorridorHeatSignals {
    return {
        corridorId: "i-10-southern",
        countryCode: "US",
        liquidityRatio: 0.7,
        activeEscorts24h: 10,
        loadsPosted24h: 8,
        fillTimeMedian_hours: 2,
        surgeActive: false,
        unmetDemandIndex: 0.3,
        priceElasticity: 0.5,
        ...overrides,
    };
}

// ── FreemiumPressureEngine ───────────────────────────────────────────────────

describe("FreemiumPressureEngine.computePressure", () => {
    describe("grace period", () => {
        it("returns none pressure for Tier-A escort within 14-day grace", () => {
            const user = makeEscort({ daysSinceSignup: 10, profileViews7d: 100 });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.overallPressure).toBe("none");
            expect(result.reasons.some(r => r.includes("Grace period"))).toBe(true);
        });

        it("returns none pressure for Tier-C (non-US) escort within 45-day grace", () => {
            const user = makeEscort({ countryCode: "PL", daysSinceSignup: 40, profileViews7d: 200 });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.overallPressure).toBe("none");
        });

        it("applies pressure once grace period is over", () => {
            const user = makeEscort({ daysSinceSignup: 20, profileViews7d: 50 });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.overallPressure).not.toBe("none");
        });
    });

    describe("escort pressure scaling by profile views", () => {
        it("returns soft pressure at low view threshold (Tier-A = 15 views)", () => {
            const user = makeEscort({ daysSinceSignup: 30, profileViews7d: 20 });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.overallPressure).toBe("soft");
        });

        it("returns medium pressure at medium view threshold (Tier-A = 40 views)", () => {
            const user = makeEscort({ daysSinceSignup: 30, profileViews7d: 50 });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.overallPressure).toBe("medium");
        });

        it("returns aggressive pressure at high view threshold (Tier-A = 80 views)", () => {
            const user = makeEscort({ daysSinceSignup: 30, profileViews7d: 90 });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.overallPressure).toBe("aggressive");
        });

        it("upgrades to hard_gate when missed opportunities > 3", () => {
            const user = makeEscort({
                daysSinceSignup: 30,
                profileViews7d: 90,
                missedOpportunities7d: 5,
            });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.overallPressure).toBe("hard_gate");
        });
    });

    describe("market guard — never hard_gate supply in under-supplied corridors", () => {
        it("relaxes hard_gate to medium when corridor liquidityRatio < 0.55", () => {
            const user = makeEscort({
                daysSinceSignup: 30,
                profileViews7d: 90,
                missedOpportunities7d: 5,
            });
            const corridor = makeCorridor({ liquidityRatio: 0.4 });
            const result = FreemiumPressureEngine.computePressure(user, corridor);
            expect(result.overallPressure).toBe("medium");
        });

        it("relaxes aggressive to soft when corridor liquidityRatio < 0.55", () => {
            const user = makeEscort({ daysSinceSignup: 30, profileViews7d: 90 });
            const corridor = makeCorridor({ liquidityRatio: 0.3 });
            const result = FreemiumPressureEngine.computePressure(user, corridor);
            expect(result.overallPressure).toBe("soft");
        });

        it("does NOT relax when corridor liquidityRatio >= 0.55", () => {
            const user = makeEscort({
                daysSinceSignup: 30,
                profileViews7d: 90,
                missedOpportunities7d: 5,
            });
            const corridor = makeCorridor({ liquidityRatio: 0.7 });
            const result = FreemiumPressureEngine.computePressure(user, corridor);
            expect(result.overallPressure).toBe("hard_gate");
        });
    });

    describe("paid users always get none pressure", () => {
        it("returns none for paid starter", () => {
            const user = makeEscort({ isPaidUser: true, currentTier: "starter" });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.overallPressure).toBe("none");
        });

        it("returns none for paid enterprise with 1000 views", () => {
            const user = makeEscort({
                isPaidUser: true,
                currentTier: "enterprise",
                profileViews7d: 1000,
                missedOpportunities7d: 50,
            });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.overallPressure).toBe("none");
        });

        it("sets enterprise rankingMultiplier to 1.35", () => {
            const user = makeEscort({ isPaidUser: true, currentTier: "enterprise" });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.directoryPressure.rankingMultiplier).toBe(1.35);
        });

        it("shows upgrade prompt for pro users (nudge to enterprise)", () => {
            const user = makeEscort({ isPaidUser: true, currentTier: "pro" });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.directoryPressure.showUpgradePrompt).toBe(true);
        });
    });

    describe("broker pressure", () => {
        it("applies hard_gate to broker past 2x free window (Tier-A: day > 14)", () => {
            const user = makeBroker({ daysSinceSignup: 20, featureUsageScore: 0.8 });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.overallPressure).toBe("hard_gate");
        });

        it("returns none for brand-new broker (day 1)", () => {
            const user = makeBroker({ daysSinceSignup: 1 });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.overallPressure).toBe("none");
        });
    });

    describe("profile completeness gate", () => {
        it("returns none if escort profile is less than 60% complete", () => {
            const user = makeEscort({
                daysSinceSignup: 60,
                profileViews7d: 500,
                profileCompleteness: 0.4,
            });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.overallPressure).toBe("none");
        });
    });

    describe("directory pressure surface", () => {
        it("caps visibility at 50 impressions/day on aggressive", () => {
            const user = makeEscort({ daysSinceSignup: 30, profileViews7d: 90 });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.directoryPressure.visibilityCap).toBe(50);
        });

        it("caps visibility at 10 impressions/day on hard_gate", () => {
            const user = makeEscort({
                daysSinceSignup: 30,
                profileViews7d: 90,
                missedOpportunities7d: 5,
            });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.directoryPressure.visibilityCap).toBe(10);
        });

        it("sets no visibility cap on none pressure", () => {
            const user = makeEscort({ daysSinceSignup: 5 });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.directoryPressure.visibilityCap).toBe(0);
        });
    });

    describe("app pressure surface", () => {
        it("hard_gate locks advanced_analytics, priority_matching, and boost_listing", () => {
            const user = makeEscort({
                daysSinceSignup: 30,
                profileViews7d: 90,
                missedOpportunities7d: 5,
            });
            const result = FreemiumPressureEngine.computePressure(user, null);
            const gates = result.appPressure.unlockGates;
            expect(gates).toContain("advanced_analytics");
            expect(gates).toContain("priority_matching");
            expect(gates).toContain("boost_listing");
        });

        it("none pressure has no gated features", () => {
            const user = makeEscort({ daysSinceSignup: 5 });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.appPressure.unlockGates).toHaveLength(0);
        });
    });

    describe("pricing pressure", () => {
        it("offers 20% discount at medium pressure", () => {
            const user = makeEscort({ daysSinceSignup: 30, profileViews7d: 50 });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.pricingPressure.discountOffered).toBe(0.20);
        });

        it("offers 0% discount at hard_gate (they have to pay)", () => {
            const user = makeEscort({
                daysSinceSignup: 30,
                profileViews7d: 90,
                missedOpportunities7d: 5,
            });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.pricingPressure.discountOffered).toBe(0);
        });

        it("shows urgency countdown only on aggressive + Tier-A", () => {
            const user = makeEscort({ daysSinceSignup: 30, profileViews7d: 90, countryCode: "US" });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.pricingPressure.urgencyCountdown).toBe(true);
        });

        it("does not show urgency countdown on aggressive + Tier-C", () => {
            const user = makeEscort({
                daysSinceSignup: 60,
                profileViews7d: 210,
                countryCode: "PL",
            });
            const result = FreemiumPressureEngine.computePressure(user, null);
            expect(result.pricingPressure.urgencyCountdown).toBe(false);
        });
    });
});

// ── AddictionLayerEngine ─────────────────────────────────────────────────────

describe("AddictionLayerEngine", () => {
    it("generateEconomicSignals returns empty array for zero-activity user", () => {
        const user = makeEscort({ profileViews7d: 0, searchAppearances7d: 0, missedOpportunities7d: 0 });
        const signals = AddictionLayerEngine.generateEconomicSignals(user);
        expect(signals).toHaveLength(0);
    });

    it("generates missed opportunity signal when missedOpportunities7d > 0", () => {
        const user = makeEscort({ missedOpportunities7d: 3 });
        const signals = AddictionLayerEngine.generateEconomicSignals(user);
        expect(signals.some(s => s.includes("missed"))).toBe(true);
    });

    it("shouldShowCompetitiveSurface requires trustScore > 0.4 and daysSinceSignup > 7", () => {
        expect(AddictionLayerEngine.shouldShowCompetitiveSurface(
            makeEscort({ trustScore: 0.5, daysSinceSignup: 14 })
        )).toBe(true);

        expect(AddictionLayerEngine.shouldShowCompetitiveSurface(
            makeEscort({ trustScore: 0.3, daysSinceSignup: 14 })
        )).toBe(false);

        expect(AddictionLayerEngine.shouldShowCompetitiveSurface(
            makeEscort({ trustScore: 0.7, daysSinceSignup: 3 })
        )).toBe(false);
    });

    it("shouldSendNotification blocks quiet hours (before 7 AM)", () => {
        const user = makeEscort({ notificationOpenRate: 0.5 });
        expect(AddictionLayerEngine.shouldSendNotification(user, "match", 5)).toBe(false);
    });

    it("shouldSendNotification blocks quiet hours (after 9 PM)", () => {
        const user = makeEscort({ notificationOpenRate: 0.5 });
        expect(AddictionLayerEngine.shouldSendNotification(user, "match", 22)).toBe(false);
    });

    it("shouldSendNotification blocks users with < 10% open rate", () => {
        const user = makeEscort({ notificationOpenRate: 0.05 });
        expect(AddictionLayerEngine.shouldSendNotification(user, "match", 12)).toBe(false);
    });

    it("allows missed_opportunity for users with >5% open rate during waking hours", () => {
        const user = makeEscort({ notificationOpenRate: 0.08 });
        expect(AddictionLayerEngine.shouldSendNotification(user, "missed_opportunity", 10)).toBe(true);
    });
});

// ── VirtuousCycleEngine ──────────────────────────────────────────────────────

describe("VirtuousCycleEngine.computeCycleStrength", () => {
    it("returns dormant for incomplete profile", () => {
        const user = makeEscort({ profileCompleteness: 0.3, trustScore: 0.5 });
        const result = VirtuousCycleEngine.computeCycleStrength(user);
        expect(result.cycleStage).toBe("dormant");
        expect(result.bottleneck).toBe("profile_completeness");
    });

    it("returns dormant for low trust score", () => {
        const user = makeEscort({ trustScore: 0.2, profileCompleteness: 0.9 });
        const result = VirtuousCycleEngine.computeCycleStrength(user);
        expect(result.cycleStage).toBe("dormant");
        expect(result.bottleneck).toBe("trust_score");
    });

    it("returns activating for user getting views but no revenue", () => {
        const user = makeEscort({ trustScore: 0.5, profileViews7d: 10, revenueGenerated: 0 });
        const result = VirtuousCycleEngine.computeCycleStrength(user);
        expect(result.cycleStage).toBe("activating");
        expect(result.bottleneck).toBe("conversion");
    });

    it("returns spinning for user with revenue flowing", () => {
        const user = makeEscort({ trustScore: 0.6, profileViews7d: 20, revenueGenerated: 100 });
        const result = VirtuousCycleEngine.computeCycleStrength(user);
        expect(result.cycleStage).toBe("spinning");
    });

    it("returns flywheel for top-tier operator", () => {
        const user = makeEscort({
            trustScore: 0.8,
            profileViews7d: 30,
            revenueGenerated: 1000,
            jobAcceptanceRate: 0.9,
        });
        const result = VirtuousCycleEngine.computeCycleStrength(user);
        expect(result.cycleStage).toBe("flywheel");
        expect(result.bottleneck).toBe("none");
    });
});
