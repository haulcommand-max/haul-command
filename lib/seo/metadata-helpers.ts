// lib/seo/metadata-helpers.ts
// Reusable metadata builders for all page types.

// Near-me keyword matrix — generates local SEO content
export const NEAR_ME_TERMS = [
  'pilot car near me',
  'escort vehicle near me',
  'oversize load escort near me',
  'heavy haul escort near me',
  'wide load pilot car near me',
  'pilot car operator near me',
  'pilot vehicle near me',
  'oversize transport escort near me',
];

// State-level keyword targets
export function getStateKeywords(stateName: string, stateCode: string): string[] {
  return [
    `pilot car ${stateName}`,
    `escort vehicle ${stateName}`,
    `oversize load escort ${stateName}`,
    `${stateName} pilot car requirements`,
    `${stateName} oversize permit`,
    `${stateName} escort rules`,
    `pilot car ${stateCode.toUpperCase()}`,
    `heavy haul ${stateName}`,
    `wide load escort ${stateName}`,
    `${stateName} oversize load regulations`,
    `pilot car near me ${stateName}`,
    `escort vehicle ${stateName} requirements`,
  ];
}

// Country-level keyword targets (for 120 countries)
export function getCountryKeywords(countryName: string, countryCode: string): string[] {
  return [
    `pilot car ${countryName}`,
    `escort vehicle ${countryName}`,
    `oversize load escort ${countryName}`,
    `heavy haul ${countryName}`,
    `pilot car operator ${countryName}`,
    `oversize transport ${countryName}`,
    `${countryName} escort requirements`,
    `${countryName} oversize permit`,
    `${countryName} heavy haul regulations`,
  ];
}

// Build metadata for directory pages
export function buildDirectoryMetadata(params: {
  country?: string;
  state?: string;
  city?: string;
  serviceType?: string;
}) {
  const { country = 'United States', state, city, serviceType = 'pilot car operators' } = params;
  const location = [city, state, country].filter(Boolean).join(', ');

  return {
    title: `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} in ${location} | Haul Command`,
    description: `Find verified ${serviceType} in ${location}. Certified heavy haul escort professionals with real-time availability. Browse ${serviceType} near you on Haul Command.`,
    keywords: [
      `${serviceType} ${location}`,
      `pilot car near me${city ? ` ${city}` : ''}`,
      `escort vehicle ${location}`,
      `heavy haul escort ${location}`,
      `oversize load escort ${location}`,
    ].join(', '),
  };
}

// Build metadata for tool pages
export function buildToolMetadata(toolName: string, description: string, jurisdiction?: string) {
  const geo = jurisdiction ? ` — ${jurisdiction}` : '';
  return {
    title: `${toolName}${geo} | Free Heavy Haul Tool | Haul Command`,
    description: `${description} Free tool for heavy haul operators, brokers, and dispatchers. All 50 US states and 120 countries.`,
    keywords: [
      toolName.toLowerCase(),
      `oversize load ${toolName.toLowerCase()}`,
      `heavy haul ${toolName.toLowerCase()}`,
      `free ${toolName.toLowerCase()} tool`,
    ].join(', '),
  };
}

// Voice search queries — targets for featured snippets and AI answers
export const VOICE_SEARCH_QUERIES = [
  'What do I need to escort an oversize load in Florida',
  'How wide can a load be without a pilot car in Texas',
  'Do I need a permit for an oversize load in California',
  'What is the maximum load width without an escort',
  'When do I need a police escort for an oversize load',
  'What states require front and rear escort vehicles',
  'How much does an oversize permit cost in Ohio',
  'What are the escort requirements for loads over 16 feet wide',
  'How much do pilot cars charge per mile',
  'What is the going rate for pilot car escorts',
  'Find a pilot car near me',
  'Pilot car operator near me available now',
  'Escort vehicle driver near me',
  'Can I move an oversize load on Sunday in Texas',
  'What time can oversize loads travel in California',
];
