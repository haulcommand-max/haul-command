
// core/calculators/escort_cost_estimator.ts (Re-exporting for UI)
// This file is a placeholder to ensure the UI can import the logic.
// In a real app, we would copy the logic from C:\Users\PC User\Biz\core\calculators\escort_cost_estimator.ts
// to components/calculators/logic/escort_cost_estimator.ts

// Copied logic from verified artifact for frontend usage
export interface EscortCostRequest {
    miles: number;
    region: 'southeast' | 'midwest' | 'northeast' | 'southwest' | 'west_coast' | 'canada';
    escortType: 'pilot_car' | 'bucket_truck';
    billingMode?: 'per_mile' | 'day_rate' | 'hourly';
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

export class EscortCostEstimator {
    public static calculate(request: EscortCostRequest): EscortCostEstimate {
        const lines: EscortCostEstimate['lineItems'] = {};
        let totalMin = 0;
        let totalMax = 0;
        const leads = request.positions.leadCount || 0;
        const chase = request.positions.chaseCount || 0;
        const poles = request.positions.highPoleCount || 0;
        const steers = request.positions.steerCount || 0;
        const units = leads + chase + (poles * 1.25) + (steers * 1.15);

        let baseLow = 0;
        let baseHigh = 0;
        const region = request.region || 'southeast';
        const rates = DEFAULTS;

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

        if (request.afterHours) { baseLow *= 1.25; baseHigh *= 1.25; }
        if (request.weekend) { baseLow *= 1.10; baseHigh *= 1.50; }

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
        if (request.urbanCoordination) { feeLow += rates.fees.urban[0]; feeHigh += rates.fees.urban[1]; }
        if (request.multiAgency) { feeLow += rates.fees.multi[0]; feeHigh += rates.fees.multi[1]; }
        if (request.coordinationFee) { const cRate = rates.fees.coord; feeLow += cRate[0]; feeHigh += cRate[1]; }

        if (feeLow > 0) {
            lines.fees = { min: feeLow, max: feeHigh, breakdown: 'Fees' };
            totalMin += feeLow;
            totalMax += feeHigh;
        }

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
            lines.police = { min: pLow, max: pHigh, breakdown: `Police (${hours}h)` };
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
