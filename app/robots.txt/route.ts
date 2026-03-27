import { NextResponse } from 'next/server';

const DOMAIN = 'https://haulcommand.com';

export async function GET() {
    const robots = `User-agent: *
Allow: /
Allow: /directory/
Allow: /loads/
Allow: /leaderboards/
Allow: /us/
Allow: /ca/
Allow: /tools/
Allow: /broker/
Allow: /corridors/
Allow: /rules/
Allow: /rates/
Allow: /requirements/
Allow: /escort-requirements/
Allow: /near/
Allow: /routes/
Allow: /port/
Allow: /border/
Allow: /county/
Allow: /industry/
Allow: /corridor/
Allow: /blog/
Allow: /services/
Allow: /compare/
Allow: /emergency/
Disallow: /api/
Disallow: /admin/
Disallow: /dev/
Disallow: /escrow/
Disallow: /settings/
Disallow: /onboarding/
Disallow: /chat/
Disallow: /inbox/
Disallow: /auth/
Disallow: /_next/

User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Bytespider
Disallow: /

Sitemap: ${DOMAIN}/sitemap.xml
Sitemap: ${DOMAIN}/sitemap-seo.xml
Sitemap: ${DOMAIN}/sitemap-US.xml
Sitemap: ${DOMAIN}/sitemap-CA.xml
Sitemap: ${DOMAIN}/sitemap-corridors.xml
Sitemap: ${DOMAIN}/sitemap-glossary.xml
Sitemap: ${DOMAIN}/sitemap-pilot-car-city.xml

# Haul Command — The Operating System for Heavy Haul
# Crawl all public directory, loads, leaderboard, and SEO pages
`;

    return new NextResponse(robots, {
        headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, s-maxage=86400' },
    });
}
