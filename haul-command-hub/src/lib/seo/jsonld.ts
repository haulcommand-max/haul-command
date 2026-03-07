const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://haulcommand.com";

export function collectionPageJsonLd(pageKey: any) {
    return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: pageKey.h1,
        description: pageKey.meta_description,
        url: `${SITE_URL}${pageKey.canonical_slug}`,
        numberOfItems: pageKey.entity_count,
        isPartOf: {
            "@type": "WebSite",
            name: "HAUL COMMAND",
            url: SITE_URL,
        },
    };
}

export function placeJsonLd(surface: any, pageKey: any) {
    const ld: any = {
        "@context": "https://schema.org",
        "@type": "Place",
        name: surface?.name ?? pageKey.h1,
        url: `${SITE_URL}${pageKey.canonical_slug}`,
    };
    if (surface?.latitude && surface?.longitude) {
        ld.geo = {
            "@type": "GeoCoordinates",
            latitude: surface.latitude,
            longitude: surface.longitude,
        };
    }
    if (surface?.address) {
        ld.address = surface.address;
    }
    return ld;
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map(i => ({
            "@type": "Question",
            name: i.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: i.answer,
            },
        })),
    };
}
