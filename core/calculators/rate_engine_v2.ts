import { EscortCostEstimator } from './escort_cost_estimator';

// 🏗️ HAUL COMMAND OS: RATE ENGINE v2 (Control Tower Edition)
// Implements Skill: rate-override-matrix
// Resolves pricing when multiple signals conflict (Baseline vs Corridor vs Surge vs Risk vs Client)

export type EscortType = 'pilot_car' | 'high_pole' | 'steer' | 'tillerman' | 'bucket_truck' | 'police' | 'route_survey';

export type RateDecision = {
    finalRate: number;
    currency: "USD" | "CAD";
    components: Array<{ code: string; amount: number; reason: string; priority: number }>;
    appliedRules: Array<{ ruleId: string; name: string; priority: number; matched: boolean }>;
    holds: Array<{ code: "NO_GO" | "REVIEW" | "PERMIT_REQUIRED"; reason: string }>;
    explanation: string; // human readable
};

export interface RateRequest {
    milesLoaded: number;
    milesDeadhead: number;
    escortType: EscortType;
    originState: string;
    destState: string;

    // Corridor Data
    corridorTags?: string[];
    detourMiles?: number;
    delayHours?: number;
    curfewPenalty?: number;
    corridorConfidence: number; // 0.0 - 1.0

    // Risk Metrics
    bridgeRisk: boolean;
    enforcementRisk: boolean;
    complexityScore: number; // 0.0 - 1.0 (ex. Superload)

    // External Overrides
    surgeMultiplier?: number;
    clientContract?: {
        floor?: number;
        cap?: number;
        fixedRate?: number;
    };
    manualOverride?: {
        amount: number;
        reason: string;
        operatorId: string;
    };
}

export type RegionConfig = {
    corridorConfidenceNoGo: number; // ex 0.65
    surgeCap: number; // ex 2.5
    riskCapPct: number; // ex 0.25
    hourlyDelayRate: number; // ex $85/hr
};

export class RateEngineV2 {
    private static CONFIG: RegionConfig = {
        corridorConfidenceNoGo: 0.60,
        surgeCap: 2.5,
        riskCapPct: 0.25,
        hourlyDelayRate: 85.00
    };

    private static GLOBAL_BASELINES = {
        pilot_car: { min: 145.00, perMile: 1.85, deadheadPerMile: 1.00 },
        high_pole: { min: 250.00, perMile: 2.50, deadheadPerMile: 1.50 },
        police: { min: 500.00, hourly: 95.00 }
    };

    /**
     * Main Entry Point: Priority-Based Decision Pipeline
     */
    static async calculate(request: RateRequest): Promise<RateDecision> {
        const decision: RateDecision = {
            finalRate: 0,
            currency: "USD",
            components: [],
            appliedRules: [],
            holds: [],
            explanation: ""
        };

        // P0: Dispatch Holds (Safety First)
        this.computeHolds(request, decision);

        // P6: Baseline Calculation
        let currentRate = this.computeBaseline(request, decision);

        // P3: Corridor Overrides
        currentRate = this.applyCorridorOverrides(request, decision, currentRate);

        // P4: Surge Overrides
        currentRate = this.applySurge(request, decision, currentRate);

        // P5: Risk Premiums
        currentRate = this.applyRiskPremium(request, decision, currentRate);

        // P1: Client Contract Clamping
        currentRate = this.applyContractClamp(request, decision, currentRate);

        // P2: Manual Ops Override (Final Say)
        currentRate = this.applyManualOverride(request, decision, currentRate);

        decision.finalRate = parseFloat(currentRate.toFixed(2));

        // Final Explanation
        decision.explanation = `Resolved final rate of ${decision.finalRate} ${decision.currency} via ${decision.appliedRules.filter(r => r.matched).length} rules. ${decision.holds.length > 0 ? 'WARNING: ACTIVE DISPATCH HOLDS.' : 'Ready for dispatch.'}`;

        return decision;
    }

    private static computeHolds(request: RateRequest, d: RateDecision) {
        if (request.corridorConfidence < this.CONFIG.corridorConfidenceNoGo) {
            d.holds.push({ code: "NO_GO", reason: `Corridor Confidence (${request.corridorConfidence.toFixed(2)}) below safety threshold.` });
        }
        if (request.bridgeRisk && request.complexityScore > 0.8) {
            d.holds.push({ code: "REVIEW", reason: "High-risk superload on bridge-sensitive corridor requires engineering review." });
        }
    }

    private static computeBaseline(request: RateRequest, d: RateDecision): number {
        const base = this.GLOBAL_BASELINES[request.escortType as keyof typeof this.GLOBAL_BASELINES] || this.GLOBAL_BASELINES.pilot_car;

        const perMileRate = 'perMile' in base ? base.perMile : 0;
        const deadheadRate = 'deadheadPerMile' in base ? base.deadheadPerMile : 0;

        const baselineRate = Math.max(
            base.min,
            (request.milesLoaded * perMileRate) + (request.milesDeadhead * deadheadRate)
        );

        d.components.push({ code: 'BASE', amount: baselineRate, reason: 'Global Baseline / Per-Mile Calculation', priority: 6 });
        d.appliedRules.push({ ruleId: 'rule-p6-global', name: 'Global Baseline', priority: 6, matched: true });

        return baselineRate;
    }


    private static applyCorridorOverrides(request: RateRequest, d: RateDecision, current: number): number {
        let corridorAdd = 0;

        if (request.detourMiles) {
            const detourCost = request.detourMiles * 1.85; // Standard detour mile rate
            corridorAdd += detourCost;
            d.components.push({ code: 'DETOUR', amount: detourCost, reason: 'Detour mileage required by corridor restriction', priority: 3 });
        }

        if (request.delayHours) {
            const delayCost = request.delayHours * this.CONFIG.hourlyDelayRate;
            corridorAdd += delayCost;
            d.components.push({ code: 'DELAY', amount: delayCost, reason: 'Expected corridor congestion/delay', priority: 3 });
        }

        if (request.curfewPenalty) {
            corridorAdd += request.curfewPenalty;
            d.components.push({ code: 'CURFEW', amount: request.curfewPenalty, reason: 'Curfew window time-cost penalty', priority: 3 });
        }

        if (corridorAdd > 0) {
            d.appliedRules.push({ ruleId: 'rule-p3-corridor', name: 'Corridor Override', priority: 3, matched: true });
        }

        return current + corridorAdd;
    }

    private static applySurge(request: RateRequest, d: RateDecision, current: number): number {
        if (request.surgeMultiplier && request.surgeMultiplier > 1.0) {
            const multiplier = Math.min(request.surgeMultiplier, this.CONFIG.surgeCap);
            const surged = (current * multiplier) - current;

            d.components.push({ code: 'SURGE', amount: surged, reason: `Capacity/Demand surge multiplier (x${multiplier})`, priority: 4 });
            d.appliedRules.push({ ruleId: 'rule-p4-surge', name: 'Surge Multiplier', priority: 4, matched: true });

            return current * multiplier;
        }
        return current;
    }

    private static applyRiskPremium(request: RateRequest, d: RateDecision, current: number): number {
        let riskAdd = 0;

        if (request.complexityScore > 0.5) {
            const riskMultiplier = 0.15; // 15% risk premium for complex loads
            riskAdd = Math.min(
                this.CONFIG.riskCapPct * current,
                (request.complexityScore * 100) + (riskMultiplier * current)
            );

            d.components.push({ code: 'RISK', amount: riskAdd, reason: `Risk/Complexity premium for score ${request.complexityScore}`, priority: 5 });
            d.appliedRules.push({ ruleId: 'rule-p5-risk', name: 'Risk/Complexity Premium', priority: 5, matched: true });
        }

        return current + riskAdd;
    }

    private static applyContractClamp(request: RateRequest, d: RateDecision, current: number): number {
        if (request.clientContract) {
            const { floor, cap, fixedRate } = request.clientContract;

            if (fixedRate) {
                const diff = fixedRate - current;
                d.components.push({ code: 'CONTRACT_FIXED', amount: diff, reason: 'Client Contract Fixed Rate Override', priority: 1 });
                d.appliedRules.push({ ruleId: 'rule-p1-contract', name: 'Client Contract (Fixed)', priority: 1, matched: true });
                return fixedRate;
            }

            if (floor && current < floor) {
                const diff = floor - current;
                d.components.push({ code: 'CONTRACT_FLOOR', amount: diff, reason: 'Client Contract Rate Floor applied', priority: 1 });
                d.appliedRules.push({ ruleId: 'rule-p1-floor', name: 'Client Contract (Floor)', priority: 1, matched: true });
                return floor;
            }

            if (cap && current > cap) {
                const diff = cap - current;
                d.components.push({ code: 'CONTRACT_CAP', amount: diff, reason: 'Client Contract Rate Ceiling applied', priority: 1 });
                d.appliedRules.push({ ruleId: 'rule-p1-cap', name: 'Client Contract (Cap)', priority: 1, matched: true });
                return cap;
            }
        }
        return current;
    }

    private static applyManualOverride(request: RateRequest, d: RateDecision, current: number): number {
        if (request.manualOverride) {
            const diff = request.manualOverride.amount - current;
            d.components.push({
                code: 'MANUAL',
                amount: diff,
                reason: `Manual Override by ${request.manualOverride.operatorId}: ${request.manualOverride.reason}`,
                priority: 2
            });
            d.appliedRules.push({ ruleId: 'rule-p2-manual', name: 'Manual Ops Override', priority: 2, matched: true });
            return request.manualOverride.amount;
        }
        return current;
    }
}
