// ══════════════════════════════════════════════════════════════
// GLOBAL BRAND SPIDER — HC Sentinel
// Scans for unlinked brand mentions across 57 countries
// Agent: HC Sentinel | Swarm: seo_backlink
// ══════════════════════════════════════════════════════════════

import { COUNTRY_CONFIGS } from '@/lib/localization/country-configs';

export interface BrandMention {
  url: string;
  domain: string;
  domainAuthority: number;
  mentionText: string;
  hasLink: boolean;
  linkTarget?: string;
  language: string;
  countryCode: string;
  discoveredAt: string;
  outreachStatus: 'pending' | 'contacted' | 'linked' | 'rejected' | 'no_response';
}

// Universal scan terms (all countries)
export const UNIVERSAL_SCAN_TERMS = [
  '"Haul Command"',
  '"haulcommand"',
  '"haulcommand.com"',
  '"haul-command"',
];

// Generate localized scan terms for each country
export function getLocalizedScanTerms(countryCode: string): string[] {
  const config = COUNTRY_CONFIGS.find(c => c.code === countryCode);
  if (!config) return UNIVERSAL_SCAN_TERMS;

  const terms = [...UNIVERSAL_SCAN_TERMS];

  // Add country-specific escort terminology
  for (const term of config.escortTerminology) {
    terms.push(`"${config.name}" "${term}"`);
    terms.push(`"${config.nameLocal}" "${term}"`);
  }

  return terms;
}

// Outreach template for unlinked mentions
export const UNLINKED_MENTION_OUTREACH = {
  subject: 'Thanks for mentioning Haul Command — quick request',
  body: `Hi [CONTACT_NAME],

I noticed you mentioned Haul Command in your article "[ARTICLE_TITLE]" — thank you for that!

Would you mind adding a link to haulcommand.com when you reference us? It helps readers find the tools and data you’re referencing.

As a thank you, I’d be happy to provide:
• An embeddable live operator count widget for your site
• Exclusive data from our 1.56M operator directory for future articles
• A guest post or expert quote on any logistics topic

Best,
Haul Command Team`,
  llm: 'claude-3.5-sonnet',
  expectedConversionRate: 0.35, // 35% historical for unlinked mentions
};

// Widget offer for converted mentions
export const EMBED_WIDGET_CONFIG = {
  types: [
    {
      name: 'Live Operator Count',
      description: 'Shows real-time operator count in visitor\'s region',
      embedCode: '<iframe src="https://haulcommand.com/embed/operator-count?country=[CC]" width="300" height="80" frameborder="0"></iframe>',
    },
    {
      name: 'Compliance Checker',
      description: 'Embeddable escort requirement checker by state/country',
      embedCode: '<iframe src="https://haulcommand.com/embed/compliance?jurisdiction=[JUR]" width="400" height="500" frameborder="0"></iframe>',
    },
    {
      name: 'Rate Estimator',
      description: 'Corridor-specific rate estimator widget',
      embedCode: '<iframe src="https://haulcommand.com/embed/rate-estimate" width="400" height="300" frameborder="0"></iframe>',
    },
  ],
};
