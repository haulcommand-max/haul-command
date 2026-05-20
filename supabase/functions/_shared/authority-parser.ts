import { corsHeaders } from "./cors.ts";
import { getServiceClient } from "./supabase.ts";

export type AuthorityParserRequest = {
  import_id?: string;
  source_url?: string;
  source_name?: string;
  source_format?: string;
  source_category?: string;
  country_code?: string;
  target_entity_subtype?: string;
  rows?: Array<Record<string, unknown>>;
  dry_run?: boolean;
  max_rows?: number;
};

export type RawAuthorityObservation = {
  name?: string | null;
  source_url?: string | null;
  external_id?: string | null;
  payload: Record<string, unknown>;
};

export function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8" },
  });
}

export function optionsResponse() {
  return new Response("ok", { headers: corsHeaders });
}

function env(name: string): string | null {
  const value = Deno.env.get(name);
  return value && value.trim() ? value.trim() : null;
}

function allowedSecrets(): string[] {
  return [
    env("AUTHORITY_IMPORT_SECRET"),
    env("CRON_SECRET"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
  ].filter(Boolean) as string[];
}

export function isAuthorized(req: Request): boolean {
  const configured = allowedSecrets();
  if (configured.length === 0) return false;

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const cronSecret = req.headers.get("x-cron-secret")?.trim();

  return configured.some((secret) => secret === bearer || secret === cronSecret);
}

export async function parseRequest(req: Request): Promise<AuthorityParserRequest> {
  return await req.json().catch(() => ({})) as AuthorityParserRequest;
}

export async function resolveImport(input: AuthorityParserRequest) {
  const supabase = getServiceClient();
  if (!input.import_id) {
    return {
      id: null,
      source_url: input.source_url ?? null,
      authority_name: input.source_name ?? "authority_parser_manual",
      country_code: input.country_code ?? "US",
      source_format: input.source_format ?? "html_scrape",
      source_category: input.source_category ?? "government_registry",
      role_keys_covered: [],
      legal_review_status: "approved",
    };
  }

  const { data, error } = await supabase
    .from("hc_authority_source_imports")
    .select("*")
    .eq("id", input.import_id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error(`Authority source import not found: ${input.import_id}`);
  if (data.legal_review_status !== "approved") {
    throw new Error(`Authority source import is not legally approved: ${data.legal_review_status}`);
  }
  return data;
}

export async function updateImport(importId: string | null | undefined, patch: Record<string, unknown>) {
  if (!importId) return;
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("hc_authority_source_imports")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", importId);
  if (error) throw error;
}

export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "HaulCommandAuthorityImporter/1.0 (+https://www.haulcommand.com/contact)",
      "accept": "text/html,application/json,text/csv,application/xml,text/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status} for ${url}`);
  return await response.text();
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function parseCsvRows(csv: string): Record<string, string>[] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < csv.length; index++) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index++;
      row.push(current.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some(Boolean)) rows.push(row);

  const headers = (rows.shift() ?? []).map((header) => header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"));
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header || `field_${index}`, values[index] ?? ""])));
}

export function coerceJsonRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === "object") as Record<string, unknown>[];
  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  for (const key of ["data", "results", "items", "records", "rows"]) {
    if (Array.isArray(record[key])) {
      return (record[key] as unknown[]).filter((item) => item && typeof item === "object") as Record<string, unknown>[];
    }
  }
  return [record];
}

export function extractHtmlObservations(html: string, sourceUrl: string): RawAuthorityObservation[] {
  const observations: RawAuthorityObservation[] = [];
  const tableRowPattern = /<tr[\s\S]*?<\/tr>/gi;
  const cellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const rowMatch of html.matchAll(tableRowPattern)) {
    const cells = Array.from(rowMatch[0].matchAll(cellPattern))
      .map((match) => stripHtml(match[1]))
      .filter(Boolean);
    if (cells.length >= 2) {
      observations.push({
        name: cells[0],
        source_url: sourceUrl,
        payload: { cells, extraction: "html_table_row" },
      });
    }
  }

  for (const linkMatch of html.matchAll(linkPattern)) {
    const label = stripHtml(linkMatch[2]);
    const href = normalizeUrl(linkMatch[1], sourceUrl);
    if (label && href && /member|carrier|operator|transport|escort|permit|registry|license/i.test(`${label} ${href}`)) {
      observations.push({
        name: label,
        source_url: href,
        payload: { label, href, extraction: "html_link" },
      });
    }
  }

  return observations;
}

export function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(value: string, baseUrl: string): string | null {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

export function rowsToObservations(rows: Array<Record<string, unknown>>, sourceUrl: string | null): RawAuthorityObservation[] {
  return rows.map((row, index) => {
    const name = firstString(row, ["name", "company_name", "legal_name", "business_name", "dba_name", "carrier_name", "organisation_name"]);
    const website = firstString(row, ["website", "url", "web", "homepage", "source_url"]);
    const external = firstString(row, ["id", "external_id", "dot_number", "mc_number", "license_number", "registration_number"]);
    return {
      name: name ?? external ?? `authority_row_${index + 1}`,
      source_url: website ?? sourceUrl,
      external_id: external,
      payload: row,
    };
  });
}

function firstString(row: Record<string, unknown>, keys: string[]): string | null {
  const normalized = new Map(Object.entries(row).map(([key, value]) => [key.toLowerCase(), value]));
  for (const key of keys) {
    const value = normalized.get(key);
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}

export async function insertRawObservations(input: {
  importRecord: Record<string, unknown>;
  observations: RawAuthorityObservation[];
  dryRun?: boolean;
  maxRows?: number;
}) {
  const maxRows = Math.max(1, Number(input.maxRows ?? 500));
  const observations = input.observations.slice(0, maxRows);
  const importId = input.importRecord.id as string | null;
  const sourceName = String(input.importRecord.authority_name ?? "authority_parser");
  const countryCode = String(input.importRecord.country_code ?? "US").toUpperCase();
  const sourceCategory = String(input.importRecord.source_category ?? "government_registry");
  const sourceType = sourceCategory === "association_registry" ? "association" : "gov";
  const sourceUrl = String(input.importRecord.source_url ?? "");
  const roleKeys = Array.isArray(input.importRecord.role_keys_covered) ? input.importRecord.role_keys_covered : [];

  if (input.dryRun) {
    return { inserted: 0, dry_run: true, sampled: observations.slice(0, 5) };
  }

  const rows = [];
  for (const observation of observations) {
    const basis = `${importId ?? sourceName}:${observation.external_id ?? observation.source_url ?? observation.name ?? JSON.stringify(observation.payload).slice(0, 200)}`;
    rows.push({
      source_type: sourceType,
      source_name: sourceName,
      source_url: observation.source_url ?? sourceUrl,
      country_code: countryCode,
      external_id: `authority_${await sha256(basis)}`,
      payload: {
        ...observation.payload,
        name: observation.name ?? null,
        authority_source_import_id: importId,
        authority_name: sourceName,
        source_category: sourceCategory,
        role_keys_covered: roleKeys,
        staging_policy: "raw_only_no_public_promotion",
        captured_at: new Date().toISOString(),
      },
    });
  }

  if (rows.length === 0) return { inserted: 0, dry_run: false };

  const supabase = getServiceClient();
  let inserted = 0;
  let skippedExisting = 0;

  for (const row of rows) {
    const { data: existing, error: lookupError } = await supabase
      .from("hc_entities_raw")
      .select("id")
      .eq("source_name", row.source_name)
      .eq("external_id", row.external_id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (existing?.id) {
      skippedExisting++;
      continue;
    }

    const { error } = await supabase.from("hc_entities_raw").insert(row);
    if (error) throw error;
    inserted++;
  }

  return { inserted, skipped_existing: skippedExisting, dry_run: false };
}
