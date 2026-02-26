
/**
 * Module 2: Slug Normalization Rules
 * Purpose: Enforce URL purity and prevent duplicates.
 */

export function normalizeSlug(input: string): string {
    if (!input) return '';

    return input
        .toLowerCase()
        .trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents (Québec -> quebec)
        .replace(/\s+/g, '-')           // Spaces to hyphens
        .replace(/[^a-z0-9-]/g, '')     // Remove non-alphanumeric (except hyphens)
        .replace(/-+/g, '-');           // Collapse multiple hyphens
}

export function normalizeAdmin1(input: string): string {
    // Basic map for state/province abbreviations
    // In production, use a full ISO-3166-2 library
    return normalizeSlug(input);
}

export function normalizeCity(input: string, context?: 'geo' | 'broad'): string {
    let slug = normalizeSlug(input);

    // Geo-specific expansions
    if (context === 'geo') {
        if (slug.startsWith('st-')) {
            slug = slug.replace(/^st-/, 'saint-');
        }
        if (slug.startsWith('mt-')) {
            slug = slug.replace(/^mt-/, 'mount-');
        }
    }

    return slug;
}

/**
 * Generates a unique "Fingerprint" for a provider to detect duplicates.
 * Rules: Phone + Email OR Name + Near location
 */
export function generateProviderFingerprint(profile: {
    name: string;
    phone: string;
    email: string;
    lat: number;
    lng: number
}): string {
    const normPhone = profile.phone.replace(/\D/g, ''); // Digits only
    const normEmail = profile.email.toLowerCase().trim();

    // If we have strong identifiers
    if (normPhone && normEmail) {
        return `${normPhone}|${normEmail}`;
    }

    // Fallback: Name + Geo (Round lat/lng to ~1km precision to catch variance)
    const normName = normalizeSlug(profile.name);
    const latKey = profile.lat.toFixed(2); // ~1.1km precision
    const lngKey = profile.lng.toFixed(2);

    return `${normName}|${latKey},${lngKey}`;
}
