// ══════════════════════════════════════════════════════════════
// LONG-TAIL DOMINATION ENGINE
// Combinatorial keyword expansion across 4 dimensions:
//   1. Service    (pilot car, oversize escort, etc.)
//   2. Equipment  (wind turbine, mobile home, crane, etc.)
//   3. Geo        (country > state > city > micro-geo)
//   4. Modifiers  (near me, emergency, weekend, etc.)
//
// Output: slug + metadata for programmatic page generation
// ══════════════════════════════════════════════════════════════

import { COUNTRY_KEYWORD_SEEDS, type CountryKeywordSeed } from './global-keyword-matrix';
import { getEscortTerminology } from './escort-terminology';

// ═══════════════════════════════════════════════
// DIMENSION 1: CORE SERVICE TERMS
// ═══════════════════════════════════════════════

export interface ServiceTerm {
    slug: string;
    label: string;
    /** Localized variants per country ISO2 */
    localized: Record<string, string[]>;
}

export const CORE_SERVICES: ServiceTerm[] = [
    {
        slug: 'pilot-car',
        label: 'Pilot Car Service',
        localized: {
            US: ['pilot car service', 'pilot car', 'pilot vehicle'],
            CA: ['pilot car service', 'pilot vehicle', 'escort vehicle service'],
            GB: ['escort vehicle service', 'abnormal load escort'],
            AU: ['escort vehicle service', 'pilot vehicle service'],
            DE: ['Begleitfahrzeug', 'BF3 Escort'],
            NL: ['begeleidingsvoertuig'],
            BR: ['veículo batedor', 'escolta de carga'],
            FR: ["véhicule d'accompagnement", 'voiture pilote'],
            IT: ['veicolo di scorta', 'scorta tecnica'],
            ZA: ['escort vehicle', 'pilot car'],
        },
    },
    {
        slug: 'oversize-escort',
        label: 'Oversize Load Escort',
        localized: {
            US: ['oversize load escort', 'oversize escort', 'wide load escort'],
            CA: ['oversize escort', 'oversize load escort'],
            GB: ['abnormal load escort', 'STGO escort'],
            AU: ['oversize escort', 'over-dimension escort'],
            DE: ['Schwertransport Begleitung', 'Überbreite Begleitung'],
            NL: ['exceptioneel transport begeleiding'],
            FR: ['convoi exceptionnel escorte'],
        },
    },
    {
        slug: 'heavy-haul-escort',
        label: 'Heavy Haul Escort',
        localized: {
            US: ['heavy haul escort', 'heavy transport escort'],
            CA: ['heavy haul escort'],
            GB: ['heavy haulage escort', 'special order escort'],
            AU: ['heavy haulage escort'],
            DE: ['Schwerlastbegleitung'],
        },
    },
];

// ═══════════════════════════════════════════════
// DIMENSION 2: EQUIPMENT MODIFIERS
// ═══════════════════════════════════════════════

export interface EquipmentModifier {
    slug: string;
    label: string;
    keywords: string[];
    /** Which countries this equipment type is common in */
    commonIn: string[];
}

export const EQUIPMENT_MODIFIERS: EquipmentModifier[] = [
    { slug: 'wind-turbine', label: 'Wind Turbine', keywords: ['wind turbine escort', 'wind turbine blade transport', 'wind energy escort'], commonIn: ['US', 'CA', 'DE', 'GB', 'AU', 'BR', 'FR', 'ES', 'SE', 'DK'] },
    { slug: 'mobile-home', label: 'Mobile Home', keywords: ['mobile home escort', 'manufactured home transport', 'single wide escort', 'double wide escort'], commonIn: ['US', 'CA'] },
    { slug: 'crane', label: 'Crane Transport', keywords: ['crane transport escort', 'crane move escort', 'crawler crane escort'], commonIn: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'] },
    { slug: 'bridge-beam', label: 'Bridge Beam', keywords: ['bridge beam escort', 'bridge girder escort', 'precast beam transport'], commonIn: ['US', 'CA', 'GB', 'AU'] },
    { slug: 'transformer', label: 'Transformer Transport', keywords: ['transformer transport escort', 'power transformer escort', 'electrical transformer move'], commonIn: ['US', 'CA', 'GB', 'AU', 'DE'] },
    { slug: 'mining-equipment', label: 'Mining Equipment', keywords: ['mining equipment escort', 'haul truck escort', 'mining vehicle transport'], commonIn: ['US', 'CA', 'AU', 'ZA', 'CL', 'BR'] },
    { slug: 'prefab-house', label: 'Prefab/Modular House', keywords: ['prefab house escort', 'modular building transport', 'modular home escort'], commonIn: ['US', 'CA', 'AU', 'NZ', 'SE', 'FI'] },
    { slug: 'construction-equipment', label: 'Construction Equipment', keywords: ['construction equipment escort', 'excavator transport escort', 'bulldozer escort'], commonIn: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'] },
    { slug: 'boat', label: 'Boat/Yacht Transport', keywords: ['boat transport escort', 'yacht escort', 'vessel transport escort'], commonIn: ['US', 'CA', 'AU', 'GB', 'IT', 'FR'] },
    { slug: 'military-equipment', label: 'Military Equipment', keywords: ['military equipment escort', 'defense transport escort', 'military vehicle escort'], commonIn: ['US', 'CA', 'GB', 'DE', 'FR'] },
];

// ═══════════════════════════════════════════════
// DIMENSION 3: GEO MODIFIERS
// ═══════════════════════════════════════════════

export interface GeoLevel {
    type: 'country' | 'state' | 'city' | 'micro';
    slug: string;
    label: string;
    country: string;
    /** Parent geo slug (e.g., state slug for a city) */
    parent?: string;
}

/** Micro-geo keywords — high ROI, low competition */
export const MICRO_GEO_SUFFIXES = [
    { slug: 'near-port', label: 'Near Port', keywords: ['near port', 'port area', 'port terminal'] },
    { slug: 'near-terminal', label: 'Near Terminal', keywords: ['near terminal', 'freight terminal', 'cargo terminal'] },
    { slug: 'near-industrial-park', label: 'Near Industrial Park', keywords: ['near industrial park', 'industrial zone', 'industrial estate'] },
    { slug: 'near-refinery', label: 'Near Refinery', keywords: ['near refinery', 'petrochemical', 'oil refinery'] },
    { slug: 'near-wind-farm', label: 'Near Wind Farm', keywords: ['near wind farm', 'wind energy site', 'wind turbine site'] },
    { slug: 'near-power-plant', label: 'Near Power Plant', keywords: ['near power plant', 'power station', 'energy facility'] },
    { slug: 'near-military-base', label: 'Near Military Base', keywords: ['near military base', 'defense installation'] },
    { slug: 'near-shipyard', label: 'Near Shipyard', keywords: ['near shipyard', 'ship building', 'naval yard'] },
];

// ═══════════════════════════════════════════════
// DIMENSION 4: INTENT/SCENARIO MODIFIERS
// ═══════════════════════════════════════════════

export interface IntentModifier {
    slug: string;
    label: string;
    keywords: string[];
    /** Priority for page generation (1 = highest) */
    priority: number;
    /** Is "near me" a strong variant? */
    nearMeBoosted: boolean;
}

export const INTENT_MODIFIERS: IntentModifier[] = [
    // Near-me (critical)
    { slug: 'near-me', label: 'Near Me', keywords: ['near me'], priority: 1, nearMeBoosted: true },
    { slug: 'near-me-open-now', label: 'Open Now Near Me', keywords: ['near me open now', 'near me available now'], priority: 1, nearMeBoosted: true },
    { slug: 'available-now', label: 'Available Now', keywords: ['available now', 'available today', 'open today'], priority: 1, nearMeBoosted: true },

    // Emergency
    { slug: 'emergency', label: 'Emergency', keywords: ['emergency', 'urgent', 'immediate'], priority: 2, nearMeBoosted: true },
    { slug: 'last-minute', label: 'Last Minute', keywords: ['last minute', 'same day', 'next day'], priority: 2, nearMeBoosted: true },
    { slug: '24-hour', label: '24 Hour', keywords: ['24 hour', '24/7', 'round the clock'], priority: 2, nearMeBoosted: true },

    // Time-based
    { slug: 'weekend', label: 'Weekend', keywords: ['weekend', 'Saturday', 'Sunday'], priority: 3, nearMeBoosted: false },
    { slug: 'night-move', label: 'Night Move', keywords: ['night move', 'night escort', 'nighttime', 'overnight'], priority: 3, nearMeBoosted: false },
    { slug: 'holiday', label: 'Holiday', keywords: ['holiday', 'holiday escort', 'holiday transport'], priority: 3, nearMeBoosted: false },

    // Compliance (snippet gold)
    { slug: 'requirements', label: 'Requirements', keywords: ['requirements', 'escort requirements', 'when escort is required'], priority: 2, nearMeBoosted: false },
    { slug: 'permit-rules', label: 'Permit Rules', keywords: ['permit rules', 'permit required', 'oversize permit'], priority: 2, nearMeBoosted: false },
    { slug: 'escort-laws', label: 'Escort Laws', keywords: ['escort laws', 'escort regulations', 'escort rules'], priority: 2, nearMeBoosted: false },
    { slug: 'cost', label: 'Cost', keywords: ['cost', 'how much does', 'price', 'rates'], priority: 2, nearMeBoosted: false },

    // Scenario
    { slug: 'route-survey', label: 'Route Survey', keywords: ['route survey', 'route survey required', 'pre-route survey'], priority: 4, nearMeBoosted: false },
    { slug: 'police-escort', label: 'Police Escort', keywords: ['police escort coordination', 'police escort required', 'law enforcement escort'], priority: 3, nearMeBoosted: false },
];

// ═══════════════════════════════════════════════
// COMBINATORIAL EXPANSION ENGINE
// ═══════════════════════════════════════════════

export interface LongTailPage {
    slug: string;
    title: string;
    h1: string;
    metaDescription: string;
    /** Primary keyword target */
    primaryKeyword: string;
    /** Secondary keywords */
    secondaryKeywords: string[];
    /** Page template type */
    template: 'service_geo' | 'service_equipment_geo' | 'near_me' | 'compliance' | 'emergency' | 'corridor';
    /** Dimensions used */
    service: string;
    equipment?: string;
    geoCountry: string;
    geoState?: string;
    geoCity?: string;
    modifier?: string;
    /** Internal linking targets */
    upwardLinks: string[];
    sidewaysLinks: string[];
    downwardLinks: string[];
    /** Snippet blocks to include */
    snippetBlocks: SnippetBlockType[];
    /** Priority (1 = critical, 5 = nice-to-have) */
    priority: number;
}

export type SnippetBlockType = 'definition' | 'steps' | 'quick_table' | 'faq' | 'cost_range' | 'regulation_summary';

/**
 * Generate all long-tail page combinations for a country.
 * This is the core expansion function.
 */
export function generateLongTailPages(
    countryIso2: string,
    states: string[],
    topCities: string[],
    options?: {
        maxPages?: number;
        serviceSlugs?: string[];
        includeEquipment?: boolean;
        includeModifiers?: boolean;
    }
): LongTailPage[] {
    const maxPages = options?.maxPages ?? 10000;
    const includeEquipment = options?.includeEquipment ?? true;
    const includeModifiers = options?.includeModifiers ?? true;
    const pages: LongTailPage[] = [];

    const terminology = getEscortTerminology(countryIso2);
    const countryName = getCountryName(countryIso2);

    const services = options?.serviceSlugs
        ? CORE_SERVICES.filter(s => options.serviceSlugs!.includes(s.slug))
        : CORE_SERVICES;

    for (const service of services) {
        const localTerms = service.localized[countryIso2] ?? [service.label.toLowerCase()];
        const primaryTerm = localTerms[0];

        // ── Tier 1: Service + Country
        pages.push(buildPage({
            slug: `${service.slug}/${countryIso2.toLowerCase()}`,
            service, primaryTerm, countryIso2, countryName,
            template: 'service_geo',
            priority: 1,
            snippetBlocks: ['definition', 'steps', 'faq', 'quick_table'],
        }));

        // ── Tier 2: Service + State
        for (const state of states) {
            const stateSlug = slugify(state);
            pages.push(buildPage({
                slug: `${service.slug}/${countryIso2.toLowerCase()}/${stateSlug}`,
                service, primaryTerm, countryIso2, countryName,
                geoState: state,
                template: 'service_geo',
                priority: 2,
                snippetBlocks: ['definition', 'faq', 'quick_table', 'regulation_summary'],
            }));

            if (pages.length >= maxPages) return pages;
        }

        // ── Tier 3: Service + City
        for (const city of topCities) {
            const citySlug = slugify(city);
            pages.push(buildPage({
                slug: `${service.slug}/${countryIso2.toLowerCase()}/${citySlug}`,
                service, primaryTerm, countryIso2, countryName,
                geoCity: city,
                template: 'service_geo',
                priority: 2,
                snippetBlocks: ['definition', 'faq', 'cost_range'],
            }));

            if (pages.length >= maxPages) return pages;
        }

        // ── Tier 4: Service + Equipment + Geo
        if (includeEquipment) {
            const relevantEquipment = EQUIPMENT_MODIFIERS.filter(e => e.commonIn.includes(countryIso2));
            for (const equip of relevantEquipment) {
                // Equipment + Country
                pages.push(buildPage({
                    slug: `${service.slug}/${equip.slug}/${countryIso2.toLowerCase()}`,
                    service, primaryTerm, countryIso2, countryName,
                    equipment: equip,
                    template: 'service_equipment_geo',
                    priority: 3,
                    snippetBlocks: ['definition', 'quick_table', 'faq'],
                }));

                // Equipment + Top States
                for (const state of states.slice(0, 10)) {
                    pages.push(buildPage({
                        slug: `${service.slug}/${equip.slug}/${countryIso2.toLowerCase()}/${slugify(state)}`,
                        service, primaryTerm, countryIso2, countryName,
                        geoState: state, equipment: equip,
                        template: 'service_equipment_geo',
                        priority: 4,
                        snippetBlocks: ['faq', 'quick_table'],
                    }));
                    if (pages.length >= maxPages) return pages;
                }
            }
        }

        // ── Tier 5: Service + Modifier + Geo
        if (includeModifiers) {
            for (const mod of INTENT_MODIFIERS) {
                // Modifier + Country
                pages.push(buildPage({
                    slug: `${service.slug}/${mod.slug}/${countryIso2.toLowerCase()}`,
                    service, primaryTerm, countryIso2, countryName,
                    modifier: mod,
                    template: mod.nearMeBoosted ? 'near_me' : mod.slug.includes('requirement') || mod.slug.includes('law') || mod.slug.includes('permit') ? 'compliance' : 'emergency',
                    priority: mod.priority,
                    snippetBlocks: mod.slug.includes('requirement') || mod.slug.includes('law')
                        ? ['definition', 'steps', 'quick_table', 'faq']
                        : ['faq', 'cost_range'],
                }));

                // Modifier + top states
                for (const state of states.slice(0, 15)) {
                    pages.push(buildPage({
                        slug: `${service.slug}/${mod.slug}/${countryIso2.toLowerCase()}/${slugify(state)}`,
                        service, primaryTerm, countryIso2, countryName,
                        geoState: state, modifier: mod,
                        template: mod.nearMeBoosted ? 'near_me' : 'compliance',
                        priority: mod.priority + 1,
                        snippetBlocks: ['faq'],
                    }));
                    if (pages.length >= maxPages) return pages;
                }
            }
        }
    }

    return pages;
}

// ── Helpers ──

function buildPage(args: {
    slug: string;
    service: ServiceTerm;
    primaryTerm: string;
    countryIso2: string;
    countryName: string;
    geoState?: string;
    geoCity?: string;
    equipment?: EquipmentModifier;
    modifier?: IntentModifier;
    template: LongTailPage['template'];
    priority: number;
    snippetBlocks: SnippetBlockType[];
}): LongTailPage {
    const { service, primaryTerm, countryIso2, countryName, geoState, geoCity, equipment, modifier, template, priority, snippetBlocks } = args;

    const geo = geoCity ?? geoState ?? countryName;
    const equipLabel = equipment?.label ?? '';
    const modLabel = modifier?.label ?? '';

    const titleParts = [
        primaryTerm,
        equipLabel ? `for ${equipLabel}` : '',
        modLabel && modifier?.nearMeBoosted ? modLabel : '',
        `in ${geo}`,
        modLabel && !modifier?.nearMeBoosted ? `— ${modLabel}` : '',
    ].filter(Boolean);

    const title = titleize(titleParts.join(' '));
    const h1 = title;
    const primaryKeyword = [primaryTerm, equipLabel.toLowerCase(), geo.toLowerCase(), modLabel.toLowerCase()].filter(Boolean).join(' ');

    const secondaryKeywords: string[] = [];
    const localTerms = service.localized[countryIso2] ?? [primaryTerm];
    for (const t of localTerms.slice(1, 4)) {
        secondaryKeywords.push([t, geo.toLowerCase()].join(' '));
    }
    if (modifier) {
        secondaryKeywords.push(...modifier.keywords.map(k => `${primaryTerm} ${k} ${geo.toLowerCase()}`));
    }

    const metaDescription = buildMetaDescription(primaryTerm, geo, equipLabel, modLabel, countryIso2);

    // Internal links
    const upwardLinks = buildUpwardLinks(args.slug, countryIso2, geoState, geoCity);
    const sidewaysLinks = buildSidewaysLinks(service.slug, countryIso2, equipment, modifier);
    const downwardLinks = buildDownwardLinks(service.slug, countryIso2, geoState, geoCity);

    return {
        slug: args.slug,
        title, h1, metaDescription,
        primaryKeyword,
        secondaryKeywords,
        template,
        service: service.slug,
        equipment: equipment?.slug,
        geoCountry: countryIso2,
        geoState,
        geoCity,
        modifier: modifier?.slug,
        upwardLinks, sidewaysLinks, downwardLinks,
        snippetBlocks,
        priority,
    };
}

function buildMetaDescription(term: string, geo: string, equip: string, mod: string, country: string): string {
    const parts = [
        `Find verified ${term} providers`,
        equip ? ` for ${equip.toLowerCase()} transport` : '',
        ` in ${geo}.`,
        mod ? ` ${mod} service available.` : '',
        ' Compare operators, rates, and reviews on Haul Command.',
    ];
    return parts.join('').slice(0, 160);
}

function buildUpwardLinks(slug: string, country: string, state?: string, city?: string): string[] {
    const links: string[] = [];
    if (city && state) links.push(`/${country.toLowerCase()}/${slugify(state)}`);
    if (state) links.push(`/${country.toLowerCase()}`);
    links.push('/directory');
    return links;
}

function buildSidewaysLinks(serviceSlug: string, country: string, equipment?: EquipmentModifier, modifier?: IntentModifier): string[] {
    const links: string[] = [];
    // Link to related equipment pages
    if (equipment) {
        const otherEquip = EQUIPMENT_MODIFIERS.filter(e => e.slug !== equipment.slug && e.commonIn.includes(country)).slice(0, 3);
        links.push(...otherEquip.map(e => `/${serviceSlug}/${e.slug}/${country.toLowerCase()}`));
    }
    // Link to related modifier pages
    if (modifier) {
        const otherMods = INTENT_MODIFIERS.filter(m => m.slug !== modifier.slug && m.priority <= modifier.priority + 1).slice(0, 3);
        links.push(...otherMods.map(m => `/${serviceSlug}/${m.slug}/${country.toLowerCase()}`));
    }
    return links;
}

function buildDownwardLinks(serviceSlug: string, country: string, state?: string, city?: string): string[] {
    // Links to operator profiles in this area
    const links: string[] = [];
    if (state) links.push(`/directory?state=${slugify(state)}`);
    links.push(`/directory?service=${serviceSlug}`);
    links.push(`/available-now`);
    return links;
}

function slugify(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function titleize(s: string): string {
    return s.replace(/\b\w/g, c => c.toUpperCase());
}

function getCountryName(iso2: string): string {
    const names: Record<string, string> = {
        US: 'United States', CA: 'Canada', GB: 'United Kingdom', AU: 'Australia',
        NZ: 'New Zealand', ZA: 'South Africa', DE: 'Germany', NL: 'Netherlands',
        BE: 'Belgium', FR: 'France', IT: 'Italy', ES: 'Spain', PT: 'Portugal',
        AT: 'Austria', CH: 'Switzerland', SE: 'Sweden', NO: 'Norway', DK: 'Denmark',
        FI: 'Finland', IE: 'Ireland', PL: 'Poland', CZ: 'Czech Republic',
        SK: 'Slovakia', HU: 'Hungary', RO: 'Romania', BG: 'Bulgaria',
        HR: 'Croatia', SI: 'Slovenia', LT: 'Lithuania', LV: 'Latvia', EE: 'Estonia',
        BR: 'Brazil', CL: 'Chile', CO: 'Colombia', MX: 'Mexico', AR: 'Argentina',
        AE: 'UAE', SA: 'Saudi Arabia', QA: 'Qatar', KW: 'Kuwait', OM: 'Oman',
        IN: 'India', JP: 'Japan', KR: 'South Korea', MY: 'Malaysia', SG: 'Singapore',
        ID: 'Indonesia', TH: 'Thailand', PH: 'Philippines', VN: 'Vietnam', TW: 'Taiwan',
    };
    return names[iso2] ?? iso2;
}

// ═══════════════════════════════════════════════
// FEATURED SNIPPET BLOCK GENERATORS
// ═══════════════════════════════════════════════

export interface SnippetBlock {
    type: SnippetBlockType;
    html: string;
    schemaMarkup?: Record<string, any>;
}

export function generateDefinitionBlock(term: string, geo: string, countryIso2: string): SnippetBlock {
    const terminology = getEscortTerminology(countryIso2);
    const alt = terminology?.escortVehicle?.[1] ?? 'escort vehicle';

    return {
        type: 'definition',
        html: `<div itemscope itemtype="https://schema.org/DefinedTerm"><p>A <strong>${term}</strong> (${alt}) is a safety vehicle that guides oversized loads through ${geo} to ensure road clearance, traffic control, and permit compliance. ${term} operators use amber warning lights, flags, and height poles to warn other drivers and coordinate with law enforcement during transport.</p></div>`,
        schemaMarkup: {
            '@type': 'DefinedTerm',
            name: term,
            description: `A safety vehicle that escorts oversized loads in ${geo}`,
        },
    };
}

export function generateFAQBlock(term: string, geo: string, countryIso2: string): SnippetBlock {
    const questions = [
        { q: `Do I need a ${term} in ${geo}?`, a: `${geo} requires escort vehicles for loads exceeding specific width, height, and weight thresholds. Check local regulations for exact requirements.` },
        { q: `How much does a ${term} cost in ${geo}?`, a: `${term} rates in ${geo} typically range from $250-$600/day for standard escorts, with specialized loads (wind turbine, superloads) costing more.` },
        { q: `How many escorts are required in ${geo}?`, a: `The number of escorts depends on load dimensions. Most ${geo} jurisdictions require 1 escort for moderate oversized loads and 2+ for wide/superloads.` },
        { q: `When is a police escort required in ${geo}?`, a: `Police escorts are typically required in ${geo} for loads exceeding specific width/height thresholds, bridge crossings, or urban route sections with heavy traffic.` },
    ];

    const faqHtml = questions.map(q =>
        `<div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question"><h3 itemprop="name">${q.q}</h3><div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"><p itemprop="text">${q.a}</p></div></div>`
    ).join('\n');

    return {
        type: 'faq',
        html: `<section itemscope itemtype="https://schema.org/FAQPage">${faqHtml}</section>`,
        schemaMarkup: {
            '@type': 'FAQPage',
            mainEntity: questions.map(q => ({
                '@type': 'Question',
                name: q.q,
                acceptedAnswer: { '@type': 'Answer', text: q.a },
            })),
        },
    };
}

export function generateQuickTable(term: string, geo: string, countryIso2: string): SnippetBlock {
    // Generic table — in production, pull from jurisdiction_rulepacks
    const rows = [
        ['Load Width 8.5–10 ft', '1 escort vehicle', 'Standard oversize'],
        ['Load Width 10–14 ft', '2 escort vehicles', 'Front + rear escort'],
        ['Load Width 14+ ft', '2+ escorts + police', 'Superload classification'],
        ['Load Height 14+ ft', '1 escort + height pole', 'Vertical clearance check'],
        ['Load Length 100+ ft', '2 escort vehicles', 'Front + rear required'],
    ];

    const tableHtml = `<table><thead><tr><th>Load Dimension</th><th>Escorts Required</th><th>Note</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>`;

    return { type: 'quick_table', html: tableHtml };
}

export function generateStepsList(term: string, geo: string): SnippetBlock {
    const steps = [
        `Determine your load dimensions (height, width, length, weight)`,
        `Check ${geo} escort requirements for your load size`,
        `Obtain required oversize/overweight permits`,
        `Book verified ${term} operators through Haul Command`,
        `Coordinate route survey if required`,
        `Schedule escort vehicles for your move date`,
    ];

    const html = `<ol>${steps.map(s => `<li>${s}</li>`).join('')}</ol>`;
    return {
        type: 'steps',
        html,
        schemaMarkup: {
            '@type': 'HowTo',
            name: `How to arrange a ${term} in ${geo}`,
            step: steps.map((s, i) => ({
                '@type': 'HowToStep',
                position: i + 1,
                text: s,
            })),
        },
    };
}

// ═══════════════════════════════════════════════
// STATS — How many pages could we generate?
// ═══════════════════════════════════════════════

export function getLongTailStats(): {
    serviceDimension: number;
    equipmentDimension: number;
    modifierDimension: number;
    microGeos: number;
    estimatedTotalPages: string;
} {
    return {
        serviceDimension: CORE_SERVICES.length,
        equipmentDimension: EQUIPMENT_MODIFIERS.length,
        modifierDimension: INTENT_MODIFIERS.length,
        microGeos: MICRO_GEO_SUFFIXES.length,
        estimatedTotalPages: `${CORE_SERVICES.length} services × (52 countries × ~20 states × ~50 cities) + ${EQUIPMENT_MODIFIERS.length} equipment × geo + ${INTENT_MODIFIERS.length} modifiers × geo ≈ 40,000+ unique long-tail pages`,
    };
}
