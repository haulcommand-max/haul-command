import type { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.haulcommand.com";

/**
 * DA 97 Hack #4b — Dynamic Sitemap Builder
 *
 * Exposes all glossary (terms, topics, country overlays) and
 * training (programs, country pages) to search crawlers.
 *
 * Next.js automatically serves this at /sitemap.xml
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // ── GLOSSARY ─────────────────────────────────────────────────────
  const [
    { data: glossaryTerms },
    { data: glossaryTopics },
    { data: glossaryCountries },
  ] = await Promise.all([
    supabase
      .from("glo_terms")
      .select("slug, updated_at")
      .eq("is_active", true)
      .eq("is_indexable", true),
    supabase.from("glo_topics").select("slug, updated_at").eq("is_active", true),
    supabase.from("glo_geo_overlays").select("country_code").limit(200),
  ]);

  const termEntries: MetadataRoute.Sitemap = (glossaryTerms || []).map((t) => ({
    url: `${SITE_URL}/glossary/${t.slug}`,
    lastModified: t.updated_at || new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const topicEntries: MetadataRoute.Sitemap = (glossaryTopics || []).map(
    (t) => ({
      url: `${SITE_URL}/glossary/topics/${t.slug}`,
      lastModified: t.updated_at || new Date().toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })
  );

  const uniqueCountryCodes = [
    ...new Set(
      (glossaryCountries || []).map((c) => c.country_code.toLowerCase())
    ),
  ];
  const countryEntries: MetadataRoute.Sitemap = uniqueCountryCodes.map(
    (cc) => ({
      url: `${SITE_URL}/glossary/${cc}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })
  );

  // ── TRAINING ─────────────────────────────────────────────────────
  const [{ data: trainingItems }, { data: trainingGeo }] = await Promise.all([
    supabase
      .from("training_catalog")
      .select("slug, updated_at")
      .eq("is_active", true)
      .eq("is_indexable", true),
    supabase.from("training_geo_fit").select("country_code").limit(200),
  ]);

  const trainingEntries: MetadataRoute.Sitemap = (trainingItems || []).map(
    (t) => ({
      url: `${SITE_URL}/training/${t.slug}`,
      lastModified: t.updated_at || new Date().toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })
  );

  const uniqueTrainingCountries = [
    ...new Set(
      (trainingGeo || []).map((c) => c.country_code.toLowerCase())
    ),
  ];
  const trainingCountryEntries: MetadataRoute.Sitemap =
    uniqueTrainingCountries.map((cc) => ({
      url: `${SITE_URL}/training/countries/${cc}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  // ── BLOG ─────────────────────────────────────────────────────────
  const { data: blogArticles } = await supabase
    .from("blog_articles")
    .select("slug, updated_at")
    .lte("published_at", new Date().toISOString());

  const blogEntries: MetadataRoute.Sitemap = (blogArticles || []).map((a) => ({
    url: `${SITE_URL}/blog/${a.slug}`,
    lastModified: a.updated_at || new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // ── CORRIDORS ──────────────────────────────────────────────────
  const { data: corridors } = await supabase
    .from("hc_corridors")
    .select("slug, updated_at")
    .eq("is_active", true)
    .limit(500);

  const corridorEntries: MetadataRoute.Sitemap = (corridors || []).map((c) => ({
    url: `${SITE_URL}/corridors/${c.slug}`,
    lastModified: c.updated_at || new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ── REGULATIONS (country pages) ────────────────────────────────
  const { data: regCountries } = await supabase
    .from("reg_jurisdictions")
    .select("slug, updated_at")
    .limit(200);

  const regEntries: MetadataRoute.Sitemap = (regCountries || []).map((r) => ({
    url: `${SITE_URL}/regulations/${r.slug}`,
    lastModified: r.updated_at || new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // ── STATIC PAGES ─────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/glossary`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/training`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/training/enterprise`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/directory`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/tools`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/regulations`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/corridors`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/data`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/advertise`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/advertise/buy`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/pricing`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/services`, changeFrequency: "monthly", priority: 0.7 },
  ];

  const US_STATES = [
    'al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia','ks','ky','la',
    'me','md','ma','mi','mn','ms','mo','mt','ne','nv','nh','nj','nm','ny','nc','nd','oh','ok',
    'or','pa','ri','sc','sd','tn','tx','ut','vt','va','wa','wv','wi','wy'
  ];

  const trainingStateEntries: MetadataRoute.Sitemap = US_STATES.map((st) => ({
    url: `${SITE_URL}/training/states/${st}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const TRAINING_ROLES = ['pilot-car-driver', 'load-supervisor', 'route-surveyor', 'pole-car-driver'];
  const trainingRoleEntries: MetadataRoute.Sitemap = TRAINING_ROLES.map((role) => ({
    url: `${SITE_URL}/training/roles/${role}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Query new training and directory models
  const [
    { data: trainingLevels },
    { data: trainingModulesData },
    { data: hcPlaces },
    { data: hcGlobalOperators }
  ] = await Promise.all([
    supabase.from("training_levels").select("level_slug"),
    supabase.from("training_modules").select("slug"),
    supabase.from("hc_places").select("country_code"),
    supabase.from("hc_global_operators").select("slug")
  ]);

  const trainingLevelEntries: MetadataRoute.Sitemap = (trainingLevels || []).map((l) => ({
    url: `${SITE_URL}/training/levels/${l.level_slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const trainingModuleEntries: MetadataRoute.Sitemap = (trainingModulesData || []).map((m) => ({
    url: `${SITE_URL}/training/modules/${m.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Reciprocity urls from training geo fit
  const reciprocityEntries: MetadataRoute.Sitemap = uniqueTrainingCountries.map((req) => ({
    url: `${SITE_URL}/training/reciprocity/${req}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const uniqueDirectoryCountries = [...new Set((hcPlaces || []).map((p) => p.country_code.toLowerCase()))];
  const directoryCountryEntries: MetadataRoute.Sitemap = uniqueDirectoryCountries.map((cc) => ({
    url: `${SITE_URL}/directory/${cc}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const directoryCountryCertifiedEntries: MetadataRoute.Sitemap = uniqueDirectoryCountries.map((cc) => ({
    url: `${SITE_URL}/directory/${cc}?trained=certified`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const placeEntries: MetadataRoute.Sitemap = (hcGlobalOperators || []).map((op) => ({
    url: `${SITE_URL}/place/${op.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...termEntries,
    ...topicEntries,
    ...countryEntries,
    ...trainingEntries,
    ...trainingCountryEntries,
    ...trainingStateEntries,
    ...trainingRoleEntries,
    ...trainingLevelEntries,
    ...trainingModuleEntries,
    ...reciprocityEntries,
    ...directoryCountryEntries,
    ...directoryCountryCertifiedEntries,
    ...placeEntries,
    ...blogEntries,
    ...corridorEntries,
    ...regEntries,
  ];
}
