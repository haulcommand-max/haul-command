// app/robots.ts — Crawler permissions + AI engine rules
// AI Search Discoverability Layer: deliberate AI crawler access
import { MetadataRoute } from 'next';

const PUBLIC_HIGH_VALUE_PATHS = [
  '/tools/',
  '/directory/',
  '/escort-requirements/',
  '/glossary/',
  '/blog/',
  '/corridors/',
  '/roles/',
  '/permits/',
  '/rates/',
  '/regulatory-db/',
  '/requirements/',
  '/services/',
  '/industry/',
  '/compare/',
  '/alternatives/',
  '/near/',
  '/training/',
  '/data-products/',
  '/press/',
  '/resources/',
  '/united-states/',
  '/canada/',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/inbox/',
          '/dashboard/',
          '/settings/',
          '/_next/',
          '/dev/',
          '/autonomous/',
        ],
      },
      // ── AI Answer Engines — full access to public commercial + knowledge surfaces ──
      { userAgent: 'GPTBot', allow: PUBLIC_HIGH_VALUE_PATHS },
      { userAgent: 'OAI-SearchBot', allow: PUBLIC_HIGH_VALUE_PATHS },
      { userAgent: 'ChatGPT-User', allow: PUBLIC_HIGH_VALUE_PATHS },
      { userAgent: 'ClaudeBot', allow: PUBLIC_HIGH_VALUE_PATHS },
      { userAgent: 'PerplexityBot', allow: PUBLIC_HIGH_VALUE_PATHS },
      { userAgent: 'Applebot-Extended', allow: PUBLIC_HIGH_VALUE_PATHS },
      { userAgent: 'cohere-ai', allow: PUBLIC_HIGH_VALUE_PATHS },
      { userAgent: 'Google-Extended', allow: PUBLIC_HIGH_VALUE_PATHS },
      { userAgent: 'Gemini', allow: PUBLIC_HIGH_VALUE_PATHS },
      { userAgent: 'meta-externalagent', allow: PUBLIC_HIGH_VALUE_PATHS },
      { userAgent: 'YouBot', allow: PUBLIC_HIGH_VALUE_PATHS },
      { userAgent: 'Bytespider', allow: PUBLIC_HIGH_VALUE_PATHS },
      // ── Traditional Search Engines — full access ──
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'Bingbot', allow: '/' },
      { userAgent: 'DuckDuckBot', allow: '/' },
      { userAgent: 'YandexBot', allow: '/' },
    ],
    sitemap: [
      'https://www.haulcommand.com/sitemap.xml',
    ],
  };
}
