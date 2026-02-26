import React from 'react';

type SchemaKind =
    | 'Organization'
    | 'LocalBusiness'
    | 'Service'
    | 'Person'
    | 'JobPosting'
    | 'WebApplication'
    | 'ItemList'
    | 'FAQPage'
    | 'BreadcrumbList';

export function SeoSchema({ schemas }: { schemas: any[] }) {
    // Render multiple schema blocks safely
    return (
        <>
            {schemas.filter(Boolean).map((s, idx) => (
                <script
                    key={idx}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
                />
            ))}
        </>
    );
}

// Helpers: build common schema objects
export const SchemaBuilders = {
    organization: (args: { name: string; url: string; logo?: string }) => ({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: args.name,
        url: args.url,
        ...(args.logo ? { logo: args.logo } : {}),
    }),

    breadcrumbList: (items: { name: string; item: string }[]) => ({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((it, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: it.name,
            item: it.item,
        })),
    }),

    localBusiness: (args: { name: string; url: string; areaServed: string }) => ({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: args.name,
        url: args.url,
        areaServed: args.areaServed,
    }),

    service: (args: { serviceType: string; areaServed: string; providerName: string }) => ({
        '@context': 'https://schema.org',
        '@type': 'Service',
        serviceType: args.serviceType,
        areaServed: args.areaServed,
        provider: { '@type': 'Organization', name: args.providerName },
    }),

    person: (args: { name: string; jobTitle?: string; areaServed?: string }) => ({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: args.name,
        ...(args.jobTitle ? { jobTitle: args.jobTitle } : {}),
        ...(args.areaServed ? { areaServed: args.areaServed } : {}),
    }),

    jobPosting: (args: {
        title: string;
        datePosted: string;
        employmentType?: string;
        jobLocationText: string;
        hiringOrganizationName: string;
        url: string;
    }) => ({
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: args.title,
        datePosted: args.datePosted,
        employmentType: args.employmentType || 'CONTRACTOR',
        jobLocation: { '@type': 'Place', address: args.jobLocationText },
        hiringOrganization: { '@type': 'Organization', name: args.hiringOrganizationName },
        url: args.url,
    }),

    webApplication: (args: { name: string; url: string; operatingSystem?: string; applicationCategory?: string }) => ({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: args.name,
        url: args.url,
        operatingSystem: args.operatingSystem || 'Web',
        applicationCategory: args.applicationCategory || 'BusinessApplication',
    }),

    itemList: (args: { name: string; items: { name: string; url: string }[] }) => ({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: args.name,
        itemListElement: args.items.map((it, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: it.name,
            url: it.url,
        })),
    }),

    faqPage: (qa: { q: string; a: string }[]) => ({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: qa.map((x) => ({
            '@type': 'Question',
            name: x.q,
            acceptedAnswer: { '@type': 'Answer', text: x.a },
        })),
    }),
};
