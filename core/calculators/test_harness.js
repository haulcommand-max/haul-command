// 🏗️ STANDALONE VERIFICATION HARNESS
// Inlined RateEngineV2 logic to bypass module resolution issues

class RateEngineV2 {
    static CONFIG = {
        corridorConfidenceNoGo: 0.60,
        surgeCap: 2.5,
        riskCapPct: 0.25,
        hourlyDelayRate: 85.00
    };

    static GLOBAL_BASELINES = {
        pilot_car: { min: 145.00, perMile: 1.85, deadheadPerMile: 1.00 },
        high_pole: { min: 250.00, perMile: 2.50, deadheadPerMile: 1.50 },
        police: { min: 500.00, hourly: 95.00 }
    };

    static async calculate(request) {
        const decision = {
            finalRate: 0,
            currency: "USD",
            components: [],
            appliedRules: [],
            holds: [],
            explanation: ""
        };

        this.computeHolds(request, decision);
        let currentRate = this.computeBaseline(request, decision);
        currentRate = this.applyCorridorOverrides(request, decision, currentRate);
        currentRate = this.applySurge(request, decision, currentRate);
        currentRate = this.applyRiskPremium(request, decision, currentRate);
        currentRate = this.applyContractClamp(request, decision, currentRate);
        currentRate = this.applyManualOverride(request, decision, currentRate);

        decision.finalRate = parseFloat(currentRate.toFixed(2));
        decision.explanation = `Resolved final rate of ${decision.finalRate} ${decision.currency} via ${decision.appliedRules.filter(r => r.matched).length} rules. ${decision.holds.length > 0 ? 'WARNING: ACTIVE DISPATCH HOLDS.' : 'Ready for dispatch.'}`;

        return decision;
    }

    static computeHolds(request, d) {
        if (request.corridorConfidence < this.CONFIG.corridorConfidenceNoGo) {
            d.holds.push({ code: "NO_GO", reason: `Corridor Confidence (${request.corridorConfidence.toFixed(2)}) below safety threshold.` });
        }
        if (request.bridgeRisk && request.complexityScore > 0.8) {
            d.holds.push({ code: "REVIEW", reason: "High-risk superload on bridge-sensitive corridor requires engineering review." });
        }
    }

    static computeBaseline(request, d) {
        const base = this.GLOBAL_BASELINES[request.escortType] || this.GLOBAL_BASELINES.pilot_car;
        const baselineRate = Math.max(
            base.min,
            (request.milesLoaded * (base.perMile || 0)) + (request.milesDeadhead * (base.deadheadPerMile || 0))
        );
        d.components.push({ code: 'BASE', amount: baselineRate, reason: 'Global Baseline / Per-Mile Calculation', priority: 6 });
        d.appliedRules.push({ ruleId: 'rule-p6-global', name: 'Global Baseline', priority: 6, matched: true });
        return baselineRate;
    }

    static applyCorridorOverrides(request, d, current) {
        let corridorAdd = 0;
        if (request.detourMiles) {
            const detourCost = request.detourMiles * 1.85;
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
        if (corridorAdd > 0) d.appliedRules.push({ ruleId: 'rule-p3-corridor', name: 'Corridor Override', priority: 3, matched: true });
        return current + corridorAdd;
    }

    static applySurge(request, d, current) {
        if (request.surgeMultiplier && request.surgeMultiplier > 1.0) {
            const multiplier = Math.min(request.surgeMultiplier, this.CONFIG.surgeCap);
            const surged = (current * multiplier) - current;
            d.components.push({ code: 'SURGE', amount: surged, reason: `Capacity/Demand surge multiplier (x${multiplier})`, priority: 4 });
            d.appliedRules.push({ ruleId: 'rule-p4-surge', name: 'Surge Multiplier', priority: 4, matched: true });
            return current * multiplier;
        }
        return current;
    }

    static applyRiskPremium(request, d, current) {
        let riskAdd = 0;
        if (request.complexityScore > 0.5) {
            riskAdd = Math.min(this.CONFIG.riskCapPct * current, (request.complexityScore * 100) + (0.15 * current));
            d.components.push({ code: 'RISK', amount: riskAdd, reason: `Risk/Complexity premium for score ${request.complexityScore}`, priority: 5 });
            d.appliedRules.push({ ruleId: 'rule-p5-risk', name: 'Risk/Complexity Premium', priority: 5, matched: true });
        }
        return current + riskAdd;
    }

    static applyContractClamp(request, d, current) {
        if (request.clientContract) {
            const { floor, cap, fixedRate } = request.clientContract;
            if (fixedRate) {
                d.components.push({ code: 'CONTRACT_FIXED', amount: fixedRate - current, reason: 'Client Contract Fixed Rate Override', priority: 1 });
                d.appliedRules.push({ ruleId: 'rule-p1-contract', name: 'Client Contract (Fixed)', priority: 1, matched: true });
                return fixedRate;
            }
            if (floor && current < floor) {
                d.components.push({ code: 'CONTRACT_FLOOR', amount: floor - current, reason: 'Client Contract Rate Floor applied', priority: 1 });
                d.appliedRules.push({ ruleId: 'rule-p1-floor', name: 'Client Contract (Floor)', priority: 1, matched: true });
                return floor;
            }
            if (cap && current > cap) {
                d.components.push({ code: 'CONTRACT_CAP', amount: cap - current, reason: 'Client Contract Rate Ceiling applied', priority: 1 });
                d.appliedRules.push({ ruleId: 'rule-p1-cap', name: 'Client Contract (Cap)', priority: 1, matched: true });
                return cap;
            }
        }
        return current;
    }

    static applyManualOverride(request, d, current) {
        if (request.manualOverride) {
            d.components.push({ code: 'MANUAL', amount: request.manualOverride.amount - current, reason: request.manualOverride.reason, priority: 2 });
            d.appliedRules.push({ ruleId: 'rule-p2-manual', name: 'Manual Ops Override', priority: 2, matched: true });
            return request.manualOverride.amount;
        }
        return current;
    }
}

async function runTests() {
    console.log("🚀 Starting Standalone Rate Engine Verification...\n");
    const scenarios = [
        { name: "S1: Base Rate (100mi)", request: { milesLoaded: 100, milesDeadhead: 20, escortType: 'pilot_car', corridorConfidence: 1.0, bridgeRisk: false, complexityScore: 0.2 } },
        { name: "S2: P0 Hold (Low Confidence)", request: { milesLoaded: 100, milesDeadhead: 0, escortType: 'pilot_car', corridorConfidence: 0.45, bridgeRisk: false, complexityScore: 0.1 } },
        { name: "S3: Corridor Overrides", request: { milesLoaded: 50, milesDeadhead: 10, escortType: 'high_pole', corridorConfidence: 0.9, detourMiles: 15, delayHours: 2, bridgeRisk: false, complexityScore: 0.3 } },
        { name: "S4: Surge + Client Cap", request: { milesLoaded: 100, milesDeadhead: 0, escortType: 'pilot_car', corridorConfidence: 0.95, bridgeRisk: false, complexityScore: 0.1, surgeMultiplier: 2.0, clientContract: { cap: 250.00 } } }
    ];
    for (const s of scenarios) {
        console.log(`--- ${s.name} ---`);
        const result = await RateEngineV2.calculate(s.request);
        console.log(`Rate: ${result.finalRate} | Holds: ${result.holds.length} | Rules: ${result.appliedRules.filter(r => r.matched).length}`);
        if (result.holds.length > 0) console.log(`HOLD: ${result.holds[0].reason}`);
        console.log(`Explanation: ${result.explanation}\n`);
    }
}
runTests();
