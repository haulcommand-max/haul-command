// Haul Command — Structured Data Schema Components
// Injects JSON-LD BreadcrumbList structured data for Google rich results

interface BreadcrumbItem {
    name: string;
    url: string;
}

interface BreadcrumbSchemaProps {
    items: BreadcrumbItem[];
}

export default function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
    if (!items || items.length === 0) return null;

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

// ─── Organization Schema (site-wide) ───

export function OrganizationSchema() {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Haul Command',
        url: 'https://hub.haulcommand.com',
        logo: 'https://hub.haulcommand.com/logo.png',
        description: 'The world\'s largest directory of pilot car, escort vehicle, and oversize load transport professionals. Connecting operators, brokers, and shippers across 120 countries.',
        sameAs: [],
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            availableLanguage: ['English', 'Spanish', 'French', 'German', 'Portuguese'],
        },
        areaServed: {
            '@type': 'GeoShape',
            description: '120 countries worldwide',
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

// ─── WebSite Schema with SearchAction ───

export function WebSiteSchema() {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Haul Command',
        url: 'https://hub.haulcommand.com',
        description: 'Find pilot cars, escort vehicles, and oversize load professionals worldwide.',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://hub.haulcommand.com/directory?q={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

// ─── Service Schema ───

export function ServiceSchema({
    serviceName,
    description,
    areaServed,
    url,
}: {
    serviceName: string;
    description: string;
    areaServed: string;
    url: string;
}) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: serviceName,
        description,
        provider: {
            '@type': 'Organization',
            name: 'Haul Command',
            url: 'https://hub.haulcommand.com',
        },
        areaServed: {
            '@type': 'Country',
            name: areaServed,
        },
        url,
        serviceType: 'Oversize Load Escort',
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
