
import React from 'react';

type SchemaProps = {
    type: 'CityService' | 'CityHub' | 'ServiceVertical' | 'Organization';
    data: any;
};

export const SchemaGenerator = ({ type, data }: SchemaProps) => {
    let schema = {};

    const domain = "haulcommand.com"; // Replace with actual domain env var
    const orgSchema = {
        "@type": "Organization",
        "@id": `https://${domain}/#org`,
        "name": "Haul Command",
        "url": `https://${domain}/`,
        "logo": `https://${domain}/assets/logo.png`,
        "description": "The Operating System for North American Heavy Haul.",
    };

    if (type === 'CityService') {
        const { country, state, city, service } = data;
        const url = `https://${domain}/${country}/${state}/${city}/${service.slug}`;

        schema = {
            "@context": "https://schema.org",
            "@graph": [
                orgSchema,
                {
                    "@type": "Service",
                    "@id": `${url}/#service`,
                    "name": `${service.name} in ${city}, ${state}`,
                    "serviceType": service.name,
                    "provider": { "@id": `https://${domain}/#org` },
                    "areaServed": [
                        { "@type": "City", "name": city },
                        { "@type": "AdministrativeArea", "name": state }
                    ]
                },
                {
                    "@type": "WebPage",
                    "@id": `${url}/#webpage`,
                    "url": url,
                    "name": `${service.name} in ${city}, ${state} | Haul Command`,
                    "isPartOf": { "@id": `https://${domain}/#website` },
                    "about": { "@id": `${url}/#service` }
                },
                {
                    "@type": "BreadcrumbList",
                    "@id": `${url}/#breadcrumb`,
                    "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": country.toUpperCase(), "item": `https://${domain}/${country}/` },
                        { "@type": "ListItem", "position": 2, "name": state.toUpperCase(), "item": `https://${domain}/${country}/${state}/` },
                        { "@type": "ListItem", "position": 3, "name": city, "item": `https://${domain}/${country}/${state}/${city}/` },
                        { "@type": "ListItem", "position": 4, "name": service.name, "item": url }
                    ]
                }
            ]
        };
    } else if (type === 'CityHub') {
        const { country, state, city } = data;
        const url = `https://${domain}/${country}/${state}/${city}`;
        schema = {
            "@context": "https://schema.org",
            "@graph": [
                orgSchema,
                {
                    "@type": "Place",
                    "@id": `${url}/#place`,
                    "name": `${city}, ${state}`,
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": city,
                        "addressRegion": state,
                        "addressCountry": country
                    }
                },
                {
                    "@type": "WebPage",
                    "@id": `${url}/#webpage`,
                    "url": url,
                    "name": `${city}, ${state} Oversize Load Directory | Haul Command`,
                    "isPartOf": { "@id": `https://${domain}/#website` },
                    "about": { "@id": `${url}/#place` }
                }
            ]
        }
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
};
