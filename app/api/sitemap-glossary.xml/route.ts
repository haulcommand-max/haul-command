export async function GET() {
  const glossaries = [
    'superload', 'pilot-car', 'steerable-trailer', 'twic-card', 'bill-of-lading', 'proof-of-delivery', 'route-survey'
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${glossaries.map(slug => `
  <url>
    <loc>https://haulcommand.com/glossary/${slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  `).join('')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate'
    }
  });
}
