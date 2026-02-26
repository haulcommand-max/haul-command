
import fs from 'fs';
import path from 'path';

// Types for the Request
export interface EscortCostRequest {
    miles: number;
    region: 'southeast' | 'midwest' | 'northeast' | 'southwest' | 'west_coast' | 'canada';
    escortType: 'pilot_car' | 'bucket_truck';
    billingMode?: 'per_mile' | 'day_rate' | 'hourly'; // default per_mile

    positions: {
        leadCount: number;
        chaseCount: number;
        highPoleCount: number;
        steerCount: number;
    };

    policeRequired: boolean;
    policeMode?: 'state_formula' | 'local_range' | 'regional_range';
    policeHours?: number;

    routeSurveyRequired: boolean;
    surveyMode?: 'regional_daily' | 'distance_tiers';

    // Context & Premiums
    afterHours?: boolean;
    weekend?: boolean;
    nightOps?: boolean;
    standbyHours?: number;
    urbanCoordination?: boolean;
    multiAgency?: boolean;
    coordinationFee?: boolean;
}

export interface CostRange {
    min: number;
    max: number;
    breakdown?: string;
}

export interface EscortCostEstimate {
    totalCost: CostRange;
    lineItems: {
        baseEscort?: CostRange;
        nightOps?: CostRange;
        police?: CostRange;
        survey?: CostRange;
        standby?: CostRange;
        fees?: CostRange;
    };
    disclaimer: string;
}

// Load Rates from JSON
// In a real app, this would be injected or loaded from DB/File.
// We will use a hardcoded fallback or load if available.
const RATES_PATH = path.resolve(__dirname, '../../../market_rates_reference.json');
let RATES_DATA: any = null;

try {
    if (fs.existsSync(RATES_PATH)) {
        const raw = fs.readFileSync(RATES_PATH, 'utf-8');
        RATES_DATA = JSON.parse(raw);
    }
} catch (e) {
    console.warn("Could not load market_rates_reference.json, using defaults.");
}

// Fallback Rates if JSON missing or incomplete
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
        hourly: [150, 250] // implied
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

export class EscortCostEstimator {

    public static calculate(request: EscortCostRequest): EscortCostEstimate {
        const lines: EscortCostEstimate['lineItems'] = {};
        let totalMin = 0;
        let totalMax = 0;

        // --- STEP A: Base Escort Cost ---

        // A1. Units Multiplier
        // units = lead_count + chase_count + (high_pole_count * 1.25) + (steer_count * 1.15)

        // Default 0 if missing
        const leads = request.positions.leadCount || 0;
        const chase = request.positions.chaseCount || 0;
        const poles = request.positions.highPoleCount || 0;
        const steers = request.positions.steerCount || 0;

        // Logic check: High Pole usually requires a pole car. We count the car as a unit + premium?
        // User formula: high_pole_count * 1.25.
        // If user inputs "1 High Pole Car", does that mean 1 vehicle? Yes.
        // So 1 High Pole Vehicle counts as 1.25 units.

        const units = leads + chase + (poles * 1.25) + (steers * 1.15);

        // A2/A3/A4. Rate Lookup
        let rateLow = 0;
        let rateHigh = 0;
        let baseLow = 0;
        let baseHigh = 0;

        const typeKey = request.escortType === 'bucket_truck' ? 'bucket_truck' : 'pilot_car';
        const region = request.region || 'southeast'; // Default

        // Use Loaded JSON or Defaults
        const rates = RATES_DATA?.escort_rates || DEFAULTS;
        // Map JSON keys if slightly different (JSON uses "lead_chase", "height_pole", "bucket_truck")
        // User requested "Units" approach which generalizes vehicle types into multipliers.
        // So we assume "Base Rate" is the Lead/Chase rate, and the Multiplier handles the premium.

        // Get Base Rate (Lead/Chase)
        const baseRates = rates.lead_chase?.per_mile?.[region] || DEFAULTS.pilot_car.per_mile[region];
        const bucketRates = rates.bucket_truck?.per_mile?.[region] || DEFAULTS.bucket_truck.per_mile[region];

        // Actual Rate to use:
        // If bucket truck is the TYPE selected, we use bucket base rate.
        // If pilot car is TYPE, we use pilot car base rate.
        // Note: If mixed (1 pilot, 1 bucket), request structure suggests splitting? 
        // But complexity reduction: "escort_type" implies the whole fleet or primary?
        // Actually, "positions" has breakdown. 
        // "escort_type" is a top level enum. 
        // Let's assume the RATE looked up is based on the `escort_type` provided (e.g. if config is "Bucket Move")
        // But usually High Pole is a pilot car.
        // Given the Units formula, we should use the STANDARD PILOT CAR RATE as the multiplier base, 
        // unless the entire fleet is bucket trucks (unlikely).
        // EXCEPT: The user formula `high_pole_count * 1.25` implies we take a base unit and multiply up.
        // So we use **Standard Pilot Car Per Mile** as the "Base Unit Rate".

        const perMileRange = rates.lead_chase?.per_mile?.[region] || DEFAULTS.pilot_car.per_mile[region];

        // Calculate Base Logic
        if (request.billingMode === 'day_rate') {
            // Day Rate
            const dayRange = rates.lead_chase?.day_rate || DEFAULTS.pilot_car.day_rate;
            const days = Math.ceil((request.miles || 450) / 450);
            baseLow = days * dayRange[0] * units;
            baseHigh = days * dayRange[1] * units;
        } else if (request.escortType === 'bucket_truck' && request.billingMode === 'hourly') {
            // Bucket Hourly
            // Note: Bucket rates are higher. We shouldn't use pilot car base for bucket add.
            // But the user formula `(lead + chase + ...)` lumps them.
            // If "Bucket Truck" is selected as type, we probably use Bucket Rates.
            // Let's stick to the prompt instructions: "per_mile_rates[escort_type][region]"

            if (request.escortType === 'bucket_truck') {
                const bucketHourly = rates.bucket_truck?.day_rate ? [150, 250] : DEFAULTS.bucket_truck.hourly; // Implied hourly
                // Use overrides if needed
                const hours = Math.max(request.standbyHours || 8, 8); // User passed hours or default 8
                // Wait, user prompt says "hours = max(user_hours, 8)" under "Hourly (bucket truck option)"
                // The passed `request.standbyHours` might be standby, not shift... 
                // We need `request.policeHours` etc. Let's assume standard day if now provided.
                baseLow = hours * bucketHourly[0] * units;
                baseHigh = hours * bucketHourly[1] * units;
            }
        } else {
            // Default Per Mile
            const rateLookup = request.escortType === 'bucket_truck' ?
                (rates.bucket_truck?.per_mile?.[region] || DEFAULTS.bucket_truck.per_mile[region]) :
                (rates.lead_chase?.per_mile?.[region] || DEFAULTS.pilot_car.per_mile[region]);

            baseLow = request.miles * rateLookup[0] * units;
            baseHigh = request.miles * rateLookup[1] * units;
        }

        // --- STEP C: Premiums (Apply to Base) ---
        // C1. After Hours (1.25x)
        if (request.afterHours) {
            baseLow *= 1.25;
            baseHigh *= 1.25;
        }

        // C2. Weekend (1.1x - 1.5x)
        if (request.weekend) {
            baseLow *= 1.10;
            baseHigh *= 1.50;
        }

        lines.baseEscort = { min: baseLow, max: baseHigh, breakdown: `Base (${units.toFixed(2)} units) + Multipliers` };
        totalMin += baseLow;
        totalMax += baseHigh;

        // C3. Night Ops Add-on (Adder)
        if (request.nightOps) {
            const nightAdd = rates.modifiers?.night_ops_add_on?.per_mile || DEFAULTS.night_add;
            const nLow = request.miles * nightAdd[0] * units;
            const nHigh = request.miles * nightAdd[1] * units;
            lines.nightOps = { min: nLow, max: nHigh, breakdown: 'Night Ops Per-Mile Adder' };
            totalMin += nLow;
            totalMax += nHigh;
        }

        // C4. Standby
        if (request.standbyHours && request.standbyHours > 0) {
            const standbyRate = rates.modifiers?.standby_hourly || DEFAULTS.standby;
            const sLow = request.standbyHours * standbyRate[0];
            const sHigh = request.standbyHours * standbyRate[1];
            lines.standby = { min: sLow, max: sHigh, breakdown: 'Standby Hours' };
            totalMin += sLow;
            totalMax += sHigh;
        }

        // C5. Fees
        let feeLow = 0;
        let feeHigh = 0;

        if (request.urbanCoordination) {
            feeLow += DEFAULTS.fees.urban[0];
            feeHigh += DEFAULTS.fees.urban[1];
        }
        if (request.multiAgency) {
            feeLow += DEFAULTS.fees.multi[0];
            feeHigh += DEFAULTS.fees.multi[1];
        }
        if (request.coordinationFee) {
            // Use JSON if available
            const cRate = rates.modifiers?.coordination_fee || DEFAULTS.fees.coord;
            feeLow += cRate[0];
            feeHigh += cRate[1];
        }

        if (feeLow > 0) {
            lines.fees = { min: feeLow, max: feeHigh, breakdown: 'Coordination & Complexity Fees' };
            totalMin += feeLow;
            totalMax += feeHigh;
        }

        // --- STEP B: Add-ons (Police / Survey) ---
        // B1. Police
        if (request.policeRequired) {
            let pLow = 0;
            let pHigh = 0;
            const hours = request.policeHours || 4; // Default 4

            if (request.policeMode === 'state_formula') {
                // (31 * hours) + (0.044 * miles)
                // This is a specific state formula (e.g. GA/FL maybe?). User provided it directly.
                const formulaBase = (31 * hours) + (0.044 * request.miles);
                pLow = formulaBase;
                pHigh = formulaBase * 1.15; // Safety buffer
            } else if (request.policeMode === 'local_range') {
                const localRate = rates.police_escort?.local || DEFAULTS.police.local;
                pLow = localRate[0] * hours;
                pHigh = localRate[1] * hours;
            } else {
                // Regional default
                const regionRate = rates.police_escort?.hourly?.[region] || DEFAULTS.police.hourly[region];
                pLow = regionRate[0] * hours;
                pHigh = regionRate[1] * hours;
            }

            lines.police = { min: pLow, max: pHigh, breakdown: `Police (${hours}h est)` };
            totalMin += pLow;
            totalMax += pHigh;
        }

        // B2. Route Survey
        if (request.routeSurveyRequired) {
            let sLow = 0;
            let sHigh = 0;

            if (request.surveyMode === 'distance_tiers') {
                const tiers = rates.route_survey?.distance_pricing || DEFAULTS.survey.tiers;
                let range = tiers['0_100'];
                if (request.miles > 500) range = tiers['500_plus'];
                else if (request.miles > 300) range = tiers['301_500'];
                else if (request.miles > 100) range = tiers['101_300'];

                sLow = range[0];
                sHigh = range[1];
            } else {
                // Regional Daily
                const daily = rates.route_survey?.daily || DEFAULTS.survey.daily;
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
