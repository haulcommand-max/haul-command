// ══════════════════════════════════════════════════════════════
// GLOBAL NEAR-ME ENGINE — HC Convoy
// Upgrades existing near-me-engine.ts with 57-country support
// Generates hyperlocal pages: country/state/city/operator
// ══════════════════════════════════════════════════════════════

import { COUNTRY_CONFIGS, CountryConfig } from '@/lib/localization/country-configs';

export interface NearMePageTemplate {
  urlPattern: string;
  schemaTypes: string[];
  contentSections: string[];
  estimatedPages: number;
}

// URL patterns for programmatic SEO pages
export const PAGE_TEMPLATES: NearMePageTemplate[] = [
  {
    urlPattern: '/directory/[country]/[state]/[city]',
    schemaTypes: ['ItemList', 'FAQPage', 'BreadcrumbList'],
    contentSections: ['operator_count', 'top_operators', 'map_embed', 'faq', 'compliance_link'],
    estimatedPages: 57000,
  },
  {
    urlPattern: '/directory/[country]/[state]',
    schemaTypes: ['ItemList', 'FAQPage', 'BreadcrumbList'],
    contentSections: ['operator_count', 'heatmap', 'compliance', 'rate_data'],
    estimatedPages: 1140,
  },
  {
    urlPattern: '/[country]/[state]/[city]/pilot-car-services',
    schemaTypes: ['Service', 'FAQPage', 'LocalBusiness'],
    contentSections: ['service_description', 'nearby_operators', 'pricing', 'faq'],
    estimatedPages: 57000,
  },
  {
    urlPattern: '/[country]/[state]/[city]/escort-vehicle-near-me',
    schemaTypes: ['Service', 'FAQPage'],
    contentSections: ['near_me_content', 'map', 'operator_list', 'faq'],
    estimatedPages: 57000,
  },
  {
    urlPattern: '/compliance/[country]/escort-regulations',
    schemaTypes: ['GovernmentService', 'FAQPage', 'Article'],
    contentSections: ['regulation_overview', 'requirements', 'penalties', 'faq'],
    estimatedPages: 3000,
  },
  {
    urlPattern: '/[country]/[state]/[corridor]/heavy-haul',
    schemaTypes: ['Service', 'FAQPage', 'Route'],
    contentSections: ['corridor_data', 'operators', 'clearance_data', 'faq'],
    estimatedPages: 10000,
  },
];

// Generate near-me keywords for a country
export function getNearMeKeywords(country: CountryConfig): string[] {
  const keywords: string[] = [];
  for (const term of country.escortTerminology) {
    keywords.push(`${term} near me`);
    keywords.push(`${term} near [city]`);
    keywords.push(`${term} [city] [state]`);
    keywords.push(`${term} services [zip]`);
    keywords.push(`best ${term} in [city]`);
    keywords.push(`how much does a ${term} cost in [city]`);
  }
  return keywords;
}

// Total page count across all templates
export const TOTAL_PROGRAMMATIC_PAGES = PAGE_TEMPLATES.reduce((sum, t) => sum + t.estimatedPages, 0);

// Generate FAQ schema for a city page
export function generateCityFAQ(city: string, state: string, country: string, operatorCount: number): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How many pilot car operators are in ${city}, ${state}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Haul Command lists ${operatorCount} verified pilot car operators in ${city}, ${state}. This number updates in real-time as operators join and verify their profiles.`,
        },
      },
      {
        '@type': 'Question',
        name: `How much does a pilot car cost in ${city}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Pilot car rates in ${city} typically range from $1.25-$2.50 per mile depending on route complexity, time of day, and escort requirements. Check current rates on Haul Command.`,
        },
      },
      {
        '@type': 'Question',
        name: `What are the escort vehicle requirements in ${state}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${state} escort vehicle requirements vary by load dimensions. Visit haulcommand.com/compliance/${country.toLowerCase()}/escort-regulations for full, up-to-date requirements.`,
        },
      },
    ],
  };
}
