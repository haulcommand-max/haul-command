
import { normalizeCity } from './slug-helper';

/**
 * Module 3: Content Uniqueness Engine
 * Purpose: Ensure no two programmatic pages are identical.
 * Strategy: Rotate intro patterns, industry focus, and regional context.
 */

// 1. Intro Variations (8-12 patterns)
const INTRO_PATTERNS = [
    (city: string, state: string, service: string) =>
        `Finding a reliable ${service} in ${city}, ${state} can be a logistical challenge. Whether you're moving modular homes or heavy construction equipment, ` +
        `verified local providers are essential for safety and compliance.`,

    (city: string, state: string, service: string) =>
        `${city} demands experienced ${service} operators. From navigating tight urban corners to managing highway escorts across ${state}, ` +
        `our network connects you with the highest-rated professionals in the region.`,

    (city: string, state: string, service: string) =>
        `Need a ${service} in ${city}? Speed up your dispatch process. Haul Command tracks active, insured providers in ${state} ` +
        `ready to support your oversize load permit requirements.`,

    (city: string, state: string, service: string) =>
        `Don't let a missing ${service} delay your load in ${city}. We aggregate real-time availability from ${state}'s top-tier escort companies, ` +
        `ensuring your heavy haul stays on schedule.`,
];

// 2. Regional Context Injectors
const REGION_DESCRIPTORS: Record<string, string> = {
    'fl': 'known for strict bridge laws and high construction volume',
    'tx': 'a hub for oil & gas superloads and wind energy transport',
    'ca': 'with complex mountain grades and port logistics requirements',
    'default': 'where navigating local regulations requires proven expertise',
};

// 3. Industry Focus Rotator
const INDUSTRIES = [
    'Construction', 'Aerospace', 'Energy', 'Modular Housing', 'Marine', 'Heavy Machinery'
];

/**
 * Generates a unique introductory paragraph for a City Service Page.
 * Deterministic based on city name char code sum to ensure SSG stability.
 */
export function generateUniqueIntro(city: string, state: string, serviceName: string): string {
    const seed = city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const patternIndex = seed % INTRO_PATTERNS.length;
    const industryIndex = seed % INDUSTRIES.length;

    const baseIntro = INTRO_PATTERNS[patternIndex](city, state, serviceName);
    const regionDesc = REGION_DESCRIPTORS[state.toLowerCase()] || REGION_DESCRIPTORS['default'];

    return `${baseIntro} Serving the ${INDUSTRIES[industryIndex]} sector, ${state} is ${regionDesc}.`;
}

/**
 * Calculates a "Uniqueness Score" for quality gating.
 * @returns 0.0 to 1.0
 */
export function calculateUniquenessScore(params: {
    introVariant: number;
    nearbyCityCount: number;
    providerCount: number;
    hasFaq: boolean;
}): number {
    let score = 0;

    // Base content variance (0.4)
    if (params.introVariant >= 0) score += 0.2;
    if (params.hasFaq) score += 0.2;


    // Data variance (0.6)
    // If we have unique nearby cities and actual providers, the page is unique
    if (params.nearbyCityCount > 3) score += 0.2;
    if (params.providerCount > 0) score += 0.4; // High weight on actual data

    return Math.min(score, 1.0);
}

/**
 * Coverage Gaps Engine (Module 2.1)
 * Purpose: Avoid soft 404s on empty pages by providing alternative value.
 */
export type CoverageGapAction = 'SHOW_LISTINGS' | 'SHOW_GAP_PANEL' | 'NOINDEX_UNTIL_SEEDED';

export function determineCoverageAction(providerCount: number, nearbyCount: number): CoverageGapAction {
    if (providerCount >= 3) return 'SHOW_LISTINGS';
    if (providerCount > 0) return 'SHOW_GAP_PANEL'; // 1-2 providers -> Show, but admit gap
    if (nearbyCount > 0) return 'SHOW_GAP_PANEL'; // 0 providers, but nearby -> Show gap + nearby
    return 'NOINDEX_UNTIL_SEEDED'; // 0 providers, 0 nearby -> Dead page
}

export function getGapPanelProps(city: string, service: string) {
    return {
        badge: "High Demand Area",
        title: `${service} Needed in ${city}`,
        description: `We have detected a shortage of verified ${service} providers in ${city}. Local rates may be higher due to demand.`,
        cta: "Are you a provider? Claim this market.",
        ctaLink: "/auth/register?gap_claim=true"
    };
}
