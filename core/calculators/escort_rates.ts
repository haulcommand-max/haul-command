
/**
 * Escort Cost Estimator Logic
 * 
 * Formula:
 * - Base Rate per Mile (Dynamic by State)
 * - Deadhead / Repositioning Fee (if applicable)
 * - Per Diem (Overnight stay if miles > 450)
 * - High Pole Surcharge
 */

interface EscortInput {
    originState: string;
    destState: string;
    miles: number;
    highPole: boolean;
    nights: number; // Optional, or calculated
}

// Simple mock averages for now. Real system would pull from DB.
const STATE_RATES: Record<string, number> = {
    'FL': 1.95,
    'TX': 2.10,
    'CA': 2.35,
    'GA': 2.00,
    'default': 2.05
};

export function calculateEscortCost(input: EscortInput) {
    const rateOrigin = STATE_RATES[input.originState] || STATE_RATES['default'];
    // const rateDest = STATE_RATES[input.destState] || STATE_RATES['default']; // simplified

    let baseRate = rateOrigin;

    if (input.highPole) {
        baseRate += 0.25; // Surcharge per mile
    }

    const lineHaul = input.miles * baseRate;

    // Per Diem Logic (Drivers need sleep)
    // Assuming 500 miles max per day
    const days = Math.ceil(input.miles / 450);
    const perDiemTotal = (days - 1) * 150; // $150/night for hotels/food involved

    const totalEstimate = lineHaul + perDiemTotal;

    // Range Confidence (+/- 10%)
    const min = totalEstimate * 0.9;
    const max = totalEstimate * 1.1;

    return {
        estimatedCost: Math.round(totalEstimate),
        range: {
            min: Math.round(min),
            max: Math.round(max)
        },
        breakdown: {
            days,
            perDiemTotal,
            baseRate,
            lineHaul: Math.round(lineHaul)
        }
    };
}
