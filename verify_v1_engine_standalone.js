
// Mock fs/path for standalone execution if needed, or just hardcode defaults
// Since we are running in a restricted env, let's hardcode the DEFAULTS which mirror the JSON provided.

const DEFAULTS = {
    pilot_car: {
        per_mile: {
            southeast: [1.65, 1.85],
            midwest: [1.75, 1.95],
            northeast: [1.80, 2.00],
            southwest: [1.85, 2.00],
            west_coast: [2.00, 2.25],
            canada: [2.25, 2.75]
        },
        day_rate: [450, 650]
    },
    bucket_truck: {
        per_mile: {
            southeast: [2.50, 3.00],
            midwest: [2.75, 3.25],
            northeast: [2.85, 3.50],
            southwest: [2.75, 3.25],
            west_coast: [3.00, 3.75],
            canada: [3.25, 4.00]
        },
        day_rate: [700, 1000],
        hourly: [150, 250]
    },
    police: {
        hourly: {
            southeast: [85, 125],
            midwest: [90, 135],
            northeast: [100, 150],
            southwest: [85, 130],
            west_coast: [110, 175],
            canada: [120, 180]
        },
        local: [50, 100]
    },
    survey: {
        daily: [650, 950],
        tiers: {
            "0_100": [2000, 3500],
            "101_300": [3500, 7500],
            "301_500": [7500, 12000],
            "500_plus": [12000, 25000]
        }
    },
    night_add: [0.50, 1.00],
    standby: [75, 125],
    fees: {
        urban: [100, 300],
        multi: [500, 1500],
        coord: [500, 1500]
    }
};

class EscortCostEstimator {
    static calculate(request) {
        const lines = {};
        let totalMin = 0;
        let totalMax = 0;

        // --- STEP A: Base Escort Cost ---

        const leads = request.positions.leadCount || 0;
        const chase = request.positions.chaseCount || 0;
        const poles = request.positions.highPoleCount || 0;
        const steers = request.positions.steerCount || 0;

        const units = leads + chase + (poles * 1.25) + (steers * 1.15);

        let baseLow = 0;
        let baseHigh = 0;

        const region = request.region || 'southeast';
        const rates = DEFAULTS; // Use defaults for standalone

        if (request.billingMode === 'day_rate') {
            const dayRange = rates.pilot_car.day_rate;
            const days = Math.ceil((request.miles || 450) / 450);
            baseLow = days * dayRange[0] * units;
            baseHigh = days * dayRange[1] * units;
        } else if (request.escortType === 'bucket_truck' && request.billingMode === 'hourly') {
            const bucketHourly = rates.bucket_truck.hourly;
            const hours = Math.max(request.standbyHours || 8, 8);
            baseLow = hours * bucketHourly[0] * units;
            baseHigh = hours * bucketHourly[1] * units;
        } else {
            const rateLookup = request.escortType === 'bucket_truck' ?
                (rates.bucket_truck.per_mile[region]) :
                (rates.pilot_car.per_mile[region]);

            baseLow = request.miles * rateLookup[0] * units;
            baseHigh = request.miles * rateLookup[1] * units;
        }

        // --- STEP C: Premiums (Apply to Base) ---
        if (request.afterHours) {
            baseLow *= 1.25;
            baseHigh *= 1.25;
        }

        if (request.weekend) {
            baseLow *= 1.10;
            baseHigh *= 1.50;
        }

        lines.baseEscort = { min: baseLow, max: baseHigh, breakdown: `Base (${units.toFixed(2)} units) + Multipliers` };
        totalMin += baseLow;
        totalMax += baseHigh;

        if (request.nightOps) {
            const nightAdd = rates.night_add;
            const nLow = request.miles * nightAdd[0] * units;
            const nHigh = request.miles * nightAdd[1] * units;
            lines.nightOps = { min: nLow, max: nHigh, breakdown: 'Night Ops Per-Mile Adder' };
            totalMin += nLow;
            totalMax += nHigh;
        }

        if (request.standbyHours && request.standbyHours > 0) {
            const standbyRate = rates.standby;
            const sLow = request.standbyHours * standbyRate[0];
            const sHigh = request.standbyHours * standbyRate[1];
            lines.standby = { min: sLow, max: sHigh, breakdown: 'Standby Hours' };
            totalMin += sLow;
            totalMax += sHigh;
        }

        let feeLow = 0;
        let feeHigh = 0;

        if (request.urbanCoordination) {
            feeLow += rates.fees.urban[0];
            feeHigh += rates.fees.urban[1];
        }
        if (request.multiAgency) {
            feeLow += rates.fees.multi[0];
            feeHigh += rates.fees.multi[1];
        }
        if (request.coordinationFee) {
            const cRate = rates.fees.coord;
            feeLow += cRate[0];
            feeHigh += cRate[1];
        }

        if (feeLow > 0) {
            lines.fees = { min: feeLow, max: feeHigh, breakdown: 'Coordination & Complexity Fees' };
            totalMin += feeLow;
            totalMax += feeHigh;
        }

        // --- STEP B: Add-ons ---
        if (request.policeRequired) {
            let pLow = 0;
            let pHigh = 0;
            const hours = request.policeHours || 4;

            if (request.policeMode === 'state_formula') {
                const formulaBase = (31 * hours) + (0.044 * request.miles);
                pLow = formulaBase;
                pHigh = formulaBase * 1.15;
            } else if (request.policeMode === 'local_range') {
                const localRate = rates.police.local;
                pLow = localRate[0] * hours;
                pHigh = localRate[1] * hours;
            } else {
                const regionRate = rates.police.hourly[region];
                pLow = regionRate[0] * hours;
                pHigh = regionRate[1] * hours;
            }

            lines.police = { min: pLow, max: pHigh, breakdown: `Police (${hours}h est)` };
            totalMin += pLow;
            totalMax += pHigh;
        }

        if (request.routeSurveyRequired) {
            let sLow = 0;
            let sHigh = 0;

            if (request.surveyMode === 'distance_tiers') {
                const tiers = rates.survey.tiers;
                let range = tiers['0_100'];
                if (request.miles > 500) range = tiers['500_plus'];
                else if (request.miles > 300) range = tiers['301_500'];
                else if (request.miles > 100) range = tiers['101_300'];

                sLow = range[0];
                sHigh = range[1];
            } else {
                const daily = rates.survey.daily;
                sLow = daily[0];
                sHigh = daily[1];
            }

            lines.survey = { min: sLow, max: sHigh, breakdown: 'Route Survey' };
            totalMin += sLow;
            totalMax += sHigh;
        }

        return {
            totalCost: { min: totalMin, max: totalMax },
            lineItems: lines,
            disclaimer: "Estimate range. Final depends on permit route & requirements."
        };
    }
}

class ConfidenceScorer {
    static calculate(req) {
        let score = 100;
        const suggestions = [];

        // --- Core Completeness ---
        if (!req.miles || req.miles <= 0) {
            score -= 15;
            suggestions.push("Add estimated miles");
        }

        let dimDeduction = 0;
        if (!req.width) dimDeduction += 10;
        if (!req.height) dimDeduction += 10;
        if (!req.length) dimDeduction += 10;
        dimDeduction = Math.min(dimDeduction, 30);
        score -= dimDeduction;
        if (dimDeduction > 0) suggestions.push("Add dimensions (W/H/L) for accurate sizing");

        if (!req.shipDate && !req.timeWindow) {
            score -= 10;
            suggestions.push("Add ship date or travel window");
        }

        const hasPositions = req.positions && (
            (req.positions.leadCount || 0) > 0 ||
            (req.positions.chaseCount || 0) > 0 ||
            (req.positions.highPoleCount || 0) > 0 ||
            (req.positions.steerCount || 0) > 0
        );
        if (!hasPositions) {
            score -= 15;
            suggestions.push("Confirm escort positions required");
        }

        // --- Risk Flags ---
        if (!req.permitRouteKnown) {
            score -= 10;
            suggestions.push("Upload permit route / permit number");
        }

        if (req.nightOps || req.weekend || req.afterHours) {
            if (!req.specialNotes || req.specialNotes.length < 5) {
                score -= 5;
                suggestions.push("Add notes for night/weekend travel");
            }
        }

        if (req.policeRequired && (!req.policeHours || req.policeHours <= 0)) {
            score -= 5;
            suggestions.push("Estimate police hours needed");
        }

        if (req.surveyRequired && !req.surveyMode) {
            score -= 5;
            suggestions.push("Select route survey method");
        }

        // --- Data Quality ---
        if (req.sourceState && (!req.originCity && !req.originZip)) {
            score -= 5;
        }

        if (req.sourceState && req.destState && req.sourceState !== req.destState) {
            if (req.miles && req.miles > 500 && (!req.destState)) {
                score -= 5;
                suggestions.push("Confirm destination state for long-haul");
            }
        }

        score = Math.max(15, Math.min(100, score));

        let label = 'Low';
        if (score >= 85) label = 'High';
        else if (score >= 65) label = 'Medium';

        return {
            score,
            label,
            suggestions: suggestions.slice(0, 3)
        };
    }
}

console.log("---------------------------------------------------------");
console.log("   HAUL COMMAND | CALCULATOR ENGINE V1 STANDALONE VERIFY");
console.log("---------------------------------------------------------\n");

// --- 1. Cost Estimator Tests ---
const reqA = {
    miles: 450,
    region: 'southeast',
    escortType: 'pilot_car',
    positions: { leadCount: 1, chaseCount: 1, highPoleCount: 0, steerCount: 0 },
    policeRequired: false,
    routeSurveyRequired: false
};

console.log("TEST A: Standard 450mi Southeast (2 Units)");
const resA = EscortCostEstimator.calculate(reqA);
console.log(JSON.stringify(resA, null, 2));


const reqB = {
    miles: 800,
    region: 'midwest',
    escortType: 'pilot_car',
    positions: { leadCount: 1, chaseCount: 1, highPoleCount: 1, steerCount: 0 },
    policeRequired: true,
    policeMode: 'state_formula',
    policeHours: 10,
    routeSurveyRequired: true,
    surveyMode: 'distance_tiers',
    weekend: true,
    nightOps: true
};

console.log("\nTEST B: Complex 800mi Midwest (3.25 Units, Police, Survey, Weekend, Night)");
const resB = EscortCostEstimator.calculate(reqB);
console.log(JSON.stringify(resB, null, 2));

// --- 2. Confidence Scorer Tests ---
console.log("\n--- Confidence Score Verification ---");

const confC = {
    permitRouteKnown: false
};
const scoreC = ConfidenceScorer.calculate(confC);
console.log("TEST C: Empty Request");
console.log(JSON.stringify(scoreC, null, 2));

const confD = {
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
console.log(JSON.stringify(scoreD, null, 2));
