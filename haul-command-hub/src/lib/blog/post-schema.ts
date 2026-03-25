/** Minimum standard for blog posts to pass Google's Helpful Content requirements. */

export interface BlogPost {
  slug: string;
  title: string;           // Max 60 chars for SEO title tag
  metaDescription: string; // 150-160 chars
  wordCount: number;       // Enforce >= 800
  publishedAt: string;
  updatedAt: string;       // Keep updating — Google rewards freshness
  author: string;
  category: 'regulations' | 'routes' | 'permits' | 'industry' | 'tools';
  stateCode?: string;      // For state-specific posts
  countryCode?: string;
  content: string;         // MDX or plain markdown
  schema: BlogPostSchema;  // JSON-LD structured data
}

export interface BlogPostSchema {
  '@context': 'https://schema.org';
  '@type': 'Article';
  headline: string;
  author: { '@type': 'Organization'; name: 'Haul Command' };
  publisher: { '@type': 'Organization'; name: 'Haul Command'; logo: string };
  datePublished: string;
  dateModified: string;
  description: string;
}

/** Minimum word count: 800 words. Google penalizes thin content under ~500. */
export const MIN_WORD_COUNT = 800;

/**
 * Validate a blog post meets minimum SEO/content quality standards.
 * Call at build time to flag thin content before it ships.
 */
export function validateBlogPost(post: Partial<BlogPost>): string[] {
  const errors: string[] = [];

  if (!post.title || post.title.length > 65)
    errors.push(`Title missing or too long (${post.title?.length ?? 0}/60 chars)`);

  if (!post.metaDescription || post.metaDescription.length > 165)
    errors.push(`Meta description missing or too long (${post.metaDescription?.length ?? 0}/160 chars)`);

  if (!post.wordCount || post.wordCount < MIN_WORD_COUNT)
    errors.push(`Content too thin: ${post.wordCount ?? 0} words (minimum: ${MIN_WORD_COUNT})`);

  if (!post.slug) errors.push('Missing slug');
  if (!post.category) errors.push('Missing category');

  return errors;
}

/**
 * Generate JSON-LD schema for a blog post.
 */
export function generateBlogSchema(post: Pick<BlogPost, 'title' | 'metaDescription' | 'publishedAt' | 'updatedAt'>): BlogPostSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    author: { '@type': 'Organization', name: 'Haul Command' },
    publisher: {
      '@type': 'Organization',
      name: 'Haul Command',
      logo: 'https://haulcommand.com/logo-full.png',
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    description: post.metaDescription,
  };
}

/**
 * SEO topic templates for bulk content generation.
 * 5 topic types × 50 states = 250 posts minimum.
 */
export const BLOG_TOPIC_TEMPLATES = [
  '2026 {STATE} Oversize Load Permit Guide: Everything You Need',
  'Pilot Car Requirements in {STATE}: Width, Height & Length Thresholds',
  'Top {CITY} Pilot Car Operators — Verified Directory',
  '{COUNTRY} Heavy Haul Regulations for Foreign Carriers',
  'Superload Permits in {STATE}: Step-by-Step Process',
];
