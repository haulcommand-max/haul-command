import { readFile } from "node:fs/promises";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const ALLOWED_FORMATS = new Set(["api", "csv", "html_scrape", "json", "pdf_scrape", "xml", "xlsx", "zip"]);
const ALLOWED_CATEGORIES = new Set(["government_registry", "association_registry", "public_open_data", "manual_review"]);
const ALLOWED_LEGAL_STATES = new Set(["approved", "pending", "needs_legal_review", "blocked"]);
const BANNED_PROVIDER_PATTERN = /google\s*places|make\.com/i;

function env(name) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : null;
}

function parseArgs(argv) {
  const args = {
    file: null,
    dryRun: false,
    allowApprovedAssociations: false,
    checkUrls: false,
  };

  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (token === "--file") {
      args.file = argv[++index] ?? null;
    } else if (token === "--dry-run") {
      args.dryRun = true;
    } else if (token === "--allow-approved-associations") {
      args.allowApprovedAssociations = true;
    } else if (token === "--check-urls") {
      args.checkUrls = true;
    }
  }

  if (!args.file) throw new Error("Missing --file <authority-sources.json>");
  return args;
}

function normalizeString(value, field) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`Missing required field: ${field}`);
  if (BANNED_PROVIDER_PATTERN.test(text)) throw new Error(`Banned provider reference in ${field}`);
  return text;
}

function inferParserFunction(sourceFormat) {
  switch (sourceFormat) {
    case "api":
      return "authority-api-parser";
    case "csv":
      return "authority-csv-parser";
    case "html_scrape":
      return "authority-html-scrape-parser";
    case "json":
      return "authority-json-parser";
    case "pdf_scrape":
      return "authority-pdf-scrape-parser";
    case "xml":
      return "authority-xml-parser";
    case "xlsx":
      return "authority-xlsx-parser";
    case "zip":
      return "authority-zip-parser";
    default:
      throw new Error(`Unsupported source_format: ${sourceFormat}`);
  }
}

export function normalizeAuthoritySource(raw, options = {}) {
  const sourceKey = normalizeString(raw.source_key, "source_key").toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  const sourceFormat = normalizeString(raw.source_format, "source_format");
  const sourceCategory = normalizeString(raw.source_category ?? "government_registry", "source_category");
  const legalReviewStatus = normalizeString(raw.legal_review_status ?? "pending", "legal_review_status");
  const sourceUrl = normalizeString(raw.source_url, "source_url");

  if (!ALLOWED_FORMATS.has(sourceFormat)) throw new Error(`Invalid source_format for ${sourceKey}: ${sourceFormat}`);
  if (!ALLOWED_CATEGORIES.has(sourceCategory)) throw new Error(`Invalid source_category for ${sourceKey}: ${sourceCategory}`);
  if (!ALLOWED_LEGAL_STATES.has(legalReviewStatus)) throw new Error(`Invalid legal_review_status for ${sourceKey}: ${legalReviewStatus}`);
  if (sourceCategory === "association_registry" && legalReviewStatus === "approved" && !options.allowApprovedAssociations) {
    throw new Error(`Association source ${sourceKey} cannot be pre-approved without --allow-approved-associations`);
  }

  return {
    source_key: sourceKey,
    template_source_key: raw.template_source_key ?? null,
    country_code: normalizeString(raw.country_code, "country_code").toUpperCase(),
    authority_name: normalizeString(raw.authority_name, "authority_name"),
    source_url: sourceUrl,
    source_format: sourceFormat,
    source_category: sourceCategory,
    role_keys_covered: Array.isArray(raw.role_keys_covered) ? raw.role_keys_covered.map(String).filter(Boolean) : [],
    parser_function: raw.parser_function ? normalizeString(raw.parser_function, "parser_function") : inferParserFunction(sourceFormat),
    refresh_frequency: String(raw.refresh_frequency ?? "quarterly").trim() || "quarterly",
    estimated_record_count: Number.isFinite(Number(raw.estimated_record_count)) ? Number(raw.estimated_record_count) : null,
    legal_review_status: legalReviewStatus,
    source_license: raw.source_license ? String(raw.source_license).trim() : null,
    source_notes: raw.source_notes ? String(raw.source_notes).trim() : null,
    status: raw.status ? String(raw.status).trim() : sourceFormat === "zip" ? "quarantined" : "queued",
    last_error: raw.last_error ? String(raw.last_error).trim() : sourceFormat === "zip" ? "ZIP authority bundles require an audited archive extractor before parser dispatch." : null,
  };
}

async function readAuthoritySources(file, options) {
  const text = await readFile(file, "utf8");
  const parsed = JSON.parse(text);
  const items = Array.isArray(parsed) ? parsed : parsed.sources;
  if (!Array.isArray(items)) throw new Error("Authority source file must be an array or { sources: [] }");

  const seen = new Set();
  return items.map((item) => {
    const normalized = normalizeAuthoritySource(item, options);
    if (seen.has(normalized.source_key)) throw new Error(`Duplicate source_key in file: ${normalized.source_key}`);
    seen.add(normalized.source_key);
    return normalized;
  });
}

async function checkSourceUrl(source) {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    let response = await fetch(source.source_url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "HaulCommandAuthoritySourceValidator/1.0 (+https://www.haulcommand.com/contact)",
      },
    });

    if (response.status === 405 || response.status === 403) {
      response = await fetch(source.source_url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "HaulCommandAuthoritySourceValidator/1.0 (+https://www.haulcommand.com/contact)",
          "range": "bytes=0-1024",
        },
      });
    }

    return {
      source_key: source.source_key,
      ok: response.ok,
      status: response.status,
      elapsed_ms: Date.now() - started,
      final_url: response.url,
    };
  } catch (error) {
    return {
      source_key: source.source_key,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      elapsed_ms: Date.now() - started,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function getSupabase() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL") ?? env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when not using --dry-run");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function loadAuthoritySources(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const sources = await readAuthoritySources(args.file, {
    allowApprovedAssociations: args.allowApprovedAssociations,
  });
  const url_checks = args.checkUrls ? await Promise.all(sources.map(checkSourceUrl)) : [];

  if (args.dryRun) {
    return {
      ok: true,
      dry_run: true,
      source_count: sources.length,
      approved_count: sources.filter((source) => source.legal_review_status === "approved").length,
      association_review_count: sources.filter((source) => source.source_category === "association_registry" && source.legal_review_status !== "approved").length,
      quarantined_count: sources.filter((source) => source.status === "quarantined").length,
      url_checks,
    };
  }

  if (args.checkUrls && url_checks.some((check) => !check.ok)) {
    throw new Error("One or more authority source URLs failed validation. Re-run with --dry-run --check-urls to inspect.");
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("hc_authority_source_imports")
    .upsert(sources, { onConflict: "source_key" });

  if (error) throw error;
  return { ok: true, dry_run: false, source_count: sources.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  loadAuthoritySources()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
