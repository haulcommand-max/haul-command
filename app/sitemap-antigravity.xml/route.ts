/**
 * GET /sitemap-antigravity.xml
 * Sitemap for company claim pages and autonomous SEO pages
 */
import { NextResponse } from 'next/server';
import { getAllCompanySlugs } from '@/lib/data/company-seed';
import { getAllAutonomousSeoParams } from '@/lib/data/autonomous-seo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://haulcommand.com';
  const now = new Date().toISOString();

  // Company pages
  const companyPages = getAllCompanySlugs().map(slug => ({
    url: `${baseUrl}/companies/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Autonomous SEO pages
  const autonomousPages = getAllAutonomousSeoParams().map(p => ({
    url: `${baseUrl}/autonomous/${p.country}/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // Permit pages
  const permitPages = [
    { url: `${baseUrl}/permits`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/permits/agents`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/permits/request`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
  ];

  // QuickPay + Availability
  const featurePages = [
    { url: `${baseUrl}/quickpay`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/availability`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/companies`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];

  const allPages = [...companyPages, ...autonomousPages, ...permitPages, ...featurePages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${p.lastModified}</lastmod>
    <changefreq>${p.changeFrequency}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
