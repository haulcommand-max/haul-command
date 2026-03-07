// ══════════════════════════════════════════════════════════════
// US STATE PILOT CAR THRESHOLDS — When escorts are required
// Source intelligence: oversize.io/regulations + FHWA data
// Purpose: Feed state pages with specific dimension thresholds,
//          number of escorts required, and police escort triggers
// ══════════════════════════════════════════════════════════════

// General US thresholds (varies by state):
// - Width > 12ft → 1 pilot car
// - Width > 14ft → 2 pilot cars (lead + follow)
// - Width > 16ft+ → Police escort in some states
// - Height > 14'6" (west) or 13'6" (east) → 1 pilot car
// - Length > 90-100ft → 1 pilot car

export interface PilotCarThreshold {
    /** Number of escort vehicles required */
    escorts: 0 | 1 | 2;
    /** Does this threshold also require police escort? */
    policeEscort: boolean;
    /** Dimension type this threshold applies to */
    dimension: "width" | "height" | "length" | "weight";
    /** Threshold value in feet/inches or pounds */
    value: string;
    /** Parsed numeric (in inches for height/width, feet for length, lbs for weight) */
    valueInches?: number;
    valueFeet?: number;
    valuePounds?: number;
}

export interface StatePilotCarRegulation {
    state: string;
    stateCode: string;
    /** Width thresholds (ascending) */
    widthThresholds: PilotCarThreshold[];
    /** Height thresholds (ascending) */
    heightThresholds: PilotCarThreshold[];
    /** Length thresholds (ascending) */
    lengthThresholds: PilotCarThreshold[];
    /** Weight thresholds (ascending) */
    weightThresholds: PilotCarThreshold[];
    /** reference URL for official state regulations */
    referenceUrl: string;
    /** Travel time restrictions */
    travelRestrictions?: string;
    /** Key notes */
    notes?: string;
}

// Selected states with known regulation detail (expandable dataset)
export const US_STATE_REGULATIONS: StatePilotCarRegulation[] = [
    {
        state: "Alabama", stateCode: "AL",
        widthThresholds: [
            { escorts: 1, policeEscort: false, dimension: "width", value: "12'", valueFeet: 12 },
        ],
        heightThresholds: [
            { escorts: 1, policeEscort: false, dimension: "height", value: "16'", valueFeet: 16 },
        ],
        lengthThresholds: [],
        weightThresholds: [],
        referenceUrl: "https://oversize.io/regulations/pilot-cars-escort-vehicles/alabama",
        notes: "Alabama only lists height > 16' threshold for 1 P/E. Relatively lenient.",
    },
    {
        state: "California", stateCode: "CA",
        widthThresholds: [
            { escorts: 1, policeEscort: false, dimension: "width", value: "12'", valueFeet: 12 },
            { escorts: 2, policeEscort: false, dimension: "width", value: "14'", valueFeet: 14 },
        ],
        heightThresholds: [
            { escorts: 1, policeEscort: false, dimension: "height", value: "14'6\"", valueInches: 174 },
        ],
        lengthThresholds: [
            { escorts: 1, policeEscort: false, dimension: "length", value: "100'", valueFeet: 100 },
        ],
        weightThresholds: [],
        referenceUrl: "https://oversize.io/regulations/pilot-cars-escort-vehicles/california",
        travelRestrictions: "No weekend/holiday moves for some permits. Daylight only for most oversized loads.",
    },
    {
        state: "Colorado", stateCode: "CO",
        widthThresholds: [
            { escorts: 1, policeEscort: false, dimension: "width", value: "12'", valueFeet: 12 },
            { escorts: 2, policeEscort: false, dimension: "width", value: "14'", valueFeet: 14 },
        ],
        heightThresholds: [
            { escorts: 1, policeEscort: false, dimension: "height", value: "14'6\"", valueInches: 174 },
        ],
        lengthThresholds: [
            { escorts: 1, policeEscort: false, dimension: "length", value: "90'", valueFeet: 90 },
        ],
        weightThresholds: [],
        referenceUrl: "https://oversize.io/regulations/pilot-cars-escort-vehicles/colorado",
    },
    {
        state: "Florida", stateCode: "FL",
        widthThresholds: [
            { escorts: 1, policeEscort: false, dimension: "width", value: "12'", valueFeet: 12 },
            { escorts: 2, policeEscort: false, dimension: "width", value: "14'6\"", valueInches: 174 },
        ],
        heightThresholds: [
            { escorts: 1, policeEscort: false, dimension: "height", value: "14'6\"", valueInches: 174 },
        ],
        lengthThresholds: [
            { escorts: 1, policeEscort: false, dimension: "length", value: "95'", valueFeet: 95 },
        ],
        weightThresholds: [],
        referenceUrl: "https://oversize.io/regulations/pilot-cars-escort-vehicles/florida",
    },
    {
        state: "Massachusetts", stateCode: "MA",
        widthThresholds: [
            { escorts: 1, policeEscort: false, dimension: "width", value: "12'", valueFeet: 12 },
        ],
        heightThresholds: [
            { escorts: 1, policeEscort: false, dimension: "height", value: "8'8\"", valueInches: 104 },
            { escorts: 2, policeEscort: false, dimension: "height", value: "13'11\"", valueInches: 167 },
            { escorts: 2, policeEscort: true, dimension: "height", value: "14'11\"", valueInches: 179 },
        ],
        lengthThresholds: [],
        weightThresholds: [],
        referenceUrl: "https://oversize.io/regulations/pilot-cars-escort-vehicles/massachusetts",
        notes: "Massachusetts has the LOWEST height threshold in the US at 8'8\". Very strict — most states start at 14'+. Three-tier height system: 1 P/E → 2 P/E → 2 P/E + police.",
    },
    {
        state: "New York", stateCode: "NY",
        widthThresholds: [
            { escorts: 1, policeEscort: false, dimension: "width", value: "12'", valueFeet: 12 },
            { escorts: 2, policeEscort: false, dimension: "width", value: "14'", valueFeet: 14 },
        ],
        heightThresholds: [
            { escorts: 1, policeEscort: false, dimension: "height", value: "13'6\"", valueInches: 162 },
        ],
        lengthThresholds: [
            { escorts: 1, policeEscort: false, dimension: "length", value: "90'", valueFeet: 90 },
        ],
        weightThresholds: [],
        referenceUrl: "https://oversize.io/regulations/pilot-cars-escort-vehicles/new-york",
        notes: "NY uses its own DMV escort driver certification — no reciprocity with any other state.",
    },
    {
        state: "Ohio", stateCode: "OH",
        widthThresholds: [
            { escorts: 1, policeEscort: false, dimension: "width", value: "13'", valueFeet: 13 },
            { escorts: 2, policeEscort: false, dimension: "width", value: "14'6\"", valueInches: 174 },
            { escorts: 2, policeEscort: true, dimension: "width", value: "16'", valueFeet: 16 },
        ],
        heightThresholds: [
            { escorts: 1, policeEscort: false, dimension: "height", value: "14'6\"", valueInches: 174 },
        ],
        lengthThresholds: [
            { escorts: 1, policeEscort: false, dimension: "length", value: "100'", valueFeet: 100 },
        ],
        weightThresholds: [],
        referenceUrl: "https://oversize.io/regulations/pilot-cars-escort-vehicles/ohio",
        notes: "Ohio has a 3-tier width system: 1 P/E at 13', 2 P/E at 14'6\", police at 16'+.",
    },
    {
        state: "Texas", stateCode: "TX",
        widthThresholds: [
            { escorts: 1, policeEscort: false, dimension: "width", value: "12'", valueFeet: 12 },
            { escorts: 2, policeEscort: false, dimension: "width", value: "14'", valueFeet: 14 },
            { escorts: 2, policeEscort: true, dimension: "width", value: "18'", valueFeet: 18 },
        ],
        heightThresholds: [
            { escorts: 1, policeEscort: false, dimension: "height", value: "16'", valueFeet: 16 },
        ],
        lengthThresholds: [
            { escorts: 1, policeEscort: false, dimension: "length", value: "110'", valueFeet: 110 },
        ],
        weightThresholds: [],
        referenceUrl: "https://oversize.io/regulations/pilot-cars-escort-vehicles/texas",
        notes: "No official Texas pilot car certification! Cards claiming to be TX certs are fraudulent. Very large thresholds due to oil/energy industry influence.",
    },
    {
        state: "Washington", stateCode: "WA",
        widthThresholds: [
            { escorts: 1, policeEscort: false, dimension: "width", value: "12'", valueFeet: 12 },
            { escorts: 2, policeEscort: false, dimension: "width", value: "14'", valueFeet: 14 },
        ],
        heightThresholds: [
            { escorts: 1, policeEscort: false, dimension: "height", value: "14'6\"", valueInches: 174 },
        ],
        lengthThresholds: [
            { escorts: 1, policeEscort: false, dimension: "length", value: "100'", valueFeet: 100 },
        ],
        weightThresholds: [],
        referenceUrl: "https://oversize.io/regulations/pilot-cars-escort-vehicles/washington",
        notes: "Home of the PEVO certification standard (WAC 468-38-100). Certification enforced at weigh stations.",
    },
];

// ── Additional oversize.io resources to reference ──

export const OVERSIZE_IO_RESOURCES = {
    finesByState: "https://oversize.io/regulations/oversize-overweight-fines-by-state",
    axleWeightCalculator: "https://oversize.io/regulations/axle-weight-calculator",
    frostLaws: "https://oversize.io/regulations/frost-laws-by-state",
    flagsLightsBanners: "https://oversize.io/regulations/oversize-flags-lights-banners-holiday-restrictions",
    stateRegulationBase: "https://oversize.io/regulations/pilot-cars-escort-vehicles",
} as const;

// ── General Equipment Requirements (from oversize.io) ──

export const GENERAL_EQUIPMENT_REQUIREMENTS = {
    vehicleMinWeight: "2,000 lbs (1/4-ton pickup or larger)",
    visibility: "Clear 360-degree vision required",
    signs: "WIDE LOAD or OVERSIZE LOAD sign mounted on roof or front/rear",
    flags: "2-4 flags, 12-18 inch square, mounted on vehicle",
    lighting: "Rotating/flashing amber light visible from 500 feet",
    communication: "CB Radio (Citizens Band) — primary communication",
    safetyGear: ["Hard hat", "High-visibility vest", "Reflective jacket", "STOP/SLOW paddle"],
    emergencyTools: ["Fire extinguisher", "First aid kit", "Spare tire", "Changing tools"],
    documentation: ["Mileage record book", "8 reflective triangles", "12 road flares"],
    measuringPole: "Required if load exceeds 14' in height",
} as const;

// ── Helpers ──

export function getStateRegulation(stateCode: string): StatePilotCarRegulation | undefined {
    return US_STATE_REGULATIONS.find(r => r.stateCode === stateCode);
}

export function getStateReferenceUrl(stateCode: string): string {
    const base = OVERSIZE_IO_RESOURCES.stateRegulationBase;
    const state = US_STATE_REGULATIONS.find(r => r.stateCode === stateCode);
    if (state) return state.referenceUrl;
    // fallback: generate URL from state code
    const stateNames: Record<string, string> = {
        AL: "alabama", AK: "alaska", AZ: "arizona", AR: "arkansas", CA: "california",
        CO: "colorado", CT: "connecticut", DE: "delaware", FL: "florida", GA: "georgia",
        HI: "hawaii", ID: "idaho", IL: "illinois", IN: "indiana", IA: "iowa",
        KS: "kansas", KY: "kentucky", LA: "louisiana", ME: "maine", MD: "maryland",
        MA: "massachusetts", MI: "michigan", MN: "minnesota", MS: "mississippi", MO: "missouri",
        MT: "montana", NE: "nebraska", NV: "nevada", NH: "new-hampshire", NJ: "new-jersey",
        NM: "new-mexico", NY: "new-york", NC: "north-carolina", ND: "north-dakota", OH: "ohio",
        OK: "oklahoma", OR: "oregon", PA: "pennsylvania", RI: "rhode-island", SC: "south-carolina",
        SD: "south-dakota", TN: "tennessee", TX: "texas", UT: "utah", VT: "vermont",
        VA: "virginia", WA: "washington", WV: "west-virginia", WI: "wisconsin", WY: "wyoming",
        DC: "district-of-columbia",
    };
    return `${base}/${stateNames[stateCode] || stateCode.toLowerCase()}`;
}

/** Get states sorted by strictness (lowest height threshold = most strict) */
export function getStatesByStrictness(): StatePilotCarRegulation[] {
    return [...US_STATE_REGULATIONS].sort((a, b) => {
        const aMin = Math.min(...a.heightThresholds.filter(t => t.escorts >= 1).map(t => t.valueInches || t.valueFeet! * 12));
        const bMin = Math.min(...b.heightThresholds.filter(t => t.escorts >= 1).map(t => t.valueInches || t.valueFeet! * 12));
        return aMin - bMin;
    });
}
