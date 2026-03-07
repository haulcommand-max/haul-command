// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL INCUMBENCY SEO ENGINE
// Spec: HC_GLOBAL_INCUMBENCY_SEO_ENGINE_V1
// Purpose: Manufacture verifiable market depth across 52 countries
// Principle: Perceived incumbency via structured depth
// ═══════════════════════════════════════════════════════════════════════════

import { getEscortTerminology, GLOBAL_ESCORT_TERMS } from './escort-terminology';
import { COUNTRY_INFRA_SEEDS, INFRA_CATEGORIES } from './infrastructure-keywords';
import { KEYWORD_SEED_PACKS, type KeywordSeedPack } from './keyword-seed-packs';
import {
    generateCountryHubPage,
    generateGlossaryPage,
    generateRateGuidePage,
    generateInfraPages,
} from './global-content-engine';

// ═══════════════════════════════════════════════════════════════════════════
// COUNTRY TIERS — SOURCE OF TRUTH
// ═══════════════════════════════════════════════════════════════════════════

export type TierCode = 'A' | 'B' | 'C' | 'D';

export interface TierConfig {
    code: TierCode;
    label: string;
    pageTargets: { min: number; max: number };
    countries: string[];
    pageClusters: PageClusterType[];
}

export type PageClusterType =
    | 'country_hub' | 'metro_pages' | 'compliance_pages' | 'glossary_pages'
    | 'corridor_pages' | 'rate_intelligence' | 'equipment_country_pages'
    | 'infrastructure_profiles' | 'starter_rate_page' | 'starter_infrastructure'
    | 'minimal_rate_range' | 'basic_compliance';

export const TIER_CONFIG: TierConfig[] = [
    {
        code: 'A', label: 'Gold', pageTargets: { min: 60, max: 120 },
        countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'NL', 'AE', 'BR'],
        pageClusters: ['country_hub', 'metro_pages', 'compliance_pages', 'glossary_pages',
            'corridor_pages', 'rate_intelligence', 'equipment_country_pages', 'infrastructure_profiles'],
    },
    {
        code: 'B', label: 'Blue', pageTargets: { min: 35, max: 70 },
        countries: ['IE', 'SE', 'NO', 'DK', 'FI', 'BE', 'AT', 'CH', 'ES', 'FR', 'IT', 'PT', 'SA', 'QA', 'MX'],
        pageClusters: ['country_hub', 'metro_pages', 'compliance_pages', 'glossary_pages',
            'corridor_pages', 'rate_intelligence', 'equipment_country_pages'],
    },
    {
        code: 'C', label: 'Silver', pageTargets: { min: 15, max: 35 },
        countries: ['PL', 'CZ', 'SK', 'HU', 'SI', 'EE', 'LV', 'LT', 'HR', 'RO', 'BG', 'GR', 'TR',
            'KW', 'OM', 'BH', 'SG', 'MY', 'JP', 'KR', 'CL', 'AR', 'CO', 'PE'],
        pageClusters: ['country_hub', 'metro_pages', 'compliance_pages', 'glossary_pages',
            'starter_rate_page', 'starter_infrastructure'],
    },
    {
        code: 'D', label: 'Slate', pageTargets: { min: 8, max: 15 },
        countries: ['UY', 'PA', 'CR'],
        pageClusters: ['country_hub', 'metro_pages', 'compliance_pages', 'glossary_pages',
            'minimal_rate_range', 'basic_compliance'],
    },
];

export function getTierForCountry(iso2: string): TierConfig | undefined {
    return TIER_CONFIG.find(t => t.countries.includes(iso2));
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE MANIFEST — What pages exist for each country
// ═══════════════════════════════════════════════════════════════════════════

export type PageType =
    | 'country_hub' | 'metro' | 'corridor' | 'compliance'
    | 'rate_guide' | 'equipment' | 'glossary' | 'infrastructure';

export interface PageManifestEntry {
    slug: string;
    pageType: PageType;
    iso2: string;
    title: string;
    locale: string;
    internalLinksOut: string[];
    internalLinksIn: string[];
    entityDensity: number;
    wordCountEstimate: number;
    lastUpdated: string;
    freshnessMaxDays: number;
    qualityPass: boolean;
    blockReasons: string[];
}

export interface CountryManifest {
    iso2: string;
    country: string;
    tier: TierCode;
    pages: PageManifestEntry[];
    totalPages: number;
    incumbencyScore: number;
    meetsPageTarget: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE SLUG GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function slugify(s: string): string {
    return s.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// ═══════════════════════════════════════════════════════════════════════════
// MANIFEST BUILDER — Generates full page manifest per country
// ═══════════════════════════════════════════════════════════════════════════

export function buildCountryManifest(iso2: string): CountryManifest | null {
    const tier = getTierForCountry(iso2);
    const terms = getEscortTerminology(iso2);
    const infra = COUNTRY_INFRA_SEEDS.find(s => s.iso2 === iso2);
    const seeds = KEYWORD_SEED_PACKS.find(p => p.iso2 === iso2);
    if (!tier || !terms || !infra || !seeds) return null;

    const pages: PageManifestEntry[] = [];
    const now = new Date().toISOString().split('T')[0];
    const country = seeds.country;
    const countrySlug = slugify(country);
    const primaryTerm = terms.escortVehicle[0] || 'escort vehicle';

    // ── 1. Country Hub ──
    const hubSlug = `/directory/${countrySlug}`;
    pages.push({
        slug: hubSlug, pageType: 'country_hub', iso2, locale: seeds.languages[0],
        title: `${cap(primaryTerm)} Services in ${country}`,
        internalLinksOut: [], internalLinksIn: [], entityDensity: 0,
        wordCountEstimate: 800, lastUpdated: now, freshnessMaxDays: 90,
        qualityPass: true, blockReasons: [],
    });

    // ── 2. Metro Pages ──
    const metros = seeds.geoModifiers.filter(g => !g.includes('port') && !g.includes('corridor'));
    const metroLimit = tier.code === 'A' ? 15 : tier.code === 'B' ? 8 : tier.code === 'C' ? 5 : 3;
    for (const metro of metros.slice(0, metroLimit)) {
        const metroSlug = `/directory/${countrySlug}/${slugify(metro)}`;
        pages.push({
            slug: metroSlug, pageType: 'metro', iso2, locale: seeds.languages[0],
            title: `${cap(primaryTerm)} in ${cap(metro)}, ${country}`,
            internalLinksOut: [hubSlug], internalLinksIn: [],
            entityDensity: Math.min(infra.ports.length + (infra.truckStops?.length || 0), 12),
            wordCountEstimate: 600, lastUpdated: now, freshnessMaxDays: 120,
            qualityPass: true, blockReasons: [],
        });
    }

    // ── 3. Corridor Pages (Tier A & B) ──
    if (['A', 'B'].includes(tier.code)) {
        for (const corridor of infra.corridors.slice(0, tier.code === 'A' ? 8 : 4)) {
            const corrSlug = `/directory/${countrySlug}/corridors/${slugify(corridor)}`;
            pages.push({
                slug: corrSlug, pageType: 'corridor', iso2, locale: seeds.languages[0],
                title: `${cap(primaryTerm)} — ${corridor}`,
                internalLinksOut: [hubSlug], internalLinksIn: [],
                entityDensity: 5, wordCountEstimate: 550, lastUpdated: now,
                freshnessMaxDays: 120, qualityPass: true, blockReasons: [],
            });
        }
    }

    // ── 4. Compliance Page ──
    pages.push({
        slug: `/compliance/${countrySlug}`, pageType: 'compliance', iso2,
        locale: seeds.languages[0],
        title: `${cap(primaryTerm)} Regulations — ${country}`,
        internalLinksOut: [hubSlug], internalLinksIn: [],
        entityDensity: 0, wordCountEstimate: 700, lastUpdated: now,
        freshnessMaxDays: 180, qualityPass: true, blockReasons: [],
    });

    // ── 5. Rate Intelligence (Tier A & B full, C starter, D minimal) ──
    if (terms.rateStructure) {
        pages.push({
            slug: `/rates/${countrySlug}`, pageType: 'rate_guide', iso2,
            locale: seeds.languages[0],
            title: `${cap(primaryTerm)} Rates — ${country} (${new Date().getFullYear()})`,
            internalLinksOut: [hubSlug], internalLinksIn: [],
            entityDensity: 0, wordCountEstimate: tier.code <= 'B' ? 650 : 400,
            lastUpdated: now, freshnessMaxDays: 60,
            qualityPass: true, blockReasons: [],
        });
    }

    // ── 6. Equipment × Country Pages (Tier A & B) ──
    if (['A', 'B'].includes(tier.code)) {
        const equipLimit = tier.code === 'A' ? 6 : 3;
        for (const equip of seeds.equipmentTerms.slice(0, equipLimit)) {
            const equipSlug = `/directory/${countrySlug}/equipment/${slugify(equip)}`;
            pages.push({
                slug: equipSlug, pageType: 'equipment', iso2, locale: seeds.languages[0],
                title: `${cap(equip)} Escort — ${country}`,
                internalLinksOut: [hubSlug], internalLinksIn: [],
                entityDensity: 3, wordCountEstimate: 500, lastUpdated: now,
                freshnessMaxDays: 120, qualityPass: true, blockReasons: [],
            });
        }
    }

    // ── 7. Glossary Page ──
    pages.push({
        slug: `/glossary/${countrySlug}`, pageType: 'glossary', iso2,
        locale: seeds.languages[0],
        title: `${cap(primaryTerm)} Glossary — ${country}`,
        internalLinksOut: [hubSlug], internalLinksIn: [],
        entityDensity: 0,
        wordCountEstimate: 500 + Object.keys(terms.glossaryTerms ?? {}).length * 40,
        lastUpdated: now, freshnessMaxDays: 365,
        qualityPass: true, blockReasons: [],
    });

    // ── 8. Infrastructure Profiles (Tier A, partial B) ──
    if (tier.code === 'A' || (tier.code === 'B' && infra.ports.length > 2)) {
        const portLimit = tier.code === 'A' ? 6 : 3;
        for (const port of infra.ports.slice(0, portLimit)) {
            pages.push({
                slug: `/directory/${countrySlug}/ports/${slugify(port)}`, pageType: 'infrastructure',
                iso2, locale: seeds.languages[0],
                title: `${cap(primaryTerm)} Near ${port}`,
                internalLinksOut: [hubSlug], internalLinksIn: [],
                entityDensity: 8, wordCountEstimate: 450, lastUpdated: now,
                freshnessMaxDays: 120, qualityPass: true, blockReasons: [],
            });
        }
    }

    // ── Wire internal link graph ──
    wireInternalLinks(pages, hubSlug);

    // ── Quality guardrails ──
    applyQualityGuardrails(pages);

    // ── Incumbency score ──
    const incumbencyScore = calculateIncumbencyScore(iso2, pages, tier);

    return {
        iso2, country, tier: tier.code, pages,
        totalPages: pages.length,
        incumbencyScore,
        meetsPageTarget: pages.length >= tier.pageTargets.min,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL LINK GRAPH BUILDER — Dense semantic mesh
// ═══════════════════════════════════════════════════════════════════════════

function wireInternalLinks(pages: PageManifestEntry[], hubSlug: string): void {
    const hub = pages.find(p => p.pageType === 'country_hub');
    const metros = pages.filter(p => p.pageType === 'metro');
    const corridors = pages.filter(p => p.pageType === 'corridor');
    const compliance = pages.find(p => p.pageType === 'compliance');
    const rateGuide = pages.find(p => p.pageType === 'rate_guide');
    const glossary = pages.find(p => p.pageType === 'glossary');
    const equipment = pages.filter(p => p.pageType === 'equipment');
    const infra = pages.filter(p => p.pageType === 'infrastructure');

    if (!hub) return;

    // Hub → everything
    hub.internalLinksOut = [
        ...metros.map(m => m.slug),
        ...corridors.map(c => c.slug),
        ...(compliance ? [compliance.slug] : []),
        ...(rateGuide ? [rateGuide.slug] : []),
        ...(glossary ? [glossary.slug] : []),
        ...equipment.map(e => e.slug),
        ...infra.map(i => i.slug),
    ];

    // Metro ↔ corridors (bidirectional)
    for (const metro of metros) {
        metro.internalLinksOut.push(...corridors.slice(0, 3).map(c => c.slug));
        if (rateGuide) metro.internalLinksOut.push(rateGuide.slug);
        if (glossary) metro.internalLinksOut.push(glossary.slug);
        if (compliance) metro.internalLinksOut.push(compliance.slug);
        // Nearby metros
        const nearby = metros.filter(m => m.slug !== metro.slug).slice(0, 3);
        metro.internalLinksOut.push(...nearby.map(n => n.slug));
        // Nearby infra
        metro.internalLinksOut.push(...infra.slice(0, 2).map(i => i.slug));
    }

    // Corridors → metros + hub (bidirectional)
    for (const corr of corridors) {
        corr.internalLinksOut.push(...metros.slice(0, 4).map(m => m.slug));
        if (rateGuide) corr.internalLinksOut.push(rateGuide.slug);
        const otherCorridors = corridors.filter(c => c.slug !== corr.slug).slice(0, 2);
        corr.internalLinksOut.push(...otherCorridors.map(c => c.slug));
    }

    // Compliance → hub + glossary
    if (compliance) {
        if (glossary) compliance.internalLinksOut.push(glossary.slug);
        compliance.internalLinksOut.push(...metros.slice(0, 3).map(m => m.slug));
    }

    // Glossary → everything relevant
    if (glossary) {
        glossary.internalLinksOut.push(...metros.slice(0, 5).map(m => m.slug));
        if (compliance) glossary.internalLinksOut.push(compliance.slug);
        if (rateGuide) glossary.internalLinksOut.push(rateGuide.slug);
        glossary.internalLinksOut.push(...equipment.slice(0, 3).map(e => e.slug));
    }

    // Equipment → corridors + hub
    for (const eq of equipment) {
        eq.internalLinksOut.push(...corridors.slice(0, 2).map(c => c.slug));
        eq.internalLinksOut.push(...metros.slice(0, 2).map(m => m.slug));
    }

    // Calculate inbound links
    for (const page of pages) {
        page.internalLinksIn = pages
            .filter(p => p.slug !== page.slug && p.internalLinksOut.includes(page.slug))
            .map(p => p.slug);
    }

    // Deduplicate all link arrays
    for (const page of pages) {
        page.internalLinksOut = [...new Set(page.internalLinksOut)];
        page.internalLinksIn = [...new Set(page.internalLinksIn)];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// QUALITY GUARDRAILS
// ═══════════════════════════════════════════════════════════════════════════

function applyQualityGuardrails(pages: PageManifestEntry[]): void {
    for (const page of pages) {
        const reasons: string[] = [];

        if (page.wordCountEstimate < 450) reasons.push('word_count_below_450');
        if (page.internalLinksOut.length < 6) reasons.push('internal_links_below_6');
        // Entity density check for metro/corridor pages
        if ((page.pageType === 'metro' || page.pageType === 'corridor') && page.entityDensity < 5) {
            reasons.push('entity_density_low');
        }

        page.blockReasons = reasons;
        page.qualityPass = reasons.length === 0;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// INCUMBENCY SCORE — 0-100
// ═══════════════════════════════════════════════════════════════════════════

export interface IncumbencyBreakdown {
    contentDepth: number;         // 0-25
    infrastructureDensity: number; // 0-20
    internalLinkStrength: number;  // 0-20
    localizationCompleteness: number; // 0-15
    rateIntelPresence: number;     // 0-10
    complianceDepth: number;       // 0-10
    total: number;
    band: 'fragile' | 'functional' | 'authority_ready' | 'dominant' | 'moat_level';
}

function calculateIncumbencyScore(
    iso2: string,
    pages: PageManifestEntry[],
    tier: TierConfig
): number {
    const breakdown = getIncumbencyBreakdown(iso2, pages, tier);
    return breakdown.total;
}

export function getIncumbencyBreakdown(
    iso2: string,
    pages: PageManifestEntry[],
    tier: TierConfig
): IncumbencyBreakdown {
    const terms = getEscortTerminology(iso2);
    const infra = COUNTRY_INFRA_SEEDS.find(s => s.iso2 === iso2);

    // 1. Content Depth (25 pts) — page count relative to tier target
    const pageRatio = Math.min(pages.length / tier.pageTargets.max, 1);
    const avgWordCount = pages.reduce((s, p) => s + p.wordCountEstimate, 0) / Math.max(pages.length, 1);
    const wordScore = Math.min(avgWordCount / 600, 1);
    const contentDepth = Math.round((pageRatio * 0.6 + wordScore * 0.4) * 25);

    // 2. Infrastructure Density (20 pts)
    const infraPages = pages.filter(p => p.pageType === 'infrastructure');
    const avgEntityDensity = pages
        .filter(p => ['metro', 'corridor', 'infrastructure'].includes(p.pageType))
        .reduce((s, p) => s + p.entityDensity, 0) / Math.max(pages.filter(p => ['metro', 'corridor'].includes(p.pageType)).length, 1);
    const infraScore = Math.min(infraPages.length / 4, 1) * 0.5 + Math.min(avgEntityDensity / 8, 1) * 0.5;
    const infrastructureDensity = Math.round(infraScore * 20);

    // 3. Internal Link Strength (20 pts)
    const avgOutLinks = pages.reduce((s, p) => s + p.internalLinksOut.length, 0) / Math.max(pages.length, 1);
    const avgInLinks = pages.reduce((s, p) => s + p.internalLinksIn.length, 0) / Math.max(pages.length, 1);
    const hub = pages.find(p => p.pageType === 'country_hub');
    const hubLinks = hub ? hub.internalLinksOut.length : 0;
    const linkScore = (Math.min(avgOutLinks / 15, 1) * 0.3 + Math.min(avgInLinks / 6, 1) * 0.3 + Math.min(hubLinks / 50, 1) * 0.4);
    const internalLinkStrength = Math.round(linkScore * 20);

    // 4. Localization Completeness (15 pts)
    const hasNativeTerms = terms && terms.escortVehicle.length > 0;
    const hasNativeOversize = terms && terms.oversizeLoad.length > 0;
    const hasGlossary = terms && (Object.keys(terms.glossaryTerms ?? {}).length > 0);
    const hasRates = terms && terms.rateStructure;
    const locScore = ((hasNativeTerms ? 0.3 : 0) + (hasNativeOversize ? 0.2 : 0) +
        (hasGlossary ? 0.25 : 0) + (hasRates ? 0.25 : 0));
    const localizationCompleteness = Math.round(locScore * 15);

    // 5. Rate Intelligence (10 pts)
    const ratePages = pages.filter(p => p.pageType === 'rate_guide');
    const rateIntelPresence = ratePages.length > 0 && hasRates ? 10 : hasRates ? 5 : 0;

    // 6. Compliance Depth (10 pts)
    const compPages = pages.filter(p => p.pageType === 'compliance');
    const hasRegTerms = terms && terms.regulationCode.length > 0;
    const hasPermitAuth = terms && terms.permitAuthority.length > 0;
    const compScore = (compPages.length > 0 ? 0.4 : 0) + (hasRegTerms ? 0.3 : 0) + (hasPermitAuth ? 0.3 : 0);
    const complianceDepth = Math.round(compScore * 10);

    const total = contentDepth + infrastructureDensity + internalLinkStrength +
        localizationCompleteness + rateIntelPresence + complianceDepth;

    let band: IncumbencyBreakdown['band'];
    if (total >= 92) band = 'moat_level';
    else if (total >= 85) band = 'dominant';
    else if (total >= 70) band = 'authority_ready';
    else if (total >= 50) band = 'functional';
    else band = 'fragile';

    return {
        contentDepth, infrastructureDensity, internalLinkStrength,
        localizationCompleteness, rateIntelPresence, complianceDepth,
        total, band,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// FRESHNESS ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export interface FreshnessReport {
    iso2: string;
    totalPages: number;
    stalePages: number;
    stalePageSlugs: string[];
    freshPercentage: number;
    nextRefreshDue: { slug: string; dueDate: string; pageType: PageType }[];
}

export function auditFreshness(manifest: CountryManifest): FreshnessReport {
    const now = new Date();
    const stalePages: string[] = [];
    const nextRefresh: { slug: string; dueDate: string; pageType: PageType }[] = [];

    for (const page of manifest.pages) {
        const lastUpdate = new Date(page.lastUpdated);
        const daysSince = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSince > page.freshnessMaxDays) {
            stalePages.push(page.slug);
        }

        // Calculate next refresh date
        const dueDate = new Date(lastUpdate);
        dueDate.setDate(dueDate.getDate() + page.freshnessMaxDays);
        nextRefresh.push({ slug: page.slug, dueDate: dueDate.toISOString().split('T')[0], pageType: page.pageType });
    }

    // Sort by soonest due
    nextRefresh.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return {
        iso2: manifest.iso2,
        totalPages: manifest.pages.length,
        stalePages: stalePages.length,
        stalePageSlugs: stalePages,
        freshPercentage: Math.round(((manifest.pages.length - stalePages.length) / manifest.pages.length) * 100),
        nextRefreshDue: nextRefresh.slice(0, 10),
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLLOUT ORCHESTRATOR — 3-phase deployment
// ═══════════════════════════════════════════════════════════════════════════

export type RolloutPhase = 'entity_footprint' | 'commercial_capture' | 'authority_lock';

export interface RolloutPlan {
    phase: RolloutPhase;
    pageTypes: PageType[];
    goal: string;
    estimatedPages: number;
    countriesAffected: number;
}

export function getRolloutPlan(): RolloutPlan[] {
    const all52 = TIER_CONFIG.flatMap(t => t.countries);

    return [
        {
            phase: 'entity_footprint',
            pageTypes: ['country_hub', 'metro', 'compliance', 'glossary'],
            goal: 'Establish presence fast — 52 hubs + metros + compliance + glossary',
            estimatedPages: 52 + (10 * 15 + 15 * 8 + 24 * 5 + 3 * 3) + 52 + 52, // hubs + metros + compliance + glossary
            countriesAffected: 52,
        },
        {
            phase: 'commercial_capture',
            pageTypes: ['corridor', 'equipment', 'rate_guide'],
            goal: 'Capture high-intent queries — corridors + equipment + rates',
            estimatedPages: (10 * 8 + 15 * 4) + (10 * 6 + 15 * 3) + 52,
            countriesAffected: 52,
        },
        {
            phase: 'authority_lock',
            pageTypes: ['infrastructure'],
            goal: 'Hard to displace — deep infrastructure + behavioral signals',
            estimatedPages: 10 * 6 + 15 * 3,
            countriesAffected: 25,
        },
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL DASHBOARD — Full 52-country incumbency overview
// ═══════════════════════════════════════════════════════════════════════════

export interface GlobalIncumbencyDashboard {
    generated: string;
    totalCountries: number;
    totalPages: number;
    avgIncumbencyScore: number;
    tierSummary: {
        tier: TierCode;
        label: string;
        countries: number;
        avgScore: number;
        totalPages: number;
        meetingTargets: number;
    }[];
    countryScores: {
        iso2: string;
        country: string;
        tier: TierCode;
        pages: number;
        score: number;
        band: string;
        meetsTarget: boolean;
        topGap: string;
    }[];
    alerts: string[];
}

export function generateGlobalDashboard(): GlobalIncumbencyDashboard {
    const countryScores: GlobalIncumbencyDashboard['countryScores'] = [];
    const alerts: string[] = [];
    let totalPages = 0;

    for (const tier of TIER_CONFIG) {
        for (const iso2 of tier.countries) {
            const manifest = buildCountryManifest(iso2);
            if (!manifest) {
                alerts.push(`MISSING_DATA: ${iso2} — cannot build manifest`);
                continue;
            }

            const breakdown = getIncumbencyBreakdown(iso2, manifest.pages, tier);
            totalPages += manifest.totalPages;

            // Find top gap
            const gaps = [
                { name: 'content_depth', score: breakdown.contentDepth, max: 25 },
                { name: 'infra_density', score: breakdown.infrastructureDensity, max: 20 },
                { name: 'link_strength', score: breakdown.internalLinkStrength, max: 20 },
                { name: 'localization', score: breakdown.localizationCompleteness, max: 15 },
                { name: 'rate_intel', score: breakdown.rateIntelPresence, max: 10 },
                { name: 'compliance', score: breakdown.complianceDepth, max: 10 },
            ].map(g => ({ ...g, pct: g.score / g.max }))
                .sort((a, b) => a.pct - b.pct);

            const topGap = gaps[0]?.name || 'none';

            countryScores.push({
                iso2,
                country: manifest.country,
                tier: tier.code,
                pages: manifest.totalPages,
                score: manifest.incumbencyScore,
                band: breakdown.band,
                meetsTarget: manifest.meetsPageTarget,
                topGap,
            });

            // Alerts
            if (manifest.incumbencyScore < 50) alerts.push(`LOW_SCORE: ${iso2} (${manifest.incumbencyScore}/100)`);
            if (!manifest.meetsPageTarget) alerts.push(`BELOW_TARGET: ${iso2} has ${manifest.totalPages} pages (min: ${tier.pageTargets.min})`);
        }
    }

    // Tier summary
    const tierSummary = TIER_CONFIG.map(tier => {
        const tierCountries = countryScores.filter(c => c.tier === tier.code);
        return {
            tier: tier.code,
            label: tier.label,
            countries: tierCountries.length,
            avgScore: Math.round(tierCountries.reduce((s, c) => s + c.score, 0) / Math.max(tierCountries.length, 1)),
            totalPages: tierCountries.reduce((s, c) => s + c.pages, 0),
            meetingTargets: tierCountries.filter(c => c.meetsTarget).length,
        };
    });

    const avgScore = Math.round(countryScores.reduce((s, c) => s + c.score, 0) / Math.max(countryScores.length, 1));

    return {
        generated: new Date().toISOString(),
        totalCountries: countryScores.length,
        totalPages,
        avgIncumbencyScore: avgScore,
        tierSummary,
        countryScores: countryScores.sort((a, b) => b.score - a.score),
        alerts,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// SITEMAP MANIFEST — For IndexNow/sitemap submission
// ═══════════════════════════════════════════════════════════════════════════

export function generateSitemapManifest(): { url: string; lastmod: string; changefreq: string; priority: number }[] {
    const entries: { url: string; lastmod: string; changefreq: string; priority: number }[] = [];

    for (const tier of TIER_CONFIG) {
        for (const iso2 of tier.countries) {
            const manifest = buildCountryManifest(iso2);
            if (!manifest) continue;

            for (const page of manifest.pages) {
                const priorityMap: Record<PageType, number> = {
                    country_hub: 0.9, metro: 0.8, corridor: 0.7, compliance: 0.7,
                    rate_guide: 0.8, equipment: 0.6, glossary: 0.5, infrastructure: 0.6,
                };
                const freqMap: Record<PageType, string> = {
                    country_hub: 'weekly', metro: 'monthly', corridor: 'monthly',
                    compliance: 'monthly', rate_guide: 'weekly', equipment: 'monthly',
                    glossary: 'yearly', infrastructure: 'monthly',
                };

                entries.push({
                    url: `https://haulcommand.com${page.slug}`,
                    lastmod: page.lastUpdated,
                    changefreq: freqMap[page.pageType] || 'monthly',
                    priority: priorityMap[page.pageType] || 0.5,
                });
            }
        }
    }

    return entries;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════════════════

function cap(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
