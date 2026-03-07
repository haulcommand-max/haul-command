// ═══════════════════════════════════════════════════════════
// GLOBAL CONTENT ENGINE — Country-aware programmatic page content
// Purpose: Generate unique, locally-relevant content for 52 countries
// Strategy: Native terminology × local infrastructure × regional context
// ═══════════════════════════════════════════════════════════

import { GLOBAL_ESCORT_TERMS, getEscortTerminology, type CountryEscortTerminology } from './escort-terminology';
import { COUNTRY_INFRA_SEEDS, type CountryInfraSeeds } from './infrastructure-keywords';
import { KEYWORD_SEED_PACKS, type KeywordSeedPack } from './keyword-seed-packs';

// ═══════════════════════════════════════════════════════════
// COUNTRY HUB PAGE GENERATOR
// ═══════════════════════════════════════════════════════════

export interface CountryHubPageData {
    country: string;
    iso2: string;
    metaTitle: string;
    metaDescription: string;
    h1: string;
    introText: string;
    serviceTerms: string[];
    topCities: string[];
    topPorts: string[];
    topCorridors: string[];
    regulatoryAuthority: string;
    rateSummary: string;
    glossaryTermCount: number;
    equipmentTypes: string[];
    faqItems: { question: string; answer: string }[];
    structuredData: object;
}

export function generateCountryHubPage(iso2: string): CountryHubPageData | null {
    const terms = getEscortTerminology(iso2);
    const infra = COUNTRY_INFRA_SEEDS.find(s => s.iso2 === iso2);
    const seeds = KEYWORD_SEED_PACKS.find(p => p.iso2 === iso2);
    if (!terms || !infra || !seeds) return null;

    const primaryTerm = terms.escortVehicle[0] || 'escort vehicle';
    const oversizeTerm = terms.oversizeLoad[0] || 'oversize load';
    const authority = terms.permitAuthority[0] || 'transport authority';
    const topPort = infra.ports[0] || '';
    const country = seeds.country;

    // Meta title: "[Native term] Services in [Country] | Haul Command"
    const metaTitle = `${capitalize(primaryTerm)} Services in ${country} | Haul Command Directory`;

    // Meta description with local terminology
    const metaDescription = `Find verified ${primaryTerm} operators for ${oversizeTerm} transport in ${country}. ` +
        `Directory of certified ${terms.operatorRole[0] || 'operators'} covering ${infra.corridors.slice(0, 2).join(', ')}. ` +
        `Regulated by ${authority}.`;

    const h1 = `${capitalize(primaryTerm)} Services — ${country}`;

    // Intro text using local context
    const introText = generateCountryIntro(country, iso2, terms, infra);

    // Rate summary from structured fields
    const rateRange = terms.baseRateRange;
    const rateSummary = rateRange
        ? `Typical rates: ${terms.currency} ${rateRange[0]}–${rateRange[1]} per ${terms.rateUnit}, day rates ${terms.currency} ${terms.dayRateRange[0]}–${terms.dayRateRange[1]}`
        : 'Contact operators for current rates';

    // FAQ items
    const faqItems = generateCountryFAQ(country, primaryTerm, oversizeTerm, authority, terms, infra);

    // Structured data (Schema.org)
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `${capitalize(primaryTerm)} Services in ${country}`,
        description: metaDescription,
        areaServed: {
            '@type': 'Country',
            name: country,
        },
        provider: {
            '@type': 'Organization',
            name: 'Haul Command',
            url: 'https://haulcommand.com',
        },
        serviceType: `${capitalize(primaryTerm)} / ${capitalize(oversizeTerm)} Escort`,
    };

    return {
        country,
        iso2,
        metaTitle,
        metaDescription,
        h1,
        introText,
        serviceTerms: terms.escortVehicle,
        topCities: seeds.geoModifiers.filter(g => !g.includes('port')).slice(0, 10),
        topPorts: infra.ports,
        topCorridors: infra.corridors,
        regulatoryAuthority: authority,
        rateSummary,
        glossaryTermCount: Object.keys(terms.glossaryTerms).length,
        equipmentTypes: seeds.equipmentTerms,
        faqItems,
        structuredData,
    };
}

// ═══════════════════════════════════════════════════════════
// COUNTRY INTRO GENERATOR — Sounds local, not auto-generated
// ═══════════════════════════════════════════════════════════

const INTRO_PATTERNS = [
    (c: string, term: string, oversize: string, authority: string, port: string, corridor: string) =>
        `${c}'s ${oversize} transport industry relies on qualified ${term} operators to ensure safe, legal movement of exceptional loads. ` +
        `Whether navigating the ${corridor} or servicing loads through ${port || 'major ports'}, ` +
        `Haul Command connects you with verified professionals who meet ${authority} requirements.`,

    (c: string, term: string, oversize: string, authority: string, port: string, corridor: string) =>
        `Finding a reliable ${term} in ${c} is critical for ${oversize} operations. ` +
        `From heavy industries near ${port || 'industrial zones'} to the busy ${corridor}, ` +
        `${authority}-compliant operators are essential. Our directory tracks availability in real-time.`,

    (c: string, term: string, oversize: string, authority: string, port: string, corridor: string) =>
        `${c}'s infrastructure demands experienced ${term} professionals. ` +
        `${oversize} movements along ${corridor}, combined with the complexity of ${port || 'major logistics hubs'}, ` +
        `require operators who understand local regulations enforced by ${authority}.`,

    (c: string, term: string, oversize: string, authority: string, port: string, corridor: string) =>
        `The ${oversize} sector in ${c} is growing rapidly. Demand for qualified ${term} services ` +
        `spans from ${port || 'key ports'} to inland corridors like ${corridor}. ` +
        `Haul Command is the leading directory for ${authority}-verified operators across ${c}.`,
];

function generateCountryIntro(
    country: string,
    iso2: string,
    terms: CountryEscortTerminology,
    infra: CountryInfraSeeds
): string {
    const seed = country.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const idx = seed % INTRO_PATTERNS.length;
    const primaryTerm = terms.escortVehicle[0] || 'escort vehicle';
    const oversizeTerm = terms.oversizeLoad[0] || 'oversize load';
    const authority = terms.permitAuthority[0] || 'transport authority';
    const port = infra.ports[0] || '';
    const corridor = infra.corridors[0] || 'major corridors';

    return INTRO_PATTERNS[idx](country, primaryTerm, oversizeTerm, authority, port, corridor);
}

// ═══════════════════════════════════════════════════════════
// FAQ GENERATOR — Unique per country, boosts content depth
// ═══════════════════════════════════════════════════════════

function generateCountryFAQ(
    country: string,
    primaryTerm: string,
    oversizeTerm: string,
    authority: string,
    terms: CountryEscortTerminology,
    infra: CountryInfraSeeds
): { question: string; answer: string }[] {
    const faqs: { question: string; answer: string }[] = [];

    faqs.push({
        question: `What is a ${primaryTerm} in ${country}?`,
        answer: `A ${primaryTerm} is a vehicle that accompanies ${oversizeTerm} transports to ensure road safety. ` +
            `In ${country}, these are also known as: ${terms.escortVehicle.slice(0, 3).join(', ')}. ` +
            `Operators must comply with regulations set by ${authority}.`,
    });

    faqs.push({
        question: `How much does a ${primaryTerm} cost in ${country}?`,
        answer: terms.baseRateRange
            ? `Rates typically range from ${terms.currency} ${terms.baseRateRange[0]}–${terms.baseRateRange[1]} per ${terms.rateUnit}, ` +
            `with day rates of ${terms.currency} ${terms.dayRateRange[0]}–${terms.dayRateRange[1]}.`
            : `Rates vary by region and load type. Contact operators through our directory for current pricing.`,
    });

    faqs.push({
        question: `What qualifications do ${primaryTerm} operators need in ${country}?`,
        answer: `${primaryTerm} operators in ${country} may need certification from ${authority}. ` +
            `Common regulatory frameworks include: ${terms.regulationCode.slice(0, 2).join(', ')}. ` +
            `Check with local authorities for specific requirements.`,
    });

    if (infra.ports.length > 0) {
        faqs.push({
            question: `Which ports in ${country} have ${primaryTerm} services?`,
            answer: `Major ports with active ${primaryTerm} services include: ${infra.ports.slice(0, 4).join(', ')}. ` +
                `These ports handle regular ${oversizeTerm} movements requiring escort services.`,
        });
    }

    if (infra.corridors.length > 0) {
        faqs.push({
            question: `What are the busiest ${oversizeTerm} corridors in ${country}?`,
            answer: `Key corridors for ${oversizeTerm} transport include: ${infra.corridors.slice(0, 3).join(', ')}. ` +
                `These routes have the highest demand for ${primaryTerm} services.`,
        });
    }

    return faqs;
}

// ═══════════════════════════════════════════════════════════
// GLOSSARY PAGE GENERATOR
// ═══════════════════════════════════════════════════════════

export interface GlossaryPageData {
    country: string;
    iso2: string;
    metaTitle: string;
    metaDescription: string;
    h1: string;
    introText: string;
    terms: { term: string; definition: string }[];
    relatedCountries: string[];
    structuredData: object;
}

export function generateGlossaryPage(iso2: string): GlossaryPageData | null {
    const terms = getEscortTerminology(iso2);
    if (!terms) return null;

    const seeds = KEYWORD_SEED_PACKS.find(p => p.iso2 === iso2);
    const country = seeds?.country || iso2;
    const primaryTerm = terms.escortVehicle[0] || 'escort vehicle';

    // Convert Record<string, string> glossaryTerms to array
    const glossaryTerms = Object.entries(terms.glossaryTerms).map(([term, definition]) => ({
        term,
        definition,
    }));

    // Also add the core service terms as glossary entries
    for (const vehicleTerm of terms.escortVehicle) {
        if (!glossaryTerms.find(g => g.term.toLowerCase() === vehicleTerm.toLowerCase())) {
            glossaryTerms.push({
                term: vehicleTerm,
                definition: `Local term for an escort or pilot vehicle used in ${country} to accompany oversize loads.`,
            });
        }
    }

    for (const roleTerm of terms.operatorRole) {
        if (!glossaryTerms.find(g => g.term.toLowerCase() === roleTerm.toLowerCase())) {
            glossaryTerms.push({
                term: roleTerm,
                definition: `The operator or driver of an escort/pilot vehicle in ${country}.`,
            });
        }
    }

    for (const loadTerm of terms.oversizeLoad) {
        if (!glossaryTerms.find(g => g.term.toLowerCase() === loadTerm.toLowerCase())) {
            glossaryTerms.push({
                term: loadTerm,
                definition: `Term used in ${country} for loads exceeding standard size or weight dimensions.`,
            });
        }
    }

    // Find related countries (same language or same tier)
    const relatedCountries = KEYWORD_SEED_PACKS
        .filter(p => p.iso2 !== iso2 && p.languages.some(l => seeds?.languages.includes(l)))
        .map(p => p.iso2)
        .slice(0, 6);

    const metaTitle = `${capitalize(primaryTerm)} Glossary — ${country} | Haul Command`;
    const metaDescription = `Complete glossary of ${primaryTerm} and oversize transport terminology used in ${country}. ` +
        `${glossaryTerms.length}+ terms including official and industry slang.`;

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTermSet',
        name: `${country} ${capitalize(primaryTerm)} Glossary`,
        description: metaDescription,
        hasDefinedTerm: glossaryTerms.map(g => ({
            '@type': 'DefinedTerm',
            name: g.term,
            description: g.definition,
        })),
    };

    return {
        country,
        iso2,
        metaTitle,
        metaDescription,
        h1: `${capitalize(primaryTerm)} Glossary — ${country}`,
        introText: `A comprehensive guide to ${primaryTerm} and ${terms.oversizeLoad[0] || 'oversize load'} terminology used in ${country}. ` +
            `Whether you're a new operator or a broker working in ${country} for the first time, this glossary covers official regulatory terms, ` +
            `industry jargon, and local expressions you need to know.`,
        terms: glossaryTerms,
        relatedCountries,
        structuredData,
    };
}

// ═══════════════════════════════════════════════════════════
// RATE GUIDE PAGE GENERATOR
// ═══════════════════════════════════════════════════════════

export interface RateGuidePageData {
    country: string;
    iso2: string;
    metaTitle: string;
    metaDescription: string;
    h1: string;
    currency: string;
    baseRateRange: [number, number];
    rateUnit: string;
    dayRateRange: [number, number];
    specializedMultiplier: number;
    jobTitles: string[];
    faqItems: { question: string; answer: string }[];
    structuredData: object;
}

export function generateRateGuidePage(iso2: string): RateGuidePageData | null {
    const terms = getEscortTerminology(iso2);
    if (!terms || !terms.baseRateRange) return null;

    const seeds = KEYWORD_SEED_PACKS.find(p => p.iso2 === iso2);
    const country = seeds?.country || iso2;
    const primaryTerm = terms.escortVehicle[0] || 'escort vehicle';

    return {
        country,
        iso2,
        metaTitle: `${capitalize(primaryTerm)} Rates & Pay — ${country} (${new Date().getFullYear()}) | Haul Command`,
        metaDescription: `Current ${primaryTerm} rates in ${country}: ${terms.currency} ${terms.baseRateRange[0]}–${terms.baseRateRange[1]}/` +
            `${terms.rateUnit}, day rates ${terms.currency} ${terms.dayRateRange[0]}–${terms.dayRateRange[1]}. Updated ${new Date().getFullYear()}.`,
        h1: `${capitalize(primaryTerm)} Rates & Pay Guide — ${country}`,
        currency: terms.currency,
        baseRateRange: terms.baseRateRange,
        rateUnit: terms.rateUnit,
        dayRateRange: terms.dayRateRange,
        specializedMultiplier: terms.specializedMultiplier,
        jobTitles: terms.jobTitles || [],
        faqItems: [
            {
                question: `How much do ${primaryTerm} operators earn in ${country}?`,
                answer: `Day rates typically range from ${terms.currency} ${terms.dayRateRange[0]}–${terms.dayRateRange[1]}. ` +
                    `Per-${terms.rateUnit} rates are ${terms.currency} ${terms.baseRateRange[0]}–${terms.baseRateRange[1]}. ` +
                    `Rates vary by region, load type, and urgency. Specialized escorts command a ${Math.round((terms.specializedMultiplier - 1) * 100)}% premium.`,
            },
            {
                question: `What job titles do ${primaryTerm} operators use in ${country}?`,
                answer: `Common titles include: ${(terms.jobTitles || []).slice(0, 4).join(', ')}.`,
            },
        ],
        structuredData: {
            '@context': 'https://schema.org',
            '@type': 'Article',
            name: `${capitalize(primaryTerm)} Rates in ${country}`,
            description: `Pay guide for ${primaryTerm} operators in ${country}`,
            datePublished: new Date().toISOString().split('T')[0],
            dateModified: new Date().toISOString().split('T')[0],
        },
    };
}

// ═══════════════════════════════════════════════════════════
// INFRASTRUCTURE PAGE GENERATOR
// ═══════════════════════════════════════════════════════════

export interface InfrastructurePageData {
    country: string;
    iso2: string;
    infraType: 'port' | 'truck_stop' | 'hotel' | 'industrial_park' | 'rail_yard' | 'border_crossing' | 'airport_cargo';
    name: string;
    metaTitle: string;
    metaDescription: string;
    h1: string;
    introText: string;
    isClaimable: boolean;
    nearbyServiceTerms: string[];
    structuredData: object;
}

export function generateInfraPages(iso2: string): InfrastructurePageData[] {
    const terms = getEscortTerminology(iso2);
    const infra = COUNTRY_INFRA_SEEDS.find(s => s.iso2 === iso2);
    const seeds = KEYWORD_SEED_PACKS.find(p => p.iso2 === iso2);
    if (!terms || !infra || !seeds) return [];

    const pages: InfrastructurePageData[] = [];
    const primaryTerm = terms.escortVehicle[0] || 'escort vehicle';
    const country = seeds.country;

    // Port pages (claimable)
    for (const port of infra.ports) {
        pages.push({
            country, iso2, infraType: 'port', name: port, isClaimable: true,
            metaTitle: `${capitalize(primaryTerm)} Near ${port} — ${country} | Haul Command`,
            metaDescription: `Find ${primaryTerm} operators near ${port}, ${country}. Available for ${terms.oversizeLoad[0] || 'oversize'} escorts.`,
            h1: `${capitalize(primaryTerm)} Services Near ${port}`,
            introText: `${port} is a major logistics hub in ${country}. ${terms.oversizeLoad[0] || 'Oversize load'} ` +
                `movements from this port require qualified ${primaryTerm} operators for safe road transit.`,
            nearbyServiceTerms: terms.escortVehicle.slice(0, 3),
            structuredData: {
                '@context': 'https://schema.org',
                '@type': 'Place',
                name: port,
                containedInPlace: { '@type': 'Country', name: country },
            },
        });
    }

    // Truck stop pages (claimable)
    for (const stop of (infra.truckStops || [])) {
        pages.push({
            country, iso2, infraType: 'truck_stop', name: stop, isClaimable: true,
            metaTitle: `${capitalize(primaryTerm)} Near ${stop} — ${country} | Haul Command`,
            metaDescription: `${capitalize(primaryTerm)} operators staging near ${stop}, ${country}. Rest and regroup for oversize load escorts.`,
            h1: `${capitalize(primaryTerm)} Services Near ${stop}`,
            introText: `${stop} is a key rest and staging point for ${primaryTerm} operators in ${country}. ` +
                `Convoy crews frequently use this location for hand-offs and rest stops during long hauls.`,
            nearbyServiceTerms: terms.escortVehicle.slice(0, 3),
            structuredData: { '@context': 'https://schema.org', '@type': 'Place', name: stop },
        });
    }

    return pages;
}

// ═══════════════════════════════════════════════════════════
// GLOBAL PAGE COUNT CALCULATOR
// ═══════════════════════════════════════════════════════════

export interface GlobalPageStats {
    totalCountries: number;
    countryHubPages: number;
    glossaryPages: number;
    rateGuidePages: number;
    infraPages: number;
    totalPages: number;
    byTier: Record<string, { countries: number; pages: number }>;
}

export function calculateGlobalPageCount(): GlobalPageStats {
    const TIERS: Record<string, string[]> = {
        A: ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'NL', 'AE', 'BR'],
        B: ['IE', 'SE', 'NO', 'DK', 'FI', 'BE', 'AT', 'CH', 'ES', 'FR', 'IT', 'PT', 'SA', 'QA', 'MX'],
        C: ['PL', 'CZ', 'SK', 'HU', 'SI', 'EE', 'LV', 'LT', 'HR', 'RO', 'BG', 'GR', 'TR', 'KW', 'OM', 'BH', 'SG', 'MY', 'JP', 'KR', 'CL', 'AR', 'CO', 'PE'],
        D: ['UY', 'PA', 'CR'],
    };

    let totalInfra = 0;
    const byTier: Record<string, { countries: number; pages: number }> = {};

    for (const [tier, codes] of Object.entries(TIERS)) {
        let tierInfra = 0;
        for (const iso2 of codes) {
            const infraPages = generateInfraPages(iso2);
            tierInfra += infraPages.length;
        }
        totalInfra += tierInfra;
        byTier[tier] = { countries: codes.length, pages: codes.length + codes.length + codes.length + tierInfra };
    }

    return {
        totalCountries: 52,
        countryHubPages: 52,
        glossaryPages: 52,
        rateGuidePages: 52,
        infraPages: totalInfra,
        totalPages: 52 + 52 + 52 + totalInfra,
        byTier,
    };
}

// ═══════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
