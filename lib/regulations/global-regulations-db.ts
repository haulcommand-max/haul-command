// ══════════════════════════════════════════════════════════════
// GLOBAL PILOT CAR REGULATIONS DATABASE
// Purpose: Structured regulatory intelligence across 120 countries
//          Powers: compliance pages, voice answers, snippets,
//          carrier intelligence, and the compliance firewall
// Source: Government regulations + industry guidelines
// ══════════════════════════════════════════════════════════════

export interface CountryRegulation {
    countryCode: string;
    countryName: string;
    tier: "A" | "B" | "C" | "D" | "E";
    terminology: { primary: string; secondary?: string[]; language: string };

    /** Standard vehicle limits before oversize classification */
    standardLimits: {
        widthM: number;
        heightM?: number;
        lengthM?: number;
        weightT?: number;
    };

    /** When escorts become mandatory */
    escortThresholds: EscortThreshold[];

    /** Permit system */
    permitSystem: {
        authority: string;
        authorityAbbrev?: string;
        permitTypes?: string[];
        digitalSystem?: string; // e.g. VEMAGS, ESDAL
        url?: string;
    };

    /** Equipment requirements */
    equipment?: string[];

    /** Escort categories (e.g. BF3/BF4 in Germany) */
    escortCategories?: EscortCategory[];

    /** Travel restrictions */
    restrictions?: string[];

    /** Certification requirements */
    certification?: { required: boolean; details: string };

    /** Data confidence */
    dataQuality: "high" | "medium" | "low";

    /**
     * Confidence state per legal_freshness_os.
     * Controls how the regulation is displayed and what disclaimers are shown.
     */
    confidenceState?: "verified_current" | "verified_but_review_due" | "partially_verified" | "seeded_needs_human_review" | "historical_reference_only";

    /** ISO date when this entry was last verified against official source */
    lastVerified?: string;

    /** Who last verified: 'system', 'human_reviewer', or reviewer name */
    lastUpdatedBy?: string;

    /** Voice-ready answer for "do I need a pilot car in {country}?" */
    voiceAnswer: string;
}

export interface EscortThreshold {
    condition: string; // e.g. "width > 3.66m (12ft)"
    escortsRequired: number;
    escortType: "civil" | "police" | "both" | "case_by_case" | "certified";
    notes?: string;
}

export interface EscortCategory {
    name: string;
    triggers: string;
    authority: "civil" | "police" | "certified" | "traffic_director";
    description: string;
}

// ══════════════════════════════════════════════════════════════
// TIER A — GOLD (10 countries)
// ══════════════════════════════════════════════════════════════

export const REGULATIONS: CountryRegulation[] = [
    {
        countryCode: "US",
        countryName: "United States",
        tier: "A",
        terminology: { primary: "pilot car", secondary: ["escort vehicle", "flag car", "lead car"], language: "en" },
        standardLimits: { widthM: 2.59, heightM: 4.11, lengthM: 19.81, weightT: 36.29 },
        escortThresholds: [
            { condition: "Width 3.66m–4.27m (12–14 ft)", escortsRequired: 1, escortType: "civil", notes: "Varies by state" },
            { condition: "Width ≥ 4.27m (≥14 ft)", escortsRequired: 2, escortType: "civil", notes: "One front, one rear" },
            { condition: "Height ≥ 4.42m (14.5 ft)", escortsRequired: 1, escortType: "civil" },
            { condition: "Length ≥ 24.4m (80 ft)", escortsRequired: 1, escortType: "civil" },
            { condition: "Super loads / extreme dimensions", escortsRequired: 2, escortType: "both", notes: "Police escort may be required" },
        ],
        permitSystem: { authority: "State DOT (each state)", permitTypes: ["Single trip", "Annual", "Overweight", "Superload"], url: "https://ops.fhwa.dot.gov/freight/sw/permit_report/index.htm" },
        equipment: ["OVERSIZE LOAD / WIDE LOAD roof sign", "Amber flashing lights", "Two-way radio / CB", "Height pole", "Red/orange safety flags", "Safety cones", "Fire extinguisher", "First aid kit"],
        restrictions: ["Night travel may be restricted", "Permits set allowable travel times", "Weekend/holiday restrictions in some states"],
        certification: { required: true, details: "Many states require certification (AZ, CO, FL, GA, LA, MN, NV, NM, NY, OK, VA). Some accept reciprocal certifications." },
        dataQuality: "high",
        voiceAnswer: "In the United States, you need a pilot car when your load exceeds 12 feet wide. Most states require one escort for loads between 12 and 14 feet wide, and two escorts for loads wider than 14 feet. Many states also require escorts for loads taller than 14.5 feet or longer than 80 feet. Check your specific state regulations for exact requirements.",
    },
    {
        countryCode: "CA",
        countryName: "Canada",
        tier: "A",
        terminology: { primary: "pilot car", secondary: ["escort vehicle", "pilot vehicle"], language: "en" },
        standardLimits: { widthM: 2.60, heightM: 4.15, lengthM: 23.00 },
        escortThresholds: [
            { condition: "Width > 3.70m (varies by province)", escortsRequired: 1, escortType: "civil" },
            { condition: "Extreme dimensions", escortsRequired: 2, escortType: "civil", notes: "One front, one rear" },
        ],
        permitSystem: { authority: "Provincial transport ministries", permitTypes: ["Single trip", "Annual"], url: "https://www.th.gov.bc.ca/permits/" },
        equipment: ["OVERSIZE LOAD / WIDE LOAD / LONG LOAD roof sign", "Amber beacons lit at night", "Warning flags", "Two-way radio"],
        certification: { required: true, details: "BC requires pilot-car drivers to hold valid certification. AB, MB, ON have similar requirements." },
        dataQuality: "high",
        voiceAnswer: "In Canada, pilot car requirements are set by each province. In British Columbia, the oversize permit determines whether one or two pilot cars are needed based on width, length, and height. Pilot-car drivers must hold valid provincial certification. Ontario typically requires escorts for loads wider than 3.7 meters.",
    },
    {
        countryCode: "AU",
        countryName: "Australia",
        tier: "A",
        terminology: { primary: "pilot vehicle", secondary: ["escort vehicle"], language: "en" },
        standardLimits: { widthM: 2.50, heightM: 4.30, lengthM: 19.00 },
        escortThresholds: [
            { condition: "Single dimension exceeded", escortsRequired: 1, escortType: "civil", notes: "Behind on divided roads, in front on undivided" },
            { condition: "Large loads / multiple dimensions exceeded", escortsRequired: 2, escortType: "civil", notes: "One front, one rear" },
        ],
        permitSystem: { authority: "National Heavy Vehicle Regulator (NHVR)", url: "https://www.nhvr.gov.au" },
        equipment: ["OVERSIZE LOAD AHEAD sign (1200×600mm)", "Rotating/flashing amber lights", "Two-way communication (not mobile phones)", "Headlights on while escorting"],
        restrictions: ["Escort vehicles must have GVM ≤ 4.5t (rear may be ≤ 6.5t)", "May not tow trailers or carry unrelated goods"],
        dataQuality: "high",
        voiceAnswer: "In Australia, the National Heavy Vehicle Regulator sets escort rules. Pilot vehicles must have four wheels, weigh under 4.5 tonnes, and display an 'OVERSIZE LOAD AHEAD' sign with amber lights. One pilot travels behind on divided roads and in front on undivided roads. Larger loads require two pilots.",
    },
    {
        countryCode: "GB",
        countryName: "United Kingdom",
        tier: "A",
        terminology: { primary: "escort vehicle", secondary: ["abnormal load escort"], language: "en" },
        standardLimits: { widthM: 2.90, heightM: 4.95, lengthM: 18.65, weightT: 44 },
        escortThresholds: [
            { condition: "Width > 3m, length > 18.65m, or weight > 44t", escortsRequired: 1, escortType: "civil", notes: "Self-escort; no traffic authority" },
            { condition: "STGO Cat 2: 80–150t", escortsRequired: 1, escortType: "both", notes: "Police notification required" },
            { condition: "STGO Cat 3: >150t or width ≥ 5m", escortsRequired: 2, escortType: "both", notes: "Police escort likely" },
        ],
        permitSystem: { authority: "Department for Transport / Highways England", digitalSystem: "ESDAL", permitTypes: ["VR1 (notification)", "Special Order"] },
        equipment: ["ABNORMAL LOAD front/rear boards", "Amber rotating beacons", "Marker boards"],
        certification: { required: false, details: "No formal statutory training, but industry guides recommend route planning and communication training." },
        dataQuality: "high",
        voiceAnswer: "In the United Kingdom, loads over 3 meters wide, 18.65 meters long, or 44 tonnes need an abnormal load notice. Hauliers can self-escort but escorts cannot direct traffic. For STGO Category 2 loads of 80 to 150 tonnes, police notification is required. Category 3 loads over 150 tonnes or 5 meters wide usually need police escorts.",
    },
    {
        countryCode: "NZ",
        countryName: "New Zealand",
        tier: "A",
        terminology: { primary: "load pilot", secondary: ["pilot vehicle"], language: "en" },
        standardLimits: { widthM: 2.50, heightM: 4.25, lengthM: 20.00 },
        escortThresholds: [
            { condition: "Cat 1: width 3.1–3.5m", escortsRequired: 1, escortType: "civil" },
            { condition: "Cat 2: width 3.5–4.7m", escortsRequired: 2, escortType: "civil" },
            { condition: "Cat 3: width > 4.7m or height > 5m", escortsRequired: 3, escortType: "both", notes: "Police involvement required" },
        ],
        permitSystem: { authority: "NZ Transport Agency (NZTA)" },
        equipment: ["Yellow roof signs: OVERSIZE LOAD", "Amber lights", "High-visibility flags"],
        restrictions: ["Night-time moves may trigger extra escorts", "Narrow bridges may require additional pilots"],
        dataQuality: "high",
        voiceAnswer: "In New Zealand, you need one load pilot for widths between 3.1 and 3.5 meters. Two pilots are required for widths between 3.5 and 4.7 meters. Loads wider than 4.7 meters or taller than 5 meters need multiple pilots and police involvement.",
    },
    {
        countryCode: "ZA",
        countryName: "South Africa",
        tier: "A",
        terminology: { primary: "escort vehicle", secondary: ["pilot car"], language: "en" },
        standardLimits: { widthM: 2.60, heightM: 4.30, lengthM: 22.00, weightT: 56 },
        escortThresholds: [
            { condition: "Width 3.0–3.5m", escortsRequired: 1, escortType: "civil", notes: "Front escort" },
            { condition: "Width 3.5–4.5m", escortsRequired: 2, escortType: "civil", notes: "Front and rear" },
            { condition: "Width > 4.5m", escortsRequired: 2, escortType: "both", notes: "Plus Traffic Police escort" },
        ],
        permitSystem: { authority: "Provincial Road Traffic Authorities" },
        equipment: ["ESCORT VEHICLE signs", "Amber flashing lights", "Reflective chevrons", "Communication devices"],
        restrictions: ["Usually restricted to daylight hours", "Some provinces prohibit weekend/public holiday travel"],
        dataQuality: "high",
        voiceAnswer: "In South Africa, loads wider than 3 meters need one front escort vehicle. Loads between 3.5 and 4.5 meters wide need two escorts, front and rear. Loads wider than 4.5 meters also require a Traffic Police escort. Travel is usually restricted to daylight hours.",
    },
    {
        countryCode: "DE",
        countryName: "Germany",
        tier: "A",
        terminology: { primary: "Begleitfahrzeug", secondary: ["BF3", "BF4", "Transportbegleitung"], language: "de" },
        standardLimits: { widthM: 2.55, heightM: 4.00, lengthM: 16.50, weightT: 44 },
        escortThresholds: [
            { condition: "Width 3.0–3.5m or length 20–25m", escortsRequired: 1, escortType: "certified", notes: "BF3 certified escort" },
            { condition: "Width > 3.5m or length > 25m", escortsRequired: 1, escortType: "certified", notes: "BF4 certified escort (higher category)" },
            { condition: "Width > 4.5m or weight > 100t", escortsRequired: 2, escortType: "both", notes: "Police escort, usually night moves" },
        ],
        permitSystem: { authority: "State road authorities", digitalSystem: "VEMAGS" },
        escortCategories: [
            { name: "BF3", triggers: "Width 3.0–3.5m or length 20–25m", authority: "certified", description: "Certified escort with illuminated signs, amber lights, radio" },
            { name: "BF4", triggers: "Width > 3.5m or length > 25m", authority: "certified", description: "Higher certification; coordinates with police" },
        ],
        equipment: ["Illuminated roof signs", "Amber flashing lights", "Radio communication with driver"],
        restrictions: ["Sunday driving ban for heavy vehicles", "Night moves (22:00–06:00) for very large loads"],
        certification: { required: true, details: "BF3 and BF4 certifications required for escort drivers." },
        dataQuality: "high",
        voiceAnswer: "In Germany, a certified BF3 escort vehicle is required for loads between 3 and 3.5 meters wide or 20 to 25 meters long. A BF4 escort is needed for wider or longer loads. Very large loads over 4.5 meters wide or 100 tonnes require police escort, usually at night. Permits are issued through the VEMAGS system.",
    },
    {
        countryCode: "NL",
        countryName: "Netherlands",
        tier: "A",
        terminology: { primary: "begeleidingsvoertuig", secondary: ["exceptioneel transport begeleiding"], language: "nl" },
        standardLimits: { widthM: 3.00, heightM: 4.00, lengthM: 22.00, weightT: 50 },
        escortThresholds: [
            { condition: "Non-motorway: width 3.51–4.00m + length 27.51–32m", escortsRequired: 1, escortType: "civil" },
            { condition: "Non-motorway: width 4.01–4.50m or length 32.01–50m", escortsRequired: 2, escortType: "civil" },
            { condition: "Non-motorway: width > 5.01m or length > 50m", escortsRequired: 2, escortType: "civil" },
            { condition: "Motorway: width 4.01m+ or length 40.01m+", escortsRequired: 1, escortType: "civil" },
            { condition: "Self-propelled: width > 3m or weight > 84t", escortsRequired: 1, escortType: "civil" },
        ],
        permitSystem: { authority: "RDW (Netherlands Vehicle Authority)", permitTypes: ["Incidental permit", "Long-term (1 year)"], digitalSystem: "INCO 92 matrix" },
        equipment: ["CONVOI EXCEPTIONNEL signs (or Dutch equivalent)", "Flashing beacons", "Radio communication"],
        dataQuality: "high",
        voiceAnswer: "In the Netherlands, escort requirements follow the INCO 92 matrix. On regular roads, one escort is needed for loads 3.5 to 4 meters wide. Two escorts are required for loads over 4 meters wide or longer than 32 meters. On motorways, escorts start at 4 meters wide or 40 meters long.",
    },
    {
        countryCode: "AE",
        countryName: "United Arab Emirates",
        tier: "A",
        terminology: { primary: "escort vehicle", secondary: ["سيارة مرافقة"], language: "ar" },
        standardLimits: { widthM: 2.60, heightM: 4.50, lengthM: 20.00 },
        escortThresholds: [
            { condition: "Dimensions exceeding standard limits", escortsRequired: 1, escortType: "case_by_case", notes: "Permit authority determines" },
            { condition: "Very large loads", escortsRequired: 2, escortType: "both", notes: "Police escort possible" },
        ],
        permitSystem: { authority: "Ministry of Interior / Emirate transport authorities" },
        equipment: ["Warning signs", "Amber lights", "Communication devices"],
        dataQuality: "low",
        voiceAnswer: "In the UAE, oversize loads wider than about 2.6 meters, taller than 4.5 meters, or longer than 20 meters need a special permit from the Ministry of Interior or the emirate's transport authority. The permit determines whether escort vehicles or police escorts are required.",
    },
    {
        countryCode: "BR",
        countryName: "Brazil",
        tier: "A",
        terminology: { primary: "carro batedor", secondary: ["veículo de escolta", "escolta"], language: "pt" },
        standardLimits: { widthM: 2.60, heightM: 4.40, lengthM: 19.80 },
        escortThresholds: [
            { condition: "Indivisible loads exceeding standard limits", escortsRequired: 1, escortType: "case_by_case", notes: "AET permit specifies" },
            { condition: "Extremely large loads / sensitive routes", escortsRequired: 1, escortType: "both", notes: "Federal Highway Police or accredited private escort" },
        ],
        permitSystem: { authority: "DNIT / ANTT", authorityAbbrev: "DNIT", permitTypes: ["AET (Autorização Especial de Trânsito)"], url: "https://www.antt.gov.br" },
        equipment: ["Illuminated signs", "Amber beacons", "Communication devices"],
        restrictions: ["Restricted to approved routes and times"],
        dataQuality: "medium",
        voiceAnswer: "In Brazil, loads exceeding 2.6 meters wide, 4.4 meters high, or 19.8 meters long require an AET special transit permit. The DNIT resolution defines when escort is needed. Police escorts or accredited private escorts may be required for very large loads.",
    },

    // ══════════════════════════════════════════════════════════
    // TIER B — BLUE (15 countries)
    // ══════════════════════════════════════════════════════════
    {
        countryCode: "IE", countryName: "Ireland", tier: "B",
        terminology: { primary: "escort vehicle", secondary: ["private escort"], language: "en" },
        standardLimits: { widthM: 2.55, heightM: 4.65, lengthM: 18.75, weightT: 44 },
        escortThresholds: [
            { condition: "Width > 3.66m (12 ft), length ≤ 27.4m", escortsRequired: 1, escortType: "civil" },
            { condition: "Width > 4.3m (14.1 ft) or length > 27.4m", escortsRequired: 1, escortType: "both", notes: "Police escort likely" },
            { condition: "Wind turbine delivery", escortsRequired: 3, escortType: "civil", notes: "Front, rear, and scout vehicle" },
        ],
        permitSystem: { authority: "An Garda Síochána / Local authorities" },
        equipment: ["Warning signs", "Amber lights", "Communication equipment"],
        certification: { required: false, details: "No statutory requirement; appropriate licence and hazard training recommended." },
        dataQuality: "medium",
        voiceAnswer: "In Ireland, loads wider than 3.66 meters should have a private escort. Loads wider than 4.3 meters or longer than 27.4 meters may require police escort. Wind turbine deliveries typically need three escort vehicles.",
    },
    {
        countryCode: "SE", countryName: "Sweden", tier: "B",
        terminology: { primary: "eskortfordon", secondary: ["Vägtransportledare"], language: "sv" },
        standardLimits: { widthM: 2.60, heightM: 4.50, lengthM: 24.00 },
        escortThresholds: [
            { condition: "Length > 30m OR width > 3.1m (one dimension)", escortsRequired: 1, escortType: "civil" },
            { condition: "Both length > 30m AND width > 3.1m", escortsRequired: 2, escortType: "civil" },
            { condition: "Length > 35m AND width > 4.5m", escortsRequired: 2, escortType: "certified", notes: "Certified Vägtransportledare required" },
        ],
        permitSystem: { authority: "Transportstyrelsen" },
        escortCategories: [
            { name: "Vägtransportledare", triggers: ">35m length and >4.5m width", authority: "traffic_director", description: "Certified traffic directors with authority to stop traffic" },
        ],
        equipment: ["Yellow signs", "Reflective chevrons", "Amber flashing lights", "Radios", "Traffic cones"],
        dataQuality: "high",
        voiceAnswer: "In Sweden, one escort is needed when a load exceeds 30 meters long or 3.1 meters wide. Two escorts are required when both limits are exceeded. For loads over 35 meters and 4.5 meters wide, two certified Vägtransportledare traffic directors must accompany the transport.",
    },
    {
        countryCode: "NO", countryName: "Norway", tier: "B",
        terminology: { primary: "følgebil", secondary: ["eskortefahrzeug"], language: "no" },
        standardLimits: { widthM: 2.55, heightM: 4.50, lengthM: 19.50, weightT: 50 },
        escortThresholds: [
            { condition: "Width > 3m or length > 23.5m", escortsRequired: 1, escortType: "civil" },
            { condition: "Extreme dimensions (permit-specified)", escortsRequired: 2, escortType: "both" },
        ],
        permitSystem: { authority: "Statens vegvesen" },
        equipment: ["Warning signs", "Amber lights", "Communication devices"],
        restrictions: ["Mountain roads may need extra escorts or seasonal restrictions"],
        dataQuality: "medium",
        voiceAnswer: "In Norway, at least one escort vehicle is required when width exceeds 3 meters or length exceeds 23.5 meters. The permit authority specifies the number and type of escorts needed, including whether police escorts are required.",
    },
    {
        countryCode: "DK", countryName: "Denmark", tier: "B",
        terminology: { primary: "ledsagebil", secondary: ["escort vehicle"], language: "da" },
        standardLimits: { widthM: 2.55, heightM: 4.00, lengthM: 22.00 },
        escortThresholds: [
            { condition: "Length > 30m AND width > 4m", escortsRequired: 1, escortType: "civil" },
            { condition: "Driver cannot see end of trailer (mirror rule)", escortsRequired: 1, escortType: "civil" },
        ],
        permitSystem: { authority: "Danish Road Directorate" },
        equipment: ["Warning signs", "Amber lights"],
        dataQuality: "medium",
        voiceAnswer: "In Denmark, a civil escort is required for loads exceeding 30 meters long and 4 meters wide. An escort is also required if the driver cannot see the end of the trailer, known as the mirror rule. Denmark generally does not require police escorts for oversize transports.",
    },
    {
        countryCode: "FI", countryName: "Finland", tier: "B",
        terminology: { primary: "saattoauto", secondary: ["escort vehicle"], language: "fi" },
        standardLimits: { widthM: 2.60, heightM: 4.40, lengthM: 25.25 },
        escortThresholds: [
            { condition: "Tractor+semi > 30m, >3m wide, >5m tall, or >60t", escortsRequired: 1, escortType: "civil" },
            { condition: "Truck+trailer > 25.25m, >3m wide, or >5m tall", escortsRequired: 1, escortType: "civil" },
        ],
        permitSystem: { authority: "Finnish Transport and Communications Agency (Traficom)" },
        equipment: ["Warning signs", "Amber lights", "Communication devices"],
        dataQuality: "medium",
        voiceAnswer: "In Finland, a civil escort is mandatory when a tractor and semi-trailer exceed 30 meters long, 3 meters wide, 5 meters tall, or weigh more than 60 tonnes. Police escort is not required; civil escorts are sufficient.",
    },
    {
        countryCode: "BE", countryName: "Belgium", tier: "B",
        terminology: { primary: "begeleidingsvoertuig", secondary: ["véhicule d'accompagnement"], language: "nl" },
        standardLimits: { widthM: 2.55, heightM: 4.00, lengthM: 16.50, weightT: 44 },
        escortThresholds: [
            { condition: "Length > 30m, width > 3.5m, weight > 90t", escortsRequired: 1, escortType: "civil" },
            { condition: "Length > 35m, width > 4.5m, height > 4.8m, or weight > 180t", escortsRequired: 2, escortType: "civil" },
            { condition: "Length > 40m AND width > 5m", escortsRequired: 3, escortType: "civil" },
        ],
        permitSystem: { authority: "Regional transport authorities (Flanders, Wallonia, Brussels)" },
        equipment: ["Warning signs", "Amber lights", "Communication devices"],
        dataQuality: "medium",
        voiceAnswer: "Belgium uses a tiered escort system. One civil escort is needed for loads over 30 meters long, 3.5 meters wide, or 90 tonnes. Two escorts for loads over 35 meters, 4.5 meters wide, or 180 tonnes. Three escorts for loads over 40 meters and 5 meters wide.",
    },
    {
        countryCode: "AT", countryName: "Austria", tier: "B",
        terminology: { primary: "Begleitfahrzeug", secondary: ["Transportbegleitung"], language: "de" },
        standardLimits: { widthM: 2.55, heightM: 4.00, lengthM: 16.50, weightT: 44 },
        escortThresholds: [
            { condition: "Length > 20m, width > 3m, height > 4.3m, or weight > 50–60t", escortsRequired: 1, escortType: "civil" },
        ],
        permitSystem: { authority: "Provincial authorities (Landeshauptmann)" },
        dataQuality: "medium",
        voiceAnswer: "In Austria, a civil escort is required when transport exceeds 20 meters long, 3 meters wide, 4.3 meters high, or 50 to 60 tonnes. Police escort is not required. Permits come from the provincial authority.",
    },
    {
        countryCode: "CH", countryName: "Switzerland", tier: "B",
        terminology: { primary: "Begleitfahrzeug", secondary: ["Transportbegleitung"], language: "de" },
        standardLimits: { widthM: 2.55, heightM: 4.00, lengthM: 16.50, weightT: 40 },
        escortThresholds: [
            { condition: "Case-by-case (no fixed thresholds)", escortsRequired: 1, escortType: "case_by_case", notes: "Permit authority decides" },
        ],
        permitSystem: { authority: "ASTRA (Federal Roads Office)", permitTypes: ["Permanent (up to 30m, 3m, 44t)", "Incidental"] },
        equipment: ["Warning signs", "Amber lights"],
        dataQuality: "medium",
        voiceAnswer: "In Switzerland, there are no fixed escort thresholds. The permit authority decides on a case-by-case basis whether a private escort or police escort is required. Permanent permits allow transport up to 30 meters long, 3 meters wide, and 44 tonnes.",
    },
    {
        countryCode: "ES", countryName: "Spain", tier: "B",
        terminology: { primary: "vehículo de acompañamiento", secondary: ["escolta"], language: "es" },
        standardLimits: { widthM: 2.55, heightM: 4.00, lengthM: 16.50, weightT: 40 },
        escortThresholds: [
            { condition: "Genérica: up to 20.55m, 3m, 4.5m, 45t", escortsRequired: 0, escortType: "civil", notes: "Generally no escort" },
            { condition: "Específica: up to 40m, 5m, >4.7m, 110t", escortsRequired: 1, escortType: "civil", notes: "May require escort depending on route" },
            { condition: "Excepcional: exceeding Específica", escortsRequired: 2, escortType: "both", notes: "Police involvement possible" },
        ],
        permitSystem: { authority: "DGT (Dirección General de Tráfico)" },
        equipment: ["CONVOI EXCEPTIONNEL signs", "Flashing beacons"],
        dataQuality: "medium",
        voiceAnswer: "Spain has three permit categories. Generic permits for loads up to 3 meters wide generally don't require escorts. Specific permits for loads up to 5 meters may require escorts. Exceptional permits for larger loads require mandatory escorts and possibly police.",
    },
    {
        countryCode: "FR", countryName: "France", tier: "B",
        terminology: { primary: "véhicule d'accompagnement", secondary: ["voiture pilote", "escorte"], language: "fr" },
        standardLimits: { widthM: 2.55, heightM: 4.00, lengthM: 16.50, weightT: 40 },
        escortThresholds: [
            { condition: "Class 2: width > 3m", escortsRequired: 1, escortType: "civil" },
            { condition: "Class 3: larger loads", escortsRequired: 2, escortType: "both", notes: "Plus police escort" },
        ],
        permitSystem: { authority: "Préfecture / DREAL" },
        equipment: ["CONVOI EXCEPTIONNEL signs", "Red/white chevron boards", "Amber flashing lights"],
        restrictions: ["Some regions restrict daytime travel", "Large transports may operate at night"],
        dataQuality: "high",
        voiceAnswer: "In France, transport exceptionnel Class 2 loads wider than 3 meters require one escort vehicle. Class 3 larger loads require two escort vehicles plus police escort. Vehicles must display CONVOI EXCEPTIONNEL signs with amber flashing lights.",
    },
    {
        countryCode: "IT", countryName: "Italy", tier: "B",
        terminology: { primary: "veicolo di scorta", secondary: ["scorta tecnica"], language: "it" },
        standardLimits: { widthM: 2.55, heightM: 4.00, lengthM: 16.50, weightT: 44 },
        escortThresholds: [
            { condition: "Width > 3m (3.2m for rail wagons)", escortsRequired: 1, escortType: "civil" },
            { condition: "Length > 25m or front overhang > 2.5m", escortsRequired: 1, escortType: "civil" },
            { condition: "Lane width < 3m with abnormal length/height", escortsRequired: 1, escortType: "civil" },
            { condition: "Speed below 30 km/h (40 on motorways)", escortsRequired: 1, escortType: "civil" },
            { condition: "Extreme dimensions/weights", escortsRequired: 2, escortType: "both", notes: "Police escort required" },
        ],
        permitSystem: { authority: "Provincial Road Administration" },
        equipment: ["Road-sign warning boards", "Amber lights", "Reflective vests"],
        dataQuality: "medium",
        voiceAnswer: "In Italy, an escort is required when the load exceeds 3 meters wide, 25 meters long, or when lane width is less than 3 meters. An escort is also needed if the vehicle travels below 30 kilometers per hour. Police escort is required for extreme dimensions.",
    },
    {
        countryCode: "PT", countryName: "Portugal", tier: "B",
        terminology: { primary: "veículo de acompanhamento", language: "pt" },
        standardLimits: { widthM: 2.55, heightM: 4.00, lengthM: 16.50 },
        escortThresholds: [
            { condition: "Width > ~3m or length > ~30m (estimated)", escortsRequired: 1, escortType: "case_by_case" },
        ],
        permitSystem: { authority: "IMT (Instituto da Mobilidade e dos Transportes)" },
        dataQuality: "low",
        voiceAnswer: "In Portugal, oversize loads require a permit from the IMT. Escorts are likely required when width exceeds about 3 meters or length exceeds 30 meters. Operators should verify requirements with the IMT.",
    },
    {
        countryCode: "SA", countryName: "Saudi Arabia", tier: "B",
        terminology: { primary: "سيارة مرافقة", secondary: ["escort vehicle"], language: "ar" },
        standardLimits: { widthM: 2.60, heightM: 4.50, lengthM: 20.00 },
        escortThresholds: [
            { condition: "Large loads (permit-determined)", escortsRequired: 1, escortType: "case_by_case" },
        ],
        permitSystem: { authority: "General Authority for Transport (GAT)" },
        dataQuality: "low",
        voiceAnswer: "In Saudi Arabia, oversize cargo requires a special permit from the General Authority for Transport. Large loads may require escort vehicles and police clearance. Operators should consult the GAT for specific requirements.",
    },
    {
        countryCode: "QA", countryName: "Qatar", tier: "B",
        terminology: { primary: "escort vehicle", secondary: ["سيارة مرافقة"], language: "ar" },
        standardLimits: { widthM: 2.60, heightM: 4.50, lengthM: 20.00 },
        escortThresholds: [
            { condition: "Heavy or wide cargo (permit-determined)", escortsRequired: 1, escortType: "case_by_case" },
        ],
        permitSystem: { authority: "Public Works Authority (Ashghal)" },
        dataQuality: "low",
        voiceAnswer: "In Qatar, oversize transport requires a permit. Escort vehicles and police may be necessary for heavy or wide cargo. Contact the Public Works Authority Ashghal for specific permit and escort requirements.",
    },
    {
        countryCode: "MX", countryName: "Mexico", tier: "B",
        terminology: { primary: "carro piloto", secondary: ["vehículo escolta"], language: "es" },
        standardLimits: { widthM: 2.60, heightM: 4.25, lengthM: 31.00 },
        escortThresholds: [
            { condition: "Dimensions exceeding generous allowances", escortsRequired: 1, escortType: "case_by_case" },
        ],
        permitSystem: { authority: "SCT (Secretaría de Comunicaciones y Transportes)" },
        dataQuality: "low",
        voiceAnswer: "Mexico has relatively generous dimension allowances, about 3.66 meters wide, 4.75 meters high, and 33.5 meters long, before requiring special permits. Oversize loads need permits from the SCT and may require escort vehicles on certain corridors.",
    },
    {
        countryCode: "IN", countryName: "India", tier: "B",
        terminology: { primary: "escort vehicle", secondary: ["pilot vehicle"], language: "en" },
        standardLimits: { widthM: 2.60, heightM: 4.75, lengthM: 18.00 },
        escortThresholds: [
            { condition: "ODC loads exceeding standard limits", escortsRequired: 1, escortType: "case_by_case", notes: "State PWD determines" },
            { condition: "Very heavy/wide loads on highways", escortsRequired: 1, escortType: "both", notes: "Traffic police escort" },
        ],
        permitSystem: { authority: "NHAI / State PWD", authorityAbbrev: "NHAI" },
        equipment: ["Warning signs", "Amber lights", "Communication devices"],
        dataQuality: "low",
        voiceAnswer: "In India, Over-Dimensional Cargo requires permits from the National Highways Authority or State Public Works Department. Escorts are determined per-permit based on load dimensions and route. Police escorts may be required for very large loads.",
    },
    {
        countryCode: "ID", countryName: "Indonesia", tier: "B",
        terminology: { primary: "kendaraan pengawal", secondary: ["escort vehicle"], language: "id" },
        standardLimits: { widthM: 2.50, heightM: 4.20, lengthM: 18.00 },
        escortThresholds: [
            { condition: "Oversize loads exceeding standard limits", escortsRequired: 1, escortType: "case_by_case", notes: "Ministry of Transportation determines" },
        ],
        permitSystem: { authority: "Kementerian Perhubungan (Ministry of Transportation)" },
        equipment: ["Warning signs", "Amber lights"],
        dataQuality: "low",
        voiceAnswer: "In Indonesia, oversize loads require permits from the Ministry of Transportation. Escort requirements are determined per-permit based on route and dimensions.",
    },
    {
        countryCode: "TH", countryName: "Thailand", tier: "B",
        terminology: { primary: "รถนำขบวน", secondary: ["escort vehicle"], language: "th" },
        standardLimits: { widthM: 2.55, heightM: 4.00, lengthM: 17.00 },
        escortThresholds: [
            { condition: "Oversize loads on highways", escortsRequired: 1, escortType: "case_by_case", notes: "DLT permit determines requirements" },
        ],
        permitSystem: { authority: "DLT (Department of Land Transport)" },
        equipment: ["Warning signs", "Amber lights", "Communication devices"],
        dataQuality: "low",
        voiceAnswer: "In Thailand, oversize loads require permits from the Department of Land Transport. Escort requirements are set by the permit authority based on load dimensions and route conditions.",
    },

    // ══════════════════════════════════════════════════════════
    // TIER C — SILVER (26 countries, condensed)
    // ══════════════════════════════════════════════════════════
    ...([
        { code: "PL", name: "Poland", lang: "pl", term: "pojazd pilotujący", w: 2.55, thresholds: [{ c: "Width > 3.2m or weight > 60t", n: 1, t: "civil" as const }, { c: "Width > 5m or weight > 80t", n: 1, t: "both" as const }], auth: "GITD", dq: "medium" as const, va: "In Poland, an escort is required when width exceeds 3.2 meters or weight exceeds 60 tonnes. Police escort is mandatory for widths over 5 meters or weights over 80 tonnes." },
        { code: "CZ", name: "Czech Republic", lang: "cs", term: "doprovodné vozidlo", w: 2.55, thresholds: [{ c: "Width > 3m or length > 25m", n: 1, t: "civil" as const }], auth: "Road Administration", dq: "medium" as const, va: "In the Czech Republic, an escort is typically required for loads wider than 3 meters or longer than 25 meters. Night travel is recommended. Police escorts may be needed for very large loads." },
        { code: "SK", name: "Slovakia", lang: "sk", term: "sprievodné vozidlo", w: 2.55, thresholds: [{ c: "Width > ~3m or length > ~25m", n: 1, t: "case_by_case" as const }], auth: "Slovak Road Administration", dq: "low" as const, va: "In Slovakia, oversize loads require permits. Escorts are likely needed when width exceeds about 3 meters. Contact the Slovak Road Administration for details." },
        { code: "HU", name: "Hungary", lang: "hu", term: "kísérő jármű", w: 2.55, thresholds: [{ c: "Width > ~3m or length > ~25m", n: 1, t: "case_by_case" as const }], auth: "Magyar Közút", dq: "low" as const, va: "In Hungary, oversize transports require permits from Magyar Közút. Escorts may be needed for loads wider than about 3 meters." },
        { code: "SI", name: "Slovenia", lang: "sl", term: "spremno vozilo", w: 2.55, thresholds: [{ c: "Width > ~3m or length > ~25m", n: 1, t: "case_by_case" as const }], auth: "Slovenian Infrastructure Agency", dq: "low" as const, va: "In Slovenia, oversize loads need permits from the Infrastructure Agency. Escorts are likely for loads wider than 3 meters, especially on two-lane roads." },
        { code: "EE", name: "Estonia", lang: "et", term: "saatesõiduk", w: 2.55, thresholds: [{ c: "Width > 3m (EU guidelines)", n: 1, t: "civil" as const }], auth: "Road Administration", dq: "low" as const, va: "In Estonia, oversize permits are required for loads over 3 meters wide. Civil escorts may be needed for wide loads." },
        { code: "LV", name: "Latvia", lang: "lv", term: "pavadošais transportlīdzeklis", w: 2.55, thresholds: [{ c: "Width > 3m (EU guidelines)", n: 1, t: "civil" as const }], auth: "Road Administration", dq: "low" as const, va: "In Latvia, oversize permits are required for loads over 3 meters wide. Escorts follow EU best-practice guidelines." },
        { code: "LT", name: "Lithuania", lang: "lt", term: "lydintysis automobilis", w: 2.55, thresholds: [{ c: "Width > 3m (EU guidelines)", n: 1, t: "civil" as const }], auth: "Road Administration", dq: "low" as const, va: "In Lithuania, oversize loads over 3 meters wide require permits and may need civil escorts." },
        { code: "HR", name: "Croatia", lang: "hr", term: "pratno vozilo", w: 2.55, thresholds: [{ c: "Width > ~3m or length > ~30m", n: 1, t: "case_by_case" as const }], auth: "Hrvatske ceste", dq: "low" as const, va: "In Croatia, oversize transports need permits from Hrvatske ceste. Escorts may be needed for loads wider than 3 meters or longer than 30 meters." },
        { code: "RO", name: "Romania", lang: "ro", term: "vehicul de însoțire", w: 2.55, thresholds: [{ c: "Width > ~3m or length > ~25m", n: 1, t: "civil" as const }], auth: "CNAIR", dq: "low" as const, va: "In Romania, oversize transport needs a permit from CNAIR. Escorts are needed when width exceeds about 3 meters. Police escorts may be required for very large loads." },
        { code: "BG", name: "Bulgaria", lang: "bg", term: "ескортно превозно средство", w: 2.55, thresholds: [{ c: "Width > ~3m or length > ~25m", n: 1, t: "case_by_case" as const }], auth: "Road Infrastructure Agency", dq: "low" as const, va: "In Bulgaria, permits are issued by the Road Infrastructure Agency. Escorts may be needed for loads wider than 3 meters." },
        { code: "GR", name: "Greece", lang: "el", term: "όχημα συνοδείας", w: 2.55, thresholds: [{ c: "Width > ~3m or length > ~25m", n: 1, t: "case_by_case" as const }], auth: "Ministry of Infrastructure and Transport", dq: "low" as const, va: "In Greece, oversize loads require permits from the Ministry of Infrastructure and Transport. Escorts are typically required for widths over 3 meters." },
        { code: "TR", name: "Turkey", lang: "tr", term: "refakat aracı", w: 2.55, thresholds: [{ c: "Width > 3.5m or length > 25m", n: 1, t: "civil" as const }, { c: "Very large loads or night moves", n: 1, t: "both" as const }], auth: "KGM (General Directorate of Highways)", dq: "medium" as const, va: "In Turkey, escorts are usually required when width exceeds 3.5 meters or length exceeds 25 meters. Police escorts may be needed for very large loads or night moves." },
        { code: "KW", name: "Kuwait", lang: "ar", term: "سيارة مرافقة", w: 2.60, thresholds: [{ c: "GCC guidelines: varies", n: 1, t: "case_by_case" as const }], auth: "Ministry of Interior", dq: "low" as const, va: "In Kuwait, oversize transport follows GCC guidelines. Loads exceeding about 2.6 meters wide need permits and may require escort vehicles." },
        { code: "OM", name: "Oman", lang: "ar", term: "سيارة مرافقة", w: 2.60, thresholds: [{ c: "GCC guidelines: varies", n: 1, t: "case_by_case" as const }], auth: "Transport Authority", dq: "low" as const, va: "In Oman, oversize transport requires permits. Loads exceeding standard dimensions may need escort vehicles or police clearance." },
        { code: "BH", name: "Bahrain", lang: "ar", term: "سيارة مرافقة", w: 2.60, thresholds: [{ c: "GCC guidelines: varies", n: 1, t: "case_by_case" as const }], auth: "Transport Ministry", dq: "low" as const, va: "In Bahrain, oversize transport follows GCC regulations. Permits and escort vehicles may be required for loads exceeding standard dimensions." },
        { code: "SG", name: "Singapore", lang: "en", term: "escort vehicle", w: 2.60, thresholds: [{ c: "Height > 4.5m, width > 3.0m, or weight > 80t", n: 1, t: "civil" as const, notes: "Auxiliary police escort mandatory" }], auth: "Land Transport Authority (LTA)", dq: "high" as const, va: "In Singapore, an auxiliary police escort is mandatory when a vehicle with load exceeds 4.5 meters high, 3 meters wide, or 80 tonnes. Applications go through the LTA portal." },
        { code: "MY", name: "Malaysia", lang: "ms", term: "kenderaan pengiring", w: 2.60, thresholds: [{ c: "Width > ~3m or heavy convoys", n: 1, t: "case_by_case" as const }], auth: "JPJ (Road Transport Department)", dq: "low" as const, va: "In Malaysia, oversize loads need permits from the JPJ Road Transport Department. Escorts may be needed for loads wider than about 3 meters." },
        { code: "JP", name: "Japan", lang: "ja", term: "誘導車", w: 2.50, thresholds: [{ c: "Special vehicles exceeding legal limits", n: 1, t: "certified" as const, notes: "2021 simplified: one escort front OR behind" }], auth: "MLIT", dq: "high" as const, va: "In Japan, special vehicles exceeding legal size or weight limits need MLIT approval. Since 2021, typically only one escort vehicle is needed, either in front or behind. Escort drivers must complete MLIT-approved training." },
        { code: "KR", name: "South Korea", lang: "ko", term: "유도차량", w: 2.50, thresholds: [{ c: "Width > ~3m or length > ~25m", n: 1, t: "case_by_case" as const }], auth: "MOLIT", dq: "low" as const, va: "In South Korea, oversize transport requires a permit from MOLIT. Loads wider than about 3 meters or longer than 25 meters often need escort vehicles." },
        { code: "CL", name: "Chile", lang: "es", term: "vehículo de escolta", w: 2.60, thresholds: [{ c: "Oversize loads (2023 protocol)", n: 1, t: "civil" as const, notes: "Private escorts replaced Carabineros in 2023" }], auth: "Ministry of Transport", dq: "medium" as const, va: "Chile updated its protocol in 2023, transferring escort duties from police to private companies. Escort vehicles need emergency lights, retroreflective markings, variable-message boards, and geolocation equipment." },
        { code: "AR", name: "Argentina", lang: "es", term: "vehículo de escolta", w: 2.60, thresholds: [{ c: "Width > 30% of vehicle, length > 30m", n: 1, t: "case_by_case" as const }], auth: "Vialidad Nacional", dq: "low" as const, va: "In Argentina, the National Road Authority issues permits for indivisible loads. The permit may require escort vehicles depending on size, route, and risk." },
        { code: "CO", name: "Colombia", lang: "es", term: "vehículo escolta", w: 2.60, thresholds: [{ c: "Oversize loads (permit-determined)", n: 1, t: "case_by_case" as const }], auth: "Ministry of Transport", dq: "low" as const, va: "In Colombia, oversize transport requires permits from the Ministry of Transport. Escorts may be public or private and must meet regulations on signage and communication." },
        { code: "PE", name: "Peru", lang: "es", term: "vehículo de escolta", w: 2.60, thresholds: [{ c: "Width > 2.6m or height > 4.3m", n: 1, t: "case_by_case" as const }], auth: "SUTRAN / Provías Nacional", dq: "medium" as const, va: "In Peru, vehicles exceeding 2.6 meters wide or 4.3 meters high need special authorization from Provías Nacional. Oversize transports often require security escorts coordinated with local police." },
        { code: "VN", name: "Vietnam", lang: "vi", term: "xe dẫn đường", w: 2.50, thresholds: [{ c: "Oversize loads exceeding limits", n: 1, t: "case_by_case" as const }], auth: "Ministry of Transport", dq: "low" as const, va: "In Vietnam, oversize loads require permits from the Ministry of Transport. Escort requirements are determined based on load dimensions and route conditions." },
        { code: "PH", name: "Philippines", lang: "en", term: "escort vehicle", w: 2.50, thresholds: [{ c: "Oversize loads exceeding limits", n: 1, t: "case_by_case" as const }], auth: "LTO / DPWH", dq: "low" as const, va: "In the Philippines, oversize loads require clearance from the LTO and DPWH. Escort vehicles may be required depending on load dimensions and highway conditions." },
    ] as const).map(c => ({
        countryCode: c.code,
        countryName: c.name,
        tier: "C" as const,
        terminology: { primary: c.term, language: c.lang },
        standardLimits: { widthM: c.w },
        escortThresholds: c.thresholds.map(t => ({ condition: t.c, escortsRequired: t.n, escortType: t.t, notes: ("notes" in t ? t.notes : undefined) as string | undefined })),
        permitSystem: { authority: c.auth },
        equipment: ["Warning signs", "Amber lights", "Communication devices"],
        dataQuality: c.dq,
        voiceAnswer: c.va,
    })),

    // ══════════════════════════════════════════════════════════
    // TIER D — SLATE (25 countries)
    // ══════════════════════════════════════════════════════════
    ...([
        { code: "UY", name: "Uruguay", lang: "es", term: "vehículo escolta", w: 2.60, auth: "MTOP", va: "In Uruguay, oversize loads require permits from the Ministry of Transport (MTOP). Escorts may be needed when width exceeds about 3 meters. Police escorts may be required for very large loads on national routes." },
        { code: "PA", name: "Panama", lang: "es", term: "vehículo escolta", w: 2.60, auth: "ATTT", va: "In Panama, oversize transport requires permits from the Transit and Land Transport Authority (ATTT). Escort vehicles may be required for loads exceeding standard width limits on the Pan-American Highway and urban corridors." },
        { code: "CR", name: "Costa Rica", lang: "es", term: "vehículo escolta", w: 2.60, auth: "MOPT", va: "In Costa Rica, oversize loads require permits from MOPT. Due to narrow mountainous roads, escort vehicles are commonly required for wide loads. Night transport may be mandated for extremely large cargo." },
        { code: "IL", name: "Israel", lang: "he", term: "רכב ליווי", w: 2.55, auth: "Ministry of Transport", va: "In Israel, oversize loads exceeding 2.55 meters wide require permits from the Ministry of Transport. Escort vehicles with flashing lights are required for loads wider than 3 meters. Police coordination is needed for loads exceeding 4 meters wide." },
        { code: "NG", name: "Nigeria", lang: "en", term: "escort vehicle", w: 2.60, auth: "FRSC / State Transport Authority", va: "In Nigeria, oversize loads require permits coordinated through the Federal Road Safety Corps. Escort vehicles are needed for wide loads on federal highways. Police escorts are commonly required for high-value or extremely large cargo." },
        { code: "EG", name: "Egypt", lang: "ar", term: "سيارة مرافقة", w: 2.55, auth: "General Authority for Roads, Bridges and Land Transport", va: "In Egypt, oversize transport requires permits from the General Authority for Roads, Bridges and Land Transport. Escort vehicles and traffic police coordination are required for loads exceeding standard dimensions, especially on the Cairo-Alexandria corridor." },
        { code: "KE", name: "Kenya", lang: "sw", term: "gari la kusindikiza", w: 2.60, auth: "KeNHA", va: "In Kenya, oversize loads require permits from the Kenya National Highways Authority (KeNHA). Escort vehicles with warning signs are required for wide loads. Police escorts may be needed for transport through Nairobi and major corridors." },
        { code: "MA", name: "Morocco", lang: "fr", term: "véhicule d'accompagnement", w: 2.55, auth: "Ministère de l'Équipement et du Transport", va: "In Morocco, oversize loads require permits from the Ministry of Equipment and Transport. French-style escort rules apply — loads wider than 3 meters typically require one or more escort vehicles. Night transport may be required for very large loads." },
        { code: "RS", name: "Serbia", lang: "sr", term: "prateće vozilo", w: 2.55, auth: "Putevi Srbije", va: "In Serbia, oversize transport requires permits from Putevi Srbije (Roads of Serbia). Civil escorts are required for loads wider than 3 meters. Police escorts may be needed for extreme dimensions, especially on the E-75 corridor." },
        { code: "UA", name: "Ukraine", lang: "uk", term: "автомобіль супроводу", w: 2.60, auth: "Ukravtodor", va: "In Ukraine, oversize loads require permits from Ukravtodor. Escort vehicles are required for loads exceeding 3.5 meters wide or 22 meters long. Traffic police accompaniment is mandatory for loads exceeding 5 meters wide." },
        { code: "KZ", name: "Kazakhstan", lang: "kk", term: "сүйемелдеу көлігі", w: 2.55, auth: "Committee for Roads", va: "In Kazakhstan, oversize transport across the vast steppe highway network requires permits from the Committee for Roads. Escort vehicles are required for wide loads, and police escorts are needed for transport through Astana and Almaty urban areas." },
        { code: "TW", name: "Taiwan", lang: "zh", term: "前導車", w: 2.50, auth: "MOTC", va: "In Taiwan, oversize loads require permits from the Ministry of Transportation and Communications. Escort vehicles are required for loads exceeding 3 meters wide. Due to dense traffic, night transport is often mandated for oversized cargo." },
        { code: "PK", name: "Pakistan", lang: "ur", term: "ایسکارٹ گاڑی", w: 2.60, auth: "National Highway Authority", va: "In Pakistan, oversize loads on national highways require permits from the National Highway Authority (NHA). Escort vehicles are commonly used for wide loads, with police escorts required on major corridors like the N-5 and M-2 motorway." },
        { code: "BD", name: "Bangladesh", lang: "bn", term: "এসকর্ট যান", w: 2.50, auth: "Roads and Highways Department", va: "In Bangladesh, oversize loads require permits from the Roads and Highways Department. Due to narrow roads and bridge weight limits, escort vehicles are commonly required. Movement is often restricted to nighttime in urban areas." },
        { code: "MN", name: "Mongolia", lang: "mn", term: "хамгаалалтын машин", w: 2.55, auth: "Ministry of Road and Transport", va: "In Mongolia, oversize transport across the sparse road network requires permits. Escort vehicles may be needed for wide loads, especially during the brief construction season when heavy equipment moves to mining sites." },
        { code: "TT", name: "Trinidad and Tobago", lang: "en", term: "escort vehicle", w: 2.55, auth: "Ministry of Works and Transport", va: "In Trinidad and Tobago, oversize loads require permits from the Ministry of Works and Transport. Escort vehicles with warning signs are required for wide loads, with police escorts for transport through Port of Spain." },
        { code: "JO", name: "Jordan", lang: "ar", term: "مركبة مرافقة", w: 2.55, auth: "Ministry of Transport", va: "In Jordan, oversize transport requires permits from the Ministry of Transport. Escort vehicles are required for loads exceeding standard dimensions, particularly on the Amman-Aqaba highway corridor." },
        { code: "GH", name: "Ghana", lang: "en", term: "escort vehicle", w: 2.60, auth: "Ghana Highway Authority", va: "In Ghana, oversize loads require permits from the Ghana Highway Authority. Escort vehicles with amber lights are required for wide loads on the Accra-Kumasi corridor and other trunk roads." },
        { code: "TZ", name: "Tanzania", lang: "sw", term: "gari la kusindikiza", w: 2.60, auth: "TANROADS", va: "In Tanzania, oversize loads require permits from the Tanzania National Roads Agency (TANROADS). Escort vehicles are needed for wide loads, especially on the Dar es Salaam to Dodoma corridor." },
        { code: "GE", name: "Georgia", lang: "ka", term: "თანმხლები მანქანა", w: 2.55, auth: "Roads Department", va: "In Georgia, oversize transport through the mountainous terrain requires permits from the Roads Department. Escort vehicles are needed for wide loads, especially through the Rikoti Pass and on the E-60 highway." },
        { code: "AZ", name: "Azerbaijan", lang: "az", term: "müşayiət avtomobili", w: 2.55, auth: "State Agency of Azerbaijan Automobile Roads", va: "In Azerbaijan, oversize loads require permits from the State Agency of Automobile Roads. Escort vehicles are required for wide loads, with police escorts for transport through Baku." },
        { code: "CY", name: "Cyprus", lang: "el", term: "όχημα συνοδείας", w: 2.55, auth: "Department of Public Works", va: "In Cyprus, oversize loads require permits from the Department of Public Works. Escort vehicles are required for loads exceeding 3 meters wide. Due to the island's compact road network, night transport is often mandated." },
        { code: "IS", name: "Iceland", lang: "is", term: "fylgdarbíll", w: 2.55, auth: "Vegagerðin (Road Administration)", va: "In Iceland, oversize transport requires permits from Vegagerðin. Escort vehicles are needed for wide loads on Route 1 (Ring Road) and highland roads during the limited summer transport season." },
        { code: "LU", name: "Luxembourg", lang: "fr", term: "véhicule d'accompagnement", w: 2.55, auth: "Administration des Ponts et Chaussées", va: "In Luxembourg, oversize loads follow Benelux-harmonized rules. Permits are issued by the Administration des Ponts et Chaussées. Escort vehicles are required for loads exceeding 3.5 meters wide, similar to Belgium and Netherlands." },
        { code: "EC", name: "Ecuador", lang: "es", term: "vehículo escolta", w: 2.60, auth: "Agencia Nacional de Tránsito", va: "In Ecuador, oversize loads require permits from the National Transit Agency. Escort vehicles are required for wide loads, especially on the Pan-American Highway and Andes mountain passages." },
    ] as const).map(c => ({
        countryCode: c.code,
        countryName: c.name,
        tier: "D" as const,
        terminology: { primary: c.term, language: c.lang },
        standardLimits: { widthM: c.w },
        escortThresholds: [
            { condition: "Width > ~3m or length > ~25–30m", escortsRequired: 1, escortType: "case_by_case" as const, notes: "Limited public documentation" },
        ],
        permitSystem: { authority: c.auth },
        equipment: ["Warning signs", "Amber lights"],
        dataQuality: "low" as const,
        voiceAnswer: c.va,
    })),

    // ══════════════════════════════════════════════════════════
    // TIER E — COPPER (41 countries)
    // ══════════════════════════════════════════════════════════
    ...([
        { code: "BO", name: "Bolivia", lang: "es", term: "vehículo escolta", w: 2.60, auth: "Administradora Boliviana de Carreteras", va: "In Bolivia, oversize loads require permits from ABC. Escort vehicles are needed for wide loads on the East-West Corridor and Altiplano highways. Mountain passes may require additional safety escorts." },
        { code: "PY", name: "Paraguay", lang: "es", term: "vehículo escolta", w: 2.60, auth: "MOPC", va: "In Paraguay, oversize transport requires permits from the Ministry of Public Works. Escort vehicles are needed for wide loads on Ruta 1 and Trans-Chaco Highway." },
        { code: "GT", name: "Guatemala", lang: "es", term: "vehículo escolta", w: 2.60, auth: "DGC (Dirección General de Caminos)", va: "In Guatemala, oversize loads require permits from the General Roads Directorate. Escort vehicles may be needed for transport on the Pan-American Highway and CA-9 corridor." },
        { code: "DO", name: "Dominican Republic", lang: "es", term: "vehículo escolta", w: 2.60, auth: "INTRANT", va: "In the Dominican Republic, oversize transport requires permits from INTRANT. Escort vehicles are needed for wide loads on the Autopista Duarte and main highways." },
        { code: "HN", name: "Honduras", lang: "es", term: "vehículo escolta", w: 2.60, auth: "INSEP", va: "In Honduras, oversize loads require permits from INSEP. Escort vehicles may be needed for transport on the CA-5 Northern Corridor." },
        { code: "SV", name: "El Salvador", lang: "es", term: "vehículo escolta", w: 2.60, auth: "FOVIAL", va: "In El Salvador, oversize transport requires permits from FOVIAL. Escort vehicles are needed for wide loads on the Pan-American Highway through the compact road network." },
        { code: "NI", name: "Nicaragua", lang: "es", term: "vehículo escolta", w: 2.60, auth: "MTI", va: "In Nicaragua, oversize loads require permits from the Ministry of Transport and Infrastructure. Escort vehicles may be needed for transport on the Pan-American Highway." },
        { code: "JM", name: "Jamaica", lang: "en", term: "escort vehicle", w: 2.55, auth: "National Works Agency", va: "In Jamaica, oversize loads require permits from the National Works Agency. Escort vehicles are needed for wide loads on the North-South Highway and coastal roads." },
        { code: "GY", name: "Guyana", lang: "en", term: "escort vehicle", w: 2.55, auth: "Ministry of Public Works", va: "In Guyana, oversize transport requires permits from the Ministry of Public Works. Escort vehicles may be needed for wide loads on the East Coast Highway and Georgetown corridors." },
        { code: "SR", name: "Suriname", lang: "nl", term: "begeleidingsvoertuig", w: 2.55, auth: "Ministry of Public Works", va: "In Suriname, oversize loads require permits from the Ministry of Public Works. Escort vehicles may be needed for transport on the main coastal highway." },
        { code: "BA", name: "Bosnia and Herzegovina", lang: "bs", term: "prateće vozilo", w: 2.55, auth: "Federal Ministry of Transport", va: "In Bosnia and Herzegovina, oversize transport follows EU-aligned rules. Permits are needed from the Federal Ministry of Transport. Escort vehicles are required for loads exceeding 3 meters wide." },
        { code: "ME", name: "Montenegro", lang: "sr", term: "prateće vozilo", w: 2.55, auth: "Ministry of Transport", va: "In Montenegro, oversize transport on the Adriatic coastal highway and mountain roads requires permits. Escort vehicles are needed for wide loads due to narrow roads and tunnel restrictions." },
        { code: "MK", name: "North Macedonia", lang: "mk", term: "придружно возило", w: 2.55, auth: "Public Enterprise for State Roads", va: "In North Macedonia, oversize loads require permits from the Public Enterprise for State Roads. Escort vehicles are needed for wide loads on the E-65 and Corridor X routes." },
        { code: "AL", name: "Albania", lang: "sq", term: "automjet shoqërues", w: 2.55, auth: "Albanian Road Authority", va: "In Albania, oversize transport requires permits from the Albanian Road Authority. Escort vehicles are needed for wide loads, especially on the Tirana-Durrës corridor and SH-8 highway." },
        { code: "MD", name: "Moldova", lang: "ro", term: "vehicul de însoțire", w: 2.55, auth: "State Road Administration", va: "In Moldova, oversize loads require permits from the State Road Administration. Escort vehicles are needed for wide loads on the M1 and M2 national highways." },
        { code: "IQ", name: "Iraq", lang: "ar", term: "سيارة مرافقة", w: 2.60, auth: "General Commission for Roads and Bridges", va: "In Iraq, oversize transport requires permits from the General Commission for Roads and Bridges. Escort vehicles and security coordination are needed for transport on the Baghdad-Basra highway and northern corridors." },
        { code: "NA", name: "Namibia", lang: "en", term: "escort vehicle", w: 2.60, auth: "Roads Authority", va: "In Namibia, oversize loads require permits from the Roads Authority. Escort vehicles are needed for wide loads on the B1 and B2 trunk roads. Due to long distances, convoy planning is essential." },
        { code: "AO", name: "Angola", lang: "pt", term: "veículo de escolta", w: 2.60, auth: "INEA", va: "In Angola, oversize transport requires permits from INEA (National Institute of Roads). Escort vehicles are needed for wide loads on the EN-100 and Luanda-Lobito corridor." },
        { code: "MZ", name: "Mozambique", lang: "pt", term: "veículo de escolta", w: 2.60, auth: "ANE (National Roads Administration)", va: "In Mozambique, oversize loads require permits from the National Roads Administration. Escort vehicles are needed for transport on the EN-1 and Maputo Corridor." },
        { code: "ET", name: "Ethiopia", lang: "am", term: "አጃቢ ተሸከርካሪ", w: 2.60, auth: "Ethiopian Roads Authority", va: "In Ethiopia, oversize transport requires permits from the Ethiopian Roads Authority. Escort vehicles are needed for wide loads on the Addis Ababa-Djibouti corridor and highland roads." },
        { code: "CI", name: "Côte d'Ivoire", lang: "fr", term: "véhicule d'accompagnement", w: 2.55, auth: "AGEROUTE", va: "In Côte d'Ivoire, oversize loads require permits from AGEROUTE. French-style escort rules may apply for loads exceeding 3 meters wide on the Abidjan-Yamoussoukro autoroute." },
        { code: "SN", name: "Senegal", lang: "fr", term: "véhicule d'accompagnement", w: 2.55, auth: "AGEROUTE Senegal", va: "In Senegal, oversize transport requires permits from AGEROUTE. Escort vehicles may be needed for wide loads on the Dakar-Thiès corridor and national highways." },
        { code: "BW", name: "Botswana", lang: "en", term: "escort vehicle", w: 2.60, auth: "Department of Roads", va: "In Botswana, oversize loads require permits from the Department of Roads. Escort vehicles are needed for wide loads on the A1 and A3 trunk roads." },
        { code: "ZM", name: "Zambia", lang: "en", term: "escort vehicle", w: 2.60, auth: "Road Development Agency", va: "In Zambia, oversize transport requires permits from the Road Development Agency. Escort vehicles are needed for wide loads on the T2 and T3 trunk roads and the Great East Road." },
        { code: "UG", name: "Uganda", lang: "en", term: "escort vehicle", w: 2.60, auth: "UNRA", va: "In Uganda, oversize loads require permits from the Uganda National Roads Authority (UNRA). Escort vehicles are needed for wide loads on the Northern Corridor highway." },
        { code: "CM", name: "Cameroon", lang: "fr", term: "véhicule d'accompagnement", w: 2.55, auth: "Ministry of Public Works", va: "In Cameroon, oversize transport requires permits from the Ministry of Public Works. Escort vehicles may be needed for loads on the Douala-Yaoundé corridor." },
        { code: "KH", name: "Cambodia", lang: "km", term: "រថយន្តអមដំណើរ", w: 2.50, auth: "Ministry of Public Works and Transport", va: "In Cambodia, oversize loads require permits from the Ministry of Public Works and Transport. Escort vehicles are needed for wide loads on National Routes 1, 4, and 5." },
        { code: "LK", name: "Sri Lanka", lang: "si", term: "ආවරණ වාහනය", w: 2.50, auth: "Road Development Authority", va: "In Sri Lanka, oversize transport requires permits from the Road Development Authority. Escort vehicles are needed for wide loads on the Colombo-Katunayake Expressway and Southern Expressway." },
        { code: "UZ", name: "Uzbekistan", lang: "uz", term: "kuzatuvchi avtomobil", w: 2.55, auth: "Roads Committee", va: "In Uzbekistan, oversize loads require permits from the Roads Committee. Escort vehicles are needed for wide loads on the M-39 and M-34 highways connecting Tashkent to regional centers." },
        { code: "LA", name: "Laos", lang: "lo", term: "ລົດຄຸ້ມກັນ", w: 2.50, auth: "Ministry of Public Works and Transport", va: "In Laos, oversize transport requires permits from the Ministry of Public Works and Transport. Escort vehicles may be needed for wide loads on Route 13 and the Vientiane-Luang Prabang corridor." },
        { code: "NP", name: "Nepal", lang: "ne", term: "एस्कोर्ट सवारी", w: 2.50, auth: "Department of Roads", va: "In Nepal, oversize loads require permits from the Department of Roads. Due to narrow mountain roads, escort vehicles are commonly required. The Kathmandu-Terai highway requires special coordination for wide loads." },
        { code: "DZ", name: "Algeria", lang: "ar", term: "سيارة مرافقة", w: 2.55, auth: "ANA (Agence Nationale des Autoroutes)", va: "In Algeria, oversize transport requires permits from the National Motorway Agency. Escort vehicles are needed for wide loads on the East-West Highway and Trans-Saharan routes." },
        { code: "TN", name: "Tunisia", lang: "ar", term: "سيارة مرافقة", w: 2.55, auth: "Ministry of Equipment and Housing", va: "In Tunisia, oversize loads require permits from the Ministry of Equipment. French-style escort rules apply for wide loads on the A1 and A3 autoroutes." },
        { code: "MT", name: "Malta", lang: "en", term: "escort vehicle", w: 2.50, auth: "Transport Malta", va: "In Malta, oversize loads require permits from Transport Malta. Due to extremely narrow roads, escort vehicles are commonly required for any load exceeding 2.5 meters wide. Night transport is often mandated." },
        { code: "BN", name: "Brunei", lang: "ms", term: "kenderaan pengiring", w: 2.55, auth: "Public Works Department", va: "In Brunei, oversize transport requires permits from the Public Works Department. Escort vehicles are needed for wide loads on the coastal highway." },
        { code: "RW", name: "Rwanda", lang: "en", term: "escort vehicle", w: 2.60, auth: "RTDA", va: "In Rwanda, oversize loads require permits from the Rwanda Transport Development Agency. Escort vehicles are needed for wide loads on the NR-1 and NR-4 national routes through hilly terrain." },
        { code: "MG", name: "Madagascar", lang: "fr", term: "véhicule d'accompagnement", w: 2.55, auth: "Ministry of Public Works", va: "In Madagascar, oversize transport requires permits. Escort vehicles may be needed for wide loads on Route Nationale 7 and other primary highways." },
        { code: "PG", name: "Papua New Guinea", lang: "en", term: "escort vehicle", w: 2.55, auth: "Department of Works", va: "In Papua New Guinea, oversize loads require permits from the Department of Works. Escort vehicles are needed for wide loads on the Highlands Highway and Lae-Nadzab corridor." },
        { code: "TM", name: "Turkmenistan", lang: "tk", term: "ugratma awtoulagy", w: 2.55, auth: "Ministry of Motor Transport", va: "In Turkmenistan, oversize transport requires permits from the Ministry of Motor Transport. Escort vehicles are required for wide loads on the M-1 highway and Ashgabat bypass." },
        { code: "KG", name: "Kyrgyzstan", lang: "ky", term: "коштоочу автоунаа", w: 2.55, auth: "Ministry of Transport and Roads", va: "In Kyrgyzstan, oversize loads require permits from the Ministry of Transport. Escort vehicles are needed for wide loads on the Bishkek-Osh highway through mountain passes." },
        { code: "MW", name: "Malawi", lang: "en", term: "escort vehicle", w: 2.60, auth: "Roads Authority", va: "In Malawi, oversize transport requires permits from the Roads Authority. Escort vehicles are needed for wide loads on the M-1 highway between Lilongwe and Blantyre." },
    ] as const).map(c => ({
        countryCode: c.code,
        countryName: c.name,
        tier: "E" as const,
        terminology: { primary: c.term, language: c.lang },
        standardLimits: { widthM: c.w },
        escortThresholds: [
            { condition: "Width > ~3m (estimated)", escortsRequired: 1, escortType: "case_by_case" as const, notes: "Frontier data — verify with local authority" },
        ],
        permitSystem: { authority: c.auth },
        equipment: ["Warning signs", "Amber lights"],
        dataQuality: "low" as const,
        voiceAnswer: c.va,
    })),
];

// ── Lookup Helpers ──

export function getRegulation(countryCode: string): CountryRegulation | undefined {
    return REGULATIONS.find(r => r.countryCode === countryCode);
}

export function getVoiceAnswer(countryCode: string): string {
    return getRegulation(countryCode)?.voiceAnswer ?? `Oversize transport regulations for this country require permits. Contact local transport authorities for escort requirements.`;
}

export function getEscortCount(countryCode: string, widthM: number): number {
    const reg = getRegulation(countryCode);
    if (!reg) return 1;
    // Simple heuristic: wider loads = more escorts
    const sorted = [...reg.escortThresholds].reverse();
    for (const t of sorted) {
        // Extract numeric threshold from condition string (rough parser)
        const match = t.condition.match(/(\d+\.?\d*)\s*m/);
        if (match && widthM >= parseFloat(match[1])) return t.escortsRequired;
    }
    return 0;
}

export function getPermitAuthority(countryCode: string): string {
    return getRegulation(countryCode)?.permitSystem.authority ?? "Local transport authority";
}

export function getLocalTerminology(countryCode: string): string {
    return getRegulation(countryCode)?.terminology.primary ?? "escort vehicle";
}

export function getCountriesByDataQuality(quality: "high" | "medium" | "low"): string[] {
    return REGULATIONS.filter(r => r.dataQuality === quality).map(r => r.countryCode);
}

export function getRegulationSummary(countryCode: string): string {
    const reg = getRegulation(countryCode);
    if (!reg) return "No regulation data available.";
    const limits = reg.standardLimits;
    return `${reg.countryName}: Oversize when width > ${limits.widthM}m${limits.heightM ? `, height > ${limits.heightM}m` : ""}${limits.lengthM ? `, length > ${limits.lengthM}m` : ""}. ${reg.escortThresholds.length} escort threshold(s). Permit: ${reg.permitSystem.authority}. Data: ${reg.dataQuality}.`;
}
