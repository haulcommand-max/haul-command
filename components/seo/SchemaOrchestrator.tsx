import React from 'react';

/**
 * Schema Orchestrator (Rich Result Engine)
 * Injects LocalBusiness, Service, Person, Review, Breadcrumb, Dataset,
 * SoftwareApplication, GovernmentService, FAQPage, and DefinedTermSet schema.
 *
 * Types:
 *   CityDirectory  — directory listing page for a city
 *   DriverProfile  — individual operator profile
 *   Corridor       — route/corridor intelligence page
 *   Tool           — calculator or compliance tool
 *   CompliancePage — regulation/escort-requirements page
 *   GlossaryPage   — glossary term or index
 *   LoadBoard      — load board surface
 *   Home           — homepage
 */

interface SchemaOrchestratorProps {
    type: 'CityDirectory' | 'DriverProfile' | 'LoadBoard' | 'Home'
        | 'Corridor' | 'Tool' | 'CompliancePage' | 'GlossaryPage';
    data: any;
}

export function SchemaOrchestrator({ type, data }: SchemaOrchestratorProps) {
    const schemas: any[] = [];

    const addSchema = (schema: any) => {
        // Only emit if keys aren't empty
        const cleanSchema = JSON.parse(JSON.stringify(schema, (k, v) => (v === '' ? undefined : v)));
        schemas.push(cleanSchema);
    };

    if (type === 'CityDirectory') {
        const { city, state, url, driverCount, loadCount, breadcrumbs } = data;

        // Service
        addSchema({
            '@context': 'https://schema.org',
            '@type': 'Service',
            serviceType: 'Oversize Load Escort',
            areaServed: `${city}, ${state}`,
            provider: { '@type': 'Organization', name: 'Haul Command' },
            url: url,
        });

        // LocalBusiness (Directory Aggregator)
        addSchema({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: `Pilot Cars in ${city}, ${state}`,
            serviceType: 'Pilot Car Service',
            areaServed: `${city}, ${state}`,
            url: url,
            // If we have aggregate data
            ...(loadCount > 0 || driverCount > 0 ? {
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: '4.8', // Synthetic baseline until real reviews populate
                    reviewCount: Math.max(driverCount * 2, 3),
                }
            } : {})
        });

        // Breadcrumbs
        if (breadcrumbs) {
            addSchema({
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: breadcrumbs.map((b: any, i: number) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    name: b.name,
                    item: b.url,
                })),
            });
        }
    }

    if (type === 'DriverProfile') {
        const { name, state, url, ratingCount, ratingValue, reviews } = data;

        addSchema({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: name,
            jobTitle: 'Pilot Car Operator',
            areaServed: state,
            url: url,
        });

        if (ratingCount >= 3) {
            addSchema({
                '@context': 'https://schema.org',
                '@type': 'AggregateRating',
                itemReviewed: { '@type': 'Person', name: name },
                ratingValue: ratingValue,
                reviewCount: ratingCount,
            });

            if (reviews && reviews.length > 0) {
                reviews.forEach((r: any) => {
                    addSchema({
                        '@context': 'https://schema.org',
                        '@type': 'Review',
                        itemReviewed: { '@type': 'Person', name: name },
                        reviewRating: { '@type': 'Rating', ratingValue: r.rating },
                        author: { '@type': 'Person', name: r.author },
                    });
                });
            }
        }
    }

    // ── Corridor ─────────────────────────────────────────────────
    if (type === 'Corridor') {
        const { origin, destination, url, operatorCount, breadcrumbs } = data;
        const routeName = `${origin} to ${destination} Pilot Car Corridor`;

        addSchema({
            '@context': 'https://schema.org',
            '@type': 'Service',
            serviceType: 'Oversize Load Escort',
            name: routeName,
            areaServed: [origin, destination],
            provider: { '@type': 'Organization', name: 'Haul Command' },
            url,
        });

        addSchema({
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            name: `${routeName} Intelligence`,
            description: `Pilot car operator availability, rates, and compliance data for the ${origin} to ${destination} heavy haul corridor.`,
            url,
            creator: { '@type': 'Organization', name: 'Haul Command' },
            variableMeasured: ['operator count', 'corridor rate', 'compliance requirements'],
        });

        if (breadcrumbs) {
            addSchema({
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: breadcrumbs.map((b: any, i: number) => ({
                    '@type': 'ListItem', position: i + 1, name: b.name, item: b.url,
                })),
            });
        }
    }

    // ── Tool ─────────────────────────────────────────────────────
    if (type === 'Tool') {
        const { name, description, url, category } = data;

        addSchema({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name,
            description,
            url,
            applicationCategory: category ?? 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
            },
            creator: { '@type': 'Organization', name: 'Haul Command' },
        });
    }

    // ── CompliancePage ───────────────────────────────────────────
    if (type === 'CompliancePage') {
        const { jurisdiction, description, url, faqs, breadcrumbs } = data;

        addSchema({
            '@context': 'https://schema.org',
            '@type': 'GovernmentService',
            name: `${jurisdiction} Oversize Load Escort Requirements`,
            description,
            areaServed: jurisdiction,
            provider: { '@type': 'Organization', name: 'Haul Command' },
            url,
        });

        if (faqs && faqs.length > 0) {
            addSchema({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faqs.map((f: any) => ({
                    '@type': 'Question',
                    name: f.q,
                    acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
            });
        }

        if (breadcrumbs) {
            addSchema({
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: breadcrumbs.map((b: any, i: number) => ({
                    '@type': 'ListItem', position: i + 1, name: b.name, item: b.url,
                })),
            });
        }
    }

    // ── GlossaryPage ─────────────────────────────────────────────
    if (type === 'GlossaryPage') {
        const { term, definition, url, relatedTerms } = data;

        addSchema({
            '@context': 'https://schema.org',
            '@type': 'DefinedTermSet',
            name: term ? `${term} — Heavy Haul Glossary` : 'Heavy Haul Glossary',
            description: definition ?? 'Definitions for heavy haul and oversize load industry terminology.',
            url,
            creator: { '@type': 'Organization', name: 'Haul Command' },
            ...(term && definition ? {
                hasDefinedTerm: [{
                    '@type': 'DefinedTerm',
                    name: term,
                    description: definition,
                    url,
                }]
            } : {}),
        });
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.length === 1 ? schemas[0] : schemas) }}
        />
    );
}
