import { NextResponse } from 'next/server';

export async function GET() {
  const resources = [
    { slug: 'escort-reciprocity-guide', lastModified: new Date().toISOString() },
    { slug: 'insurance-requirements', lastModified: new Date().toISOString() },
    { slug: 'permit-agencies', lastModified: new Date().toISOString() },
    { slug: 'state-regulations', lastModified: new Date().toISOString() },
    { slug: 'equipment-directory', lastModified: new Date().toISOString() },
    { slug: 'pilot-car-certification', lastModified: new Date().toISOString() }
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${resources
    .map(
      (resource) => `
  <url>
    <loc>https://haulcommand.com/resources/${resource.slug}</loc>
    <lastmod>${resource.lastModified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join("")}
</urlset>`;

  return new NextResponse(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
