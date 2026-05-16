import type { Metadata } from 'next';

const SITE_URL = 'https://www.haulcommand.com';
const SITE_NAME = 'Haul Command';

export type PageSeoFamily =
  | 'home'
  | 'tools_hub'
  | 'tool_detail'
  | 'directory_hub'
  | 'directory_country'
  | 'directory_region'
  | 'directory_city'
  | 'profile'
  | 'load_board'
  | 'load_detail'
  | 'regulation'
  | 'glossary'
  | 'corridor'
  | 'market_data'
  | 'blog'
  | 'training'
  | 'role'
  | 'adgrid'
  | 'trust';

export type PageQualityStatus =
  | 'indexable'
  | 'developing_noindex'
  | 'source_review_needed'
  | 'canonicalized'
  | 'private';

export interface InternalLinkSlot {
  label: string;
  href: string;
  reason: string;
  pageFamily?: PageSeoFamily;
}

export interface ConversionCta {
  label: string;
  href: string;
  intent:
    | 'find_provider'
    | 'claim_profile'
    | 'post_load'
    | 'request_support'
    | 'open_tool'
    | 'check_regulations'
    | 'sponsor_market'
    | 'view_data'
    | 'submit_correction';
  primary?: boolean;
}

export interface PageSeoContract {
  path: string;
  pageType: PageSeoFamily;
  title: string;
  metaDescription: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalPath?: string;
  robots?: 'index' | 'noindex';
  h1: string;
  eyebrow?: string;
  visibleIntro: string;
  quickAnswer: string;
  h2Outline: string[];
  faqQuestions?: string[];
  schemaTypes: string[];
  primaryKeyword: string;
  secondaryKeywords: string[];
  entityTerms: string[];
  country?: string;
  region?: string;
  city?: string;
  corridor?: string;
  role?: string;
  language?: string;
  imageFilenamePattern?: string;
  imageAltText?: string;
  internalLinkSlots: InternalLinkSlot[];
  conversionCtas: ConversionCta[];
  sourceBasis: string;
  lastReviewedAt?: string;
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'event_driven';
  qualityStatus: PageQualityStatus;
  linkMagnetModules?: Array<
    | 'embed_tool'
    | 'share_result'
    | 'download_checklist'
    | 'citation_block'
    | 'qr_code'
    | 'share_card'
    | 'badge'
    | 'source_pack'
    | 'data_preview'
  >;
}

export const INTERNAL_LINK_BUDGETS: Record<PageSeoFamily, { contextualMin: number; contextualMax: number; totalMax: number }> = {
  home: { contextualMin: 12, contextualMax: 24, totalMax: 60 },
  tools_hub: { contextualMin: 20, contextualMax: 40, totalMax: 120 },
  tool_detail: { contextualMin: 8, contextualMax: 14, totalMax: 36 },
  directory_hub: { contextualMin: 16, contextualMax: 32, totalMax: 90 },
  directory_country: { contextualMin: 12, contextualMax: 24, totalMax: 70 },
  directory_region: { contextualMin: 10, contextualMax: 18, totalMax: 56 },
  directory_city: { contextualMin: 8, contextualMax: 14, totalMax: 42 },
  profile: { contextualMin: 6, contextualMax: 12, totalMax: 32 },
  load_board: { contextualMin: 8, contextualMax: 16, totalMax: 50 },
  load_detail: { contextualMin: 6, contextualMax: 12, totalMax: 34 },
  regulation: { contextualMin: 10, contextualMax: 18, totalMax: 46 },
  glossary: { contextualMin: 6, contextualMax: 12, totalMax: 34 },
  corridor: { contextualMin: 12, contextualMax: 24, totalMax: 70 },
  market_data: { contextualMin: 10, contextualMax: 20, totalMax: 56 },
  blog: { contextualMin: 8, contextualMax: 18, totalMax: 44 },
  training: { contextualMin: 8, contextualMax: 14, totalMax: 38 },
  role: { contextualMin: 8, contextualMax: 16, totalMax: 46 },
  adgrid: { contextualMin: 6, contextualMax: 12, totalMax: 34 },
  trust: { contextualMin: 6, contextualMax: 12, totalMax: 34 },
};

export function absoluteUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function definePageSeoContract(contract: PageSeoContract) {
  return contract;
}

export function contractToMetadata(contract: PageSeoContract): Metadata {
  const canonical = absoluteUrl(contract.canonicalPath ?? contract.path);
  const shouldIndex =
    contract.robots !== 'noindex' &&
    contract.qualityStatus !== 'developing_noindex' &&
    contract.qualityStatus !== 'source_review_needed' &&
    contract.qualityStatus !== 'private';
  const shouldFollow = contract.qualityStatus !== 'private';

  return {
    title: contract.title,
    description: contract.metaDescription,
    keywords: [
      contract.primaryKeyword,
      ...contract.secondaryKeywords,
      ...contract.entityTerms,
    ].filter(Boolean).join(', '),
    alternates: { canonical },
    robots: {
      index: shouldIndex,
      follow: shouldFollow,
      googleBot: {
        index: shouldIndex,
        follow: shouldFollow,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title: contract.ogTitle ?? contract.title,
      description: contract.ogDescription ?? contract.metaDescription,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: contract.ogTitle ?? contract.title,
      description: contract.ogDescription ?? contract.metaDescription,
    },
  };
}

export function contractToCollectionJsonLd(
  contract: PageSeoContract,
  items: Array<{ name: string; url: string }>
) {
  const uniqueItems = items.filter((item, index, allItems) => {
    const itemUrl = absoluteUrl(item.url);
    return allItems.findIndex((candidate) => absoluteUrl(candidate.url) === itemUrl) === index;
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: contract.h1,
    description: contract.visibleIntro,
    url: absoluteUrl(contract.canonicalPath ?? contract.path),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: uniqueItems.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.url),
      })),
    },
  };
}
