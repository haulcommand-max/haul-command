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
          '/dashboard/',
          '/dev/',
          '/data/',
          '/onboarding/',
          '/settings/',
          '/accept/',
          '/escrow/',
        ],
      },
      {
        // Block AI scrapers from ingesting content (protect SEO moat)
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'Google-Extended',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
    ],
    sitemap: [
      'https://haulcommand.com/sitemap.xml',
      'https://haulcommand.com/sitemap-US.xml',
      'https://haulcommand.com/sitemap-CA.xml',
      'https://haulcommand.com/sitemap-AU.xml',
    ],
  };
}
