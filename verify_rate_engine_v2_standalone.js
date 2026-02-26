// 🧪 VERIFY RATE ENGINE V2 (Standalone)
// Includes the logic class directly to ensure easy execution

class RateEngineV2 {
    // Global Baseline (Fallback)
    static GLOBAL_BASELINE = {
        pilot_car: { min: 1.85, max: 2.25 },
        high_pole: { min: 2.25, max: 2.75 },
        bucket_truck: { min: 3500, max: 5500 }, // Flat
        police: { min: 85, max: 135 }, // Hourly
        route_survey: { min: 1.50, max: 2.50 } // Per mile
    };

    /**
     * Main Calculation Entry Point
     */
    static async calculate(request) {
        const trace = [];

        // 1. Fetch Overrides (Simulated DB Call)
        const overrides = await this.fetchOverrides(request);

        // 2. Resolve Base Rate (Winner Takes All)
        let baseRate = this.resolveBaseRate(request, overrides, trace);

        // 3. Apply Multipliers (Seasonal / Emergency)
        baseRate = this.applyMultipliers(baseRate, overrides, trace);

        return {
            min: parseFloat(baseRate.min.toFixed(2)),
            max: parseFloat(baseRate.max.toFixed(2)),
            applied_overrides: trace,
            base_rate_source: trace[0] || 'Global Baseline',
            currency: 'USD'
        };
    }

    static resolveBaseRate(request, overrides, trace) {
        // Filter for Base Rate Setters (Not Multipliers)
        const candidates = overrides.filter(o =>
            ['corridor', 'state'].includes(o.scope_type) &&
            ['per_mile', 'hourly', 'daily', 'flat_add'].includes(o.rate_type)
        );

        // Sort by Priority (High > Low)
        candidates.sort((a, b) => b.priority - a.priority);

        if (candidates.length > 0) {
            const winner = candidates[0];
            trace.push(`Winner: ${winner.scope_type.toUpperCase()} (${winner.scope_value}) - Priority ${winner.priority}`);
            return { min: winner.low_value, max: winner.high_value };
        }

        // Fallback to Global
        trace.push('Global Baseline Applied');
        const global = this.GLOBAL_BASELINE[request.escort_type] || { min: 0, max: 0 };
        return { min: global.min, max: global.max };
    }

    static applyMultipliers(base, overrides, trace) {
        let { min, max } = base;

        // Filter for Multipliers (Seasonal, Emergency)
        const multipliers = overrides.filter(o =>
            ['seasonal', 'emergency'].includes(o.scope_type) &&
            o.rate_type === 'multiplier'
        );

        for (const m of multipliers) {
            min *= m.low_value;
            max *= m.high_value;
            trace.push(`Multiplier: ${m.scope_type.toUpperCase()} (${m.scope_value}) [x${m.low_value}-x${m.high_value}]`);
        }

        return { min, max };
    }

    // --- Mock Data Layer ---
    static async fetchOverrides(request) {
        // Mock DB
        const mockDB = [
            // Example: Florida Override
            {
                id: '1',
                scope_type: 'state',
                scope_value: 'FL',
                escort_type: 'pilot_car',
                rate_type: 'per_mile',
                low_value: 1.95,
                high_value: 2.45,
                priority: 10,
                active: true
            },
            // Example: GA Construction Corridor
            {
                id: '2',
                scope_type: 'corridor',
                scope_value: 'I-75_GA',
                escort_type: 'pilot_car',
                rate_type: 'per_mile',
                low_value: 2.50,
                high_value: 3.00,
                priority: 20, // Wins over State
                active: true
            },
            // Example: Hurricane Season
            {
                id: '3',
                scope_type: 'seasonal',
                scope_value: 'HURRICANE_SEASON',
                escort_type: 'pilot_car',
                rate_type: 'multiplier',
                low_value: 1.10,
                high_value: 1.20,
                priority: 5,
                active: true
            }
        ];

        return mockDB.filter(o => {
            if (!o.active) return false;
            if (o.escort_type !== request.escort_type) return false;

            // Match Override Scope
            if (o.scope_type === 'state') return o.scope_value === request.origin_state;
            if (o.scope_type === 'corridor') return request.corridor_tags?.includes(o.scope_value);
            if (o.scope_type === 'seasonal') return request.date_season === 'hurricane'; // Simplified logic

            return false;
        });
    }
}

// --- RUN TESTS ---
async function runTests() {
    console.log("🚦 STARTING RATE ENGINE V2 VERIFICATION\n");

    // TEST 1: Global Baseline
    console.log("--- TEST 1: Global Baseline (AL -> MS) ---");
    const result1 = await RateEngineV2.calculate({
        origin_state: 'AL',
        dest_state: 'MS',
        escort_type: 'pilot_car',
        date: new Date(),
        miles: 100
    });
    console.log(`Result: $${result1.min} - $${result1.max} / mi`);
    console.log("Trace:", result1.applied_overrides);
    console.log(result1.base_rate_source === 'Global Baseline Applied' ? "✅ PASS" : "❌ FAIL");
    console.log("");

    // TEST 2: State Override (FL)
    console.log("--- TEST 2: State Override (FL -> GA) ---");
    const result2 = await RateEngineV2.calculate({
        origin_state: 'FL',
        dest_state: 'GA',
        escort_type: 'pilot_car',
        date: new Date(),
        miles: 100
    });
    console.log(`Result: $${result2.min} - $${result2.max} / mi`);
    console.log("Trace:", result2.applied_overrides);
    console.log(result2.applied_overrides[0].includes('STATE (FL)') ? "✅ PASS" : "❌ FAIL");
    console.log("");

    // TEST 3: Corridor Override (I-75 GA beats Global/State)
    console.log("--- TEST 3: Corridor Priority (I-75 GA) ---");
    const result3 = await RateEngineV2.calculate({
        origin_state: 'GA',
        dest_state: 'TN',
        corridor_tags: ['I-75_GA'],
        escort_type: 'pilot_car',
        date: new Date(),
        miles: 100
    });
    console.log(`Result: $${result3.min} - $${result3.max} / mi`);
    console.log("Trace:", result3.applied_overrides);
    console.log(result3.applied_overrides[0].includes('CORRIDOR (I-75_GA)') ? "✅ PASS" : "❌ FAIL");
    console.log("");

    // TEST 4: Seasonal Multiplier (Hurricane Season)
    console.log("--- TEST 4: Seasonal Multiplier (Hurricane Season) on top of State ---");
    const result4 = await RateEngineV2.calculate({
        origin_state: 'FL',
        dest_state: 'GA',
        escort_type: 'pilot_car',
        date_season: 'hurricane', // Mock property
        miles: 100
    });
    console.log(`Result: $${result4.min} - $${result4.max} / mi`);
    console.log("Expected Approx: 2.14 - 2.94");
    console.log("Trace:", result4.applied_overrides);
    console.log(result4.applied_overrides.length === 2 ? "✅ PASS" : "❌ FAIL");
    console.log("");
}

runTests();
