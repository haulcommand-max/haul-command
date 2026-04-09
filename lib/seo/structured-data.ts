/**
 * Haul Command: JSON-LD Structured Data Factory
 * 
 * Centralized generation of schema.org markup.
 * Every page family calls into this factory to guarantee compliance
 * with Google's structured data guidelines.
 * 
 * Rules from master prompt:
 * - Structured data must match visible page content
 * - Must be current, truthful, and non-misleading
 * - Do not mark up fake reviews, invisible content, or irrelevant content
 */

export interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
}

export function generateOrganizationSchema(props?: OrganizationSchemaProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: props?.name || 'Haul Command',
    url: props?.url || 'https://www.haulcommand.com',
    logo: props?.logo || 'https://www.haulcommand.com/logo.png',
    description: 'The global operating system for heavy haul logistics. Pilot car directory, escort dispatch, route intelligence, and compliance tools across 120 countries.',
    sameAs: props?.sameAs || [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English'],
    },
  };
}

export interface ArticleSchemaProps {
  title: string;
  description: string;
  slug: string;
  published_at: string;
  modified_at?: string;
  author_name?: string;
  image_url?: string;
}

export function generateArticleSchema(props: ArticleSchemaProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: props.title,
    description: props.description,
    url: `https://www.haulcommand.com/blog/${props.slug}`,
    datePublished: props.published_at,
    dateModified: props.modified_at || props.published_at,
    author: {
      '@type': 'Organization',
      name: props.author_name || 'Haul Command Research Desk',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Haul Command',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.haulcommand.com/logo.png',
      },
    },
    image: props.image_url || 'https://www.haulcommand.com/og/blog-default.png',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.haulcommand.com/blog/${props.slug}`,
    },
  };
}

export interface ProfilePageSchemaProps {
  name: string;
  slug: string;
  description: string;
  image_url?: string;
  service_area?: string[];
  telephone?: string;
  rating?: number;
  review_count?: number;
}

export function generateProfilePageSchema(props: ProfilePageSchemaProps) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Organization',
      name: props.name,
      url: `https://www.haulcommand.com/profile/${props.slug}`,
      description: props.description,
      image: props.image_url,
      telephone: props.telephone,
      areaServed: props.service_area?.map(area => ({
        '@type': 'AdministrativeArea',
        name: area,
      })),
    },
  };

  // Only add aggregate rating if real reviews exist
  if (props.rating && props.review_count && props.review_count > 0) {
    schema.mainEntity.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: props.rating,
      reviewCount: props.review_count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export interface HowToSchemaProps {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
  tool_url: string;
}

export function generateHowToSchema(props: HowToSchemaProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: props.name,
    description: props.description,
    step: props.steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
    mainEntityOfPage: props.tool_url,
  };
}

export interface BreadcrumbSchemaProps {
  items: { name: string; url: string }[];
}

export function generateBreadcrumbSchema(props: BreadcrumbSchemaProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: props.items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * hreflang Link Generator
 * For Tier A countries with localized regulation content.
 * Returns array of <link> attributes for Next.js Head.
 */
export function generateHreflangLinks(basePath: string, availableCountries: string[]) {
  const COUNTRY_LANG_MAP: Record<string, string> = {
    us: 'en-US',
    ca: 'en-CA',
    au: 'en-AU',
    gb: 'en-GB',
    nz: 'en-NZ',
    za: 'en-ZA',
    de: 'de-DE',
    nl: 'nl-NL',
    ae: 'en-AE',
    br: 'pt-BR',
  };

  return availableCountries
    .filter(c => COUNTRY_LANG_MAP[c])
    .map(c => ({
      rel: 'alternate',
      hrefLang: COUNTRY_LANG_MAP[c],
      href: `https://www.haulcommand.com${basePath}/${c}`,
    }))
    .concat([{
      rel: 'alternate',
      hrefLang: 'x-default',
      href: `https://www.haulcommand.com${basePath}`,
    }]);
}
