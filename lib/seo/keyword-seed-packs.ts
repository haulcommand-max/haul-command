// ═══════════════════════════════════════════════════════════
// GLOBAL KEYWORD SEED PACKS — Country-by-country SEO terms
// Pattern: service_core × equipment_type × geo_modifier
// ═══════════════════════════════════════════════════════════

export interface KeywordSeedPack {
    country: string;
    iso2: string;
    languages: string[];
    coreTerms: string[];
    geoModifiers: string[];
    equipmentTerms: string[];
    regulatoryTerms: string[];
    urgencyModifiers: string[];
}

export const KEYWORD_SEED_PACKS: KeywordSeedPack[] = [
    // ── WAVE 1: Foundation ──
    {
        country: "United States",
        iso2: "US",
        languages: ["en"],
        coreTerms: [
            "pilot car services",
            "oversize load escort",
            "wide load escort",
            "heavy haul escort",
            "escort vehicle services",
            "route survey services",
            "height pole services",
        ],
        geoModifiers: [
            "texas", "california", "florida", "georgia", "louisiana",
            "ohio", "pennsylvania", "illinois", "new york", "michigan",
            "houston", "dallas", "los angeles", "jacksonville", "atlanta",
        ],
        equipmentTerms: [
            "wind turbine blade transport",
            "mobile home transport",
            "transformer transport",
            "crane transport",
            "steel beam transport",
            "boat transport",
            "farm equipment transport",
            "construction equipment transport",
        ],
        regulatoryTerms: [
            "oversize load permit",
            "wide load regulations",
            "pilot car requirements",
            "escort vehicle certification",
            "oversize load dimensions",
        ],
        urgencyModifiers: [
            "near me", "today", "same day", "emergency",
            "available now", "24/7", "this week",
        ],
    },
    {
        country: "Canada",
        iso2: "CA",
        languages: ["en", "fr"],
        coreTerms: [
            "pilot car services canada",
            "oversize load escort canada",
            "wide load escort",
            "heavy haul escort vehicle",
            "véhicule d'escorte surdimensionné",
            "transport hors normes escorte",
        ],
        geoModifiers: [
            "ontario", "alberta", "british columbia", "quebec",
            "saskatchewan", "manitoba", "toronto", "calgary",
            "vancouver", "edmonton", "winnipeg", "montreal",
        ],
        equipmentTerms: [
            "oil sands equipment transport",
            "mining equipment escort",
            "wind turbine transport canada",
            "prefab building transport",
            "forestry equipment transport",
        ],
        regulatoryTerms: [
            "oversize load permit canada",
            "pilot car requirements ontario",
            "alberta wide load regulations",
            "bc oversize load escort rules",
        ],
        urgencyModifiers: [
            "near me", "available today", "this week",
        ],
    },
    {
        country: "Australia",
        iso2: "AU",
        languages: ["en"],
        coreTerms: [
            "pilot vehicle australia",
            "oversize escort australia",
            "heavy haul escort australia",
            "over-dimensional transport escort",
            "OSOM transport escort",
            "pilot vehicle operator",
        ],
        geoModifiers: [
            "perth", "brisbane", "melbourne", "sydney",
            "regional wa", "queensland", "new south wales",
            "victoria", "south australia", "northern territory",
            "port hedland", "gladstone", "hunter valley",
        ],
        equipmentTerms: [
            "mining equipment transport",
            "wind turbine transport australia",
            "oversize machinery escort",
            "agricultural machinery transport",
            "modular building transport",
        ],
        regulatoryTerms: [
            "NHVR oversize permit",
            "pilot vehicle accreditation",
            "OSOM vehicle permit",
            "state road authority escort rules",
        ],
        urgencyModifiers: [
            "near me", "available today", "urgent",
        ],
    },
    {
        country: "United Kingdom",
        iso2: "GB",
        languages: ["en"],
        coreTerms: [
            "abnormal load escort uk",
            "escort vehicle uk",
            "wide load escort uk",
            "STGO escort services",
            "abnormal load police notification",
            "special types escort",
        ],
        geoModifiers: [
            "midlands", "greater london", "manchester",
            "scotland corridor", "north england",
            "wales", "birmingham", "leeds", "bristol",
            "port of felixstowe", "port of southampton",
        ],
        equipmentTerms: [
            "abnormal indivisible loads",
            "heavy plant transport",
            "modular transport uk",
            "transformer transport uk",
            "wind farm transport",
        ],
        regulatoryTerms: [
            "STGO regulations",
            "abnormal load notification",
            "highways england escort requirements",
            "police escort booking",
            "vehicle special orders",
        ],
        urgencyModifiers: [
            "near me", "urgent", "same day",
        ],
    },

    // ── WAVE 2: Expansion ──
    {
        country: "Germany",
        iso2: "DE",
        languages: ["de", "en"],
        coreTerms: [
            "schwertransport begleitung",
            "begleitschutz transport",
            "grossraumtransport escort",
            "überbreite ladung begleitung",
            "BF3 begleitfahrzeug",
            "BF4 begleitfahrzeug",
        ],
        geoModifiers: [
            "nrw", "bavaria", "hamburg port",
            "niedersachsen", "baden-württemberg",
            "duisburg", "bremerhaven", "frankfurt",
        ],
        equipmentTerms: [
            "windkraft transport",
            "industrieanlagen transport",
            "transformator transport",
            "stahlbau transport",
            "baumaschinen transport",
        ],
        regulatoryTerms: [
            "STVO schwertransport",
            "genehmigung grossraum",
            "begleitfahrzeug zulassung",
        ],
        urgencyModifiers: [
            "sofort verfügbar", "dringend", "heute",
        ],
    },
    {
        country: "Netherlands",
        iso2: "NL",
        languages: ["nl", "en"],
        coreTerms: [
            "zwaar transport begeleiding",
            "exceptioneel transport escort",
            "oversize load escort netherlands",
        ],
        geoModifiers: [
            "rotterdam port", "amsterdam", "eindhoven",
            "maastricht", "groningen",
        ],
        equipmentTerms: [
            "offshore transport", "windmolen transport",
            "zware machines transport",
        ],
        regulatoryTerms: [
            "RDW ontheffing", "exceptioneel transport vergunning",
        ],
        urgencyModifiers: ["direct beschikbaar", "vandaag"],
    },
    {
        country: "South Africa",
        iso2: "ZA",
        languages: ["en"],
        coreTerms: [
            "abnormal load escort south africa",
            "pilot vehicle south africa",
            "oversize load escort SA",
        ],
        geoModifiers: [
            "gauteng", "cape town", "durban",
            "mpumalanga", "free state", "richards bay",
        ],
        equipmentTerms: [
            "mining equipment transport",
            "renewable energy transport",
            "turbine transport south africa",
        ],
        regulatoryTerms: [
            "RTMS abnormal load permit",
            "NRTA pilot vehicle requirements",
        ],
        urgencyModifiers: ["available now", "urgent"],
    },
    {
        country: "New Zealand",
        iso2: "NZ",
        languages: ["en"],
        coreTerms: [
            "pilot vehicle new zealand",
            "oversize load escort nz",
            "over-dimension vehicle escort",
        ],
        geoModifiers: [
            "auckland", "christchurch", "wellington",
            "waikato", "canterbury", "southland",
        ],
        equipmentTerms: [
            "dairy equipment transport",
            "forestry equipment escort",
            "construction machinery transport",
        ],
        regulatoryTerms: [
            "NZTA overdimension permit",
            "pilot vehicle operator certification",
        ],
        urgencyModifiers: ["available today", "urgent"],
    },

    // ── WAVE 3: Scale ──
    {
        country: "Brazil",
        iso2: "BR",
        languages: ["pt"],
        coreTerms: [
            "escolta carga especial",
            "escolta rodoviaria pesada",
            "transporte superdimensionado",
            "veículo batedor",
            "escolta carga indivisível",
        ],
        geoModifiers: [
            "são paulo", "minas gerais", "paraná corridor",
            "rio grande do sul", "bahia", "goiás",
            "santos port", "paranaguá",
        ],
        equipmentTerms: [
            "máquinas agrícolas transporte",
            "transformadores transporte",
            "equipamento mineração transporte",
            "turbina eólica transporte",
        ],
        regulatoryTerms: [
            "AET autorização especial trânsito",
            "DNIT normas carga especial",
        ],
        urgencyModifiers: ["disponível agora", "urgente", "hoje"],
    },
    {
        country: "Mexico",
        iso2: "MX",
        languages: ["es"],
        coreTerms: [
            "escolta carga sobredimensionada",
            "vehículo piloto transporte especial",
            "escolta transporte pesado",
        ],
        geoModifiers: [
            "monterrey", "guadalajara", "ciudad de méxico",
            "veracruz port", "manzanillo", "chihuahua",
        ],
        equipmentTerms: [
            "transporte maquinaria pesada",
            "transporte equipo industrial",
            "transporte aerogeneradores",
        ],
        regulatoryTerms: [
            "SCT permiso carga especial",
            "NOM transporte sobredimensionado",
        ],
        urgencyModifiers: ["disponible ahora", "urgente", "hoy"],
    },
];

// ═══════════════════════════════════════════════════════════
// LONG-TAIL GENERATOR — Combine patterns programmatically
// ═══════════════════════════════════════════════════════════

export function generateLongTailKeywords(pack: KeywordSeedPack): string[] {
    const results: string[] = [];

    for (const core of pack.coreTerms) {
        // service + geo
        for (const geo of pack.geoModifiers) {
            results.push(`${core} ${geo}`);
            results.push(`${core} in ${geo}`);
            results.push(`${core} near ${geo}`);
        }
        // service + equipment
        for (const equip of pack.equipmentTerms) {
            results.push(`${core} ${equip}`);
        }
        // service + urgency
        for (const urgency of pack.urgencyModifiers) {
            results.push(`${core} ${urgency}`);
        }
    }

    // equipment + geo (cross products)
    for (const equip of pack.equipmentTerms) {
        for (const geo of pack.geoModifiers.slice(0, 5)) { // top 5 geos only
            results.push(`${equip} ${geo}`);
        }
    }

    return results;
}
