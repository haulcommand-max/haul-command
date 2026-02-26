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
Allow: /near/
Allow: /routes/
Allow: /port/
Allow: /border/
Allow: /county/
Allow: /industry/
Allow: /escort/corridor/
Disallow: /api/
Disallow: /admin/
Disallow: /dev/
Disallow: /escrow/
Disallow: /settings/
Disallow: /onboarding/
Disallow: /chat/

Sitemap: ${DOMAIN}/sitemap.xml
Sitemap: ${DOMAIN}/sitemap-seo.xml

# Haul Command — The Operating System for Heavy Haul
# Crawl all public directory, loads, leaderboard, and SEO pages
`;

    return new NextResponse(robots, {
        headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, s-maxage=86400' },
    });
}
