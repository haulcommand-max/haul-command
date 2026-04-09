/**
 * JSON-LD Factory — Centralized Structured Data Generator
 * 
 * buildJsonLdPayload(pageType, entityData) → schema.org JSON-LD object
 * 
 * Spec: HC-EDGE-ACCELERATION-PACK-V1 / Wave 1 / structured_data
 * Additive only — never removes existing inline schemas.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';
const ORG_NAME = 'Haul Command';
const ORG_LOGO = `${SITE_URL}/logo.png`;

// ── Shared fragments ──────────────────────────────────────────────────────────

function orgReference() {
    return { '@type': 'Organization', name: ORG_NAME, url: SITE_URL, logo: ORG_LOGO };
}

function breadcrumbList(items: Array<{ name: string; url: string }>) {
    return {
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
        })),
    };
}

function faqBlock(pairs: Array<{ question: string; answer: string }>) {
    if (!pairs.length) return null;
    return {
        '@type': 'FAQPage',
        mainEntity: pairs.map(p => ({
            '@type': 'Question',
            name: p.question,
            acceptedAnswer: { '@type': 'Answer', text: p.answer },
        })),
    };
}

function aggregateRating(rating: number, count: number) {
    if (!count || count < 1) return undefined;
    return {
        '@type': 'AggregateRating',
        ratingValue: rating.toFixed(1),
        reviewCount: count,
        bestRating: '5',
        worstRating: '1',
    };
}

// ── Page-type payloads ────────────────────────────────────────────────────────

export type PageType =
    | 'glossary_term'
    | 'operator_profile'
    | 'leaderboard'
    | 'port_page'
    | 'directory_city'
    | 'escort_requirements'
    | 'corridor'
    | 'answer'
    | 'rules';

// Glossary term page: DefinedTerm + FAQPage
interface GlossaryTermData {
    term: string;
    slug: string;
    definition: string;
    shortDefinition: string;
    countryCode?: string;
    /** FAQ pairs derived from the term */
    faqs?: Array<{ question: string; answer: string }>;
    breadcrumbs?: Array<{ name: string; url: string }>;
}

function glossaryTermSchema(data: GlossaryTermData) {
    const graph: object[] = [
        {
            '@type': 'DefinedTerm',
            '@id': `${SITE_URL}/glossary/${data.slug}`,
            name: data.term,
            description: data.definition,
            inDefinedTermSet: {
                '@type': 'DefinedTermSet',
                name: 'Haul Command ESC Glossary',
                url: `${SITE_URL}/glossary`,
            },
            ...(data.countryCode ? { spatialCoverage: { '@type': 'Country', name: data.countryCode } } : {}),
        },
    ];

    if (data.faqs?.length) {
        const faq = faqBlock(data.faqs);
        if (faq) graph.push(faq);
    }

    if (data.breadcrumbs?.length) {
        graph.push(breadcrumbList(data.breadcrumbs));
    }

    return { '@context': 'https://schema.org', '@graph': graph };
}

// Operator profile: ProfessionalService + AggregateRating
interface OperatorProfileData {
    name: string;
    slug: string;
    city?: string;
    state?: string;
    country?: string;
    serviceType?: string;
    trustScore?: number;
    reviewCount?: number;
    ratingValue?: number;
    isVerified?: boolean;
    description?: string;
    breadcrumbs?: Array<{ name: string; url: string }>;
}

function operatorProfileSchema(data: OperatorProfileData) {
    const graph: object[] = [
        {
            '@type': 'ProfessionalService',
            '@id': `${SITE_URL}/directory/profile/${data.slug}`,
            name: data.name,
            description: data.description || `${data.name} — verified pilot car and escort vehicle operator on Haul Command.`,
            provider: orgReference(),
            serviceType: data.serviceType || 'Pilot Car / Oversize Load Escort',
            ...(data.city || data.state
                ? {
                    address: {
                        '@type': 'PostalAddress',
                        addressLocality: data.city,
                        addressRegion: data.state,
                        addressCountry: data.country || 'US',
                    },
                    areaServed: {
                        '@type': 'Place',
                        name: [data.city, data.state].filter(Boolean).join(', '),
                    },
                }
                : {}),
            ...(data.ratingValue && data.reviewCount
                ? { aggregateRating: aggregateRating(data.ratingValue, data.reviewCount) }
                : {}),
        },
    ];

    if (data.breadcrumbs?.length) {
        graph.push(breadcrumbList(data.breadcrumbs));
    }

    return { '@context': 'https://schema.org', '@graph': graph };
}

// Leaderboard: ItemList
interface LeaderboardData {
    corridorName: string;
    url: string;
    items: Array<{ name: string; url: string; position: number }>;
    breadcrumbs?: Array<{ name: string; url: string }>;
}

function leaderboardSchema(data: LeaderboardData) {
    const graph: object[] = [
        {
            '@type': 'ItemList',
            name: `${data.corridorName} Escort Operator Leaderboard`,
            url: data.url.startsWith('http') ? data.url : `${SITE_URL}${data.url}`,
            numberOfItems: data.items.length,
            itemListElement: data.items.map(item => ({
                '@type': 'ListItem',
                position: item.position,
                name: item.name,
                url: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
            })),
        },
    ];

    if (data.breadcrumbs?.length) {
        graph.push(breadcrumbList(data.breadcrumbs));
    }

    return { '@context': 'https://schema.org', '@graph': graph };
}

// Port page: Place + CivicStructure + LocalBusiness
interface PortPageData {
    portName: string;
    slug: string;
    city?: string;
    state?: string;
    country?: string;
    twicCount: number;
    capabilities: string[];
    description?: string;
    breadcrumbs?: Array<{ name: string; url: string }>;
}

function portPageSchema(data: PortPageData) {
    const graph: object[] = [
        {
            '@type': ['CivicStructure', 'Place'],
            '@id': `${SITE_URL}/ports/${data.slug}`,
            name: data.portName,
            description: data.description || `${data.portName} — TWIC escort directory and gate intelligence on Haul Command.`,
            ...(data.city || data.state
                ? {
                    address: {
                        '@type': 'PostalAddress',
                        addressLocality: data.city,
                        addressRegion: data.state,
                        addressCountry: data.country || 'US',
                    },
                }
                : {}),
        },
        {
            '@type': 'Service',
            name: `TWIC Pilot Car Escort Services at ${data.portName}`,
            provider: orgReference(),
            serviceType: 'TWIC-Verified Oversize Load Escort',
            areaServed: { '@type': 'Place', name: data.portName },
            description: `${data.twicCount} TWIC-verified escort operators available near ${data.portName}.`,
        },
    ];

    if (data.breadcrumbs?.length) {
        graph.push(breadcrumbList(data.breadcrumbs));
    }

    return { '@context': 'https://schema.org', '@graph': graph };
}

// Corridor page: Dataset + FAQPage
interface CorridorData {
    url: string;
    name: string;
    description: string;
    faqs?: Array<{ question: string; answer: string }>;
    breadcrumbs?: Array<{ name: string; url: string }>;
}

function corridorSchema(data: CorridorData) {
    const graph: object[] = [
        buildDatasetJsonLd({
            url: data.url.startsWith('http') ? data.url : `${SITE_URL}${data.url}`,
            name: `${data.name} Corridor Intelligence`,
            description: data.description,
            temporalCoverage: '2025/..',
        })['@type'] ? buildDatasetJsonLd({
            url: data.url.startsWith('http') ? data.url : `${SITE_URL}${data.url}`,
            name: `${data.name} Corridor Intelligence`,
            description: data.description,
            temporalCoverage: '2025/..',
        }) : {}
    ];

    if (data.faqs?.length) {
        const faq = faqBlock(data.faqs);
        if (faq) graph.push(faq);
    }
    if (data.breadcrumbs?.length) {
        graph.push(breadcrumbList(data.breadcrumbs));
    }
    return { '@context': 'https://schema.org', '@graph': graph };
}

// Pricing page: OfferCatalog
interface PricingData {
    name: string;
    description: string;
    offers: Array<{ name: string; price: number; currency: string; description?: string; }>;
    breadcrumbs?: Array<{ name: string; url: string }>;
}

function pricingSchema(data: PricingData) {
    const graph: object[] = [
        {
            '@type': 'OfferCatalog',
            name: data.name,
            description: data.description,
            itemListElement: data.offers.map((offer, i) => ({
                '@type': 'Offer',
                itemOffered: {
                    '@type': 'Service',
                    name: offer.name,
                    ...(offer.description ? { description: offer.description } : {}),
                },
                price: offer.price,
                priceCurrency: offer.currency,
                position: i + 1,
            }))
        }
    ];
    if (data.breadcrumbs?.length) {
        graph.push(breadcrumbList(data.breadcrumbs));
    }
    return { '@context': 'https://schema.org', '@graph': graph };
}

// ── Master dispatcher ─────────────────────────────────────────────────────────

type EntityDataMap = {
    glossary_term: GlossaryTermData;
    operator_profile: OperatorProfileData;
    leaderboard: LeaderboardData;
    port_page: PortPageData;
    // Future page types can be added without touching existing code
    directory_city: Record<string, unknown>;
    escort_requirements: Record<string, unknown>;
    corridor: CorridorData;
    pricing: PricingData;
    answer: Record<string, unknown>;
    rules: Record<string, unknown>;
};

export function buildJsonLdPayload<T extends PageType>(
    pageType: T,
    entityData: EntityDataMap[T],
): object | null {
    switch (pageType) {
        case 'glossary_term':
            return glossaryTermSchema(entityData as GlossaryTermData);
        case 'operator_profile':
            return operatorProfileSchema(entityData as OperatorProfileData);
        case 'leaderboard':
            return leaderboardSchema(entityData as LeaderboardData);
        case 'port_page':
            return portPageSchema(entityData as PortPageData);
        case 'corridor':
            return corridorSchema(entityData as CorridorData);
        case 'pricing':
            return pricingSchema(entityData as PricingData);
        // These page types already have inline schemas — return null to avoid duplication
        case 'directory_city':
        case 'escort_requirements':
        case 'answer':
        case 'rules':
            return null;
        default:
            return null;
    }
}

// ── React helper component ────────────────────────────────────────────────────

/**
 * Returns props for a <script type="application/ld+json"> element.
 * Usage: <script {...jsonLdScriptProps(schema)} />
 */
export function jsonLdScriptProps(schema: object | null) {
    if (!schema) return null;
    return {
        type: 'application/ld+json' as const,
        dangerouslySetInnerHTML: { __html: JSON.stringify(schema) },
    };
}

/**
 * Universal React component to render JSON-LD schema array or object.
 */
export function RenderJsonLd({ schema }: { schema: object | object[] | null | undefined }) {
    if (!schema) return null;
    
    // We import React dynamically for CSR or use standard element for SSR compatibility
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

// Alias for user-preferred naming
export const jsonLdScriptTag = jsonLdScriptProps;

// ── Standalone builder functions (direct use) ─────────────────────────────────

export type JsonLd = Record<string, any>;

/**
 * Build operator profile JSON-LD with ProfessionalService + LocalBusiness dual type.
 * Supports aggregateRating, areaServed, and optional image/telephone.
 */
export function buildOperatorProfileJsonLd(params: {
    url: string;
    name: string;
    description?: string;
    imageUrl?: string;
    telephone?: string;
    priceRange?: string;
    areaServed?: string[];
    aggregateRating?: { ratingValue: number; reviewCount: number };
    entityType?: string;
}) {
    // Determine exact schema.org type based on entity context
    let primaryType = 'ProfessionalService';
    // Base is always LocalBusiness for physical directories
    const schemaTypes = ['LocalBusiness'];

    if (params.entityType) {
        switch (params.entityType.toLowerCase()) {
            case 'hotel':
                primaryType = 'Hotel';
                 break;
            case 'yard':
                primaryType = 'ParkingFacility';
                break;
            case 'repair':
                primaryType = 'AutoRepair';
                break;
            case 'gas':
            case 'fuel':
                primaryType = 'GasStation';
                break;
            case 'port':
                primaryType = 'CivicStructure';
                break;
            case 'warehouse':
                primaryType = 'SelfStorage';
                break;
            case 'operator':
            case 'pilot_car':
            default:
                primaryType = 'ProfessionalService';
                break;
        }
    }

    // Add primary type to the schema array
    if (primaryType !== 'LocalBusiness') {
        schemaTypes.unshift(primaryType);
    }

    const json: JsonLd = {
        '@context': 'https://schema.org',
        '@type': schemaTypes.length === 1 ? schemaTypes[0] : schemaTypes,
        '@id': params.url,
        url: params.url,
        name: params.name,
        ...(params.description ? { description: params.description } : {}),
        ...(params.imageUrl ? { image: params.imageUrl } : {}),
        ...(params.telephone ? { telephone: params.telephone } : {}),
        ...(params.priceRange ? { priceRange: params.priceRange } : {}),
        ...(params.areaServed?.length
            ? {
                areaServed: params.areaServed.map((x) => ({
                    '@type': 'AdministrativeArea',
                    name: x,
                })),
            }
            : {}),
        ...(params.aggregateRating
            ? {
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: params.aggregateRating.ratingValue,
                    reviewCount: params.aggregateRating.reviewCount,
                },
            }
            : {}),
    };
    return json;
}

/**
 * Build glossary term JSON-LD with DefinedTerm + optional FAQPage.
 * Returns both schemas when FAQ is provided.
 */
export function buildGlossaryTermJsonLd(params: {
    url: string;
    term: string;
    definition: string;
    faq?: Array<{ q: string; a: string }>;
}) {
    const definedTerm: JsonLd = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        '@id': params.url,
        url: params.url,
        name: params.term,
        description: params.definition,
    };

    if (!params.faq?.length) return definedTerm;

    const faqJson: JsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        '@id': `${params.url}#faq`,
        url: params.url,
        mainEntity: params.faq.map(({ q, a }) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a },
        })),
    };

    return { definedTerm, faqPage: faqJson };
}

/**
 * Build city directory JSON-LD with Service type.
 */
export function buildCityDirectoryJsonLd(params: {
    url: string;
    city: string;
    region?: string;
    country: string;
    serviceName: string;
    providers?: Array<{ name: string; url: string }>;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': params.url,
        url: params.url,
        name: `${params.serviceName} in ${params.city}`,
        areaServed: [
            { '@type': 'City', name: params.city },
            ...(params.region ? [{ '@type': 'AdministrativeArea', name: params.region }] : []),
            { '@type': 'Country', name: params.country },
        ],
        ...(params.providers?.length
            ? {
                provider: params.providers.map((p) => ({
                    '@type': 'Organization',
                    name: p.name,
                    url: p.url,
                })),
            }
            : {}),
    };
}

/**
 * Build Authority Hub JSON-LD (GovernmentService + FAQPage).
 */
export function buildAuthorityHubJsonLd(params: {
    url: string;
    jurisdictionName: string;
    countryCode: string;
    topic: string;
    description: string;
    faqItems?: Array<{ question: string; answer: string }>;
    breadcrumbs?: Array<{ name: string; url: string }>;
}) {
    const graph: Record<string, unknown>[] = [
        {
            '@type': 'GovernmentService',
            name: `${params.topic} — ${params.jurisdictionName}`,
            description: params.description,
            url: params.url,
            areaServed: {
                '@type': 'AdministrativeArea',
                name: params.jurisdictionName,
            },
            provider: orgReference(),
        },
    ];

    if (params.faqItems && params.faqItems.length > 0) {
        graph.push({
            '@type': 'FAQPage',
            mainEntity: params.faqItems.map(faq => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
        });
    }

    if (params.breadcrumbs) {
        graph.push(breadcrumbList(params.breadcrumbs));
    }

    return { '@context': 'https://schema.org', '@graph': graph };
}

/**
 * Build Dataset JSON-LD (for data desk reports / market intelligence).
 */
export function buildDatasetJsonLd(params: {
    url: string;
    name: string;
    description: string;
    temporalCoverage?: string;
    spatialCoverage?: string;
    keywords?: string[];
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: params.name,
        description: params.description,
        url: params.url,
        creator: orgReference(),
        license: `${SITE_URL}/terms`,
        ...(params.temporalCoverage ? { temporalCoverage: params.temporalCoverage } : {}),
        ...(params.spatialCoverage ? { spatialCoverage: { '@type': 'Place', name: params.spatialCoverage } } : {}),
        ...(params.keywords ? { keywords: params.keywords.join(', ') } : {}),
    };
}

/**
 * Build Press Hub JSON-LD (WebPage + Organization + Dataset).
 */
export function buildPressHubJsonLd(params: {
    url: string;
    countryName: string;
    description: string;
    breadcrumbs?: Array<{ name: string; url: string }>;
}) {
    const graph: Record<string, unknown>[] = [
        {
            '@type': 'WebPage',
            name: `${params.countryName} Press Hub`,
            url: params.url,
            description: params.description,
            publisher: orgReference(),
        },
        {
            '@type': 'Dataset',
            name: `${params.countryName} Escort Market Intelligence`,
            description: `Market rates, corridor difficulty, availability, and compliance data for ${params.countryName}.`,
            url: `${params.url}/reports`,
            creator: orgReference(),
            temporalCoverage: '2025/..',
            license: `${SITE_URL}/terms`,
        },
    ];

    if (params.breadcrumbs) {
        graph.push(breadcrumbList(params.breadcrumbs));
    }

    return { '@context': 'https://schema.org', '@graph': graph };
}

/**
 * Build Article JSON-LD for blog posts.
 */
export function buildArticleJsonLd(params: {
    url: string;
    headline: string;
    description?: string;
    imageUrl?: string;
    datePublished: string;
    dateModified?: string;
    authorName?: string;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: params.headline,
        ...(params.description ? { description: params.description } : {}),
        ...(params.imageUrl ? { image: params.imageUrl } : {}),
        datePublished: params.datePublished,
        ...(params.dateModified ? { dateModified: params.dateModified } : {}),
        author: {
            '@type': 'Organization',
            name: params.authorName || ORG_NAME,
        },
        publisher: orgReference(),
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': params.url,
        },
    };
}

/**
 * Build standalone Service schema.
 */
export function buildServiceJsonLd(params: {
    url: string;
    name: string;
    description?: string;
    serviceType: string;
    areaServed?: string[];
    providerName?: string;
    providerUrl?: string;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': params.url,
        url: params.url,
        name: params.name,
        ...(params.description ? { description: params.description } : {}),
        serviceType: params.serviceType,
        provider: {
            '@type': 'Organization',
            name: params.providerName || ORG_NAME,
            url: params.providerUrl || SITE_URL,
        },
        ...(params.areaServed?.length
            ? {
                areaServed: params.areaServed.map((name) => ({
                    '@type': 'AdministrativeArea',
                    name,
                })),
            }
            : {}),
    };
}
