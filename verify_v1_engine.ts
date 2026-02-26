
import { EscortCostEstimator, EscortCostRequest } from './core/calculators/escort_cost_estimator.ts';
import { ConfidenceScorer, ConfidenceRequest } from './core/calculators/confidence_scorer.ts';

console.log("---------------------------------------------------------");
console.log("   HAUL COMMAND | CALCULATOR ENGINE V1 VERIFICATION");
console.log("---------------------------------------------------------\n");

// --- 1. Cost Estimator Tests ---

// Scenario A: Standard Southeast Run (1 Lead, 1 Chase)
const reqA: EscortCostRequest = {
    miles: 450,
    region: 'southeast',
    escortType: 'pilot_car',
    positions: { leadCount: 1, chaseCount: 1, highPoleCount: 0, steerCount: 0 },
    policeRequired: false,
    routeSurveyRequired: false
};

console.log("TEST A: Standard 450mi Southeast (2 Units)");
const resA = EscortCostEstimator.calculate(reqA);
console.log(`Cost: $${resA.totalCost.min} - $${resA.totalCost.max}`);
console.log("Expect Units=2. Base Rate SE [1.65, 1.85].");
console.log(`Calc Check Low: 450 * 1.65 * 2 = ${450 * 1.65 * 2}`);
console.log(`Calc Check High: 450 * 1.85 * 2 = ${450 * 1.85 * 2}`);
console.log("------------------");

// Scenario B: Complex Super Load (High Pole, Police, Weekend, Night)
const reqB: EscortCostRequest = {
    miles: 800,
    region: 'midwest',
    escortType: 'pilot_car',
    positions: { leadCount: 1, chaseCount: 1, highPoleCount: 1, steerCount: 0 }, // Units: 1+1+1.25 = 3.25
    policeRequired: true,
    policeMode: 'state_formula',
    policeHours: 10,
    routeSurveyRequired: true,
    surveyMode: 'distance_tiers', // > 500 tier
    weekend: true,
    nightOps: true
};

console.log("TEST B: Complex 800mi Midwest (3.25 Units, Police, Survey, Weekend, Night)");
const resB = EscortCostEstimator.calculate(reqB);
console.log(JSON.stringify(resB, null, 2));

// --- 2. Confidence Scorer Tests ---

console.log("\n---------------------------------------------------------");
console.log("   CONFIDENCE SCORE VERIFICATION");
console.log("---------------------------------------------------------");

// Scenario C: Empty/Poor Request
const confC: ConfidenceRequest = {
    permitRouteKnown: false
};
const scoreC = ConfidenceScorer.calculate(confC);
console.log("TEST C: Empty Request");
console.log(`Score: ${scoreC.score} (${scoreC.label})`);
console.log("Suggestions:", scoreC.suggestions);

// Scenario D: Strong Request
const confD: ConfidenceRequest = {
    miles: 500,
    width: 14, height: 15, length: 120,
    shipDate: "2026-03-01",
    positions: { leadCount: 2 },
    permitRouteKnown: true,
    originCity: "Atlanta", sourceState: "GA",
    destCity: "Miami", destState: "FL"
};
const scoreD = ConfidenceScorer.calculate(confD);
console.log("\nTEST D: Strong Request");
console.log(`Score: ${scoreD.score} (${scoreD.label})`);
console.log("Suggestions:", scoreD.suggestions);
