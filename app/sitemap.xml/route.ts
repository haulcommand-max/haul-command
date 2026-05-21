import { NextRequest, NextResponse } from "next/server";

import {
  getSitemapMasterRows,
  getSitemapToolEligible,
  siteUrl,
  type SitemapMasterRow,
} from "@/lib/tools/tool-substrate";

export const revalidate = 21600;

const SITEMAP_CHUNK_MAX = 45_000;

type SitemapEntry = {
  url: string;
  lastMod: string;
  changeFreq: string;
  priority?: string;
};

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function dateOnly(value: string | null | undefined) {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.split("T")[0] || value;
}

function rowPath(row: SitemapMasterRow) {
  return row.canonical_url || row.page_url || row.url_path || "";
}

function absolute(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl()}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

function fallbackCoreEntries(): SitemapEntry[] {
  const now = dateOnly(null);
  return [
    { url: `${siteUrl()}/`, lastMod: now, changeFreq: "daily", priority: "1.0" },
    { url: `${siteUrl()}/tools`, lastMod: now, changeFreq: "weekly", priority: "0.75" },
    { url: `${siteUrl()}/directory`, lastMod: now, changeFreq: "hourly", priority: "0.95" },
    { url: `${siteUrl()}/regulations`, lastMod: now, changeFreq: "weekly", priority: "0.85" },
    { url: `${siteUrl()}/glossary`, lastMod: now, changeFreq: "weekly", priority: "0.80" },
    { url: `${siteUrl()}/training`, lastMod: now, changeFreq: "weekly", priority: "0.80" },
  ];
}

async function buildEntries(): Promise<SitemapEntry[]> {
  const [masterRows, toolRows] = await Promise.all([
    getSitemapMasterRows(),
    getSitemapToolEligible(),
  ]);
  const now = dateOnly(null);
  const masterEntries = masterRows
    .map((row) => {
      const path = rowPath(row);
      if (!path || path.startsWith("/tools/")) return null;
      return {
        url: absolute(path),
        lastMod: dateOnly(row.last_verified_at || row.last_published || row.updated_at),
        changeFreq: row.change_freq || "weekly",
        priority: row.priority == null ? undefined : Number(row.priority).toFixed(2),
      };
    })
    .filter(Boolean) as SitemapEntry[];

  const toolEntries = toolRows
    .filter((row) => row.page_url)
    .map((row) => ({
      url: row.canonical_url || absolute(row.page_url || `/tools/${row.slug}`),
      lastMod: dateOnly(row.last_verified_at || now),
      changeFreq: "weekly",
      priority: "0.70",
    }));

  const entries = [...(masterEntries.length ? masterEntries : fallbackCoreEntries()), ...toolEntries];
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

function renderUrlset(entries: SitemapEntry[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((entry) => `  <url>
    <loc>${xmlEscape(entry.url)}</loc>
    <lastmod>${xmlEscape(entry.lastMod)}</lastmod>
    <changefreq>${xmlEscape(entry.changeFreq)}</changefreq>${entry.priority ? `
    <priority>${xmlEscape(entry.priority)}</priority>` : ""}
  </url>`).join("\n")}
</urlset>`;
}

function renderSitemapIndex(totalEntries: number) {
  const chunks = Math.ceil(totalEntries / SITEMAP_CHUNK_MAX);
  const now = dateOnly(null);
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from({ length: chunks }, (_, index) => `  <sitemap>
    <loc>${xmlEscape(`${siteUrl()}/sitemap.xml?chunk=${index}`)}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`).join("\n")}
</sitemapindex>`;
}

export async function GET(request: NextRequest) {
  const entries = await buildEntries();
  const chunkParam = request.nextUrl.searchParams.get("chunk");
  const chunk = chunkParam == null ? null : Number(chunkParam);
  const body = chunk == null
    ? entries.length > SITEMAP_CHUNK_MAX
      ? renderSitemapIndex(entries.length)
      : renderUrlset(entries)
    : renderUrlset(entries.slice(chunk * SITEMAP_CHUNK_MAX, (chunk + 1) * SITEMAP_CHUNK_MAX));

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=21600, s-maxage=21600",
      "X-Robots-Tag": "noindex",
    },
  });
}
