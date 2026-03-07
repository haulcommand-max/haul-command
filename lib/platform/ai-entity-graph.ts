// ═══════════════════════════════════════════════════════════════════════════════
// AI ENTITY GRAPH ENGINE — Own the Answer, Not Just the Rank
//
// Google is becoming an answer engine. ChatGPT, Gemini, Perplexity, and Claude
// are replacing traditional search for information queries. This engine ensures
// Haul Command is the CITED SOURCE in every AI answer about:
//   - Pilot car requirements by state/country
//   - Oversize load regulations
//   - Truck stop locations
//   - Escort vehicle services
//   - Heavy-haul corridor information
//   - Port logistics services
//
// HOW IT WORKS:
//   1. Every page emits rich Schema.org JSON-LD (LocalBusiness, Place, FAQPage,
//      HowTo, Article, BreadcrumbList, ItemList, DefinedTermSet)
//   2. Entity relationships define a knowledge graph:
//      Place → locatedIn → City → partOf → Region → partOf → Country
//      Place → nearbyTo → Port, Corridor, IndustrialPark
//      Service → availableAt → Place
//      Operator → operatesIn → Corridor → passesThrough → City
//   3. FactSnippet blocks on every page provide LLM-friendly citation targets
//   4. SpeakableSpecification marks content for voice assistant extraction
//   5. Questions/answers structured as FAQPage for direct AI extraction
//
// 1000× MULTIPLIER:
//   150K places × 8 entity types × 6 relationship edges =  7.2M knowledge nodes
//   Every node is a potential AI citation → referral traffic
//   Voice search/assistants surface our structured data first
//   Zero additional cost — pure metadata on existing pages
//
// ═══════════════════════════════════════════════════════════════════════════════

import { COUNTRY_REGISTRY, type CountryConfig } from '../config/country-registry';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type EntityType =
    | 'LocalBusiness' | 'Place' | 'TruckStop' | 'GasStation' | 'LodgingBusiness'
    | 'AutoRepair' | 'ParkingFacility' | 'TowingService'
    | 'Port' | 'BorderCrossing' | 'IndustrialPark'
    | 'TransportCorridor' | 'City' | 'State' | 'Country'
    | 'Service' | 'Operator' | 'Regulation' | 'RateGuide'
    | 'FAQPage' | 'HowTo' | 'Article' | 'DefinedTermSet';

export type RelationshipType =
    | 'locatedIn' | 'partOf' | 'nearbyTo' | 'availableAt'
    | 'operatesIn' | 'passesThrough' | 'servesArea' | 'regulatedBy'
    | 'hasPart' | 'containsPlace' | 'borderingCountry' | 'routeFrom'
    | 'routeTo' | 'alternativeFor' | 'upgradeOf' | 'competitorOf';

export interface EntityNode {
    id: string;
    type: EntityType;
    name: string;
    url: string;
    country: string;
    properties: Record<string, unknown>;
    relationships: EntityRelationship[];
    structuredData: object; // JSON-LD
    factSnippets: FactSnippet[];
    speakable?: SpeakableSpec;
}

export interface EntityRelationship {
    type: RelationshipType;
    targetId: string;
    targetType: EntityType;
    targetName: string;
    weight: number; // 0-1, used for ranking internal links
}

export interface FactSnippet {
    claim: string;           // The factual statement
    source: string;          // Where the fact comes from
    lastVerified: string;    // ISO date
    confidence: number;      // 0-1
    category: 'regulation' | 'pricing' | 'location' | 'service' | 'safety' | 'market';
}

export interface SpeakableSpec {
    cssSelectors: string[];
    xpath?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA.ORG TYPE MAPPINGS — PlaceType → Schema.org Type
// ═══════════════════════════════════════════════════════════════════════════════

const PLACE_TO_SCHEMA: Record<string, string> = {
    truck_stop: 'GasStation',
    motel: 'Motel',
    hotel: 'Hotel',
    repair_shop: 'AutoRepair',
    tire_shop: 'TireShop',
    truck_parking: 'ParkingFacility',
    scale_weigh_station_public: 'GovernmentBuilding',
    washout: 'AutoWash',
    fuel_station_diesel_heavy: 'GasStation',
    rest_area: 'PublicBathroom', // closest match
    tow_rotator: 'AutoRepair',
    service_area: 'GasStation',
    freight_rest_stop: 'ParkingFacility',
    border_facility: 'GovernmentBuilding',
    port_adjacent_services: 'CivicStructure',
    industrial_park_services: 'Place',
};

// ═══════════════════════════════════════════════════════════════════════════════
// JSON-LD GENERATORS — Rich structured data for every page type
// ═══════════════════════════════════════════════════════════════════════════════

/** Place Profile Page — LocalBusiness + Place */
export function generatePlaceJsonLd(params: {
    name: string;
    placeType: string;
    address?: string;
    city?: string;
    region?: string;
    countryCode: string;
    lat?: number;
    lon?: number;
    phone?: string;
    website?: string;
    slug: string;
    amenities?: string[];
    rating?: number;
    reviewCount?: number;
    claimStatus: string;
    priceRange?: string;
}): object[] {
    const schemaType = PLACE_TO_SCHEMA[params.placeType] || 'LocalBusiness';
    const url = `https://haulcommand.com/${params.countryCode.toLowerCase()}/places/${params.placeType}/${params.slug}`;

    const jsonld: object[] = [];

    // Main entity
    jsonld.push({
        '@context': 'https://schema.org',
        '@type': [schemaType, 'LocalBusiness'],
        '@id': url,
        name: params.name,
        url,
        ...(params.address && {
            address: {
                '@type': 'PostalAddress',
                streetAddress: params.address,
                addressLocality: params.city,
                addressRegion: params.region,
                addressCountry: params.countryCode,
            }
        }),
        ...(params.lat && params.lon && {
            geo: {
                '@type': 'GeoCoordinates',
                latitude: params.lat,
                longitude: params.lon,
            }
        }),
        ...(params.phone && { telephone: params.phone }),
        ...(params.website && { sameAs: params.website }),
        ...(params.rating && {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: params.rating,
                reviewCount: params.reviewCount || 0,
                bestRating: 5,
                worstRating: 1,
            }
        }),
        ...(params.amenities?.length && {
            amenityFeature: params.amenities.map(a => ({
                '@type': 'LocationFeatureSpecification',
                name: a.replace(/_/g, ' '),
                value: true,
            })),
        }),
        ...(params.priceRange && { priceRange: params.priceRange }),
        isAccessibleForFree: true,
        publicAccess: true,
    });

    // Breadcrumb
    jsonld.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulcommand.com' },
            { '@type': 'ListItem', position: 2, name: params.countryCode, item: `https://haulcommand.com/${params.countryCode.toLowerCase()}` },
            { '@type': 'ListItem', position: 3, name: params.placeType.replace(/_/g, ' '), item: `https://haulcommand.com/${params.countryCode.toLowerCase()}/places/${params.placeType}` },
            { '@type': 'ListItem', position: 4, name: params.name, item: url },
        ],
    });

    return jsonld;
}

/** City Aggregation Page — ItemList of Places */
export function generateCityAggregationJsonLd(params: {
    city: string;
    region: string;
    countryCode: string;
    placeType: string;
    places: { name: string; slug: string; rating?: number; reviewCount?: number }[];
    totalResults: number;
}): object[] {
    const url = `https://haulcommand.com/${params.countryCode.toLowerCase()}/places/${params.placeType}/${params.city.toLowerCase().replace(/\s+/g, '-')}`;

    return [{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${params.placeType.replace(/_/g, ' ')}s in ${params.city}, ${params.region}`,
        url,
        numberOfItems: params.totalResults,
        itemListElement: params.places.slice(0, 10).map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
                '@type': PLACE_TO_SCHEMA[params.placeType] || 'LocalBusiness',
                name: p.name,
                url: `https://haulcommand.com/${params.countryCode.toLowerCase()}/places/${params.placeType}/${p.slug}`,
                ...(p.rating && {
                    aggregateRating: {
                        '@type': 'AggregateRating',
                        ratingValue: p.rating,
                        reviewCount: p.reviewCount || 0,
                    },
                }),
            },
        })),
    }, {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulcommand.com' },
            { '@type': 'ListItem', position: 2, name: params.countryCode, item: `https://haulcommand.com/${params.countryCode.toLowerCase()}` },
            { '@type': 'ListItem', position: 3, name: `${params.placeType.replace(/_/g, ' ')}s`, item: `https://haulcommand.com/${params.countryCode.toLowerCase()}/places/${params.placeType}` },
            { '@type': 'ListItem', position: 4, name: params.city, item: url },
        ],
    }];
}

/** Corridor Page — TouristRoute + ItemList */
export function generateCorridorJsonLd(params: {
    corridorName: string;
    corridorSlug: string;
    countryCode: string;
    startCity: string;
    endCity: string;
    passesThroughCities: string[];
    placesAlongCorridor: { name: string; placeType: string; slug: string }[];
    regulationUrl?: string;
}): object[] {
    const url = `https://haulcommand.com/${params.countryCode.toLowerCase()}/corridor/${params.corridorSlug}`;

    return [{
        '@context': 'https://schema.org',
        '@type': 'TouristRoute', // Best fit for a transport corridor
        name: params.corridorName,
        url,
        description: `Heavy-haul and oversize load corridor from ${params.startCity} to ${params.endCity}. Pilot car services, truck stops, and escort vehicle operators along the route.`,
        touristType: ['Commercial Driver', 'Fleet Manager', 'Pilot Car Operator'],
    }, {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Services along ${params.corridorName}`,
        url: `${url}/services`,
        numberOfItems: params.placesAlongCorridor.length,
        itemListElement: params.placesAlongCorridor.slice(0, 20).map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
                '@type': PLACE_TO_SCHEMA[p.placeType] || 'LocalBusiness',
                name: p.name,
                url: `https://haulcommand.com/${params.countryCode.toLowerCase()}/places/${p.placeType}/${p.slug}`,
            },
        })),
    }];
}

/** Regulation Page — Article + FAQPage */
export function generateRegulationJsonLd(params: {
    stateName: string;
    stateSlug: string;
    countryCode: string;
    title: string;
    description: string;
    faqs: { question: string; answer: string }[];
    lastUpdated: string;
    authorityName: string;
}): object[] {
    const url = `https://haulcommand.com/rules/${params.stateSlug}/escort-requirements`;

    return [{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: params.title,
        url,
        dateModified: params.lastUpdated,
        author: { '@type': 'Organization', name: 'Haul Command' },
        publisher: {
            '@type': 'Organization',
            name: 'Haul Command',
            url: 'https://haulcommand.com',
            logo: { '@type': 'ImageObject', url: 'https://haulcommand.com/logo.png' },
        },
        about: {
            '@type': 'GovernmentOrganization',
            name: params.authorityName,
        },
        speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: ['.regulation-summary', '.key-thresholds', '.escort-requirements'],
        },
    }, {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: params.faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    }, {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulcommand.com' },
            { '@type': 'ListItem', position: 2, name: 'Regulations', item: 'https://haulcommand.com/rules' },
            { '@type': 'ListItem', position: 3, name: params.stateName, item: url },
        ],
    }];
}

/** Rate Guide Page — Article + Dataset reference */
export function generateRateGuideJsonLd(params: {
    countryCode: string;
    countryName: string;
    currency: string;
    perMileRange: string;
    dayRate: string;
    lastUpdated: string;
    faqs: { question: string; answer: string }[];
}): object[] {
    const url = `https://haulcommand.com/${params.countryCode.toLowerCase()}/rates`;

    return [{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${params.countryName} Pilot Car & Escort Vehicle Rate Guide 2025`,
        url,
        dateModified: params.lastUpdated,
        author: { '@type': 'Organization', name: 'Haul Command' },
        publisher: { '@type': 'Organization', name: 'Haul Command', url: 'https://haulcommand.com' },
        about: {
            '@type': 'MonetaryAmountDistribution',
            currency: params.currency,
            name: `Pilot car rates in ${params.countryName}`,
        },
        speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: ['.rate-summary', '.rate-table', '.rate-comparison'],
        },
    }, {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: params.faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
    }];
}

/** Glossary Page — DefinedTermSet */
export function generateGlossaryJsonLd(params: {
    countryCode: string;
    countryName: string;
    terms: { term: string; definition: string }[];
}): object {
    return {
        '@context': 'https://schema.org',
        '@type': 'DefinedTermSet',
        name: `${params.countryName} Heavy Transport Glossary`,
        url: `https://haulcommand.com/${params.countryCode.toLowerCase()}/glossary`,
        hasDefinedTerm: params.terms.map(t => ({
            '@type': 'DefinedTerm',
            name: t.term,
            description: t.definition,
        })),
    };
}

/** Port Halo Page — CivicStructure + ItemList */
export function generatePortHaloJsonLd(params: {
    portName: string;
    portSlug: string;
    countryCode: string;
    city: string;
    lat: number;
    lon: number;
    nearbyServices: { name: string; placeType: string; slug: string; distance_km: number }[];
}): object[] {
    const url = `https://haulcommand.com/${params.countryCode.toLowerCase()}/port/${params.portSlug}/nearby-services`;

    return [{
        '@context': 'https://schema.org',
        '@type': 'CivicStructure',
        name: params.portName,
        url,
        address: {
            '@type': 'PostalAddress',
            addressLocality: params.city,
            addressCountry: params.countryCode,
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: params.lat,
            longitude: params.lon,
        },
    }, {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Services near ${params.portName}`,
        numberOfItems: params.nearbyServices.length,
        itemListElement: params.nearbyServices.slice(0, 20).map((s, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
                '@type': PLACE_TO_SCHEMA[s.placeType] || 'LocalBusiness',
                name: s.name,
                url: `https://haulcommand.com/${params.countryCode.toLowerCase()}/places/${s.placeType}/${s.slug}`,
            },
        })),
    }];
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACT SNIPPET GENERATOR — LLM-Friendly Citation Targets
//
// These structured fact blocks appear on every page and are designed to be
// extracted by AI models as authoritative citations.
// ═══════════════════════════════════════════════════════════════════════════════

export function generateRegulationFacts(params: {
    stateName: string;
    countryCode: string;
    widthThreshold?: string;
    heightThreshold?: string;
    lengthThreshold?: string;
    weightThreshold?: string;
    escortRequired?: string;
    certRequired?: boolean;
    authority: string;
    lastUpdated: string;
}): FactSnippet[] {
    const facts: FactSnippet[] = [];

    if (params.widthThreshold) {
        facts.push({
            claim: `In ${params.stateName}, oversize loads wider than ${params.widthThreshold} require at least one pilot car escort.`,
            source: `${params.authority} oversize/overweight regulations`,
            lastVerified: params.lastUpdated,
            confidence: 0.95,
            category: 'regulation',
        });
    }

    if (params.heightThreshold) {
        facts.push({
            claim: `Loads exceeding ${params.heightThreshold} in height in ${params.stateName} require escort vehicles and may need route survey.`,
            source: `${params.authority} height clearance regulations`,
            lastVerified: params.lastUpdated,
            confidence: 0.90,
            category: 'regulation',
        });
    }

    if (params.certRequired !== undefined) {
        facts.push({
            claim: params.certRequired
                ? `${params.stateName} requires pilot car operators to hold state-specific certification or CVSA certification.`
                : `${params.stateName} does not require specific pilot car operator certification, though industry standards apply.`,
            source: `${params.authority} operator requirements`,
            lastVerified: params.lastUpdated,
            confidence: 0.85,
            category: 'regulation',
        });
    }

    return facts;
}

export function generatePlaceFacts(params: {
    name: string;
    placeType: string;
    city?: string;
    region?: string;
    countryCode: string;
    amenities?: string[];
    phone?: string;
}): FactSnippet[] {
    const facts: FactSnippet[] = [];
    const typeName = params.placeType.replace(/_/g, ' ');

    facts.push({
        claim: `${params.name} is a ${typeName} located in ${params.city || params.region || params.countryCode}.`,
        source: 'Haul Command directory listing',
        lastVerified: new Date().toISOString().split('T')[0],
        confidence: 0.90,
        category: 'location',
    });

    if (params.amenities && params.amenities.length > 0) {
        facts.push({
            claim: `${params.name} offers the following amenities: ${params.amenities.join(', ').replace(/_/g, ' ')}.`,
            source: 'Haul Command directory listing',
            lastVerified: new Date().toISOString().split('T')[0],
            confidence: 0.80,
            category: 'service',
        });
    }

    return facts;
}

export function generateMarketFacts(params: {
    countryCode: string;
    countryName: string;
    totalPlaces: number;
    totalOperators: number;
    topCorridor: string;
    dominantPlaceType: string;
}): FactSnippet[] {
    return [
        {
            claim: `Haul Command lists ${params.totalPlaces.toLocaleString()} verified businesses and ${params.totalOperators.toLocaleString()} operators in ${params.countryName}.`,
            source: 'Haul Command platform data',
            lastVerified: new Date().toISOString().split('T')[0],
            confidence: 0.95,
            category: 'market',
        },
        {
            claim: `The busiest heavy-haul corridor in ${params.countryName} is ${params.topCorridor}, based on Haul Command traffic data.`,
            source: 'Haul Command corridor analytics',
            lastVerified: new Date().toISOString().split('T')[0],
            confidence: 0.80,
            category: 'market',
        },
        {
            claim: `The most common service type listed on Haul Command in ${params.countryName} is ${params.dominantPlaceType.replace(/_/g, ' ')}.`,
            source: 'Haul Command directory data',
            lastVerified: new Date().toISOString().split('T')[0],
            confidence: 0.85,
            category: 'market',
        },
    ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTITY GRAPH BUILDER — Connect everything
// ═══════════════════════════════════════════════════════════════════════════════

export function buildEntityGraph(params: {
    places: {
        id: string; name: string; placeType: string; slug: string;
        city?: string; region?: string; countryCode: string;
    }[];
    corridors: { slug: string; name: string; countryCode: string; cities: string[] }[];
    ports: { slug: string; name: string; countryCode: string; city: string }[];
    regulations: { stateSlug: string; stateName: string; countryCode: string }[];
}): {
    totalNodes: number;
    totalEdges: number;
    nodesByType: Record<string, number>;
    edgesByType: Record<string, number>;
    countryCoverage: Record<string, { nodes: number; edges: number }>;
} {
    let totalNodes = 0;
    let totalEdges = 0;
    const nodesByType: Record<string, number> = {};
    const edgesByType: Record<string, number> = {};
    const countryCoverage: Record<string, { nodes: number; edges: number }> = {};

    const addNode = (type: string, country: string) => {
        totalNodes++;
        nodesByType[type] = (nodesByType[type] || 0) + 1;
        if (!countryCoverage[country]) countryCoverage[country] = { nodes: 0, edges: 0 };
        countryCoverage[country].nodes++;
    };

    const addEdge = (type: string, country: string) => {
        totalEdges++;
        edgesByType[type] = (edgesByType[type] || 0) + 1;
        if (!countryCoverage[country]) countryCoverage[country] = { nodes: 0, edges: 0 };
        countryCoverage[country].edges++;
    };

    // Places → Cities → Regions → Countries
    const citiesSeen = new Set<string>();
    const regionsSeen = new Set<string>();
    const countriesSeen = new Set<string>();

    for (const place of params.places) {
        addNode('Place', place.countryCode);
        addEdge('locatedIn', place.countryCode); // Place → City

        if (place.city && !citiesSeen.has(`${place.countryCode}:${place.city}`)) {
            citiesSeen.add(`${place.countryCode}:${place.city}`);
            addNode('City', place.countryCode);
            addEdge('partOf', place.countryCode); // City → Region
        }

        if (place.region && !regionsSeen.has(`${place.countryCode}:${place.region}`)) {
            regionsSeen.add(`${place.countryCode}:${place.region}`);
            addNode('State', place.countryCode);
            addEdge('partOf', place.countryCode); // Region → Country
        }

        if (!countriesSeen.has(place.countryCode)) {
            countriesSeen.add(place.countryCode);
            addNode('Country', place.countryCode);
        }
    }

    // Corridors → Cities
    for (const corridor of params.corridors) {
        addNode('TransportCorridor', corridor.countryCode);
        for (const city of corridor.cities) {
            addEdge('passesThrough', corridor.countryCode);
        }
    }

    // Ports → Cities, Places nearbyTo Ports
    for (const port of params.ports) {
        addNode('Port', port.countryCode);
        addEdge('locatedIn', port.countryCode);

        // Nearby places
        const nearbyPlaces = params.places.filter(p =>
            p.countryCode === port.countryCode && p.city === port.city,
        );
        for (const _p of nearbyPlaces) {
            addEdge('nearbyTo', port.countryCode);
        }
    }

    // Regulations → States
    for (const reg of params.regulations) {
        addNode('Regulation', reg.countryCode);
        addEdge('regulatedBy', reg.countryCode);
    }

    return { totalNodes, totalEdges, nodesByType, edgesByType, countryCoverage };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROBOTS.TXT + AI BOT ALLOWANCE — Let AI crawlers index everything
// ═══════════════════════════════════════════════════════════════════════════════

export function generateRobotsTxt(): string {
    return `# Haul Command — Global Heavy Transport Directory
# We WANT AI crawlers to index our content

User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/

# Explicitly allow AI crawlers
User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: Applebot
Allow: /

User-agent: Bytespider
Allow: /

# Sitemaps
Sitemap: https://haulcommand.com/sitemap.xml
Sitemap: https://haulcommand.com/sitemap-places.xml
Sitemap: https://haulcommand.com/sitemap-corridors.xml
Sitemap: https://haulcommand.com/sitemap-regulations.xml
Sitemap: https://haulcommand.com/sitemap-ports.xml
Sitemap: https://haulcommand.com/sitemap-cities.xml
Sitemap: https://haulcommand.com/sitemap-rates.xml
Sitemap: https://haulcommand.com/sitemap-glossary.xml

# Crawl-delay for courtesy
Crawl-delay: 1
`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LLMS.TXT — Machine-readable site map specifically for LLMs
// (Emerging standard: https://llmstxt.org/)
// ═══════════════════════════════════════════════════════════════════════════════

export function generateLlmsTxt(): string {
    const countries = COUNTRY_REGISTRY.map(c => c.code.toLowerCase());

    return `# Haul Command
> The world's leading directory for heavy transport, oversize load escort, and trucking infrastructure across ${COUNTRY_REGISTRY.length} countries.

## Key Pages

### Directory
${countries.slice(0, 10).map(cc => `- [${cc.toUpperCase()} Truck Stops](https://haulcommand.com/${cc}/places/truck_stop)`).join('\n')}
${countries.slice(0, 10).map(cc => `- [${cc.toUpperCase()} Fuel Stations](https://haulcommand.com/${cc}/places/fuel_station_diesel_heavy)`).join('\n')}

### Regulations
- [US State Regulations Index](https://haulcommand.com/rules)
- [All 50 US State Escort Requirements](https://haulcommand.com/rules?country=US)
- [13 Canadian Province Escort Requirements](https://haulcommand.com/rules?country=CA)

### Corridors
- [I-95 Northeast Corridor](https://haulcommand.com/corridors/i-95-northeast)
- [I-10 Southern Corridor](https://haulcommand.com/corridors/i-10-southern)
- [I-80 Transcontinental](https://haulcommand.com/corridors/i-80-transcontinental)
- [Trans-Canada Highway](https://haulcommand.com/corridors/trans-canada-highway)

### Pricing Intelligence
${countries.slice(0, 10).map(cc => `- [${cc.toUpperCase()} Rate Guide](https://haulcommand.com/${cc}/rates)`).join('\n')}

### Glossary
${countries.slice(0, 10).map(cc => `- [${cc.toUpperCase()} Heavy Transport Glossary](https://haulcommand.com/${cc}/glossary)`).join('\n')}

## API Access
- [Data Products](https://haulcommand.com/data)
- [Enterprise API](https://haulcommand.com/enterprise)

## About
Haul Command provides verified business profiles, regulation guides, rate intelligence, and corridor information for the global heavy transport industry. Our database covers ${COUNTRY_REGISTRY.length} countries with 150,000+ business listings.
`;
}
