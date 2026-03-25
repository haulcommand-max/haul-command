import { supabaseServer } from "@/lib/supabase-server";
import { COUNTRIES } from "@/lib/seo-countries";
import { SEO_SERVICES } from "@/lib/seo-countries";
import { INFRASTRUCTURE_TYPES } from "@/lib/hc-loaders/infrastructure";
import type { MetadataRoute } from "next";
import { getAllTerms } from "@/lib/glossary";

export const dynamic = "force-dynamic";

export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }];
}

export default async function sitemap({ id = 0 }: { id?: number }): Promise<MetadataRoute.Sitemap> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://haulcommand.com";
    const now = new Date();

    // ─── ID 1: 28,500-page Dictionary SEO Factory ───
    if (id === 1) {
        const terms = getAllTerms();
        return terms.flatMap((t) =>
            COUNTRIES.map((c) => ({
                url: `${siteUrl}/dictionary/${c.slug}/${t.id}`,
                lastModified: now,
                changeFrequency: 'monthly' as const,
                priority: 0.6,
            }))
        );
    }

    // ─── ID 2: 4,500 City-Level Landing Pages ───
    if (id === 2) {
        return COUNTRIES.flatMap((c) =>
            c.cities.flatMap((city) =>
                SEO_SERVICES.map((svc) => ({
                    url: `${siteUrl}/${c.slug}/city/${encodeURIComponent(city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}/${svc.slug}`,
                    lastModified: now,
                    changeFrequency: 'weekly' as const,
                    priority: 0.6,
                }))
            )
        );
    }

    // ─── ID 3: Dynamic routes from Supabase ───
    if (id === 3) {
        if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
            try {
                const supabase = supabaseServer();
                const { data } = await supabase
                    .from("hc_page_keys")
                    .select("canonical_slug,updated_at")
                    .eq("indexable", true)
                    .eq("page_status", "active")
                    .order("updated_at", { ascending: false })
                    .limit(50000);

                if (data) {
                    return data.map((row) => ({
                        url: `${siteUrl}${row.canonical_slug}`,
                        lastModified: row.updated_at,
                    }));
                }
            } catch {
                return [];
            }
        }
        return [];
    }

    // ─── ID 0: Core Static & Matrix Routes ───
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
        // Revenue Streams
        { url: `${siteUrl}/financing`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${siteUrl}/financing/apply`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${siteUrl}/fuel-card`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${siteUrl}/carbon`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${siteUrl}/carbon/order`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${siteUrl}/dispute`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${siteUrl}/dispute/request`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${siteUrl}/academy`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${siteUrl}/academy/enroll`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${siteUrl}/exchange`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
        { url: `${siteUrl}/exchange/list`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${siteUrl}/exchange/browse`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
        { url: `${siteUrl}/government`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
        // Future Waves
        { url: `${siteUrl}/av-escort`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
        { url: `${siteUrl}/av-escort/certify`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
        // Sprint 2 Revenue Waves
        { url: `${siteUrl}/insurance`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${siteUrl}/insurance/quote`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${siteUrl}/drone-survey`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${siteUrl}/drone-survey/order`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${siteUrl}/drone-survey/become-operator`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
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
        // Australia regions
        { url: `${siteUrl}/directory/au/nsw`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
        { url: `${siteUrl}/directory/au/vic`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
        { url: `${siteUrl}/directory/au/qld`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
        { url: `${siteUrl}/directory/au/wa`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
        { url: `${siteUrl}/directory/au/sa`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
        // UK regions
        { url: `${siteUrl}/directory/gb/england`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
        { url: `${siteUrl}/directory/gb/scotland`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
        { url: `${siteUrl}/directory/gb/wales`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    ];

    // 57-country route families
    const countryRoutes: MetadataRoute.Sitemap = COUNTRIES.flatMap(c => [
        { url: `${siteUrl}/directory/${c.slug}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.8 },
        { url: `${siteUrl}/requirements/${c.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
        { url: `${siteUrl}/rates/${c.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
    ]);

    const serviceRoutes: MetadataRoute.Sitemap = [];
    for (const svc of SEO_SERVICES) {
        serviceRoutes.push({ url: `${siteUrl}/services/${svc.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 });
        for (const c of COUNTRIES) {
            serviceRoutes.push({ url: `${siteUrl}/services/${svc.slug}/${c.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 });
        }
    }

    const infraRoutes: MetadataRoute.Sitemap = [];
    for (const infra of INFRASTRUCTURE_TYPES) {
        for (const c of COUNTRIES) {
            infraRoutes.push({ url: `${siteUrl}/infrastructure/${infra.slug}/${c.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 });
        }
    }

    // City × Service pages (~3,420 URLs)
    const cityServiceRoutes: MetadataRoute.Sitemap = COUNTRIES.flatMap(c =>
        c.cities.flatMap(city => {
            const citySlug = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            return [
                // City landing page
                { url: `${siteUrl}/${c.slug}/city/${encodeURIComponent(citySlug)}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 },
                // City × Service pages
                ...SEO_SERVICES.map(svc => ({
                    url: `${siteUrl}/${c.slug}/city/${encodeURIComponent(citySlug)}/${svc.slug}`,
                    lastModified: now,
                    changeFrequency: 'weekly' as const,
                    priority: 0.5,
                })),
            ];
        })
    );

    // 500+ Glossary term pages
    let glossaryTerms: MetadataRoute.Sitemap = [];
    try {
        glossaryTerms = getAllTerms().map(t => ({
            url: `${siteUrl}/dictionary/term/${t.id}`,
            lastModified: now,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }));
    } catch { /* glossary module may not be available */ }

    // Dynamic routes from hc_page_keys (if Supabase available)
    let dynamicRoutes: MetadataRoute.Sitemap = [];
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        try {
            const supabase = supabaseServer();
            const { data } = await supabase
                .from("hc_page_keys")
                .select("canonical_slug,updated_at")
                .eq("indexable", true)
                .eq("page_status", "active")
                .order("updated_at", { ascending: false })
                .limit(50000);
            if (data) {
                dynamicRoutes = data.map((row) => ({
                    url: `${siteUrl}${row.canonical_slug}`,
                    lastModified: row.updated_at,
                }));
            }
        } catch { /* Supabase unavailable — skip dynamic routes */ }
    }
    // Dictionary × Country pages (~28,500 URLs)
    const allTerms = getAllTerms();
    const dictionaryCountryRoutes: MetadataRoute.Sitemap = COUNTRIES.flatMap(c =>
        allTerms.map(t => ({
            url: `${siteUrl}/dictionary/${c.slug}/${t.id}`,
            lastModified: now,
            changeFrequency: 'monthly' as const,
            priority: 0.4,
        }))
    );

    // Equipment × Country pages (~570 URLs)
    const equipSlugs = (equip: string) => equip.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const equipmentRoutes: MetadataRoute.Sitemap = COUNTRIES.flatMap(c =>
        c.equipment_focus.map(equip => ({
            url: `${siteUrl}/equipment/${equipSlugs(equip)}/${c.slug}`,
            lastModified: now,
            changeFrequency: 'weekly' as const,
            priority: 0.5,
        }))
    );

    return [
        ...staticRoutes,
        ...liveRegionRoutes,
        ...countryRoutes,
        ...serviceRoutes,
        ...infraRoutes,
        ...cityServiceRoutes,
        ...glossaryTerms,
        ...dictionaryCountryRoutes,
        ...equipmentRoutes,
        ...dynamicRoutes,
    ];
}
