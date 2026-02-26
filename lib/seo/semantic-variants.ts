// ════════════════════════════════════════════════════════════════
// SEMANTIC VARIANT ENGINE + MULTILINGUAL KEYWORDS
// Source: hc-seo-expansion-pack-v1
// ════════════════════════════════════════════════════════════════

export type SupportedRegion = 'texas' | 'florida_southeast' | 'wisconsin_midwest' | 'canada_general' | 'default';

// Canonical term synonyms
export const TERM_VARIANTS = {
    pilot_car: ['pilot car', 'escort vehicle', 'escort car', 'lead car', 'chase car', 'escort truck'],
    oversize_load: ['oversize load', 'oversized load', 'wide load', 'heavy haul', 'super load', 'oversize convoy'],
    jobs: ['jobs', 'work', 'hiring', 'contracts', 'gigs'],
    service: ['service', 'services', 'company', 'companies'],
};

// Regional term preferences
const REGIONAL_BIAS: Record<SupportedRegion, { pilot_car: string; oversize: string; tone: string }> = {
    texas: { pilot_car: 'wide load escort', oversize: 'heavy haul', tone: 'blue-collar direct' },
    florida_southeast: { pilot_car: 'pilot car service', oversize: 'wide load', tone: 'service-oriented' },
    wisconsin_midwest: { pilot_car: 'pilot car operator', oversize: 'oversize load', tone: 'formal/compliance' },
    canada_general: { pilot_car: 'pilot car service', oversize: 'oversized load', tone: 'neutral/professional' },
    default: { pilot_car: 'pilot car service', oversize: 'oversize load', tone: 'balanced' },
};

export function detectRegion(state: string): SupportedRegion {
    if (['TX', 'OK', 'LA'].includes(state)) return 'texas';
    if (['FL', 'GA', 'SC', 'NC', 'AL'].includes(state)) return 'florida_southeast';
    if (['WI', 'IL', 'IN', 'OH', 'MN', 'MI'].includes(state)) return 'wisconsin_midwest';
    if (!state || ['ON', 'AB', 'BC', 'QC', 'SK', 'MB'].includes(state)) return 'canada_general';
    return 'default';
}

export function getSemanticVariants(city: string, state: string): string[] {
    const region = detectRegion(state);
    const bias = REGIONAL_BIAS[region];
    const c = `${city}, ${state}`;
    const variants = [
        `${bias.pilot_car} in ${c}`,
        `${bias.oversize} escort in ${c}`,
        `pilot car ${city} ${state}`,
        `escort vehicle service ${c}`,
        `wide load escort near ${city}`,
        `pilot car jobs in ${c}`,
        `hire pilot car escort ${city}`,
        `oversize load escort ${city}`,
        `certified pilot car driver ${state}`,
        `heavy haul escort ${city}`,
        `pilot car directory ${city} ${state}`,
        `pilot car company ${city}`,
    ];
    return [...new Set(variants)].slice(0, 12);
}

// ── Spanish (US) keywords ─────────────────────────────────────
export const KEYWORDS_ES_US = {
    core_services: [
        'carro piloto carga sobredimensionada',
        'escolta para carga ancha',
        'servicio de carro piloto',
        'escolta de carga pesada',
        'vehiculo escolta carga ancha',
    ],
    jobs: [
        'trabajos carro piloto',
        'empleo escolta carga sobredimensionada',
        'conductor carro piloto trabajo',
        'trabajo escolta carga pesada',
        'como ser conductor carro piloto',
    ],
    platform: [
        'aplicacion carro piloto',
        'bolsa de cargas sobredimensionadas',
        'directorio carro piloto',
        'app de escoltas de carga',
        'plataforma carro piloto',
    ],
    geoTemplate: (city: string, state: string) => [
        `carro piloto en ${city} ${state}`,
        `escolta carga ancha en ${city}`,
        `trabajos carro piloto ${state}`,
    ],
};

// ── French (Canada) keywords ──────────────────────────────────
export const KEYWORDS_FR_CA = {
    core_services: [
        'voiture pilote convoi exceptionnel',
        'service escorte chargement hors norme',
        'vehicule escorte transport lourd',
        'escorte convoi routier',
        'service voiture pilote',
    ],
    jobs: [
        'emploi voiture pilote',
        'travail escorte convoi exceptionnel',
        'chauffeur voiture pilote emploi',
        'devenir voiture pilote',
        'travail escorte transport lourd',
    ],
    platform: [
        'application voiture pilote',
        'repertoire voiture pilote',
        'tableau de chargements hors norme',
        'plateforme escorte routiere',
        'annuaire voiture pilote',
    ],
    geoTemplate: (city: string, province: string) => [
        `voiture pilote ${city} ${province}`,
        `escorte convoi exceptionnel ${province}`,
        `emploi voiture pilote ${province}`,
    ],
};

// ── Rural expansion config ─────────────────────────────────────
export const RURAL_EXPANSION_CONFIG = {
    population_band: { min: 500, max: 75000 },
    max_radius_miles: 75,
    national_targets: { us: 3800, ca: 1200 },
    priority_boosts: {
        interstate_within_15mi: 25,
        major_port_within_50mi: 20,
        border_crossing_within_40mi: 20,
        oil_wind_ag_region: 15,
        low_competitor_density: 30,
    },
};

// Killer Move #10 — Safe keyword expansion
export const KEYWORD_EXPANSION_SAFE = {
    commercial_extreme: [
        'hire escort vehicle near me',
        'pilot car company usa',
        'pilot car company canada',
        'book pilot car online',
        'find escort vehicle fast',
    ],
    driver_supply: [
        'become escort vehicle driver',
        'pilot car contractor work',
        'pilot car owner operator',
        'escort vehicle independent contractor',
    ],
    platform_gap: [
        'pilot car marketplace usa',
        'escort driver network',
        'oversize load matching platform',
        'heavy haul escort marketplace',
    ],
    lsi_expansion: [
        'pilot vehicle operator',
        'oversize convoy escort',
        'certified escort operator',
        'wide load lead vehicle',
        'rear pilot vehicle',
    ],
};
