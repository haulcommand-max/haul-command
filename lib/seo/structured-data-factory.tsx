/**
 * ═══════════════════════════════════════════════════════════════
 * STRUCTURED DATA FACTORY — Voice + AI + Rich Snippet Engine
 * 
 * Generates JSON-LD for:
 *   - SpeakableSpecification (voice search eligibility)
 *   - FAQPage (rich snippets in Google/Bing)
 *   - LocalBusiness (directory listings)
 *   - HowTo (process guides)
 *   - Service (service pages)
 *   - BreadcrumbList (navigation)
 *   - WebSite + SearchAction (sitelinks search box)
 * 
 * Coverage: All 120 countries, all major search engines + AI systems
 * ═══════════════════════════════════════════════════════════════
 */

// ── SPEAKABLE — Voice Search Eligibility ────────────────────

export interface SpeakableConfig {
  headline: string;
  summary: string;
  cssSelectors?: string[];
  url: string;
  datePublished?: string;
  dateModified?: string;
  image?: string;
}

export function generateSpeakable(config: SpeakableConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: config.headline,
    url: config.url,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: config.cssSelectors || [
        '.speakable-headline',
        '.speakable-summary',
      ],
    },
    ...(config.datePublished && { datePublished: config.datePublished }),
    ...(config.dateModified && { dateModified: config.dateModified }),
    ...(config.image && { image: config.image }),
  };
}

// ── FAQ PAGE — Rich Snippets ────────────────────────────────

export interface FAQItem {
  question: string;
  answer: string;
}

export function generateFAQSchema(faqs: FAQItem[], url?: string, dateModified?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
    ...(url && { url }),
    dateModified: dateModified || new Date().toISOString().split('T')[0],
  };
}

// ── LOCAL BUSINESS — Directory Listings ─────────────────────

export interface LocalBusinessConfig {
  name: string;
  description: string;
  address: {
    street?: string;
    city: string;
    state: string;
    zip?: string;
    country: string;
  };
  phone?: string;
  email?: string;
  url?: string;
  image?: string;
  geo?: { lat: number; lng: number };
  priceRange?: string;
  openingHours?: string[];
  rating?: { value: number; count: number };
  serviceArea?: string[];
  category?: string;
}

export function generateLocalBusiness(config: LocalBusinessConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': config.url,
    name: config.name,
    description: config.description,
    address: {
      '@type': 'PostalAddress',
      ...(config.address.street && { streetAddress: config.address.street }),
      addressLocality: config.address.city,
      addressRegion: config.address.state,
      ...(config.address.zip && { postalCode: config.address.zip }),
      addressCountry: config.address.country,
    },
    ...(config.phone && { telephone: config.phone }),
    ...(config.email && { email: config.email }),
    ...(config.url && { url: config.url }),
    ...(config.image && { image: config.image }),
    ...(config.geo && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: config.geo.lat,
        longitude: config.geo.lng,
      },
    }),
    ...(config.priceRange && { priceRange: config.priceRange }),
    ...(config.openingHours && { openingHoursSpecification: config.openingHours }),
    ...(config.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: config.rating.value,
        reviewCount: config.rating.count,
        bestRating: 5,
      },
    }),
    ...(config.serviceArea && {
      areaServed: config.serviceArea.map(area => ({
        '@type': 'State',
        name: area,
      })),
    }),
    dateModified: new Date().toISOString().split('T')[0],
  };
}

// ── SERVICE — Service Pages ─────────────────────────────────

export interface ServiceConfig {
  name: string;
  description: string;
  provider: string;
  providerUrl: string;
  serviceType: string;
  areaServed: string[];
  url: string;
  offers?: { price: string; currency: string; description: string };
}

export function generateService(config: ServiceConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: config.name,
    description: config.description,
    provider: {
      '@type': 'Organization',
      name: config.provider,
      url: config.providerUrl,
    },
    serviceType: config.serviceType,
    areaServed: config.areaServed.map(area => ({
      '@type': 'Country',
      name: area,
    })),
    url: config.url,
    ...(config.offers && {
      offers: {
        '@type': 'Offer',
        price: config.offers.price,
        priceCurrency: config.offers.currency,
        description: config.offers.description,
      },
    }),
    dateModified: new Date().toISOString().split('T')[0],
  };
}

// ── HOW-TO — Process Guides ─────────────────────────────────

export interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

export function generateHowTo(
  name: string,
  description: string,
  steps: HowToStep[],
  totalTime?: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    ...(totalTime && { totalTime }),
    step: steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };
}

// ── BREADCRUMBS ─────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbs(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ── WEBSITE + SEARCH ACTION (Sitelinks Search Box) ──────────

export function generateWebsiteSearch(siteName: string, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ── COUNTRY-SPECIFIC SEO CONFIG ─────────────────────────────

export interface CountrySEOConfig {
  code: string;
  locale: string;
  currency: string;
  searchEngines: string[];
  voiceAssistants: string[];
  aiPlatforms: string[];
  primaryTerms: string[];
}

export const COUNTRY_SEO_MAP: CountrySEOConfig[] = [
  // Tier A — Gold
  { code: 'US', locale: 'en-US', currency: 'USD', searchEngines: ['Google','Bing','Yahoo','DuckDuckGo'], voiceAssistants: ['Google Assistant','Alexa','Siri','Cortana'], aiPlatforms: ['ChatGPT','Gemini','Perplexity','Claude','Copilot'], primaryTerms: ['pilot car','escort vehicle','oversize load','heavy haul'] },
  { code: 'CA', locale: 'en-CA', currency: 'CAD', searchEngines: ['Google','Bing'], voiceAssistants: ['Google Assistant','Alexa','Siri'], aiPlatforms: ['ChatGPT','Gemini','Perplexity'], primaryTerms: ['pilot vehicle','escort car','wide load','oversize transport'] },
  { code: 'AU', locale: 'en-AU', currency: 'AUD', searchEngines: ['Google','Bing'], voiceAssistants: ['Google Assistant','Siri'], aiPlatforms: ['ChatGPT','Gemini'], primaryTerms: ['pilot vehicle','escort vehicle','OSOM load','oversize transport'] },
  { code: 'GB', locale: 'en-GB', currency: 'GBP', searchEngines: ['Google','Bing'], voiceAssistants: ['Google Assistant','Alexa','Siri'], aiPlatforms: ['ChatGPT','Gemini','Perplexity'], primaryTerms: ['escort vehicle','abnormal load','wide load escort','heavy haulage'] },
  { code: 'DE', locale: 'de-DE', currency: 'EUR', searchEngines: ['Google','Bing','Ecosia'], voiceAssistants: ['Google Assistant','Alexa','Siri'], aiPlatforms: ['ChatGPT','Gemini'], primaryTerms: ['Schwertransport','Begleitfahrzeug','Überbreite','Sondertransport'] },
  { code: 'NL', locale: 'nl-NL', currency: 'EUR', searchEngines: ['Google','Bing'], voiceAssistants: ['Google Assistant'], aiPlatforms: ['ChatGPT','Gemini'], primaryTerms: ['exceptioneel transport','begeleidingsvoertuig','zwaar transport'] },
  { code: 'AE', locale: 'ar-AE', currency: 'AED', searchEngines: ['Google','Bing'], voiceAssistants: ['Google Assistant','Siri'], aiPlatforms: ['ChatGPT','Gemini'], primaryTerms: ['heavy transport','oversize cargo','escort vehicle','abnormal load'] },
  { code: 'BR', locale: 'pt-BR', currency: 'BRL', searchEngines: ['Google','Bing'], voiceAssistants: ['Google Assistant'], aiPlatforms: ['ChatGPT','Gemini'], primaryTerms: ['transporte especial','carga indivisível','escolta de carga','veículo batedor'] },
  { code: 'NZ', locale: 'en-NZ', currency: 'NZD', searchEngines: ['Google','Bing'], voiceAssistants: ['Google Assistant','Siri'], aiPlatforms: ['ChatGPT','Gemini'], primaryTerms: ['pilot vehicle','overweight permit','overdimension load'] },
  { code: 'ZA', locale: 'en-ZA', currency: 'ZAR', searchEngines: ['Google','Bing'], voiceAssistants: ['Google Assistant'], aiPlatforms: ['ChatGPT','Gemini'], primaryTerms: ['abnormal load','pilot vehicle','oversize transport','heavy haulage'] },
  // Tier B
  { code: 'SE', locale: 'sv-SE', currency: 'SEK', searchEngines: ['Google','Bing'], voiceAssistants: ['Google Assistant'], aiPlatforms: ['ChatGPT','Gemini'], primaryTerms: ['tungtransport','ledsagningsfordon','specialtransport'] },
  { code: 'NO', locale: 'nb-NO', currency: 'NOK', searchEngines: ['Google','Bing'], voiceAssistants: ['Google Assistant'], aiPlatforms: ['ChatGPT','Gemini'], primaryTerms: ['spesialtransport','følgebil','tungtransport'] },
  { code: 'FR', locale: 'fr-FR', currency: 'EUR', searchEngines: ['Google','Bing','Qwant'], voiceAssistants: ['Google Assistant','Siri'], aiPlatforms: ['ChatGPT','Gemini','Mistral'], primaryTerms: ['transport exceptionnel','véhicule pilote','convoi exceptionnel'] },
  { code: 'ES', locale: 'es-ES', currency: 'EUR', searchEngines: ['Google','Bing'], voiceAssistants: ['Google Assistant','Siri'], aiPlatforms: ['ChatGPT','Gemini'], primaryTerms: ['transporte especial','vehículo piloto','carga sobredimensionada'] },
  { code: 'IT', locale: 'it-IT', currency: 'EUR', searchEngines: ['Google','Bing'], voiceAssistants: ['Google Assistant','Siri'], aiPlatforms: ['ChatGPT','Gemini'], primaryTerms: ['trasporto eccezionale','veicolo scorta','carico eccezionale'] },
  // Tier C — Non-Google engines
  { code: 'JP', locale: 'ja-JP', currency: 'JPY', searchEngines: ['Google','Yahoo Japan','Bing'], voiceAssistants: ['Google Assistant','Siri'], aiPlatforms: ['ChatGPT','Gemini'], primaryTerms: ['特殊車両','誘導車','超大型輸送'] },
  { code: 'KR', locale: 'ko-KR', currency: 'KRW', searchEngines: ['Naver','Google','Daum'], voiceAssistants: ['Google Assistant','Bixby'], aiPlatforms: ['ChatGPT','Gemini'], primaryTerms: ['특수운송','유도차량','초대형화물'] },
  { code: 'TR', locale: 'tr-TR', currency: 'TRY', searchEngines: ['Google','Yandex','Bing'], voiceAssistants: ['Google Assistant'], aiPlatforms: ['ChatGPT','Gemini'], primaryTerms: ['ağır yük taşımacılığı','özel nakliye','eşkort aracı'] },
  { code: 'MX', locale: 'es-MX', currency: 'MXN', searchEngines: ['Google','Bing'], voiceAssistants: ['Google Assistant','Siri'], aiPlatforms: ['ChatGPT','Gemini'], primaryTerms: ['transporte especial','vehículo piloto','carga sobredimensionada'] },
  { code: 'SA', locale: 'ar-SA', currency: 'SAR', searchEngines: ['Google','Bing'], voiceAssistants: ['Google Assistant','Siri'], aiPlatforms: ['ChatGPT','Gemini'], primaryTerms: ['نقل ثقيل','مركبة مرافقة','حمولة كبيرة'] },
];

// ── OPEN SEARCH — Browser Search Integration ────────────────

export function generateOpenSearchXML(
  shortName: string,
  description: string,
  siteUrl: string,
) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>${shortName}</ShortName>
  <Description>${description}</Description>
  <Url type="text/html" template="${siteUrl}/search?q={searchTerms}"/>
  <Image width="16" height="16" type="image/x-icon">${siteUrl}/favicon.ico</Image>
  <InputEncoding>UTF-8</InputEncoding>
</OpenSearchDescription>`;
}

// ── COMBINED SCHEMA INJECTOR ────────────────────────────────
// Use in Next.js page components:
//   <StructuredData schemas={[schema1, schema2]} />

export function StructuredDataScript({ schemas }: { schemas: object[] }) {
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
