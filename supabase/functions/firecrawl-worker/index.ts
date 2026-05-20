import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

type FirecrawlRequest = {
  url?: string;
  urls?: string[];
  queue_id?: string;
  source_type?: "gov" | "association" | "directory" | "maps" | "social" | "manual" | "partner" | "registry";
  source_name?: string;
  country_code?: string;
  target_entity_subtype?: string;
  trigger_clay?: boolean;
  dry_run?: boolean;
};

const FIRECRAWL_ENDPOINT = "https://api.firecrawl.dev/v2/scrape";
const MAX_URLS_PER_RUN = 5;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8" },
  });
}

function env(name: string): string | null {
  const value = Deno.env.get(name);
  return value && value.trim() ? value.trim() : null;
}

function allowedSecrets(): string[] {
  return [
    env("FIRECRAWL_WORKER_SECRET"),
    env("CRON_SECRET"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
  ].filter(Boolean) as string[];
}

function isAuthorized(req: Request): boolean {
  const configured = allowedSecrets();
  if (configured.length === 0) return false;

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const cronSecret = req.headers.get("x-cron-secret")?.trim();

  return configured.some((secret) => secret === bearer || secret === cronSecret);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function updateQueue(queueId: string | undefined, status: string, patch: Record<string, unknown>) {
  if (!queueId) return;

  try {
    const supabase = getServiceClient();
    await supabase
      .from("hc_discovery_work_queue")
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...patch,
      })
      .eq("id", queueId);
  } catch (error) {
    console.error("firecrawl-worker queue update failed", error);
  }
}

async function scrapeUrl(apiKey: string, url: string) {
  const response = await fetch(FIRECRAWL_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "links"],
      onlyMainContent: true,
      timeout: 60000,
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Firecrawl scrape failed for ${url}: ${response.status} ${JSON.stringify(body).slice(0, 500)}`);
  }

  return body;
}

async function insertRawDiscovery(input: {
  url: string;
  scrape: Record<string, unknown>;
  sourceType: string;
  sourceName: string;
  countryCode: string;
  targetEntitySubtype: string;
}) {
  const supabase = getServiceClient();
  const externalId = `firecrawl_${await sha256(input.url)}`;
  const scrapeData = (input.scrape.data ?? input.scrape) as Record<string, unknown>;

  const payload = {
    target_entity_subtype: input.targetEntitySubtype,
    url: input.url,
    scrape: scrapeData,
    captured_at: new Date().toISOString(),
  };

  const { data: existing, error: lookupError } = await supabase
    .from("hc_entities_raw")
    .select("id")
    .eq("source_name", input.sourceName)
    .eq("external_id", externalId)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing?.id) return { external_id: externalId, existing: true };

  const { error } = await supabase
    .from("hc_entities_raw")
    .insert({
      source_type: input.sourceType,
      source_name: input.sourceName,
      source_url: input.url,
      country_code: input.countryCode,
      external_id: externalId,
      payload,
    });

  if (error) throw error;

  return { external_id: externalId };
}

async function triggerClay(payload: Record<string, unknown>) {
  const webhookUrl = env("CLAY_WEBHOOK_URL");
  if (!webhookUrl) return { skipped: true, reason: "missing_clay_webhook_url" };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  return { ok: response.ok, status: response.status };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });
  if (!isAuthorized(req)) return json(401, { ok: false, error: "unauthorized" });

  const apiKey = env("FIRECRAWL_API_KEY");
  if (!apiKey) return json(503, { ok: false, error: "FIRECRAWL_API_KEY is not configured" });

  const body = await req.json().catch(() => ({})) as FirecrawlRequest;
  const urls = [...(body.urls ?? []), ...(body.url ? [body.url] : [])]
    .map((url) => String(url).trim())
    .filter(Boolean)
    .slice(0, MAX_URLS_PER_RUN);

  if (urls.length === 0) return json(400, { ok: false, error: "url or urls[] required" });

  const sourceType = body.source_type ?? "directory";
  const sourceName = body.source_name ?? "firecrawl_worker";
  const countryCode = (body.country_code ?? "US").toUpperCase();
  const targetEntitySubtype = body.target_entity_subtype ?? "heavy_haul_support_provider";
  const dryRun = body.dry_run === true;

  await updateQueue(body.queue_id, "running", {
    locked_at: new Date().toISOString(),
    locked_by: "firecrawl-worker",
    attempts: 1,
  });

  const results: Array<Record<string, unknown>> = [];
  let errorCount = 0;

  for (const url of urls) {
    try {
      const scrape = await scrapeUrl(apiKey, url);
      const stored = dryRun
        ? { external_id: `dry_run_${await sha256(url)}` }
        : await insertRawDiscovery({
          url,
          scrape,
          sourceType,
          sourceName,
          countryCode,
          targetEntitySubtype,
        });

      const clay = body.trigger_clay
        ? await triggerClay({
          source: "firecrawl-worker",
          url,
          country_code: countryCode,
          target_entity_subtype: targetEntitySubtype,
          external_id: stored.external_id,
        })
        : { skipped: true, reason: "trigger_clay_false" };

      results.push({ ok: true, url, ...stored, clay });
    } catch (error) {
      errorCount++;
      results.push({ ok: false, url, error: error instanceof Error ? error.message : String(error) });
    }
  }

  await updateQueue(body.queue_id, errorCount > 0 ? "failed" : "succeeded", {
    last_error: errorCount > 0 ? `${errorCount} scrape(s) failed` : null,
    result_summary: { processed: urls.length, error_count: errorCount, sample: results.slice(0, 3) },
  });

  return json(errorCount > 0 ? 207 : 200, {
    ok: errorCount === 0,
    processed: urls.length,
    error_count: errorCount,
    dry_run: dryRun,
    results,
  });
});
