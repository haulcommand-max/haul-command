/**
 * lib/seo/interlinking-graph.ts
 * Global SEO Interlinking Dominance System
 *
 * Rules:
 *  - No page is a dead end
 *  - Every page sends AND receives links
 *  - Link equity flows: Tools → Regulations → Glossary → Directory → Profiles
 *  - All pages reachable within 3 clicks
 *  - noindex pages are excluded from link flow
 */

export type PageType =
  | 'tool'
  | 'regulation'
  | 'glossary'
  | 'directory'
  | 'profile'
  | 'corridor'
  | 'role'
  | 'load'
  | 'leaderboard'
  | 'country'
  | 'blog'
  | 'support';

export interface InternalLink {
  href: string;
  label: string;
  context?: string; // Why this link exists (for audit)
}

// ─── Priority weights (higher = more equity passed) ─────────────────────────
export const PAGE_EQUITY_WEIGHT: Record<PageType, number> = {
  tool:        1.00, // Highest authority
  regulation:  0.90,
  glossary:    0.80,
  directory:   0.75,
  corridor:    0.70,
  role:        0.65,
  leaderboard: 0.60,
  load:        0.55,
  profile:     0.50,
  country:     0.45,
  blog:        0.35,
  support:     0.20,
};

// ─── Core link graph: for each page type, what it must link to ───────────────
export const LINK_GRAPH: Record<PageType, PageType[]> = {
  tool:        ['directory', 'regulation', 'glossary', 'corridor'],
  regulation:  ['tool', 'directory', 'glossary', 'country'],
  glossary:    ['tool', 'regulation', 'directory', 'role'],
  directory:   ['profile', 'corridor', 'glossary', 'regulation'],
  corridor:    ['directory', 'tool', 'regulation', 'leaderboard'],
  role:        ['directory', 'tool', 'glossary', 'load'],
  leaderboard: ['directory', 'corridor', 'role', 'tool'],
  load:        ['directory', 'corridor', 'tool', 'role'],
  profile:     ['directory', 'corridor', 'glossary', 'regulation'],
  country:     ['directory', 'regulation', 'tool', 'corridor'],
  blog:        ['tool', 'directory', 'glossary', 'regulation'],
  support:     ['tool', 'directory'],
};

// ─── Static link sets per page type (always-on links) ─────────────────────
export const STATIC_LINKS: Record<PageType, InternalLink[]> = {
  tool: [
    { href: '/directory', label: 'Find escort operators', context: 'post-tool CTA' },
    { href: '/tools/escort-calculator', label: 'Escort vehicle calculator' },
    { href: '/tools/permit-checker', label: 'Permit requirements checker' },
    { href: '/corridors', label: 'Corridor intelligence' },
    { href: '/glossary', label: 'Heavy haul glossary' },
  ],
  regulation: [
    { href: '/tools/escort-calculator', label: 'Calculate escorts for this state', context: 'highest-intent CTA' },
    { href: '/directory', label: 'Find escort operators' },
    { href: '/glossary', label: 'Glossary of permit terms' },
    { href: '/loads', label: 'Heavy haul load board' },
  ],
  glossary: [
    { href: '/tools/escort-calculator', label: 'Escort vehicle calculator' },
    { href: '/directory', label: 'Find heavy haul operators' },
    { href: '/roles/pilot-car-operator', label: 'Pilot car operators' },
    { href: '/roles/broker', label: 'Heavy haul brokers' },
  ],
  directory: [
    { href: '/tools/escort-calculator', label: 'Escort calculator' },
    { href: '/leaderboards', label: 'Top-ranked operators' },
    { href: '/corridors', label: 'Browse by corridor' },
    { href: '/loads', label: 'Load board' },
  ],
  corridor: [
    { href: '/directory', label: 'Find operators on this corridor' },
    { href: '/tools/escort-calculator', label: 'Calculate escorts for this route' },
    { href: '/leaderboards', label: 'Top operators' },
    { href: '/loads', label: 'Loads on this corridor' },
  ],
  role: [
    { href: '/directory', label: 'Find operators', context: 'buyer CTA' },
    { href: '/directory/claim', label: 'Get listed free', context: 'operator CTA' },
    { href: '/tools/escort-calculator', label: 'Escort calculator' },
    { href: '/leaderboards', label: 'Top-ranked operators' },
  ],
  leaderboard: [
    { href: '/directory', label: 'Browse all operators' },
    { href: '/corridors', label: 'Corridor rankings' },
    { href: '/tools/escort-calculator', label: 'Escort calculator' },
    { href: '/roles/pilot-car-operator', label: 'Pilot car operators' },
    { href: '/loads', label: 'Heavy haul loads' },
  ],
  load: [
    { href: '/directory', label: 'Find escort operators' },
    { href: '/tools/escort-calculator', label: 'Calculate escort requirements' },
    { href: '/corridors', label: 'Corridor intelligence' },
    { href: '/roles/pilot-car-operator', label: 'Pilot car operators' },
  ],
  profile: [
    { href: '/directory', label: 'Back to directory' },
    { href: '/corridors', label: 'Active corridors' },
    { href: '/tools/escort-calculator', label: 'Calculate escort needs' },
    { href: '/leaderboards', label: 'See leaderboard rankings' },
  ],
  country: [
    { href: '/directory', label: 'Find operators internationally' },
    { href: '/tools/escort-calculator', label: 'International escort calculator' },
    { href: '/corridors', label: 'Global corridor intelligence' },
  ],
  blog: [
    { href: '/tools/escort-calculator', label: 'Escort calculator' },
    { href: '/directory', label: 'Find operators' },
    { href: '/glossary', label: 'Heavy haul glossary' },
  ],
  support: [
    { href: '/directory', label: 'Operator directory' },
    { href: '/tools/escort-calculator', label: 'Escort calculator' },
  ],
};

// ─── US State link mesh ──────────────────────────────────────────────────────
// For regulation/state pages: link to adjacent states and the national directory
export const US_STATE_ADJACENT: Record<string, string[]> = {
  TX: ['LA', 'AR', 'OK', 'NM'],
  CA: ['OR', 'NV', 'AZ'],
  FL: ['GA', 'AL'],
  NY: ['NJ', 'CT', 'PA', 'MA', 'VT'],
  PA: ['NY', 'NJ', 'DE', 'MD', 'OH', 'WV'],
  OH: ['PA', 'WV', 'KY', 'IN', 'MI'],
  IL: ['IN', 'WI', 'IA', 'MO', 'KY'],
  GA: ['FL', 'AL', 'TN', 'SC', 'NC'],
  // Extend as needed
};

// ─── Top corridors for linking ───────────────────────────────────────────────
export const TOP_CORRIDORS = [
  { slug: 'i-10', label: 'I-10 (TX-LA-FL)' },
  { slug: 'i-20', label: 'I-20 (TX-GA)' },
  { slug: 'i-35', label: 'I-35 (TX-OK-KS)' },
  { slug: 'i-40', label: 'I-40 (CA-TX-NC)' },
  { slug: 'i-80', label: 'I-80 (CA-NE)' },
  { slug: 'i-90', label: 'I-90 (WA-NY)' },
];

// ─── Tool page cross-links ───────────────────────────────────────────────────
export const TOOL_CROSS_LINKS: Record<string, InternalLink[]> = {
  'escort-calculator': [
    { href: '/tools/permit-checker', label: 'Check permit requirements' },
    { href: '/tools/bridge-weight', label: 'Bridge weight calculator' },
    { href: '/tools/cost-calculator', label: 'Haul cost calculator' },
    { href: '/tools/route-complexity', label: 'Route complexity analyzer' },
  ],
  'permit-checker': [
    { href: '/tools/escort-calculator', label: 'Escort vehicle calculator' },
    { href: '/tools/cost-calculator', label: 'Haul cost estimator' },
  ],
  'bridge-weight': [
    { href: '/tools/escort-calculator', label: 'Escort requirements' },
    { href: '/tools/route-complexity', label: 'Route complexity' },
  ],
  'cost-calculator': [
    { href: '/tools/escort-calculator', label: 'Escort calculator' },
    { href: '/tools/permit-checker', label: 'Permit checker' },
    { href: '/directory', label: 'Find operators for this route' },
  ],
};

// ─── Homepage link set (high authority, link out to everything) ───────────────
export const HOMEPAGE_LINKS: InternalLink[] = [
  { href: '/directory', label: 'Heavy haul operator directory' },
  { href: '/tools/escort-calculator', label: 'Escort vehicle calculator' },
  { href: '/loads', label: 'Load board' },
  { href: '/leaderboards', label: 'Top operators' },
  { href: '/corridors', label: 'Corridor intelligence' },
  { href: '/roles/pilot-car-operator', label: 'Pilot car operators' },
  { href: '/roles/broker', label: 'Heavy haul brokers' },
  { href: '/roles/heavy-haul-carrier', label: 'Heavy haul carriers' },
  { href: '/glossary', label: 'Industry glossary' },
  { href: '/pricing', label: 'List your business' },
];

// ─── noindex pages (excluded from link flow) ─────────────────────────────────
export const NOINDEX_PATHS = new Set([
  '/admin',
  '/dashboard',
  '/auth',
  '/onboarding',
  '/dev',
  '/accept',
  '/quickpay',
]);

/**
 * Get contextual related links for a given page type and optional slug context.
 * Use this in page components to inject the footer link strip.
 */
export function getRelatedLinks(
  pageType: PageType,
  context?: { state?: string; corridor?: string; toolSlug?: string },
): InternalLink[] {
  const base = STATIC_LINKS[pageType] ?? [];

  const extras: InternalLink[] = [];

  if (pageType === 'regulation' && context?.state) {
    const adjacent = US_STATE_ADJACENT[context.state] ?? [];
    adjacent.slice(0, 3).forEach(s =>
      extras.push({
        href: `/escort-requirements/${s.toLowerCase()}`,
        label: `${s} escort requirements`,
        context: 'adjacent state link',
      })
    );
  }

  if (pageType === 'tool' && context?.toolSlug) {
    const crossLinks = TOOL_CROSS_LINKS[context.toolSlug] ?? [];
    extras.push(...crossLinks);
  }

  if (pageType === 'corridor' && context?.corridor) {
    extras.push({
      href: `/directory?corridor=${context.corridor}`,
      label: `Operators on ${context.corridor}`,
      context: 'corridor-specific directory link',
    });
  }

  return [...base, ...extras].slice(0, 8); // Cap at 8 per render
}
