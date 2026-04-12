import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

/**
 * DISCOVERY-SEARCH-CORE ORCHESTRATOR
 * WAVE-3 S3-01: Single entry point for all search/discovery operations.
 *
 * Actions:
 *   action=sync_profile       → Enqueue driver_profiles → Typesense
 *   action=sync_operator      → Enqueue hc_global_operators → Typesense  
 *   action=sync_load          → Enqueue loads → Typesense
 *   action=sync_corridor      → Enqueue corridors → Typesense
 *   action=bulk_sync          → Full collection rebuild (admin only)
 *   action=indexnow           → Ping IndexNow API for new/updated URLs
 *   action=smart_autolink     → Run SmartAutoLinker on content records
 *   action=search             → Query Typesense across collections (for frontend)
 *
 * All sync paths use search_jobs queue (canonical path per search-indexer architecture).
 */

const VALID_TABLE_COLLECTIONS: Record<string, string> = {
  sync_profile: "driver_profiles",
  sync_operator: "hc_global_operators",
  sync_load: "loads",
  sync_corridor: "corridors",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = getServiceClient();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* optional */ }

  const action = String(body.action || "sync_profile");
  const now = new Date().toISOString();
  const recordId = body.record_id as string | undefined;
  const ids = body.ids as string[] | undefined;

  // ─────────────────────────────────────────────────
  // SINGLE RECORD SYNC — profile, operator, load, corridor
  // ─────────────────────────────────────────────────
  if (VALID_TABLE_COLLECTIONS[action]) {
    const tableName = VALID_TABLE_COLLECTIONS[action];

    if (!recordId) {
      return new Response(JSON.stringify({ error: "record_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase.from("search_jobs").insert({
      table_name: tableName,
      record_id: recordId,
      operation: "UPSERT",
      status: "pending",
      created_at: now,
    });

    return new Response(JSON.stringify({ ok: !error, action, table_name: tableName, record_id: recordId, enqueued: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─────────────────────────────────────────────────
  // BULK SYNC — Admin-initiated full collection rebuild
  // ─────────────────────────────────────────────────
  if (action === "bulk_sync") {
    const tableName = String(body.table_name || "driver_profiles");
    const limit = Number(body.limit || 500);

    const { data: rows, error } = await supabase
      .from(tableName)
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jobs = (rows || []).map((r: any) => ({
      table_name: tableName,
      record_id: r.id,
      operation: "UPSERT",
      status: "pending",
      created_at: now,
    }));

    if (jobs.length > 0) {
      await supabase.from("search_jobs").insert(jobs);
    }

    // Log bulk sync OS event
    await supabase.from("os_event_log").insert({
      event_type: "search.bulk_sync_enqueued",
      entity_type: tableName,
      payload: { count: jobs.length, table_name: tableName },
      created_at: now,
    });

    return new Response(JSON.stringify({ ok: true, action: "bulk_sync", enqueued: jobs.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─────────────────────────────────────────────────
  // INDEXNOW — Ping Microsoft/Bing IndexNow API for URL crawling
  // WAVE-3 S3-02: Fire when new corridor/profile/glossary pages publish
  // ─────────────────────────────────────────────────
  if (action === "indexnow") {
    const urls = body.urls as string[] | undefined;
    const apiKey = Deno.env.get("INDEXNOW_API_KEY") || "";
    const host = Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://haulcommand.com";

    if (!urls || urls.length === 0) {
      return new Response(JSON.stringify({ error: "urls[] required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!apiKey) {
      console.warn("[indexnow] INDEXNOW_API_KEY not set — skipping");
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "no_api_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ping Bing IndexNow
    const payload = {
      host: host.replace("https://", "").replace("http://", ""),
      key: apiKey,
      keyLocation: `${host}/${apiKey}.txt`,
      urlList: urls,
    };

    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Log to OS event
    await supabase.from("os_event_log").insert({
      event_type: "seo.indexnow_pinged",
      payload: { url_count: urls.length, status: res.status, sample_urls: urls.slice(0, 3) },
      created_at: now,
    });

    return new Response(JSON.stringify({
      ok: res.ok,
      action: "indexnow",
      status: res.status,
      urls_submitted: urls.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ─────────────────────────────────────────────────
  // SMART AUTOLINKER — inject canonical internal links into content records
  // WAVE-3 S3-03: Runs on corridor/glossary/regulation rows
  // ─────────────────────────────────────────────────
  if (action === "smart_autolink") {
    const tableName = String(body.table_name || "corridor_profiles");
    const batchSize = Number(body.batch_size || 20);

    // Fetch rows with body_content needing link injection
    const { data: rows } = await supabase
      .from(tableName)
      .select("id, slug, body_content, internal_links_injected_at")
      .is("internal_links_injected_at", null)
      .limit(batchSize);

    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ ok: true, action: "smart_autolink", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the canonical link targets: corridors, glossary terms, regulations
    const { data: corridors } = await supabase
      .from("corridors")
      .select("slug, display_name")
      .limit(200);

    const { data: glossary } = await supabase
      .from("glossary_terms")
      .select("slug, term")
      .limit(500);

    const linkTargets = [
      ...(corridors || []).map((c: any) => ({ term: c.display_name, url: `/rates/corridors/${c.slug}` })),
      ...(glossary || []).map((g: any) => ({ term: g.term, url: `/glossary/${g.slug}` })),
    ];

    let processed = 0;
    for (const row of rows) {
      if (!row.body_content) continue;

      let content = row.body_content as string;
      // Inject first occurrence of each matched term (not already linked)
      for (const target of linkTargets) {
        const regex = new RegExp(`(?<!href="[^"]*)(${escapeRegex(target.term)})(?!</a>)`, "i");
        content = content.replace(regex, `<a href="${target.url}" class="hc-autolink">$1</a>`);
      }

      await supabase.from(tableName).update({
        body_content: content,
        internal_links_injected_at: now,
      }).eq("id", row.id);

      processed++;
    }

    return new Response(JSON.stringify({ ok: true, action: "smart_autolink", processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─────────────────────────────────────────────────
  // SEARCH — Query Typesense (called by GlobalOmniSearch / frontend)
  // ─────────────────────────────────────────────────
  if (action === "search") {
    const query = String(body.query || "");
    const typesenseHost = Deno.env.get("TYPESENSE_HOST") || "typesense.haulcommand.internal";
    const typesensePort = Deno.env.get("TYPESENSE_PORT") || "8108";
    const typesenseProtocol = Deno.env.get("TYPESENSE_PROTOCOL") || "https";
    const typesenseKey = Deno.env.get("TYPESENSE_API_KEY") || "";

    if (!query) {
      return new Response(JSON.stringify({ error: "query required" }), { status: 400, headers: corsHeaders });
    }

    try {
      // Multi-search request to Typesense
      const searchReq = {
        searches: [
          { collection: "driver_profiles", q: query, query_by: "display_name,home_base_state,vehicle_type,equipment_tags,certifications", limit: 3 },
          { collection: "corridors", q: query, query_by: "corridor_id,origin_state,dest_state", limit: 2 },
          { collection: "glossary_terms", q: query, query_by: "term,definition", limit: 2 }
        ]
      };

      const res = await fetch(`${typesenseProtocol}://${typesenseHost}:${typesensePort}/multi_search?q=${encodeURIComponent(query)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TYPESENSE-API-KEY": typesenseKey
        },
        body: JSON.stringify(searchReq)
      });
      
      const tsData = await res.json();
      return new Response(JSON.stringify({ ok: true, results: tsData.results || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
