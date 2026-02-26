export type PricingBenchmark = {
    service_key: string;
    region_key: string;
    unit: string;
    min_rate: number;
    max_rate: number;
    currency: string;
    notes?: string;
    tier_key?: string;
};

export type QuoteInput = {
    service_key: string;
    region_key: string;
    miles: number;
    days: number;
    addons: string[];
};

export function calculateRange(input: QuoteInput, benchmarks: PricingBenchmark[]) {
    // Filter benchmarks for selected service/region
    const serviceBenchmarks = benchmarks.filter(b => b.service_key === input.service_key && (b.region_key === input.region_key || b.region_key === "all"));

    let totalMin = 0;
    let totalMax = 0;
    const lineItems: any[] = [];

    // Core Service Calculation
    const perMile = serviceBenchmarks.find(b => b.unit === "per_mile");
    const dayRate = serviceBenchmarks.find(b => b.unit === "day_rate");
    const flat = serviceBenchmarks.find(b => b.unit === "flat");
    const minimum = serviceBenchmarks.find(b => b.unit === "minimum");

    // Logic: Use per_mile if available, else day_rate, else flat
    // This is a simplified logic based on the user's dataset structure

    if (perMile) {
        const costMin = perMile.min_rate * input.miles;
        const costMax = perMile.max_rate * input.miles;
        totalMin += costMin;
        totalMax += costMax;
        lineItems.push({ label: "Mileage Pay", unit: "per_mile", quantity: input.miles, min: costMin, max: costMax, rate: perMile });
    } else if (dayRate) {
        const costMin = dayRate.min_rate * input.days;
        const costMax = dayRate.max_rate * input.days;
        totalMin += costMin;
        totalMax += costMax;
        lineItems.push({ label: "Day Rate", unit: "day_rate", quantity: input.days, min: costMin, max: costMax, rate: dayRate });
    }

    // Check minimums
    if (minimum) {
        if (totalMin < minimum.min_rate) totalMin = minimum.min_rate;
        if (totalMax < minimum.max_rate) totalMax = minimum.max_rate; // questionable if max should be clamped by min, usually min just floors the low end
        // actually min usually implies "at least this amount". so max stays what it is unless it's also below min
        if (totalMax < minimum.min_rate) totalMax = minimum.min_rate;
    }

    // Addons
    for (const addonKey of input.addons) {
        const addonBench = benchmarks.filter(b => b.service_key === addonKey && (b.region_key === "all" || b.region_key === input.region_key));
        // Flatten addons: usually generic addons are per mile or flat
        for (const ab of addonBench) {
            let addedMin = 0;
            let addedMax = 0;
            if (ab.unit === "per_mile") {
                addedMin = ab.min_rate * input.miles;
                addedMax = ab.max_rate * input.miles;
            } else if (ab.unit === "flat") {
                addedMin = ab.min_rate;
                addedMax = ab.max_rate;
            } else if (ab.unit === "multiplier") {
                // complicated, skip for mvp or apply to clean total
                continue;
            }

            if (addedMin > 0) {
                totalMin += addedMin;
                totalMax += addedMax;
                lineItems.push({ label: ab.service_key, unit: ab.unit, min: addedMin, max: addedMax, rate: ab });
            }
        }
    }

    return { min: totalMin, max: totalMax, lineItems, currency: "USD" };
}
