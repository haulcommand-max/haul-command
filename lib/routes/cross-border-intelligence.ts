// ══════════════════════════════════════════════════════════════
// CROSS-BORDER CORRIDOR INTELLIGENCE
// 10x Move #2: Nobody maps what happens when oversize loads
//              cross borders. Escort rules CHANGE at every
//              border. This module maps those transitions.
//
// WHY 10x: International heavy haul is a nightmare. If HC
//          can tell a broker "here's exactly what changes
//          when you cross from TX into MX," that's worth
//          enterprise money. Plus: every crossing = a page.
// ══════════════════════════════════════════════════════════════

export interface BorderCrossing {
    crossingId: string;
    name: string;
    fromCountry: string;
    toCountry: string;
    fromRegion: string; // state/province
    toRegion: string;
    crossingType: "road" | "bridge" | "tunnel" | "ferry";
    gpsLat: number;
    gpsLng: number;

    /** What changes at this border */
    regulationChanges: RegulationChange[];

    /** Crossing-specific requirements */
    crossingRequirements: string[];

    /** Estimated delay for oversize at this crossing */
    oversizeDelayHours: number;

    /** Whether escort is required THROUGH the crossing */
    escortThroughCrossing: boolean;

    /** Customs/permit considerations */
    customsNotes: string[];

    /** SEO page metadata */
    seoMeta: {
        url: string;
        title: string;
        metaDescription: string;
        voiceAnswer: string;
    };
}

export interface RegulationChange {
    category: "escort_count" | "escort_type" | "terminology" | "measurement_units" | "permit_authority" | "travel_hours" | "equipment" | "certification" | "speed_limit" | "weight_limit";
    fromRule: string;
    toRule: string;
    impact: "critical" | "significant" | "minor";
    actionRequired: string;
}

// ── Major Cross-Border Corridors ──

export const CROSS_BORDER_CORRIDORS: BorderCrossing[] = [
    // ═══ US ↔ Canada ═══
    {
        crossingId: "us-ca-detroit-windsor",
        name: "Ambassador Bridge (Detroit ↔ Windsor)",
        fromCountry: "US", toCountry: "CA", fromRegion: "MI", toRegion: "ON",
        crossingType: "bridge", gpsLat: 42.3125, gpsLng: -83.0756,
        regulationChanges: [
            { category: "permit_authority", fromRule: "Michigan DOT", toRule: "Ontario MTO", impact: "critical", actionRequired: "Obtain separate Ontario oversize permit" },
            { category: "measurement_units", fromRule: "Imperial (feet/lbs)", toRule: "Metric (meters/kg)", impact: "minor", actionRequired: "Convert all dimensions to metric for Canadian permit" },
            { category: "escort_count", fromRule: "MI: 1 escort > 12ft wide", toRule: "ON: 1 escort > 3.7m wide", impact: "significant", actionRequired: "Verify Ontario escort requirements for your dimensions" },
            { category: "certification", fromRule: "State-specific or reciprocal", toRule: "Ontario pilot car certification required", impact: "critical", actionRequired: "Ensure escort driver holds Ontario-recognized certification" },
        ],
        crossingRequirements: ["Advance notification to bridge authority", "Oversize escort may need to follow, not lead, across bridge", "Weight restrictions on Ambassador Bridge (check current limits)"],
        oversizeDelayHours: 2,
        escortThroughCrossing: true,
        customsNotes: ["ATA Carnet or customs bond for equipment", "Pre-clear cargo with CBSA", "TIP (Temporary Import Permit) if load stays in Canada temporarily"],
        seoMeta: {
            url: "/crossing/detroit-windsor-oversize",
            title: "Oversize Load: Detroit to Windsor Crossing Guide | Haul Command",
            metaDescription: "Cross the Ambassador Bridge with an oversize load. Michigan to Ontario regulation changes, escort requirements, permit swaps, and delay estimates.",
            voiceAnswer: "Crossing from Detroit to Windsor with an oversize load requires switching from a Michigan DOT permit to an Ontario MTO permit. Dimensions must be converted to metric. Ontario requires certified pilot car operators. Allow 2 hours for crossing delays.",
        },
    },
    {
        crossingId: "us-ca-buffalo-niagara",
        name: "Peace Bridge (Buffalo ↔ Fort Erie)",
        fromCountry: "US", toCountry: "CA", fromRegion: "NY", toRegion: "ON",
        crossingType: "bridge", gpsLat: 42.9064, gpsLng: -78.9042,
        regulationChanges: [
            { category: "permit_authority", fromRule: "New York DOT", toRule: "Ontario MTO", impact: "critical", actionRequired: "Obtain Ontario oversize permit" },
            { category: "escort_count", fromRule: "NY: 1 escort > 12ft, police possible > 16ft", toRule: "ON: 1 escort > 3.7m", impact: "significant", actionRequired: "Adjust escort plan for Ontario rules" },
        ],
        crossingRequirements: ["Advance booking for oversize crossing, limited windows", "Height clearance check on Peace Bridge"],
        oversizeDelayHours: 3,
        escortThroughCrossing: true,
        customsNotes: ["Pre-arrange CBSA clearance", "Cargo manifest required"],
        seoMeta: {
            url: "/crossing/buffalo-fort-erie-oversize",
            title: "Oversize Load: Buffalo to Fort Erie Crossing | Haul Command",
            metaDescription: "Peace Bridge oversize crossing guide. New York to Ontario escort changes, permit requirements, height limits.",
            voiceAnswer: "Crossing from Buffalo to Fort Erie via the Peace Bridge with an oversize load requires advance booking, an Ontario MTO permit, and certified Canadian escorts. Allow 3 hours for delays.",
        },
    },
    {
        crossingId: "us-ca-blaine-surrey",
        name: "Pacific Highway (Blaine ↔ Surrey)",
        fromCountry: "US", toCountry: "CA", fromRegion: "WA", toRegion: "BC",
        crossingType: "road", gpsLat: 49.0024, gpsLng: -122.7565,
        regulationChanges: [
            { category: "permit_authority", fromRule: "Washington DOT", toRule: "BC Ministry of Transportation", impact: "critical", actionRequired: "Obtain BC oversize permit" },
            { category: "certification", fromRule: "WA: no state cert required", toRule: "BC: pilot car certification mandatory", impact: "critical", actionRequired: "BC-certified escort required" },
            { category: "escort_type", fromRule: "Civilian escorts", toRule: "BC certified pilot with traffic control authority", impact: "significant", actionRequired: "Book BC-certified pilot car operator" },
        ],
        crossingRequirements: ["Pre-approval from border authority for oversize", "May need to split escort team at border"],
        oversizeDelayHours: 2.5,
        escortThroughCrossing: true,
        customsNotes: ["CBSA clearance", "BC requires separate provincial inspections"],
        seoMeta: {
            url: "/crossing/blaine-surrey-oversize",
            title: "Oversize Load: Blaine WA to Surrey BC | Haul Command",
            metaDescription: "Pacific Highway oversize crossing. Washington to BC escort certification changes, permit swap, delay estimates.",
            voiceAnswer: "Crossing from Washington to British Columbia with an oversize load requires BC-certified pilot car operators. Washington escorts cannot operate in BC. Allow 2.5 hours for crossing.",
        },
    },

    // ═══ US ↔ Mexico ═══
    {
        crossingId: "us-mx-laredo",
        name: "World Trade Bridge (Laredo ↔ Nuevo Laredo)",
        fromCountry: "US", toCountry: "MX", fromRegion: "TX", toRegion: "TAM",
        crossingType: "bridge", gpsLat: 27.5686, gpsLng: -99.5075,
        regulationChanges: [
            { category: "permit_authority", fromRule: "Texas DOT (TxDOT)", toRule: "SCT (Mexico)", impact: "critical", actionRequired: "Obtain Mexican federal transit permit from SCT" },
            { category: "terminology", fromRule: "Pilot car / escort vehicle", toRule: "Carro piloto / vehículo escolta", impact: "minor", actionRequired: "Use Spanish terminology in Mexico" },
            { category: "measurement_units", fromRule: "Imperial (feet/lbs)", toRule: "Metric (meters/kg)", impact: "minor", actionRequired: "Convert all dimensions to metric" },
            { category: "escort_type", fromRule: "US civilian escorts", toRule: "May require Federal Police escort in Mexico", impact: "critical", actionRequired: "Arrange Mexican escorts — US escorts cannot operate in Mexico" },
        ],
        crossingRequirements: ["Mexican customs broker required", "Vehicle must meet Mexican emissions standards or obtain temporary permit", "Oversize loads restricted to specific crossing times"],
        oversizeDelayHours: 4,
        escortThroughCrossing: false,
        customsNotes: ["Mexican customs clearance required", "TIP (Temporary Import Permit) for vehicle and equipment", "Insurance: Mexican liability policy mandatory"],
        seoMeta: {
            url: "/crossing/laredo-nuevo-laredo-oversize",
            title: "Oversize Load: Laredo TX to Nuevo Laredo Mexico | Haul Command",
            metaDescription: "Cross from Texas to Mexico with an oversize load. Permit swaps, escort changes, customs requirements, and delay estimates for Laredo crossing.",
            voiceAnswer: "Crossing from Laredo Texas to Mexico with an oversize load requires a Mexican SCT permit, Mexican escorts, and a customs broker. US escorts cannot operate in Mexico. Allow 4 hours for crossing delays.",
        },
    },

    // ═══ EU Internal (Schengen) ═══
    {
        crossingId: "de-nl-venlo",
        name: "A67/A40 (Germany ↔ Netherlands at Venlo)",
        fromCountry: "DE", toCountry: "NL", fromRegion: "NRW", toRegion: "LB",
        crossingType: "road", gpsLat: 51.3667, gpsLng: 6.1667,
        regulationChanges: [
            { category: "permit_authority", fromRule: "VEMAGS (Germany)", toRule: "RDW / INCO 92 (Netherlands)", impact: "critical", actionRequired: "Dutch permit required — German VEMAGS permit not valid in NL" },
            { category: "escort_type", fromRule: "BF3/BF4 certified Begleitfahrzeug", toRule: "Dutch begeleidingsvoertuig (different certification)", impact: "critical", actionRequired: "Switch escort team at border — German BF3 not valid in NL" },
            { category: "terminology", fromRule: "Begleitfahrzeug / Schwertransport", toRule: "Begeleidingsvoertuig / exceptioneel transport", impact: "minor", actionRequired: "Use Dutch terminology in Netherlands" },
            { category: "equipment", fromRule: "German BF signs", toRule: "CONVOI EXCEPTIONNEL signs", impact: "significant", actionRequired: "Swap signage at border" },
        ],
        crossingRequirements: ["No physical border check (Schengen) but escort swap required", "Coordinate timing for escort team handoff"],
        oversizeDelayHours: 1,
        escortThroughCrossing: false,
        customsNotes: ["No customs within Schengen", "But separate transport permits still required per country"],
        seoMeta: {
            url: "/crossing/germany-netherlands-oversize",
            title: "Oversize Load: Germany to Netherlands Crossing | Haul Command",
            metaDescription: "Crossing from Germany to Netherlands with a Schwertransport. BF3/BF4 to Dutch escort swap, VEMAGS to RDW permit change, signage requirements.",
            voiceAnswer: "Crossing from Germany to the Netherlands with an oversize load requires switching from German BF3 escorts to Dutch escorts at the border. You also need a separate Dutch RDW permit. German VEMAGS permits are not valid in the Netherlands.",
        },
    },
    {
        crossingId: "de-fr-kehl",
        name: "Europabrücke (Germany ↔ France at Kehl/Strasbourg)",
        fromCountry: "DE", toCountry: "FR", fromRegion: "BW", toRegion: "GES",
        crossingType: "bridge", gpsLat: 48.5738, gpsLng: 7.7989,
        regulationChanges: [
            { category: "permit_authority", fromRule: "VEMAGS (Germany)", toRule: "DREAL/Préfecture (France)", impact: "critical", actionRequired: "French TE permit required" },
            { category: "escort_type", fromRule: "BF3/BF4 certified", toRule: "French véhicule d'accompagnement", impact: "critical", actionRequired: "Switch to French escort team" },
            { category: "equipment", fromRule: "German BF signs", toRule: "CONVOI EXCEPTIONNEL signs", impact: "significant", actionRequired: "Swap all signage to French requirements" },
        ],
        crossingRequirements: ["Escort swap at border area", "French escort must have CONVOI EXCEPTIONNEL equipment"],
        oversizeDelayHours: 1.5,
        escortThroughCrossing: false,
        customsNotes: ["No customs (Schengen)", "Separate national transport permits required"],
        seoMeta: {
            url: "/crossing/germany-france-oversize",
            title: "Oversize Load: Germany to France Crossing | Haul Command",
            metaDescription: "Schwertransport to convoi exceptionnel. German to French escort swap, VEMAGS to DREAL permit change.",
            voiceAnswer: "Crossing from Germany to France with an oversize load means switching from BF3 German escorts to French escorts with CONVOI EXCEPTIONNEL signs. You need a separate French transport exceptionnel permit from the local DREAL.",
        },
    },

    // ═══ Other Critical Crossings ═══
    {
        crossingId: "gb-fr-eurotunnel",
        name: "Channel Tunnel (UK ↔ France)",
        fromCountry: "GB", toCountry: "FR", fromRegion: "KEN", toRegion: "HDF",
        crossingType: "tunnel", gpsLat: 51.0948, gpsLng: 1.1175,
        regulationChanges: [
            { category: "escort_type", fromRule: "UK self-escort (STGO)", toRule: "French TE escorts required", impact: "critical", actionRequired: "Arrange French convoy exceptionnel escorts for arrival" },
            { category: "terminology", fromRule: "Abnormal load", toRule: "Transport exceptionnel / convoi exceptionnel", impact: "minor", actionRequired: "Use French terminology" },
            { category: "measurement_units", fromRule: "Imperial (UK permits)", toRule: "Metric (French permits)", impact: "minor", actionRequired: "Convert dimensions" },
        ],
        crossingRequirements: ["Eurotunnel has strict height/width limits for shuttle", "Pre-book oversize slot (limited capacity)", "May need to use ferry instead for very large loads"],
        oversizeDelayHours: 3,
        escortThroughCrossing: false,
        customsNotes: ["Post-Brexit: customs declarations required", "ATA Carnet recommended", "EORI number needed"],
        seoMeta: {
            url: "/crossing/uk-france-channel-tunnel-oversize",
            title: "Oversize Load: UK to France via Channel Tunnel | Haul Command",
            metaDescription: "Moving abnormal loads from UK to France. STGO to transport exceptionnel, escort swaps, Eurotunnel restrictions, post-Brexit customs.",
            voiceAnswer: "Moving an oversize load from the UK to France via the Channel Tunnel requires pre-booking an oversize slot. UK escorts cannot operate in France. You need French transport exceptionnel permits and escorts on arrival. Post-Brexit customs declarations are required.",
        },
    },
    {
        crossingId: "za-mz-lebombo",
        name: "Lebombo/Ressano Garcia (South Africa ↔ Mozambique)",
        fromCountry: "ZA", toCountry: "MZ", fromRegion: "MP", toRegion: "MAP",
        crossingType: "road", gpsLat: -25.4833, gpsLng: 31.9833,
        regulationChanges: [
            { category: "escort_type", fromRule: "ZA: tiered escort (1-2 civil + police for >4.5m)", toRule: "MZ: case-by-case, police coordination", impact: "critical", actionRequired: "Arrange Mozambican escorts at border" },
        ],
        crossingRequirements: ["Border delays common (4-8 hours)", "Mozambican transport permit required"],
        oversizeDelayHours: 6,
        escortThroughCrossing: false,
        customsNotes: ["Full customs clearance required", "Local agent strongly recommended"],
        seoMeta: {
            url: "/crossing/south-africa-mozambique-oversize",
            title: "Oversize Load: South Africa to Mozambique | Haul Command",
            metaDescription: "Lebombo border crossing with oversize load. SA to Mozambique escort, permit, and customs guide.",
            voiceAnswer: "Crossing from South Africa to Mozambique with an oversize load at Lebombo can take 4 to 8 hours. You need a Mozambican transport permit and local escorts. A local agent is strongly recommended.",
        },
    },
];

// ── Border Crossing Lookup ──

export function findCrossingsBetween(from: string, to: string): BorderCrossing[] {
    return CROSS_BORDER_CORRIDORS.filter(c =>
        (c.fromCountry === from && c.toCountry === to) ||
        (c.fromCountry === to && c.toCountry === from)
    );
}

export function getCriticalRegulationChanges(crossingId: string): RegulationChange[] {
    const crossing = CROSS_BORDER_CORRIDORS.find(c => c.crossingId === crossingId);
    return crossing?.regulationChanges.filter(r => r.impact === "critical") ?? [];
}

export function getEstimatedCrossingDelay(crossingId: string): number {
    return CROSS_BORDER_CORRIDORS.find(c => c.crossingId === crossingId)?.oversizeDelayHours ?? 4;
}

export function getAllCrossingPages(): BorderCrossing["seoMeta"][] {
    return CROSS_BORDER_CORRIDORS.map(c => c.seoMeta);
}
