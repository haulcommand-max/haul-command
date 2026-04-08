/**
 * lib/seo/metadata.ts — Haul Command dynamic generateMetadata factory
 *
 * Usage in any dynamic route:
 *   // app/directory/[country]/[region]/page.tsx
 *   export const generateMetadata = buildMetadata({
 *     titleFn: ({ country, region }) => `Pilot Cars in ${region}, ${country} | Haul Command`,
 *     descriptionFn: ({ country, region }) =>
 *       `Find verified pilot car operators in ${region}. Compare availability, trust scores, and local coverage.`,
 *     type: 'website',
 *   });
 *
 * Or use the pre-built recipes below for common page families.
 */

import type { Metadata } from 'next';

const SITE_NAME = 'Haul Command';
const SITE_URL = 'https://haulcommand.com';
const DEFAULT_IMAGE = '/og/default.jpg';

// ─── Core factory ─────────────────────────────────────────────────────────────
interface MetadataInput<P = Record<string, string>> {
  params?: P;
  searchParams?: Record<string, string>;
}

interface MetadataConfig<P> {
  titleFn: (params: P) => string;
  descriptionFn: (params: P) => string;
  imageFn?: (params: P) => string;
  type?: 'website' | 'article';
  /** JSON-LD objects to inject alongside standard meta */
  jsonLdFn?: (params: P) => Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

export function buildMetadata<P extends Record<string, string>>(
  config: MetadataConfig<P>,
) {
  return async ({ params }: MetadataInput<P>): Promise<Metadata> => {
    const p = (params ?? {}) as P;
    const title = `${config.titleFn(p)} | ${SITE_NAME}`;
    const description = config.descriptionFn(p);
    const imageUrl = config.imageFn ? config.imageFn(p) : DEFAULT_IMAGE;
    const canonical = `${SITE_URL}`;

    return {
      title,
      description,
      metadataBase: new URL(SITE_URL),
      alternates: { canonical },
      openGraph: {
        title,
        description,
        siteName: SITE_NAME,
        type: config.type ?? 'website',
        images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
      robots: config.noindex
        ? { index: false, follow: false }
        : { index: true, follow: true },
    };
  };
}

// ─── JSON-LD generators ────────────────────────────────────────────────────────
/**
 * Generate FAQPage JSON-LD from a Q&A array.
 * Paste the output into a <script type="application/ld+json"> tag.
 */
export function buildFaqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

/**
 * Generate Course JSON-LD for training module pages.
 */
export function buildCourseJsonLd(course: {
  name: string;
  description: string;
  provider?: string;
  url?: string;
  duration?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description,
    url: course.url ?? SITE_URL,
    duration: course.duration,
    provider: {
      '@type': 'Organization',
      name: course.provider ?? SITE_NAME,
    },
  };
}

/**
 * Generate LocalBusiness JSON-LD for operator profiles.
 */
export function buildLocalBusinessJsonLd(biz: {
  name: string;
  description?: string;
  city: string;
  region: string;
  country: string;
  phone?: string;
  url?: string;
  latitude?: number;
  longitude?: number;
  reviewCount?: number;
  ratingValue?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: biz.name,
    description: biz.description,
    url: biz.url ?? SITE_URL,
    telephone: biz.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: biz.city,
      addressRegion: biz.region,
      addressCountry: biz.country,
    },
    ...(biz.latitude &&
      biz.longitude && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: biz.latitude,
          longitude: biz.longitude,
        },
      }),
    ...(biz.reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: biz.ratingValue ?? 4.8,
        reviewCount: biz.reviewCount,
      },
    }),
  };
}

// ─── Pre-built metadata recipes ───────────────────────────────────────────────
/** For /directory/[country]/[region] dynamic pages */
export const buildRegionMetadata = buildMetadata<{ country: string; region: string }>({
  titleFn: ({ country, region }) =>
    `Pilot Cars & Escort Vehicles in ${region}, ${country.toUpperCase()} | Rates, Rules, Directory`,
  descriptionFn: ({ country, region }) =>
    `Find verified pilot car operators serving ${region}, ${country.toUpperCase()}. Compare trust scores, live availability, local regulations, and corridor rates.`,
});

/** For /rates/corridors/[slug] dynamic pages */
export const buildCorridorMetadata = buildMetadata<{ slug: string }>({
  titleFn: ({ slug }) => {
    const label = slug
      .split('-')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return `${label} Escort Rate Guide | Pilot Car Pricing & Corridor Intelligence`;
  },
  descriptionFn: ({ slug }) => {
    const label = slug
      .split('-')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return `Current pilot car rates and logistics intelligence for the ${label} corridor. Compare operators, permit requirements, and estimated costs on Haul Command.`;
  },
});

/** For /loads/[type] dynamic load type hub pages */
export const buildLoadTypeMetadata = buildMetadata<{ type: string }>({
  titleFn: ({ type }) => {
    const label = type
      .split('-')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return `${label} Transport Escort Requirements | Oversize Load Intelligence`;
  },
  descriptionFn: ({ type }) => {
    const label = type
      .split('-')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return `Find qualified escort operators with experience in ${label} transport. Review permit requirements, route intelligence, and live availability on Haul Command.`;
  },
});
