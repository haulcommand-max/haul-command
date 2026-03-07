// ══════════════════════════════════════════════════════════════
// SEASONAL DEMAND PREDICTOR
// 10x Move #3: Predict escort demand 30-90 days out
//
// WHY 10x: If Haul Command can tell escorts "October is
//          wind turbine season in Texas — position there
//          for 3x rates" and tell brokers "Q2 construction
//          boom in Florida means book escorts 2 weeks early"
//          → that's enterprise intelligence nobody else has.
//          Also: seasonal pages = evergreen SEO content.
// ══════════════════════════════════════════════════════════════

export interface SeasonalDemandSignal {
    signalId: string;
    industry: string;
    loadTypes: string[];
    peakMonths: number[]; // 1-12
    rampUpWeeks: number; // how many weeks before peak demand rises
    countries: string[];
    states?: string[]; // US-specific
    corridors: string[]; // e.g. "Houston → Permian Basin"
    demandMultiplier: number; // 1.0 = normal, 3.0 = 3x demand
    rateImpact: "premium_surge" | "above_average" | "normal" | "below_average";
    escortShortageRisk: "high" | "medium" | "low";
    description: string;
}

export const SEASONAL_DEMAND_SIGNALS: SeasonalDemandSignal[] = [
    // ═══ ENERGY ═══
    {
        signalId: "wind-turbine-season-us",
        industry: "Wind Energy",
        loadTypes: ["wind_turbine_blade", "nacelle", "tower_section", "generator"],
        peakMonths: [3, 4, 5, 9, 10, 11],
        rampUpWeeks: 4,
        countries: ["US"],
        states: ["TX", "IA", "OK", "KS", "IL", "MN", "CO", "IN", "ND", "OR"],
        corridors: ["Houston → Amarillo", "Duluth → Des Moines", "Oklahoma City → Dodge City", "Portland → Eastern OR wind farms"],
        demandMultiplier: 3.0,
        rateImpact: "premium_surge",
        escortShortageRisk: "high",
        description: "Wind farm construction peaks in spring and fall. Blade transports require 2 escorts minimum due to extreme length (60-80m). Certified operators in wind corridors command premium rates.",
    },
    {
        signalId: "wind-turbine-season-de",
        industry: "Wind Energy",
        loadTypes: ["wind_turbine_blade", "nacelle", "tower_section"],
        peakMonths: [4, 5, 6, 9, 10],
        rampUpWeeks: 6,
        countries: ["DE", "NL", "DK"],
        corridors: ["Hamburg → Schleswig-Holstein", "Bremen → Niedersachsen", "Rotterdam → North Sea coast"],
        demandMultiplier: 2.5,
        rateImpact: "premium_surge",
        escortShortageRisk: "high",
        description: "European wind farm construction peaks spring through fall. BF4 escorts required for blade transports. Night moves mandated. Certified BF4 operators are scarce.",
    },
    {
        signalId: "solar-panel-season",
        industry: "Solar Energy",
        loadTypes: ["transformer", "solar_inverter", "substation_components"],
        peakMonths: [2, 3, 4, 5, 10, 11],
        rampUpWeeks: 3,
        countries: ["US", "AU"],
        states: ["CA", "TX", "FL", "AZ", "NV", "NC"],
        corridors: ["Phoenix → Mojave", "Houston → West TX solar belt", "Brisbane → QLD solar farms"],
        demandMultiplier: 2.0,
        rateImpact: "above_average",
        escortShortageRisk: "medium",
        description: "Solar farm installations ramp up before summer. Transformer deliveries are the primary oversize loads. Rural coverage critical.",
    },
    {
        signalId: "oil-gas-season",
        industry: "Oil & Gas",
        loadTypes: ["drilling_rig", "compressor", "pressure_vessel", "pipeline_section", "frac_equipment"],
        peakMonths: [1, 2, 3, 4, 5, 9, 10, 11, 12],
        rampUpWeeks: 2,
        countries: ["US", "CA", "SA", "AE", "QA"],
        states: ["TX", "ND", "OK", "NM", "PA", "WV", "CO", "WY"],
        corridors: ["Houston → Permian Basin", "Cushing → Bakken", "Edmonton → Fort McMurray", "Dammam → Riyadh"],
        demandMultiplier: 2.5,
        rateImpact: "premium_surge",
        escortShortageRisk: "high",
        description: "Oil & gas activity drives year-round oversize demand. Rig moves are frequent and time-sensitive. Winter operations in northern states face escort shortages.",
    },

    // ═══ CONSTRUCTION ═══
    {
        signalId: "construction-boom-us",
        industry: "Construction",
        loadTypes: ["crane_sections", "precast_concrete", "steel_beams", "modular_buildings", "bridge_girders"],
        peakMonths: [3, 4, 5, 6, 7, 8, 9, 10],
        rampUpWeeks: 3,
        countries: ["US", "CA"],
        states: ["TX", "FL", "CA", "WA", "GA", "NC", "AZ", "CO"],
        corridors: ["Nationwide — follows infrastructure spending", "Sun Belt states see sustained demand"],
        demandMultiplier: 1.8,
        rateImpact: "above_average",
        escortShortageRisk: "medium",
        description: "Construction season drives steady escort demand. Bridge and highway projects create oversize transport needs. Demand correlates with federal infrastructure spending.",
    },
    {
        signalId: "construction-season-eu",
        industry: "Construction",
        loadTypes: ["crane_sections", "precast_concrete", "steel_structures", "modular_units"],
        peakMonths: [4, 5, 6, 7, 8, 9],
        rampUpWeeks: 4,
        countries: ["DE", "FR", "NL", "BE", "AT", "CH", "SE", "NO"],
        corridors: ["Rhine corridor", "Benelux construction zones", "Nordic infrastructure projects"],
        demandMultiplier: 1.5,
        rateImpact: "above_average",
        escortShortageRisk: "medium",
        description: "European construction peaks spring through early fall. Major infrastructure projects in Germany and Scandinavia drive demand. BF3 escorts needed.",
    },

    // ═══ AGRICULTURE ═══
    {
        signalId: "harvest-equipment-us",
        industry: "Agriculture",
        loadTypes: ["combine_harvester", "grain_head", "cotton_picker", "planter"],
        peakMonths: [3, 4, 5, 9, 10, 11],
        rampUpWeeks: 2,
        countries: ["US", "CA", "AU", "BR", "AR"],
        states: ["KS", "NE", "IA", "MN", "SD", "ND", "TX", "IL", "IN", "OH"],
        corridors: ["Great Plains north-south corridor: TX → ND", "Midwest grain belt"],
        demandMultiplier: 2.0,
        rateImpact: "above_average",
        escortShortageRisk: "medium",
        description: "Custom harvesters move equipment north following the wheat harvest (April-November). Combines and headers are oversize loads requiring escorts. Predictable seasonal migration.",
    },

    // ═══ MINING ═══
    {
        signalId: "mining-equipment",
        industry: "Mining",
        loadTypes: ["haul_truck", "excavator", "crusher", "dragline_components", "mill_components"],
        peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // year-round
        rampUpWeeks: 2,
        countries: ["AU", "ZA", "BR", "CL", "PE", "CA"],
        corridors: ["Perth → Pilbara", "Johannesburg → Mpumalanga", "Santiago → Atacama", "Edmonton → Northern AB mines"],
        demandMultiplier: 2.0,
        rateImpact: "premium_surge",
        escortShortageRisk: "high",
        description: "Mining equipment moves are year-round but spike with new mine development. Remote locations mean escort availability is critical. Cat 797 haul trucks are among the widest loads moved.",
    },

    // ═══ MARINE / PORT ═══
    {
        signalId: "port-heavy-lift-season",
        industry: "Marine & Port",
        loadTypes: ["ship_components", "offshore_platform_modules", "LNG_equipment", "port_crane"],
        peakMonths: [3, 4, 5, 6, 9, 10, 11],
        rampUpWeeks: 6,
        countries: ["US", "GB", "NL", "NO", "AE", "SG", "KR", "JP"],
        corridors: ["Houston Ship Channel → inland", "Rotterdam → Ruhr", "Aberdeen → North Sea bases", "Singapore → industrial zones"],
        demandMultiplier: 2.5,
        rateImpact: "premium_surge",
        escortShortageRisk: "medium",
        description: "Heavy-lift season for offshore and marine projects. Port-to-site moves are complex, short-distance but extremely wide/heavy. Police escorts often required.",
    },

    // ═══ MANUFACTURED HOUSING / MODULAR ═══
    {
        signalId: "modular-housing-us",
        industry: "Manufactured Housing",
        loadTypes: ["manufactured_home", "modular_building_section", "tiny_house"],
        peakMonths: [3, 4, 5, 6, 7, 8, 9, 10],
        rampUpWeeks: 2,
        countries: ["US"],
        states: ["TX", "AL", "IN", "PA", "GA", "NC", "SC", "TN"],
        corridors: ["Factory to site — typically 200-500 mile radius", "Southeast US dominates manufactured housing"],
        demandMultiplier: 1.5,
        rateImpact: "normal",
        escortShortageRisk: "low",
        description: "Manufactured home deliveries are steady spring through fall. Single-wides are at the escort threshold; double-wides always need escorts. High-volume, predictable demand.",
    },
];

// ── Demand Prediction Engine ──

export interface DemandForecast {
    month: number;
    year: number;
    country: string;
    state?: string;
    predictedDemandLevel: "surge" | "high" | "normal" | "low";
    activeSignals: string[];
    topLoadTypes: string[];
    topCorridors: string[];
    rateAdvice: string;
    escortAdvice: string;
}

export function forecastDemand(
    month: number,
    country: string,
    state?: string
): DemandForecast {
    const activeSignals = SEASONAL_DEMAND_SIGNALS.filter(s => {
        if (!s.countries.includes(country)) return false;
        if (state && s.states && !s.states.includes(state)) return false;
        // Check if this month is in peak or ramp-up
        const rampStartMonth = s.peakMonths.map(m => (m - Math.ceil(s.rampUpWeeks / 4) + 12 - 1) % 12 + 1);
        return s.peakMonths.includes(month) || rampStartMonth.includes(month);
    });

    const maxMultiplier = activeSignals.length > 0
        ? Math.max(...activeSignals.map(s => s.demandMultiplier))
        : 1.0;

    const level: DemandForecast["predictedDemandLevel"] =
        maxMultiplier >= 2.5 ? "surge" :
            maxMultiplier >= 1.5 ? "high" :
                maxMultiplier >= 1.0 ? "normal" : "low";

    return {
        month,
        year: new Date().getFullYear(),
        country,
        state,
        predictedDemandLevel: level,
        activeSignals: activeSignals.map(s => s.signalId),
        topLoadTypes: [...new Set(activeSignals.flatMap(s => s.loadTypes))].slice(0, 5),
        topCorridors: [...new Set(activeSignals.flatMap(s => s.corridors))].slice(0, 5),
        rateAdvice: level === "surge"
            ? "🔴 Premium rates justified — demand significantly exceeds supply"
            : level === "high"
                ? "🟠 Above-average rates expected — book escorts early"
                : "🟢 Standard rates — good availability expected",
        escortAdvice: activeSignals.some(s => s.escortShortageRisk === "high")
            ? "⚠️ High shortage risk — secure escorts 2+ weeks in advance"
            : "Standard lead times sufficient",
    };
}

export function forecast12Months(country: string, state?: string): DemandForecast[] {
    const currentMonth = new Date().getMonth() + 1;
    return Array.from({ length: 12 }, (_, i) => {
        const m = ((currentMonth - 1 + i) % 12) + 1;
        return forecastDemand(m, country, state);
    });
}

// ── SEO: Seasonal Content Pages ──

export function generateSeasonalPages(country: string): { url: string; title: string; description: string }[] {
    const signals = SEASONAL_DEMAND_SIGNALS.filter(s => s.countries.includes(country));
    return signals.map(s => ({
        url: `/insights/${country.toLowerCase()}/${s.signalId}`,
        title: `${s.industry} Oversize Load Season — ${s.countries.includes("US") ? "US" : country} Escort Demand Guide | Haul Command`,
        description: s.description,
    }));
}
