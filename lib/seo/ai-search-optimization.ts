// ══════════════════════════════════════════════════════════════
// AI SEARCH ENGINE OPTIMIZATION (AIO)
// Optimize for Perplexity, ChatGPT Search, Google AI Overviews, Gemini
// ══════════════════════════════════════════════════════════════

export interface AISearchEngine {
  name: string;
  strategy: string;
  structuredDataRequired: string[];
  priority: 'high' | 'medium' | 'low';
}

export const AI_SEARCH_ENGINES: AISearchEngine[] = [
  {
    name: 'Perplexity AI',
    strategy: 'Structured FAQ pages with cited sources → Perplexity cites structured data',
    structuredDataRequired: ['FAQPage', 'Dataset', 'HowTo'],
    priority: 'high',
  },
  {
    name: 'ChatGPT Search (SearchGPT)',
    strategy: 'Clear, factual authority pages with timestamps and source citations',
    structuredDataRequired: ['Article', 'Dataset', 'Organization'],
    priority: 'high',
  },
  {
    name: 'Google AI Overviews (SGE)',
    strategy: 'Own featured snippets → own AI overviews. Structured answers in H2/H3.',
    structuredDataRequired: ['FAQPage', 'HowTo', 'Article'],
    priority: 'high',
  },
  {
    name: 'Google Gemini',
    strategy: 'Wikidata entity + schema.org markup = Knowledge Graph entry',
    structuredDataRequired: ['Organization', 'LocalBusiness', 'Dataset'],
    priority: 'medium',
  },
];

// Every page MUST include these for AI search visibility
export const AI_SEARCH_PAGE_REQUIREMENTS = {
  every_page: [
    'datePublished + dateModified (freshness signal)',
    'author entity (Haul Command as Organization)',
    'sourceOrganization (official DOT when citing regulations)',
    'FAQPage schema (AI engines love Q&A format)',
    'HowTo schema (for process pages)',
    'Dataset schema (for data pages — signals AI that we have proprietary data)',
  ],
  compliance_pages: ['FAQPage', 'GovernmentService', 'LegalForceStatus'],
  directory_pages: ['LocalBusiness', 'ItemList', 'AggregateRating'],
  blog_pages: ['Article', 'BreadcrumbList', 'SpeakableSpecification'],
  data_pages: ['Dataset', 'DataFeed', 'StatisticalPopulation'],
};

// Non-Google search engine targets
export const NON_GOOGLE_ENGINES = [
  {
    engine: 'Naver',
    countries: ['KR'],
    marketShare: 55,
    actions: [
      'Register on Naver Webmaster Tools',
      'Create Naver Blog with Korean-language content',
      'Submit to Naver Caf\u00e9 (community forums)',
      'Use Naver Knowledge iN for Q&A authority',
      'Korean-language structured data required',
    ],
  },
  {
    engine: 'Yahoo Japan',
    countries: ['JP'],
    marketShare: 15,
    actions: [
      'Register on Yahoo Japan Search Console',
      'Note: uses Google index but has its own ranking factors',
      'Japanese-language content with proper meta tags',
    ],
  },
  {
    engine: 'Yandex',
    countries: ['TR'],
    marketShare: 2,
    actions: [
      'Submit to Yandex.Webmaster',
      'Track SQI (Site Quality Index)',
      'Turkish-language optimization',
    ],
  },
  {
    engine: 'C\u1ed1c C\u1ed1c',
    countries: ['VN'],
    marketShare: 3,
    actions: [
      'Register on C\u1ed1c C\u1ed1c Webmaster',
      'Vietnamese-language content optimization',
    ],
  },
];
