import { ESC_GLOSSARY_PAGES } from "@/lib/esc/esc-public-content";
import { rpcGlossaryHubPayload } from "@/lib/glossary/rpc";

export async function GET() {
  const staticSlugs = Object.keys(ESC_GLOSSARY_PAGES);
  let dbSlugs: string[] = [];

  try {
    const payload = await rpcGlossaryHubPayload();
    dbSlugs = [
      ...(payload.featured_terms ?? []).map((term) => term.slug),
      ...(payload.recently_updated_terms ?? []).map((term) => term.slug),
    ];
  } catch {
    dbSlugs = [];
  }

  const glossaries = Array.from(new Set([...staticSlugs, ...dbSlugs].filter(Boolean))).sort();
  const lastmod = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${glossaries
  .map(
    (slug) => `  <url>
    <loc>https://www.haulcommand.com/glossary/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate",
    },
  });
}
