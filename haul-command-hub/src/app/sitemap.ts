import { supabaseServer } from "@/lib/supabase-server";
import { COUNTRIES } from "@/lib/seo-countries";
import { SEO_SERVICES } from "@/lib/seo-countries";
import { INFRASTRUCTURE_TYPES } from "@/lib/hc-loaders/infrastructure";
import type { MetadataRoute } from "next";
import { getAllTerms } from "@/lib/glossary";

export const dynamic = "force-dynamic";

/**
 * Sitemap Index Splitter — 50K URL Chunking
 * 
 * Google limits sitemaps to 50,000 URLs per file.
 * We split into granular chunks to stay well under the limit:
 * 
 *  ID 0:  Core static + country routes + live regions (~350 URLs)
 *  ID 1:  Service × Country matrix (~350 URLs)
 *  ID 2:  Infrastructure × Country matrix (~570 URLs)
 *  ID 3:  City landing + City × Service pages (~3,420 URLs)
 *  ID 4:  Glossary term pages (~500 URLs)
 *  ID 5:  Equipment × Country pages (~570 URLs)
 *  ID 6:  Dictionary × Country — Batch A (countries 0-18, ~9,500 URLs)
 *  ID 7:  Dictionary × Country — Batch B (countries 19-37, ~9,500 URLs)
 *  ID 8:  Dictionary × Country — Batch C (countries 38-56, ~9,500 URLs)
 *  ID 9:  City-level SEO Factory — Batch A (countries 0-18, ~1,500 URLs)
 *  ID 10: City-level SEO Factory — Batch B (countries 19-37, ~1,500 URLs)
 *  ID 11: City-level SEO Factory — Batch C (countries 38-56, ~1,500 URLs)
 *  ID 12: Dynamic Supabase routes — Batch A (0-49999)
 *  ID 13: Dynamic Supabase routes — Batch B (50000-99999)
 *  ID 14: Dynamic Supabase routes — Batch C (100000+)
 */

const SITEMAP_COUNT = 15;

export async function generateSitemaps() {
  return Array.from({ length: SITEMAP_COUNT }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id = 0 }: { id?: number }): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://haulcommand.com";
  const now = new Date();
  const allTerms = getAllTerms();

  // ─── ID 0: Core Static + Country Routes + Live Regions ───
  if (id === 0) {
    const staticRoutes: MetadataRoute.Sitemap = [
      { url: siteUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
      { url: `${siteUrl}/directory`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
      { url: `${siteUrl}/requirements`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${siteUrl}/services`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${siteUrl}/rates`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${siteUrl}/corridors`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${siteUrl}/loads`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
      { url: `${siteUrl}/claim`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
      { url: `${siteUrl}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${siteUrl}/developers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
      { url: `${siteUrl}/developers/getting-started`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
      { url: `${siteUrl}/developers/authentication`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
      { url: `${siteUrl}/developers/rate-limits`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
      { url: `${siteUrl}/advertise/create`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
      // Revenue Streams — only include routes that have actual page files
      { url: `${siteUrl}/financing`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${siteUrl}/financing/apply`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
      { url: `${siteUrl}/fuel-card`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${siteUrl}/carbon`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${siteUrl}/dispute`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${siteUrl}/academy`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${siteUrl}/exchange`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
      { url: `${siteUrl}/government`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
      { url: `${siteUrl}/av-escort`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
      { url: `${siteUrl}/insurance`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${siteUrl}/drone-survey`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${siteUrl}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
      { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
      { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
      { url: `${siteUrl}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
      { url: `${siteUrl}/glossary`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
      { url: `${siteUrl}/legal/dpa`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
      // VS Comparison pages (20 competitors)
      ...['pilot-car-loads', 'truckstop-heavy-haul', 'oversize-io', 'heavy-haul-load-board',
          'landstar', 'bennett-motor-express', 'barnhart-crane', 'berger-transfer',
          'daseke', 'escort-dispatch', 'escort-online', 'pilot-car-registry',
          'wide-load-magazine', 'truck-permits', 'permit-pro', 'transapi-de',
          'convois-exceptionnels-fr', 'abnormal-loads-uk', 'heavy-haul-magazine', 'overdrive-tonnage',
      ].map(slug => ({ url: `${siteUrl}/compare/${slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 })),
      // Enterprise / Autonomous company pages
      ...['aurora-innovation','kodiak-robotics','einride','volvo-autonomous-solutions','vestas-wind','waymo-via','torc-robotics','plus-ai','tusimple','gatik','ge-vernova','siemens-gamesa','mammoet','goldhofer','sarens'].map(slug => (
        { url: `${siteUrl}/enterprise/${slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 }
      )),
    ];

    // AU and GB live directory region pages
    const liveRegionRoutes: MetadataRoute.Sitemap = [
      { url: `${siteUrl}/directory/au/nsw`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
      { url: `${siteUrl}/directory/au/vic`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
      { url: `${siteUrl}/directory/au/qld`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
      { url: `${siteUrl}/directory/au/wa`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
      { url: `${siteUrl}/directory/au/sa`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
      { url: `${siteUrl}/directory/gb/england`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
      { url: `${siteUrl}/directory/gb/scotland`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
      { url: `${siteUrl}/directory/gb/wales`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    ];

    // 120-country route families
    const countryRoutes: MetadataRoute.Sitemap = COUNTRIES.flatMap(c => [
      { url: `${siteUrl}/directory/${c.slug}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.8 },
      { url: `${siteUrl}/requirements/${c.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${siteUrl}/rates/${c.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
    ]);

    return [...staticRoutes, ...liveRegionRoutes, ...countryRoutes];
  }

  // ─── ID 1: Service × Country Matrix ───
  if (id === 1) {
    const serviceRoutes: MetadataRoute.Sitemap = [];
    for (const svc of SEO_SERVICES) {
      serviceRoutes.push({ url: `${siteUrl}/services/${svc.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 });
      for (const c of COUNTRIES) {
        serviceRoutes.push({ url: `${siteUrl}/services/${svc.slug}/${c.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 });
      }
    }
    return serviceRoutes;
  }

  // ─── ID 2: Infrastructure × Country Matrix ───
  if (id === 2) {
    const infraRoutes: MetadataRoute.Sitemap = [];
    for (const infra of INFRASTRUCTURE_TYPES) {
      for (const c of COUNTRIES) {
        infraRoutes.push({ url: `${siteUrl}/infrastructure/${infra.slug}/${c.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 });
      }
    }
    return infraRoutes;
  }

  // ─── ID 3: City Landing + City × Service Pages ───
  if (id === 3) {
    const cityServiceRoutes: MetadataRoute.Sitemap = COUNTRIES.flatMap(c =>
      c.cities.flatMap(city => {
        const citySlug = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return [
          { url: `${siteUrl}/${c.slug}/city/${encodeURIComponent(citySlug)}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 },
          ...SEO_SERVICES.map(svc => ({
            url: `${siteUrl}/${c.slug}/city/${encodeURIComponent(citySlug)}/${svc.slug}`,
            lastModified: now,
            changeFrequency: 'weekly' as const,
            priority: 0.5,
          })),
        ];
      })
    );
    return cityServiceRoutes;
  }

  // ─── ID 4: Glossary Term Pages ───
  if (id === 4) {
    try {
      return allTerms.map(t => ({
        url: `${siteUrl}/dictionary/term/${t.id}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    } catch { return []; }
  }

  // ─── ID 5: Equipment × Country Pages ───
  if (id === 5) {
    const equipSlugs = (equip: string) => equip.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return COUNTRIES.flatMap(c =>
      c.equipment_focus.map(equip => ({
        url: `${siteUrl}/equipment/${equipSlugs(equip)}/${c.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }))
    );
  }

  // ─── IDs 6-8: Dictionary × Country (split into 3 batches to stay under 50K) ───
  if (id >= 6 && id <= 8) {
    const batchIndex = id - 6;
    const batchSize = Math.ceil(COUNTRIES.length / 3);
    const batchCountries = COUNTRIES.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);
    return batchCountries.flatMap(c =>
      allTerms.map(t => ({
        url: `${siteUrl}/dictionary/${c.slug}/${t.id}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.4,
      }))
    );
  }

  // ─── IDs 9-11: City-Level SEO Factory (split into 3 batches) ───
  if (id >= 9 && id <= 11) {
    const batchIndex = id - 9;
    const batchSize = Math.ceil(COUNTRIES.length / 3);
    const batchCountries = COUNTRIES.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);
    return batchCountries.flatMap(c =>
      c.cities.flatMap(city =>
        SEO_SERVICES.map(svc => ({
          url: `${siteUrl}/${c.slug}/city/${encodeURIComponent(city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}/${svc.slug}`,
          lastModified: now,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }))
      )
    );
  }

  // ─── IDs 12-14: Dynamic Supabase Routes (paginated 50K batches) ───
  if (id >= 12 && id <= 14) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
    const batchIndex = id - 12;
    const BATCH_SIZE = 50000;
    const offset = batchIndex * BATCH_SIZE;

    try {
      const supabase = supabaseServer();
      const { data } = await supabase
        .from("hc_page_keys")
        .select("canonical_slug,updated_at")
        .eq("indexable", true)
        .eq("page_status", "active")
        .order("updated_at", { ascending: false })
        .range(offset, offset + BATCH_SIZE - 1);

      if (data && data.length > 0) {
        return data.map((row) => ({
          url: `${siteUrl}${row.canonical_slug}`,
          lastModified: row.updated_at,
        }));
      }
    } catch { /* Supabase unavailable — skip */ }
    return [];
  }

  return [];
}
