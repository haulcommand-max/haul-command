// ══════════════════════════════════════════════════════════════
// NEAR-ME DYNAMIC PAGE ENGINE
// Geo-aware rendering that:
//   1. Detects user region via IP/geo headers
//   2. Surfaces local operators
//   3. Updates availability signals
//   4. Generates "near me" variant pages for all service types
//
// Routes: /[service]/near-me, /[service]/near-me-open-now, etc.
// ══════════════════════════════════════════════════════════════

import { headers } from 'next/headers';
import { CORE_SERVICES, INTENT_MODIFIERS, type ServiceTerm } from './long-tail-domination';
import { COUNTRY_KEYWORD_SEEDS } from './global-keyword-matrix';

export interface NearMeContext {
    /** Detected country ISO2 */
    country: string;
    /** Detected region/state */
    region: string;
    /** Detected city */
    city: string;
    /** Is the detection confident? */
    confident: boolean;
    /** Latitude */
    lat: number;
    /** Longitude */
    lng: number;
    /** Local terminology for escort services */
    localPrimaryTerm: string;
    /** Local alternative terms */
    localAltTerms: string[];
}

/**
 * Detect user geo from request headers.
 * Uses Vercel/Cloudflare geo headers.
 */
export async function detectUserGeo(): Promise<NearMeContext> {
    const headerList = await headers();

    const country = headerList.get('x-vercel-ip-country') || headerList.get('cf-ipcountry') || 'US';
    const region = headerList.get('x-vercel-ip-country-region') || headerList.get('cf-region') || '';
    const city = headerList.get('x-vercel-ip-city') || headerList.get('cf-ipcity') || '';
    const lat = parseFloat(headerList.get('x-vercel-ip-latitude') || '0');
    const lng = parseFloat(headerList.get('x-vercel-ip-longitude') || '0');

    // Find localized terminology
    const seed = COUNTRY_KEYWORD_SEEDS.find(s => s.iso2 === country);
    const primaryTerm = seed?.primaryTerm ?? 'pilot car';
    const altTerms = seed?.searchTerms?.filter(t => t !== primaryTerm) ?? [];

    return {
        country,
        region,
        city: decodeURIComponent(city),
        confident: !!city && !!region,
        lat, lng,
        localPrimaryTerm: primaryTerm,
        localAltTerms: altTerms.slice(0, 3),
    };
}

/**
 * Generate all "near me" page variants for sitemap generation.
 */
export function generateNearMeRoutes(): Array<{
    path: string;
    service: string;
    modifier: string;
    priority: number;
}> {
    const routes: Array<{ path: string; service: string; modifier: string; priority: number }> = [];

    const nearMeModifiers = INTENT_MODIFIERS.filter(m => m.nearMeBoosted);

    for (const service of CORE_SERVICES) {
        for (const mod of nearMeModifiers) {
            routes.push({
                path: `/${service.slug}/${mod.slug}`,
                service: service.slug,
                modifier: mod.slug,
                priority: 1,
            });
        }
    }

    return routes;
}

/**
 * Generate availability-enhanced metadata for near-me pages.
 */
export function generateNearMeMetadata(
    service: ServiceTerm,
    geo: NearMeContext,
    modifierSlug?: string,
): {
    title: string;
    description: string;
    keywords: string[];
} {
    const mod = INTENT_MODIFIERS.find(m => m.slug === modifierSlug);
    const term = geo.localPrimaryTerm;
    const location = geo.city || geo.region || geo.country;

    const title = [
        term,
        mod?.label ?? 'Near Me',
        location ? `in ${location}` : '',
    ].filter(Boolean).join(' ');

    const description = [
        `Find verified ${term} operators`,
        mod?.label ? ` ${mod.label.toLowerCase()}` : ' near your location',
        location ? ` in ${location}` : '',
        '. Real-time availability, reviews, and instant dispatch.',
    ].join('');

    const keywords = [
        `${term} near me`,
        `${term} ${location}`,
        ...(mod?.keywords ?? []).map(k => `${term} ${k}`),
        ...geo.localAltTerms.map(t => `${t} near me`),
    ];

    return { title, description, keywords };
}

/**
 * Build freshness signals for near-me pages.
 * These tell Google the page has dynamic, fresh content.
 */
export function buildFreshnessSignals(geo: NearMeContext): {
    lastUpdated: string;
    availableCount: string;
    freshBadge: string;
} {
    const now = new Date();
    return {
        lastUpdated: now.toISOString(),
        availableCount: '—', // P1: Real count requires DB query — never fabricate
        freshBadge: `Updated ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
    };
}
