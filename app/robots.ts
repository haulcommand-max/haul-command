// app/robots.ts — Crawler permissions + AI engine rules
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/inbox',
          '/dashboard',
          '/settings',
          '/_next/',
        ],
      },
      // Let AI crawlers index all public content — AI SEO strategy
      { userAgent: 'GPTBot', allow: ['/tools/', '/directory/', '/escort-requirements', '/glossary', '/blog', '/regulations'] },
      { userAgent: 'ClaudeBot', allow: ['/tools/', '/directory/', '/escort-requirements', '/glossary', '/blog'] },
      { userAgent: 'PerplexityBot', allow: ['/tools/', '/directory/', '/escort-requirements', '/glossary'] },
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'Bingbot', allow: '/' },
    ],
    sitemap: [
      'https://www.haulcommand.com/sitemap.xml',
    ],
  };
}
