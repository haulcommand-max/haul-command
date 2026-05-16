import React from 'react';
import { buildDefinedTermJsonLd, buildFAQPageJsonLd, buildQAPageJsonLd } from '@/lib/seo/jsonld';

/**
 * Schema Orchestrator (Rich Result Engine)
 * Injects LocalBusiness, Service, Person, Review, Breadcrumb, Dataset,
 * SoftwareApplication, GovernmentService, FAQPage, QAPage, and DefinedTerm schema.
 */

interface SchemaOrchestratorProps {
    type: 'CityDirectory' | 'DriverProfile' | 'LoadBoard' | 'Home'
        | 'Corridor' | 'Tool' | 'CompliancePage' | 'GlossaryPage' | 'QAPage';
    data: any;
}

export function SchemaOrchestrator({ type, data }: SchemaOrchestratorProps) {
    const schemas: any[] = [];

    const addSchema = (schema: any) => {
        if (!schema) return;
        const cleanSchema = JSON.parse(JSON.stringify(schema, (_k, v) => (v === '' ? undefined : v)));
        schemas.push(cleanSchema);
    };

    if (type === 'CityDirectory') {
        const { city, state, url, driverCount, loadCount, breadcrumbs, faqs } = data;

        addSchema({
            '@context': 'https://schema.org',
            '@type': 'Service',
            serviceType: 'Oversize Load Escort',
            areaServed: `${city}, ${state}`,
            provider: { '@type': 'Organization', name: 'Haul Command' },
            url,
        });

        addSchema({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: `Pilot Cars in ${city}, ${state}`,
            serviceType: 'Pilot Car Service',
            areaServed: `${city}, ${state}`,
            url,
            description: `Directory surface for pilot car services in ${city}, ${state}${driverCount > 0 ? ` with ${driverCount} indexed operators` : ''}${loadCount > 0 ? ` and ${loadCount} load signals` : ''}.`,
        });

        addSchema(buildFAQPageJsonLd({ url, faqs }));

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
            name,
            jobTitle: 'Pilot Car Operator',
            areaServed: state,
            url,
        });

        if (ratingCount >= 3) {
            addSchema({
                '@context': 'https://schema.org',
                '@type': 'AggregateRating',
                itemReviewed: { '@type': 'Person', name },
                ratingValue,
                reviewCount: ratingCount,
            });

            if (reviews && reviews.length > 0) {
                reviews.forEach((r: any) => {
                    addSchema({
                        '@context': 'https://schema.org',
                        '@type': 'Review',
                        itemReviewed: { '@type': 'Person', name },
                        reviewRating: { '@type': 'Rating', ratingValue: r.rating },
                        author: { '@type': 'Person', name: r.author },
                    });
                });
            }
        }
    }

    if (type === 'Corridor') {
        const { origin, destination, url, breadcrumbs } = data;
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
                    '@type': 'ListItem',
                    position: i + 1,
                    name: b.name,
                    item: b.url,
                })),
            });
        }
    }

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

        addSchema(buildFAQPageJsonLd({ url, faqs }));

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

    if (type === 'GlossaryPage') {
        const { term, definition, url, aliases, faqs } = data;

        if (term && definition) {
            addSchema(buildDefinedTermJsonLd({ url, term, definition, aliases }));
        } else {
            addSchema({
                '@context': 'https://schema.org',
                '@type': 'DefinedTermSet',
                name: term ? `${term} - Heavy Haul Glossary` : 'Heavy Haul Glossary',
                description: definition ?? 'Definitions for heavy haul and oversize load industry terminology.',
                url,
                creator: { '@type': 'Organization', name: 'Haul Command' },
            });
        }

        addSchema(buildFAQPageJsonLd({ url, faqs }));
    }

    if (type === 'QAPage') {
        addSchema(buildQAPageJsonLd({
            url: data.url,
            question: data.question,
            answer: data.answer,
            visible: data.visible,
        }));
    }

    if (schemas.length === 0) return null;

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.length === 1 ? schemas[0] : schemas) }}
        />
    );
}
