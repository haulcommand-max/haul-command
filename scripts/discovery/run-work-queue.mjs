import process from "node:process";
import { webcrypto } from "node:crypto";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";
import { tavily } from "@tavily/core";

const SUPPORTED_JOB_TYPES = new Set([
  "tavily_search",
  "reverse_company_search",
  "firecrawl_scrape",
  "clay_enrichment",
  "authority_registry_scan",
  "association_member_scan",
]);

const STAGED_ONLY_MESSAGE =
  "Discovery queue runner stages raw observations only; promotion remains behind existing quality, seasoning, and dedup gates.";

function env(name) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : null;
}

function parseArgs(argv) {
  const args = {
    limit: 5,
    dryRun: false,
    workerId: `discovery-work-queue-${process.pid}`,
  };

  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (token === "--dry-run") {
      args.dryRun = true;
    } else if (token === "--limit") {
      args.limit = Math.max(1, Number(argv[++index] ?? args.limit) || args.limit);
    } else if (token === "--worker-id") {
      args.workerId = String(argv[++index] ?? args.workerId);
    }
  }

  return args;
}

let supabaseClient = null;
function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const url = env("NEXT_PUBLIC_SUPABASE_URL") ?? env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  supabaseClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseClient;
}

let tavilyClient = null;
function getTavily() {
  if (tavilyClient) return tavilyClient;
  const key = env("TAVILY_API_KEY");
  if (!key) throw new Error("TAVILY_API_KEY is required for Tavily discovery jobs");
  tavilyClient = tavily({ apiKey: key });
  return tavilyClient;
}

async function sha256(value) {
  const digest = await webcrypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeCountry(job) {
  return String(job.country_code ?? "US").trim().toUpperCase();
}

async function claimJobs(limit, workerId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("hc_discovery_work_queue")
    .select("*")
    .eq("status", "pending")
    .lte("run_after", new Date().toISOString())
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  const claimed = [];
  for (const job of data ?? []) {
    const { data: updated, error: updateError } = await supabase
      .from("hc_discovery_work_queue")
      .update({
        status: "running",
        locked_at: new Date().toISOString(),
        locked_by: workerId,
        attempts: Number(job.attempts ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();

    if (updateError) throw updateError;
    if (updated) claimed.push(updated);
  }

  return claimed;
}

async function updateJob(jobId, status, patch = {}) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("hc_discovery_work_queue")
    .update({
      status,
      updated_at: new Date().toISOString(),
      locked_at: null,
      locked_by: null,
      ...patch,
    })
    .eq("id", jobId);

  if (error) throw error;
}

async function insertRawObservation(job, observation) {
  const supabase = getSupabase();
  const sourceUrl = observation.url ?? job.source_url ?? "";
  const externalId = `${job.provider}_${await sha256(`${job.id}:${sourceUrl || job.query || job.source_name}`)}`;
  const payload = {
    target_entity_subtype: job.target_entity_subtype ?? "heavy_haul_support_provider",
    discovery_queue_id: job.id,
    provider: job.provider,
    job_type: job.job_type,
    query: job.query,
    observation,
    captured_at: new Date().toISOString(),
    promotion_policy: STAGED_ONLY_MESSAGE,
  };

  const { data: existing, error: lookupError } = await supabase
    .from("hc_entities_raw")
    .select("id")
    .eq("source_name", job.source_name ?? `discovery_${job.provider}`)
    .eq("external_id", externalId)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing?.id) return { external_id: externalId, existing: true };

  const { error } = await supabase
    .from("hc_entities_raw")
    .insert({
      source_type: "directory",
      source_name: job.source_name ?? `discovery_${job.provider}`,
      source_url: sourceUrl || null,
      country_code: normalizeCountry(job),
      external_id: externalId,
      payload,
    });

  if (error) throw error;
  return { external_id: externalId };
}

async function runTavilyJob(job, dryRun) {
  const query = String(job.query ?? "").trim();
  if (!query) throw new Error("Tavily discovery job has no query");

  const response = await getTavily().search(query, {
    maxResults: Number(job.payload?.max_results ?? 8),
    searchDepth: job.priority <= 50 ? "advanced" : "basic",
  });

  const results = Array.isArray(response.results) ? response.results : [];
  if (!dryRun) {
    for (const result of results) {
      await insertRawObservation(job, {
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score,
      });
    }
  }

  return {
    ok: true,
    provider: "tavily",
    query,
    result_count: results.length,
    dry_run: dryRun,
    promotion_policy: STAGED_ONLY_MESSAGE,
  };
}

async function runFirecrawlJob(job, dryRun) {
  const url = String(job.source_url ?? job.payload?.url ?? "").trim();
  if (!url) throw new Error("Firecrawl discovery job has no source_url");

  const projectUrl = env("NEXT_PUBLIC_SUPABASE_URL") ?? env("SUPABASE_URL");
  const secret = env("FIRECRAWL_WORKER_SECRET") ?? env("CRON_SECRET") ?? env("SUPABASE_SERVICE_ROLE_KEY");
  if (!projectUrl || !secret) throw new Error("Supabase URL and FIRECRAWL_WORKER_SECRET/CRON_SECRET are required");

  const endpoint = `${projectUrl.replace(/\/$/, "")}/functions/v1/firecrawl-worker`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      url,
      queue_id: job.id,
      source_type: "directory",
      source_name: job.source_name ?? "discovery_firecrawl",
      country_code: normalizeCountry(job),
      target_entity_subtype: job.target_entity_subtype ?? "heavy_haul_support_provider",
      trigger_clay: false,
      dry_run: dryRun,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Firecrawl worker returned ${response.status}: ${JSON.stringify(body).slice(0, 500)}`);
  return body;
}

async function runClayJob(job, dryRun) {
  const webhookUrl = env("CLAY_WEBHOOK_URL");
  if (!webhookUrl) throw new Error("CLAY_WEBHOOK_URL is required for Clay enrichment jobs");

  const payload = {
    source: "discovery-work-queue",
    queue_id: job.id,
    country_code: normalizeCountry(job),
    target_entity_subtype: job.target_entity_subtype,
    source_url: job.source_url,
    source_name: job.source_name,
    payload: job.payload,
    promotion_policy: STAGED_ONLY_MESSAGE,
  };

  if (dryRun) return { ok: true, provider: "clay", dry_run: true, payload };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  return { ok: response.ok, provider: "clay", status: response.status };
}

async function runAuthorityJob(job, dryRun) {
  if (job.payload?.legal_review_status !== "approved") {
    return {
      ok: true,
      skipped: true,
      reason: "Authority or association import is not legally approved",
      promotion_policy: STAGED_ONLY_MESSAGE,
    };
  }

  const parserFunction = String(job.payload?.parser_function ?? "").trim();
  const importId = String(job.payload?.authority_source_import_id ?? "").trim();
  if (!parserFunction || !importId) {
    throw new Error("Authority discovery job requires payload.parser_function and payload.authority_source_import_id");
  }

  const projectUrl = env("NEXT_PUBLIC_SUPABASE_URL") ?? env("SUPABASE_URL");
  const secret = env("AUTHORITY_IMPORT_SECRET") ?? env("CRON_SECRET") ?? env("SUPABASE_SERVICE_ROLE_KEY");
  if (!projectUrl || !secret) throw new Error("Supabase URL and AUTHORITY_IMPORT_SECRET/CRON_SECRET are required");

  const endpoint = `${projectUrl.replace(/\/$/, "")}/functions/v1/${parserFunction}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      import_id: importId,
      source_url: job.source_url,
      source_name: job.source_name,
      source_format: job.payload?.source_format,
      source_category: job.payload?.source_category,
      country_code: normalizeCountry(job),
      target_entity_subtype: job.target_entity_subtype,
      dry_run: dryRun,
      max_rows: Number(job.payload?.max_rows ?? 500),
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Authority parser ${parserFunction} returned ${response.status}: ${JSON.stringify(body).slice(0, 500)}`);

  return {
    ok: true,
    provider: job.provider,
    parser_function: parserFunction,
    parser_result: body,
    dry_run: dryRun,
    promotion_policy: STAGED_ONLY_MESSAGE,
  };
}

async function runJob(job, dryRun) {
  if (!SUPPORTED_JOB_TYPES.has(job.job_type)) {
    return {
      status: "skipped",
      summary: {
        ok: true,
        skipped: true,
        reason: `No non-Google, non-Make consumer is implemented for ${job.job_type} yet`,
        promotion_policy: STAGED_ONLY_MESSAGE,
      },
    };
  }

  if (job.job_type === "tavily_search" || job.job_type === "reverse_company_search") {
    return { status: "succeeded", summary: await runTavilyJob(job, dryRun) };
  }
  if (job.job_type === "firecrawl_scrape") {
    return { status: "succeeded", summary: await runFirecrawlJob(job, dryRun) };
  }
  if (job.job_type === "clay_enrichment") {
    return { status: "succeeded", summary: await runClayJob(job, dryRun) };
  }
  if (job.job_type === "authority_registry_scan" || job.job_type === "association_member_scan") {
    const summary = await runAuthorityJob(job, dryRun);
    return { status: summary.skipped ? "skipped" : "succeeded", summary };
  }

  return {
    status: "quarantined",
    summary: {
      ok: false,
      reason: `Unhandled job type ${job.job_type}`,
      promotion_policy: STAGED_ONLY_MESSAGE,
    },
  };
}

export async function runDiscoveryWorkQueue(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const jobs = await claimJobs(args.limit, args.workerId);
  const results = [];

  for (const job of jobs) {
    try {
      const result = await runJob(job, args.dryRun);
      await updateJob(job.id, result.status, {
        result_summary: result.summary,
        last_error: null,
      });
      results.push({ id: job.id, job_type: job.job_type, status: result.status });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retryable = Number(job.attempts ?? 0) + 1 < Number(job.max_attempts ?? 3);
      await updateJob(job.id, retryable ? "pending" : "failed", {
        run_after: retryable ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : job.run_after,
        last_error: message,
        result_summary: { ok: false, error: message, retryable },
      });
      results.push({ id: job.id, job_type: job.job_type, status: retryable ? "pending" : "failed", error: message });
    }
  }

  return {
    ok: true,
    claimed: jobs.length,
    processed: results.length,
    dry_run: args.dryRun,
    results,
  };
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  runDiscoveryWorkQueue()
    .then((summary) => {
      console.log(JSON.stringify(summary, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
