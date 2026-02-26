/**
 * Structured Data Generator (JSON-LD)
 *
 * Generates valid schema.org markup for:
 *  - Organization
 *  - LocalBusiness / Service
 *  - BreadcrumbList
 *  - FAQPage
 *  - ItemList
 *  - JobPosting (load board)
 *  - SoftwareApplication (app)
 *  - Dataset (public intelligence)
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';
const ORG_NAME = 'Haul Command';
const ORG_LOGO = `${SITE_URL}/logo.png`;

// ── Organization ───────────────────────────────────────────────────────────

export function organizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: ORG_NAME,
        url: SITE_URL,
        logo: ORG_LOGO,
        sameAs: [
            'https://www.facebook.com/haulcommand',
            'https://twitter.com/haulcommand',
            'https://www.linkedin.com/company/haulcommand',
            'https://www.youtube.com/@haulcommand',
        ],
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            availableLanguage: ['English', 'Spanish', 'French'],
        },
    };
}

// ── LocalBusiness / Service (for geo pages) ────────────────────────────────

export function localBusinessSchema(params: {
    name: string;
    description: string;
    url: string;
    city?: string;
    region?: string;
    country?: string;
    lat?: number;
    lon?: number;
    serviceType?: string;
    areaServed?: string[];
}) {
    return {
        '@context': 'https://schema.org',
        '@type': ['LocalBusiness', 'Service'],
        name: params.name,
        description: params.description,
        url: params.url,
        provider: {
            '@type': 'Organization',
            name: ORG_NAME,
            url: SITE_URL,
        },
        serviceType: params.serviceType || 'Oversize Load Escort Services',
        areaServed: params.areaServed?.map((a) => ({
            '@type': 'Place',
            name: a,
        })),
        ...(params.lat && params.lon
            ? {
                geo: {
                    '@type': 'GeoCoordinates',
                    latitude: params.lat,
                    longitude: params.lon,
                },
            }
            : {}),
        ...(params.city || params.region
            ? {
                address: {
                    '@type': 'PostalAddress',
                    addressLocality: params.city,
                    addressRegion: params.region,
                    addressCountry: params.country || 'US',
                },
            }
            : {}),
    };
}

// ── BreadcrumbList ─────────────────────────────────────────────────────────

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
        })),
    };
}

// ── FAQPage ────────────────────────────────────────────────────────────────

export function faqSchema(pairs: Array<{ question: string; answer: string }>) {
    if (!pairs.length) return null;
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: pairs.map((p) => ({
            '@type': 'Question',
            name: p.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: p.answer,
            },
        })),
    };
}

// ── ItemList (directory listings, corridor lists, etc.) ─────────────────────

export function itemListSchema(params: {
    name: string;
    url: string;
    items: Array<{ name: string; url: string; position?: number }>;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: params.name,
        url: params.url.startsWith('http') ? params.url : `${SITE_URL}${params.url}`,
        numberOfItems: params.items.length,
        itemListElement: params.items.map((item, i) => ({
            '@type': 'ListItem',
            position: item.position ?? i + 1,
            name: item.name,
            url: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
        })),
    };
}

// ── JobPosting (load board listings) ───────────────────────────────────────

export function jobPostingSchema(params: {
    title: string;
    description: string;
    slug: string;
    originCity?: string;
    originRegion?: string;
    originCountry?: string;
    destinationCity?: string;
    destinationRegion?: string;
    postedAt: string;
    expiresAt?: string;
    salary?: number;
    currency?: string;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: params.title,
        description: params.description,
        url: `${SITE_URL}/loads/${params.slug}`,
        datePosted: params.postedAt,
        validThrough: params.expiresAt,
        hiringOrganization: {
            '@type': 'Organization',
            name: ORG_NAME,
            sameAs: SITE_URL,
        },
        jobLocation: {
            '@type': 'Place',
            address: {
                '@type': 'PostalAddress',
                addressLocality: params.originCity,
                addressRegion: params.originRegion,
                addressCountry: params.originCountry || 'US',
            },
        },
        ...(params.salary
            ? {
                baseSalary: {
                    '@type': 'MonetaryAmount',
                    currency: params.currency || 'USD',
                    value: {
                        '@type': 'QuantitativeValue',
                        value: params.salary,
                        unitText: 'PER_TRIP',
                    },
                },
            }
            : {}),
        employmentType: 'CONTRACTOR',
        industry: 'Transportation & Logistics',
    };
}

// ── SoftwareApplication (mobile app) ───────────────────────────────────────

export function softwareAppSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Haul Command',
        operatingSystem: 'iOS, Android',
        applicationCategory: 'BusinessApplication',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '500',
        },
        description: 'The #1 app for oversize load escorts and pilot car services. Find escorts, post loads, and manage heavy haul logistics.',
    };
}

// ── Dataset (public intelligence exports) ──────────────────────────────────

export function datasetSchema(params: {
    name: string;
    description: string;
    url: string;
    temporalCoverage?: string;
    spatialCoverage?: string[];
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: params.name,
        description: params.description,
        url: params.url.startsWith('http') ? params.url : `${SITE_URL}${params.url}`,
        creator: {
            '@type': 'Organization',
            name: ORG_NAME,
            url: SITE_URL,
        },
        license: 'https://creativecommons.org/licenses/by-nc/4.0/',
        temporalCoverage: params.temporalCoverage || 'P30D',
        ...(params.spatialCoverage
            ? {
                spatialCoverage: params.spatialCoverage.map((s) => ({
                    '@type': 'Place',
                    name: s,
                })),
            }
            : {}),
    };
}

// ── Script Tag Helper ──────────────────────────────────────────────────────

/**
 * Wrap a schema object as a JSON-LD script tag string.
 * Use in Next.js <Script> or dangerouslySetInnerHTML.
 */
export function jsonLdScript(schema: object | null): string {
    if (!schema) return '';
    return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

/**
 * For React components: returns props for a <script> element.
 */
export function jsonLdProps(schema: object | null) {
    if (!schema) return null;
    return {
        type: 'application/ld+json',
        dangerouslySetInnerHTML: { __html: JSON.stringify(schema) },
    };
}
