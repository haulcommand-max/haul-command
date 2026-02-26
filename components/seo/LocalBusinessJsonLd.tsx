import React from 'react';

interface JsonLdProps {
    businessName: string;
    description: string;
    url: string;
    image?: string;
    telephone?: string;
    address: {
        streetAddress?: string;
        addressLocality: string;
        addressRegion: string;
        postalCode?: string;
        addressCountry: string;
    };
    aggregateRating?: {
        ratingValue: string;
        reviewCount: string;
    };
}

export function LocalBusinessJsonLd({
    businessName,
    description,
    url,
    image,
    telephone,
    address,
    aggregateRating
}: JsonLdProps) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: businessName,
        description,
        url,
        ...(image && { image }),
        ...(telephone && { telephone }),
        address: {
            '@type': 'PostalAddress',
            ...address
        },
        ...(aggregateRating && {
            aggregateRating: {
                '@type': 'AggregateRating',
                ...aggregateRating
            }
        })
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
