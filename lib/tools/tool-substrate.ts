import { createClient } from "@supabase/supabase-js";

import { STATIC_TOOL_CONCEPTS } from "@/lib/tools/static-tool-concepts";

const SITE_URL = "https://www.haulcommand.com";

export type ToolCountsVerified = {
  registered_concepts: number;
  verified_live: number;
  pending_qa: number;
  coming_soon: number;
  broken_404: number;
  wrong_intent_routing: number;
  thin_static_articles: number;
  families: number;
  last_crawl_at: string | null;
};

export type TrustClaimSource = {
  claim_text: string;
  source_count: number | null;
  source_url: string | null;
  last_verified_at: string | null;
};

export type ToolRenderPacket = {
  slug: string;
  name: string;
  page_url: string | null;
  canonical_url: string | null;
  h1_expected: string | null;
  family: string | null;
  category: string | null;
  short_desc: string | null;
  status: string | null;
  coverage_scope: string | null;
  is_free: boolean | null;
  requires_login: boolean | null;
  primary_audience: string | null;
  route_status: number | string | null;
  qa_status: string | null;
  content_status: string | null;
  indexing_status: string | null;
  open_tool_render_allowed: boolean | null;
  open_tool_block_reason: string | null;
  aeo_answer_block: string | null;
  voice_answer: string | null;
  speakable_query: string | null;
  near_me_query: string | null;
  paa_questions: unknown;
  comparison_pairs: unknown;
  hreflang_alts: unknown;
  image_seo_assets: unknown;
  commercial_intent_ctas: unknown;
  schema_org_type: string | null;
  trust_claims: unknown;
  glossary_interlinks: unknown;
  freshness_label: string | null;
  last_freshness_at: string | null;
  dataset_eligible?: boolean | null;
  last_verified_at?: string | null;
  last_crawled_at?: string | null;
};

export type SitemapToolEligible = {
  slug: string;
  name: string | null;
  page_url: string | null;
  canonical_url: string | null;
  last_verified_at: string | null;
};

export type SitemapMasterRow = {
  url_path?: string | null;
  page_url?: string | null;
  canonical_url?: string | null;
  last_verified_at?: string | null;
  last_published?: string | null;
  updated_at?: string | null;
  change_freq?: string | null;
  priority?: number | string | null;
};

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL).replace(/\/$/, "");
}

function getSupabaseForToolSubstrate() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-client-info": "haul-command-tool-substrate/1.0" } },
  });
}

function staticFallbackPackets(): ToolRenderPacket[] {
  return STATIC_TOOL_CONCEPTS.map((tool) => ({
    ...tool,
    canonical_url: `${siteUrl()}${tool.page_url}`,
    h1_expected: tool.name,
    route_status: null,
    qa_status: "qa_pending",
    content_status: "route_not_verified",
    indexing_status: "coming_soon",
    open_tool_render_allowed: false,
    open_tool_block_reason: "qa_pending",
    aeo_answer_block: `${tool.name} is registered in the Haul Command tool catalog, but it is not marked verified live until route, content, and indexing QA pass.`,
    voice_answer: `${tool.name} is not yet verified live. Use related directory, regulation, and glossary resources while QA is pending.`,
    speakable_query: null,
    near_me_query: null,
    paa_questions: [],
    comparison_pairs: [],
    hreflang_alts: [{ hreflang: "x-default", href: `${siteUrl()}${tool.page_url}` }],
    image_seo_assets: {},
    commercial_intent_ctas: [],
    schema_org_type: "WebApplication",
    trust_claims: [],
    glossary_interlinks: [],
    freshness_label: "pending QA",
    last_freshness_at: null,
    dataset_eligible: false,
  }));
}

function countsFromPackets(packets: ToolRenderPacket[]): ToolCountsVerified {
  const families = new Set(packets.map((packet) => packet.family).filter(Boolean)).size;
  return {
    registered_concepts: packets.length,
    verified_live: packets.filter((packet) => packet.open_tool_render_allowed === true).length,
    pending_qa: packets.filter((packet) => packet.open_tool_block_reason === "qa_pending").length,
    coming_soon: packets.filter((packet) => ["qa_pending", "placeholder_content", "placeholder_detected"].includes(String(packet.open_tool_block_reason || ""))).length,
    broken_404: packets.filter((packet) => packet.open_tool_block_reason === "route_404").length,
    wrong_intent_routing: packets.filter((packet) => ["wrong_intent_routing", "intent_mismatch"].includes(String(packet.open_tool_block_reason || ""))).length,
    thin_static_articles: packets.filter((packet) => packet.open_tool_block_reason === "thin_static_article").length,
    families,
    last_crawl_at: packets.map((packet) => packet.last_crawled_at || packet.last_verified_at).filter(Boolean).sort().at(-1) || null,
  };
}

export function parseJsonArray<T = Record<string, unknown>>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function renderBlockedToolLabel(reason: string | null | undefined): "Coming Soon" | "In Development" | "Hidden" {
  switch (reason) {
    case "placeholder_content":
    case "placeholder_detected":
    case "qa_pending":
      return "Coming Soon";
    case "thin_static_article":
    case "quarantined":
      return "Hidden";
    default:
      return "In Development";
  }
}

export async function getApprovedToolTrustClaims(): Promise<TrustClaimSource[]> {
  const supabase = getSupabaseForToolSubstrate();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("hc_trust_claims_sources")
    .select("claim_text, source_count, source_url, last_verified_at")
    .contains("surfaces", ["tools"])
    .eq("public_display_allowed", true)
    .eq("legal_review_status", "approved");
  if (error) return [];
  return (data || []) as TrustClaimSource[];
}

export async function getToolRenderPackets(): Promise<ToolRenderPacket[]> {
  const supabase = getSupabaseForToolSubstrate();
  if (!supabase) return staticFallbackPackets();
  const { data, error } = await supabase.from("v_tool_render_packet").select("*").order("name");
  if (error || !data?.length) return staticFallbackPackets();
  return data as ToolRenderPacket[];
}

export async function getToolRenderPacket(slug: string): Promise<ToolRenderPacket | null> {
  const supabase = getSupabaseForToolSubstrate();
  if (supabase) {
    const { data, error } = await supabase.from("v_tool_render_packet").select("*").eq("slug", slug).maybeSingle();
    if (!error && data) return data as ToolRenderPacket;
  }
  return staticFallbackPackets().find((packet) => packet.slug === slug) || null;
}

export async function getToolCountsVerified(packets?: ToolRenderPacket[]): Promise<ToolCountsVerified> {
  const supabase = getSupabaseForToolSubstrate();
  if (supabase) {
    const { data, error } = await supabase.from("v_tool_counts_verified").select("*").limit(1).maybeSingle();
    if (!error && data) return data as ToolCountsVerified;
  }
  return countsFromPackets(packets || staticFallbackPackets());
}

export async function getSitemapToolEligible(): Promise<SitemapToolEligible[]> {
  const supabase = getSupabaseForToolSubstrate();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("v_sitemap_tools_eligible")
    .select("slug, name, page_url, canonical_url, last_verified_at");
  if (error) return [];
  return (data || []) as SitemapToolEligible[];
}

export async function getSitemapMasterRows(): Promise<SitemapMasterRow[]> {
  const supabase = getSupabaseForToolSubstrate();
  if (!supabase) return [];
  const { data, error } = await supabase.from("v_sitemap_master").select("*");
  if (error) return [];
  return (data || []) as SitemapMasterRow[];
}
