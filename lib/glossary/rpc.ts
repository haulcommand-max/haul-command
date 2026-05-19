import { createClient } from "@/utils/supabase/server";
import type {
  GlossaryHubPayload,
  GlossaryTermPayload,
  GlossaryTopicPayload,
  GlossaryCountryPayload,
} from "./types";

/**
 * P0 FIX: All RPCs now gracefully degrade instead of throwing
 * when stored procedures don't exist in the DB yet.
 * 
 * Root cause: `if (error) throw error` was crashing every page
 * that referenced glossary data, triggering the "SYSTEM FAULT"
 * error boundary.
 */

type JsonRecord = Record<string, unknown>;

const DEFAULT_COUNTRY_CLUSTERS = ["US", "CA", "AU", "GB", "MX", "DE"];
let didWarnGlossaryTermRpc = false;

function isMissingRpc(error: { message?: string; details?: string; hint?: string } | null | undefined) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`.toLowerCase();
  return text.includes("could not find the function") || text.includes("function public.glo_");
}

function shouldSuppressGlossaryRpcWarning(error: { message?: string; details?: string; hint?: string } | null | undefined) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`.toLowerCase();
  return text.includes("fetch failed") || isMissingRpc(error);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asStringArray(value: unknown): string[] {
  return asArray(value)
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function sourceCount(value: unknown): number {
  return asArray(value).length;
}

function mapAliases(value: unknown, languageCode = "en"): GlossaryTermPayload["aliases"] {
  return asStringArray(value).map((alias) => ({
    alias,
    alias_type: "synonym",
    country_code: null,
    region_code: null,
    language_code: languageCode,
    is_preferred: false,
  }));
}

function mapJsonLinks(value: unknown, targetType: string): GlossaryTermPayload["links"] {
  return asArray(value).slice(0, 8).map((item, index) => {
    const record = typeof item === "object" && item !== null ? (item as JsonRecord) : {};
    const rawSlug = record.slug ?? record.id ?? record.target_id ?? item;
    const rawLabel = record.label ?? record.title ?? record.name ?? record.anchor_text;
    const targetId = String(rawSlug ?? "").trim();
    return {
      link_type: "related",
      target_type: targetType,
      target_id: targetId,
      anchor_text: rawLabel ? String(rawLabel) : targetId.replace(/[-_]/g, " "),
      priority: 100 - index,
      is_auto_generated: true,
      metadata: record,
    };
  }).filter((link) => link.target_id.length > 0);
}

function mapSources(value: unknown): GlossaryTermPayload["sources"] {
  return asArray(value).slice(0, 8).map((item, index) => {
    if (typeof item === "string") {
      return {
        source_type: "source",
        source_label: item,
        source_url: null,
        source_note: null,
        source_authority_score: 60,
        is_primary: index === 0,
      };
    }
    const record = typeof item === "object" && item !== null ? (item as JsonRecord) : {};
    return {
      source_type: String(record.source_type ?? record.type ?? "source"),
      source_label: String(record.source_label ?? record.title ?? record.name ?? record.url ?? "Source"),
      source_url: typeof record.source_url === "string" ? record.source_url : typeof record.url === "string" ? record.url : null,
      source_note: typeof record.source_note === "string" ? record.source_note : typeof record.note === "string" ? record.note : null,
      source_authority_score: Number(record.source_authority_score ?? record.authority_score ?? 60),
      is_primary: Boolean(record.is_primary ?? index === 0),
    };
  });
}

function defaultTermFaq(term: string, answer: string): GlossaryTermPayload["faqs"] {
  if (!term || !answer) return [];
  return [
    {
      question: `What does ${term} mean in heavy haul?`,
      answer,
      sort_order: 1,
      is_voice_friendly: true,
    },
  ];
}

function emptyPayloadParts() {
  return {
    aliases: [],
    faqs: [],
    use_cases: [],
    sources: [],
    links: [],
    relationships: [],
    quality: {},
    metrics: {},
  } satisfies Omit<GlossaryTermPayload, "term">;
}

function defaultGlossaryHubPayload(): GlossaryHubPayload {
  return {
    counts: { total_terms: 0, total_countries: DEFAULT_COUNTRY_CLUSTERS.length, total_topics: 0, total_letters: 0 },
    featured_terms: [],
    recently_updated_terms: [],
    topic_clusters: [],
    country_clusters: DEFAULT_COUNTRY_CLUSTERS.map((country_code) => ({
      country_code,
      overlay_term_count: 0,
      last_overlay_update: null,
    })),
    letter_index: [],
  };
}

function lettersFromTerms(terms: Array<{ canonical_term: string }>): string[] {
  return Array.from(
    new Set(
      terms
        .map((term) => term.canonical_term.trim().charAt(0).toUpperCase())
        .filter((letter) => /^[A-Z]$/.test(letter)),
    ),
  ).sort();
}

async function fallbackGlossaryHubPayload(): Promise<GlossaryHubPayload> {
  const supabase = createClient();
  const fallback = defaultGlossaryHubPayload();

  const { data: hcTerms, count: hcCount, error: hcError } = await supabase
    .from("hc_glossary_terms")
    .select("slug, canonical_term, definition_short, ai_snippet_answer, related_services_json, related_tools_json, updated_at", {
      count: "exact",
    })
    .in("status", ["active", "published"])
    .order("updated_at", { ascending: false })
    .limit(40);

  if (!hcError && hcTerms && hcTerms.length > 0) {
    const cards = hcTerms
      .filter((term) => term.slug && term.canonical_term)
      .map((term) => ({
        slug: term.slug,
        canonical_term: term.canonical_term,
        short_definition: term.definition_short || term.ai_snippet_answer || "Heavy-haul glossary term tracked by Haul Command.",
        topic_primary_slug: null,
        commercial_intent_level: term.related_services_json || term.related_tools_json ? 1 : 0,
        sponsor_eligible: Boolean(term.related_services_json || term.related_tools_json),
      }));

    return {
      ...fallback,
      counts: {
        total_terms: hcCount ?? cards.length,
        total_countries: DEFAULT_COUNTRY_CLUSTERS.length,
        total_topics: 0,
        total_letters: lettersFromTerms(cards).length,
      },
      featured_terms: cards.slice(0, 12),
      recently_updated_terms: hcTerms
        .filter((term) => term.slug && term.canonical_term && term.updated_at)
        .slice(0, 12)
        .map((term) => ({
          slug: term.slug,
          canonical_term: term.canonical_term,
          updated_at: term.updated_at,
          freshness_state: "current",
        })),
      letter_index: lettersFromTerms(cards),
    };
  }

  const { data: legacyTerms, count: legacyCount } = await supabase
    .from("glossary_terms")
    .select("slug, term, short_definition, category, related_services, related_tools, updated_at", { count: "exact" })
    .eq("published", true)
    .eq("noindex", false)
    .order("updated_at", { ascending: false })
    .limit(80);

  if (!legacyTerms || legacyTerms.length === 0) return fallback;

  const cards = legacyTerms
    .filter((term) => term.slug && term.term)
    .map((term) => ({
      slug: term.slug,
      canonical_term: term.term,
      short_definition: term.short_definition || "Heavy-haul glossary term tracked by Haul Command.",
      topic_primary_slug: term.category,
      commercial_intent_level: term.related_services || term.related_tools ? 1 : 0,
      sponsor_eligible: Boolean(term.related_services || term.related_tools),
    }));

  const topics = new Map<string, number>();
  for (const term of cards) {
    if (!term.topic_primary_slug) continue;
    topics.set(term.topic_primary_slug, (topics.get(term.topic_primary_slug) ?? 0) + 1);
  }

  return {
    ...fallback,
    counts: {
      total_terms: legacyCount ?? cards.length,
      total_countries: DEFAULT_COUNTRY_CLUSTERS.length,
      total_topics: topics.size,
      total_letters: lettersFromTerms(cards).length,
    },
    featured_terms: cards.slice(0, 12),
    recently_updated_terms: legacyTerms
      .filter((term) => term.slug && term.term && term.updated_at)
      .slice(0, 12)
      .map((term) => ({
        slug: term.slug,
        canonical_term: term.term,
        updated_at: term.updated_at,
        freshness_state: "current",
      })),
    topic_clusters: Array.from(topics.entries()).map(([slug, active_term_count]) => ({
      slug,
      name: slug.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      description: "Reviewed Haul Command glossary terms in this operational cluster.",
      active_term_count,
    })),
    letter_index: lettersFromTerms(cards),
  };
}

async function fallbackGlossaryTermPayload(params: {
  termSlug: string;
  countryCode?: string | null;
}): Promise<GlossaryTermPayload | null> {
  const supabase = createClient();

  const { data: hcTerm, error: hcError } = await supabase
    .from("hc_glossary_terms")
    .select(
      "id, canonical_term, slug, definition_short, definition_long, aliases_json, country_variants_json, ambiguity_notes_json, related_tools_json, related_training_json, related_regulations_json, related_services_json, related_entities_json, ai_snippet_answer, status, updated_at"
    )
    .eq("slug", params.termSlug)
    .in("status", ["active", "published"])
    .maybeSingle();

  if (hcTerm && !hcError) {
    const aliases = mapAliases(hcTerm.aliases_json);
    const definition = hcTerm.definition_short || hcTerm.ai_snippet_answer || "";
    const longDefinition = hcTerm.definition_long || null;
    const links = [
      ...mapJsonLinks(hcTerm.related_services_json, "service"),
      ...mapJsonLinks(hcTerm.related_tools_json, "tool"),
      ...mapJsonLinks(hcTerm.related_training_json, "training"),
      ...mapJsonLinks(hcTerm.related_regulations_json, "regulation"),
      ...mapJsonLinks(hcTerm.related_entities_json, "entity"),
    ];

    return {
      term: {
        id: hcTerm.id,
        slug: hcTerm.slug,
        canonical_term: hcTerm.canonical_term,
        short_definition: definition,
        expanded_definition: longDefinition,
        plain_english: longDefinition || definition,
        why_it_matters: null,
        term_type: "definition",
        topic_primary_slug: null,
        topic_primary_name: null,
        commercial_intent_level: links.length ? 2 : 0,
        near_me_relevance: false,
        sponsor_eligible: links.length > 0,
        featured_snippet_candidate: Boolean(hcTerm.ai_snippet_answer || definition),
        ai_answer_variant: hcTerm.ai_snippet_answer || definition,
        voice_answer_variant: hcTerm.ai_snippet_answer || definition,
        confidence_state: "source_backed",
        freshness_state: "current",
        reviewed_at: hcTerm.updated_at,
        next_review_due: null,
        source_count: 0,
        overlay:
          params.countryCode && hcTerm.country_variants_json && typeof hcTerm.country_variants_json === "object"
            ? {
                country_code: params.countryCode.toUpperCase(),
                region_code: null,
                local_title_override: null,
                local_regulatory_note: String((hcTerm.country_variants_json as JsonRecord)[params.countryCode.toUpperCase()] ?? ""),
                is_indexable: true,
              }
            : null,
      },
      ...emptyPayloadParts(),
      aliases,
      faqs: defaultTermFaq(hcTerm.canonical_term, definition),
      use_cases: asStringArray(hcTerm.ambiguity_notes_json).map((use_case, index) => ({
        use_case,
        sort_order: index + 1,
      })),
      links,
    };
  }

  const { data: legacyTerm } = await supabase
    .from("glossary_terms")
    .select(
      "id, slug, term, short_definition, long_definition, category, synonyms, acronyms, sources, published, noindex, why_it_matters, related_rules, related_services, related_problems, related_corridors, related_entities, related_tools, source_confidence, snippet_priority, last_reviewed_at, updated_at"
    )
    .eq("slug", params.termSlug)
    .eq("published", true)
    .eq("noindex", false)
    .maybeSingle();

  if (!legacyTerm) return null;

  const definition = legacyTerm.short_definition || legacyTerm.long_definition || "";
  const sources = mapSources(legacyTerm.sources);
  const links = [
    ...mapJsonLinks(legacyTerm.related_services, "service"),
    ...mapJsonLinks(legacyTerm.related_tools, "tool"),
    ...mapJsonLinks(legacyTerm.related_rules, "regulation"),
    ...mapJsonLinks(legacyTerm.related_corridors, "corridor"),
    ...mapJsonLinks(legacyTerm.related_entities, "entity"),
  ];

  return {
    term: {
      id: legacyTerm.id,
      slug: legacyTerm.slug,
      canonical_term: legacyTerm.term,
      short_definition: definition,
      expanded_definition: legacyTerm.long_definition,
      plain_english: legacyTerm.long_definition || definition,
      why_it_matters: legacyTerm.why_it_matters,
      term_type: legacyTerm.category || "definition",
      topic_primary_slug: legacyTerm.category,
      topic_primary_name: legacyTerm.category,
      commercial_intent_level: Number(legacyTerm.snippet_priority ?? 0) > 0 ? 1 : 0,
      near_me_relevance: false,
      sponsor_eligible: links.length > 0,
      featured_snippet_candidate: true,
      ai_answer_variant: definition,
      voice_answer_variant: definition,
      confidence_state: Number(legacyTerm.source_confidence ?? 0) >= 0.8 ? "verified" : "source_backed",
      freshness_state: "current",
      reviewed_at: legacyTerm.last_reviewed_at || legacyTerm.updated_at,
      next_review_due: null,
      source_count: sources.length || sourceCount(legacyTerm.sources),
      overlay: null,
    },
    ...emptyPayloadParts(),
    aliases: [...mapAliases(legacyTerm.synonyms), ...mapAliases(legacyTerm.acronyms)],
    faqs: defaultTermFaq(legacyTerm.term, definition),
    use_cases: asStringArray(legacyTerm.related_problems).map((use_case, index) => ({
      use_case,
      sort_order: index + 1,
    })),
    sources,
    links,
  };
}

export async function rpcGlossaryHubPayload(): Promise<GlossaryHubPayload> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("glo_glossary_hub_payload");

    if (error) {
      if (!isMissingRpc(error) && !String(error.message ?? "").toLowerCase().includes("fetch failed")) {
        console.warn("[glossary] Hub RPC failed, using table fallback:", error.message);
      }
      return fallbackGlossaryHubPayload();
    }
    return data as GlossaryHubPayload;
  } catch (e) {
    console.warn("[glossary] Hub RPC threw, using table fallback:", e);
    return fallbackGlossaryHubPayload();
  }
}

export async function rpcGlossaryTermPayload(params: {
  termSlug: string;
  countryCode?: string | null;
  regionCode?: string | null;
}): Promise<GlossaryTermPayload | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("glo_term_page_payload", {
      p_term_slug: params.termSlug,
      p_country_code: params.countryCode ?? null,
      p_region_code: params.regionCode ?? null,
    });

    if (error) {
      if (isMissingRpc(error)) {
        return fallbackGlossaryTermPayload(params);
      }
      if (!shouldSuppressGlossaryRpcWarning(error) && !didWarnGlossaryTermRpc) {
        didWarnGlossaryTermRpc = true;
        console.warn("[glossary] Term RPC failed, using table fallback:", error.message);
      }
      return fallbackGlossaryTermPayload(params);
    }
    if (!data || !data.term) return null;
    return data as GlossaryTermPayload;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (!message.toLowerCase().includes("fetch failed") && !didWarnGlossaryTermRpc) {
      didWarnGlossaryTermRpc = true;
      console.warn("[glossary] Term RPC threw, using table fallback:", e);
    }
    return fallbackGlossaryTermPayload(params);
  }
}

export async function rpcGlossaryTopicPayload(
  topicSlug: string
): Promise<GlossaryTopicPayload | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("glo_topic_page_payload", {
      p_topic_slug: topicSlug,
    });

    if (error) {
      console.warn("[glossary] Topic RPC failed:", error.message);
      return null;
    }
    if (!data || !data.topic) return null;
    return data as GlossaryTopicPayload;
  } catch (e) {
    console.warn("[glossary] Topic RPC threw:", e);
    return null;
  }
}

export async function rpcGlossaryCountryPayload(
  countryCode: string
): Promise<GlossaryCountryPayload | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("glo_country_hub_payload", {
      p_country_code: countryCode,
    });

    if (error) {
      console.warn("[glossary] Country RPC failed:", error.message);
      return null;
    }
    if (!data || !data.country_code) return null;
    return data as GlossaryCountryPayload;
  } catch (e) {
    console.warn("[glossary] Country RPC threw:", e);
    return null;
  }
}
