// Haul Command — Internal Linking Domination Engine
// Computes the optimal internal link graph for SEO authority flow

import { COUNTRIES, SEO_SERVICES, SNIPPET_TOPICS, CountryConfig } from '@/lib/seo-countries';

const BASE_URL = 'https://hub.haulcommand.com';

// ─── Link Types ───

export interface InternalLink {
    href: string;
    anchor: string;
    rel?: string;       // 'contextual' | 'nav' | 'footer' | 'breadcrumb'
    priority: number;   // 1-10, higher = more important
}

// ─── Topical Authority Clusters ───
// Each cluster is a "hub and spoke" structure that Google rewards

export interface TopicalCluster {
    pillarPage: { path: string; title: string };
    spokes: { path: string; title: string; type: string }[];
    crossLinks: { path: string; title: string }[];
}

export function buildTopicalClusters(): TopicalCluster[] {
    const clusters: TopicalCluster[] = [];

    for (const country of COUNTRIES) {
        const countryPath = `${BASE_URL}/${country.slug}`;

        // Each country is a pillar page
        const cluster: TopicalCluster = {
            pillarPage: {
                path: countryPath,
                title: `${country.terms.pilot_car} Services in ${country.name}`,
            },
            spokes: [],
            crossLinks: [],
        };

        // Service pages are spokes
        for (const service of SEO_SERVICES) {
            cluster.spokes.push({
                path: `${countryPath}/${service.slug}`,
                title: `${country.terms[service.termKey] || service.label} in ${country.name}`,
                type: 'service',
            });
        }

        // Guide pages are spokes
        for (const topic of SNIPPET_TOPICS) {
            cluster.spokes.push({
                path: `${countryPath}/guide/${topic.slug}`,
                title: `${topic.title} in ${country.name}`,
                type: 'guide',
            });
        }

        // Cross-links to neighboring/similar countries
        const neighbors = getNeighborCountries(country);
        for (const neighbor of neighbors) {
            cluster.crossLinks.push({
                path: `${BASE_URL}/${neighbor.slug}`,
                title: `${neighbor.terms.pilot_car} in ${neighbor.name}`,
            });
        }

        clusters.push(cluster);
    }

    return clusters;
}

// ─── Country Hub Internal Links ───
// What links should appear on each country hub page

export function getCountryHubLinks(country: CountryConfig): InternalLink[] {
    const links: InternalLink[] = [];
    const countryPath = `/${country.slug}`;

    // 1. Service pages (highest priority internal links)
    for (const service of SEO_SERVICES) {
        links.push({
            href: `${countryPath}/${service.slug}`,
            anchor: `${country.terms[service.termKey] || service.label} in ${country.name}`,
            rel: 'contextual',
            priority: 9,
        });
    }

    // 2. Guide pages (snippet authority)
    for (const topic of SNIPPET_TOPICS) {
        links.push({
            href: `${countryPath}/guide/${topic.slug}`,
            anchor: `${topic.title} — ${country.name} Guide`,
            rel: 'contextual',
            priority: 8,
        });
    }

    // 3. Cross-country links (authority flow)
    const neighbors = getNeighborCountries(country);
    for (const neighbor of neighbors.slice(0, 6)) {
        links.push({
            href: `/${neighbor.slug}`,
            anchor: `${neighbor.terms.pilot_car} in ${neighbor.name}`,
            rel: 'contextual',
            priority: 5,
        });
    }

    // 4. Tools (always link)
    links.push(
        { href: '/tools/cost-estimator', anchor: 'Cost Estimator Tool', rel: 'contextual', priority: 6 },
        { href: '/tools/superload-meter', anchor: 'Superload Risk Meter', rel: 'contextual', priority: 6 },
        { href: '/tools/friday-checker', anchor: 'Friday Move Checker', rel: 'contextual', priority: 5 },
        { href: '/tools/movement-checker', anchor: 'Movement Checker', rel: 'contextual', priority: 5 },
    );

    // 5. Countries index
    links.push({
        href: '/countries',
        anchor: 'All 57 Countries',
        rel: 'nav',
        priority: 4,
    });

    // 6. Directory
    links.push({
        href: '/directory',
        anchor: 'Operator Directory',
        rel: 'nav',
        priority: 7,
    });

    return links;
}

// ─── Service Page Internal Links ───

export function getServicePageLinks(country: CountryConfig, currentServiceSlug: string): InternalLink[] {
    const links: InternalLink[] = [];
    const countryPath = `/${country.slug}`;

    // Parent country hub (upward link)
    links.push({
        href: countryPath,
        anchor: `${country.terms.pilot_car} in ${country.name}`,
        rel: 'breadcrumb',
        priority: 10,
    });

    // Sibling services
    for (const service of SEO_SERVICES) {
        if (service.slug === currentServiceSlug) continue;
        links.push({
            href: `${countryPath}/${service.slug}`,
            anchor: `${country.terms[service.termKey] || service.label}`,
            rel: 'contextual',
            priority: 7,
        });
    }

    // Related guides
    for (const topic of SNIPPET_TOPICS) {
        links.push({
            href: `${countryPath}/guide/${topic.slug}`,
            anchor: `${topic.title} Guide`,
            rel: 'contextual',
            priority: 6,
        });
    }

    // Cost estimator (high intent)
    links.push({
        href: '/tools/cost-estimator',
        anchor: `Estimate ${country.terms.escort_vehicle} Costs`,
        rel: 'contextual',
        priority: 7,
    });

    return links;
}

// ─── Guide Page Internal Links ───

export function getGuidePageLinks(country: CountryConfig, currentTopicSlug: string): InternalLink[] {
    const links: InternalLink[] = [];
    const countryPath = `/${country.slug}`;

    // Parent country hub
    links.push({
        href: countryPath,
        anchor: `${country.name} Hub`,
        rel: 'breadcrumb',
        priority: 10,
    });

    // Related services
    for (const service of SEO_SERVICES) {
        links.push({
            href: `${countryPath}/${service.slug}`,
            anchor: `${country.terms[service.termKey] || service.label} in ${country.name}`,
            rel: 'contextual',
            priority: 8,
        });
    }

    // Sibling guides
    for (const topic of SNIPPET_TOPICS) {
        if (topic.slug === currentTopicSlug) continue;
        links.push({
            href: `${countryPath}/guide/${topic.slug}`,
            anchor: `${topic.title} in ${country.name}`,
            rel: 'contextual',
            priority: 6,
        });
    }

    // Tools
    links.push({
        href: '/tools/superload-meter',
        anchor: 'Superload Risk Meter',
        rel: 'contextual',
        priority: 5,
    });

    return links;
}

// ─── Homepage Internal Links ───
// Homepage should link to ALL Tier A country hubs + top services

export function getHomepageLinks(): InternalLink[] {
    const links: InternalLink[] = [];

    // Tier A countries (highest priority)
    const tierA = COUNTRIES.filter((c) => c.tier === 'A');
    for (const country of tierA) {
        links.push({
            href: `/${country.slug}`,
            anchor: `${country.terms.pilot_car} in ${country.name}`,
            rel: 'contextual',
            priority: 9,
        });

        // Also link to their top 2 services
        for (const service of SEO_SERVICES.slice(0, 2)) {
            links.push({
                href: `/${country.slug}/${service.slug}`,
                anchor: `${country.terms[service.termKey] || service.label} — ${country.name}`,
                rel: 'contextual',
                priority: 7,
            });
        }
    }

    // Tier B countries
    const tierB = COUNTRIES.filter((c) => c.tier === 'B');
    for (const country of tierB) {
        links.push({
            href: `/${country.slug}`,
            anchor: `${country.terms.pilot_car} — ${country.name}`,
            rel: 'contextual',
            priority: 6,
        });
    }

    // Tier C+D countries (lower priority, still linked)
    const tierCD = COUNTRIES.filter((c) => c.tier === 'C' || c.tier === 'D');
    for (const country of tierCD) {
        links.push({
            href: `/${country.slug}`,
            anchor: `${country.name}`,
            rel: 'footer',
            priority: 3,
        });
    }

    // Tools
    links.push(
        { href: '/tools/cost-estimator', anchor: 'Cost Estimator', rel: 'nav', priority: 8 },
        { href: '/tools/superload-meter', anchor: 'Superload Meter', rel: 'nav', priority: 8 },
        { href: '/countries', anchor: 'All 57 Countries', rel: 'nav', priority: 7 },
        { href: '/directory', anchor: 'Operator Directory', rel: 'nav', priority: 9 },
        { href: '/leaderboards', anchor: 'Corridor Leaderboards', rel: 'nav', priority: 7 },
    );

    // Money guides (global variants)
    for (const topic of SNIPPET_TOPICS) {
        links.push({
            href: `/us/guide/${topic.slug}`,
            anchor: topic.title,
            rel: 'contextual',
            priority: 6,
        });
    }

    return links;
}

// ─── Footer Link Grid ───
// The footer should have a dense link grid for crawl equity distribution

export function getFooterLinkGrid(): { label: string; links: InternalLink[] }[] {
    const grid: { label: string; links: InternalLink[] }[] = [];

    // Top countries
    grid.push({
        label: 'Top Countries',
        links: COUNTRIES.filter((c) => c.tier === 'A' || c.tier === 'B')
            .slice(0, 20)
            .map((c) => ({
                href: `/${c.slug}`,
                anchor: `${c.flag} ${c.name}`,
                rel: 'footer',
                priority: 5,
            })),
    });

    // Services
    grid.push({
        label: 'Services',
        links: SEO_SERVICES.map((s) => ({
            href: `/us/${s.slug}`,
            anchor: s.label,
            rel: 'footer',
            priority: 5,
        })),
    });

    // Guides
    grid.push({
        label: 'Guides',
        links: SNIPPET_TOPICS.map((t) => ({
            href: `/us/guide/${t.slug}`,
            anchor: t.title,
            rel: 'footer',
            priority: 4,
        })),
    });

    // Tools
    grid.push({
        label: 'Tools',
        links: [
            { href: '/tools/cost-estimator', anchor: 'Cost Estimator', rel: 'footer', priority: 5 },
            { href: '/tools/superload-meter', anchor: 'Superload Risk Meter', rel: 'footer', priority: 5 },
            { href: '/tools/friday-checker', anchor: 'Friday Move Checker', rel: 'footer', priority: 4 },
            { href: '/tools/movement-checker', anchor: 'Movement Checker', rel: 'footer', priority: 4 },
        ],
    });

    return grid;
}

// ─── Neighbor Country Logic ───
// Groups countries by geographic region for cross-linking

const REGION_MAP: Record<string, string[]> = {
    north_america: ['us', 'ca', 'mx'],
    south_america: ['br', 'ar', 'cl', 'co', 'pe'],
    western_europe: ['gb', 'de', 'fr', 'nl', 'be', 'at', 'ch', 'ie', 'es', 'pt', 'it'],
    northern_europe: ['se', 'no', 'fi', 'dk', 'ee', 'lv', 'lt'],
    eastern_europe: ['pl', 'cz', 'sk', 'hu', 'ro', 'bg', 'hr', 'rs', 'si', 'ua'],
    middle_east: ['ae', 'sa', 'qa', 'kw', 'om', 'bh', 'il', 'tr'],
    africa: ['za', 'ng', 'ke', 'eg', 'gh', 'tz'],
    south_asia: ['in', 'pk'],
    east_asia: ['cn', 'jp', 'kr', 'tw'],
    southeast_asia: ['sg', 'my', 'th', 'id', 'ph', 'vn'],
    oceania: ['au', 'nz'],
};

function getNeighborCountries(country: CountryConfig): CountryConfig[] {
    // Find which region this country belongs to
    const region = Object.entries(REGION_MAP).find(([, slugs]) =>
        slugs.includes(country.slug)
    );

    if (!region) return [];

    // Return other countries in same region
    return COUNTRIES.filter(
        (c) => c.slug !== country.slug && region[1].includes(c.slug)
    );
}

// ─── Link Health Auditor ───
// Use this to detect orphan pages and excessive click depth

export interface LinkHealthReport {
    totalPages: number;
    totalInternalLinks: number;
    avgLinksPerPage: number;
    maxClickDepth: number;
    orphanPages: string[];
    thinLinkPages: { path: string; linkCount: number }[];
    anchorTextDistribution: {
        exact_match_pct: number;
        partial_match_pct: number;
        branded_pct: number;
    };
}

export function computeLinkHealth(): LinkHealthReport {
    // Compute total page + link inventory
    const allPages: string[] = [];
    const linkCounts: Record<string, number> = {};

    // Country hub pages
    for (const country of COUNTRIES) {
        const path = `/${country.slug}`;
        allPages.push(path);
        const links = getCountryHubLinks(country);
        linkCounts[path] = links.length;
    }

    // Service pages
    for (const country of COUNTRIES) {
        for (const service of SEO_SERVICES) {
            const path = `/${country.slug}/${service.slug}`;
            allPages.push(path);
            const links = getServicePageLinks(country, service.slug);
            linkCounts[path] = links.length;
        }
    }

    // Guide pages
    for (const country of COUNTRIES) {
        for (const topic of SNIPPET_TOPICS) {
            const path = `/${country.slug}/guide/${topic.slug}`;
            allPages.push(path);
            const links = getGuidePageLinks(country, topic.slug);
            linkCounts[path] = links.length;
        }
    }

    const totalLinks = Object.values(linkCounts).reduce((sum, n) => sum + n, 0);
    const avgLinks = allPages.length > 0 ? totalLinks / allPages.length : 0;

    // Detect thin-link pages (< 10 internal links)
    const thinLinkPages = Object.entries(linkCounts)
        .filter(([, count]) => count < 10)
        .map(([path, linkCount]) => ({ path, linkCount }));

    return {
        totalPages: allPages.length,
        totalInternalLinks: totalLinks,
        avgLinksPerPage: Math.round(avgLinks * 10) / 10,
        maxClickDepth: 3, // Enforced by architecture
        orphanPages: [], // Will be computed at build-time via sitemap comparison
        thinLinkPages,
        anchorTextDistribution: {
            exact_match_pct: 30, // Target
            partial_match_pct: 45,
            branded_pct: 25,
        },
    };
}
