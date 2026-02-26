// Internal link engine — generates structured link sets for SEO pages
// Returns: parent state, nearby cities, related corridors, signup CTA

export interface InternalLinkSet {
    parentState: { href: string; label: string };
    nearbyCities: Array<{ href: string; label: string }>;
    corridors: Array<{ href: string; label: string }>;
    ctaLink: { href: string; label: string };
}

// Corridor name → slug mapping
export const CORRIDOR_SLUGS: Record<string, string> = {
    "I-75": "i-75-north-south",
    "I-10": "i-10-gulf-coast",
    "I-95": "i-95-atlantic",
    "I-40": "i-40-transcon",
    "I-20": "i-20-southeast",
    "I-285": "i-285-atlanta-perimeter",
};

export function buildInternalLinks(opts: {
    country: string;
    state: string;
    city: string;
    slug: string;
    nearbyCities: string[];
    corridors?: string[];
}): InternalLinkSet {
    const { country, state, city, slug, nearbyCities, corridors = [] } = opts;

    const parentState = {
        href: `/${country}/${state}`,
        label: `Pilot Car Services in ${state.toUpperCase()}`,
    };

    const nearbyCityLinks = nearbyCities.slice(0, 4).map((c) => ({
        href: `/${country}/${state}/${c}`,
        label: `Escort Services near ${c.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")}`,
    }));

    const corridorLinks = (corridors.length ? corridors : Object.keys(CORRIDOR_SLUGS).slice(0, 3)).map((name) => ({
        href: `/escort/corridor/${CORRIDOR_SLUGS[name] ?? name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        label: `${name} Corridor Escorts`,
    }));

    const ctaLink = {
        href: "/onboarding",
        label: `Get Matched Fast in ${city}`,
    };

    return { parentState, nearbyCities: nearbyCityLinks, corridors: corridorLinks, ctaLink };
}
