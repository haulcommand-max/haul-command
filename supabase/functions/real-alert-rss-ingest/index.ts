import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type AlertSource = {
  source_slug: string;
  source_name: string;
  source_type: string;
  country_code: string | null;
  region_code: string | null;
  feed_url: string | null;
  feed_format: string | null;
  scrape_selector: string | null;
  poll_interval_minutes: number | null;
  last_polled_at: string | null;
  consecutive_failures: number | null;
  is_active: boolean | null;
  confidence_score: number | string | null;
};

type FeedItem = {
  title: string;
  link: string | null;
  guid: string;
  published_at: string | null;
  summary: string | null;
};

type PollResult = {
  source_slug: string;
  ok: boolean;
  skipped?: string;
  http_status?: number;
  items_extracted: number;
  items_persisted: number;
  error_message?: string;
};

const DEFAULT_LIMIT = 3;
const DEFAULT_AUTH_LIMIT = 15;
const DEFAULT_MAX_ITEMS_PER_SOURCE = 10;
const DEFAULT_FETCH_TIMEOUT_MS = 20_000;
const RAW_RESPONSE_LIMIT = 200_000;

const BROWSER_HEADERS = {
  "accept": "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, application/json;q=0.8, text/html;q=0.7, */*;q=0.5",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  "pragma": "no-cache",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 HaulCommandAlerts/1.0",
};

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function isInternalRequest(req: Request): boolean {
  const expected = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const cronSecret = Deno.env.get("CRON_SECRET") ?? Deno.env.get("EDGE_CRON_SECRET") ?? "";
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.replace(/^Bearer\s+/i, "").trim();
  const headerSecret = req.headers.get("x-cron-secret") ?? "";

  return Boolean(
    (expected && bearer === expected) ||
      (cronSecret && (bearer === cronSecret || headerSecret === cronSecret)),
  );
}

function isDue(source: AlertSource, now: Date): boolean {
  if (!source.last_polled_at) return true;
  const intervalMinutes = Math.max(5, Number(source.poll_interval_minutes ?? 60));
  const last = new Date(source.last_polled_at).getTime();
  if (!Number.isFinite(last)) return true;
  return now.getTime() - last >= intervalMinutes * 60_000;
}

function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .trim();
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function textBetween(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(re);
  return match?.[1] ? decodeEntities(stripTags(match[1])) : null;
}

function attrValue(block: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, "i");
  return block.match(re)?.[1] ?? null;
}

function toIsoDate(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString();
}

function absoluteUrl(url: string | null, base: string): string | null {
  if (!url) return null;
  try {
    return new URL(decodeEntities(url), base).toString();
  } catch {
    return null;
  }
}

function normalizeTitle(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return stripTags(String(value)).slice(0, 240);
}

function uniqueItems(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  const out: FeedItem[] = [];

  for (const item of items) {
    const key = item.guid || item.link || item.title;
    if (!item.title || !key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

function parseXmlItems(text: string, baseUrl: string): FeedItem[] {
  const blocks = [
    ...text.matchAll(/<item\b[\s\S]*?<\/item>/gi),
    ...text.matchAll(/<entry\b[\s\S]*?<\/entry>/gi),
  ].map((match) => match[0]);

  return uniqueItems(blocks.map((block) => {
    const title = normalizeTitle(textBetween(block, "title"));
    const atomLink = attrValue(block, "link", "href");
    const link = absoluteUrl(textBetween(block, "link") || atomLink, baseUrl);
    const guid = textBetween(block, "guid") || textBetween(block, "id") || link || title;
    const published = textBetween(block, "pubDate") || textBetween(block, "published") || textBetween(block, "updated");
    const summary = textBetween(block, "description") || textBetween(block, "summary") || textBetween(block, "content");

    return {
      title,
      link,
      guid,
      published_at: toIsoDate(published),
      summary: summary ? summary.slice(0, 1_500) : null,
    };
  }));
}

function findFirstArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const obj = value as Record<string, unknown>;
  for (const key of ["events", "incidents", "items", "features", "results", "data", "value"]) {
    if (Array.isArray(obj[key])) return obj[key] as unknown[];
  }

  for (const val of Object.values(obj)) {
    if (Array.isArray(val)) return val;
  }

  return [];
}

function firstProp(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
  }

  const lower = new Map(Object.keys(obj).map((key) => [key.toLowerCase(), key]));
  for (const key of keys) {
    const actual = lower.get(key.toLowerCase());
    if (actual && obj[actual] !== undefined && obj[actual] !== null && obj[actual] !== "") {
      return obj[actual];
    }
  }

  return null;
}

function toFeedDate(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 10_000_000_000 ? value : value * 1000;
    return new Date(millis).toISOString();
  }
  return toIsoDate(value);
}

function parseJsonItems(text: string, baseUrl: string): FeedItem[] {
  const parsed = JSON.parse(text);
  const rows = findFirstArray(parsed);

  return uniqueItems(rows.map((entry) => {
    const raw = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
    const props = raw.properties && typeof raw.properties === "object" ? raw.properties as Record<string, unknown> : raw;
    const eventType = normalizeTitle(firstProp(props, ["eventType", "EventType", "type", "Type"]));
    const roadName = normalizeTitle(firstProp(props, ["roadName", "RoadwayName", "roadway", "route", "Route"]));
    const direction = normalizeTitle(firstProp(props, ["direction", "DirectionOfTravel", "directionOfTravel"]));
    const description = normalizeTitle(firstProp(props, ["description", "Description", "details", "Details", "comments", "Comment", "longDescription"]));
    const directTitle = normalizeTitle(firstProp(props, ["title", "Title", "headline", "Headline", "name", "Name"]));
    const structuredTitle = roadName
      ? `${eventType || "Traffic event"} on ${roadName}${direction ? ` ${direction}` : ""}`
      : eventType;
    const title = directTitle || structuredTitle || description || "Authority alert";
    const summary = description || title;
    const id = String(firstProp(props, ["id", "ID", "eventId", "EventId", "identifier", "guid", "objectId", "SourceId", "url", "link"]) ?? title);
    const linkValue = firstProp(props, ["url", "URL", "link", "Link", "webUrl", "WebUrl"]);
    const link = typeof linkValue === "string" ? absoluteUrl(linkValue, baseUrl) : null;
    const date = firstProp(props, ["published_at", "publishedAt", "pubDate", "updated", "updatedAt", "LastUpdated", "Reported", "StartDate", "created"]);

    return {
      title,
      link,
      guid: id,
      published_at: toFeedDate(date),
      summary: summary ? summary.slice(0, 1_500) : null,
    };
  }));
}

function parseHtmlItems(text: string, baseUrl: string): FeedItem[] {
  const items: FeedItem[] = [];
  const anchorRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of text.matchAll(anchorRe)) {
    const link = absoluteUrl(match[1], baseUrl);
    const title = normalizeTitle(match[2]);
    if (!title || title.length < 8) continue;
    items.push({
      title,
      link,
      guid: link ?? title,
      published_at: null,
      summary: null,
    });
  }

  if (items.length === 0) {
    const headingRe = /<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi;
    for (const match of text.matchAll(headingRe)) {
      const title = normalizeTitle(match[1]);
      if (!title || title.length < 8) continue;
      items.push({ title, link: baseUrl, guid: `${baseUrl}#${title}`, published_at: null, summary: null });
    }
  }

  return uniqueItems(items).slice(0, 40);
}

function parseItems(text: string, format: string | null, contentType: string, baseUrl: string): FeedItem[] {
  const normalized = (format || "").toLowerCase();
  const looksJson = contentType.includes("json") || /^\s*[\[{]/.test(text);
  const looksXml = contentType.includes("xml") || /<(rss|feed|item|entry)\b/i.test(text);

  if (normalized === "json_api" || looksJson) return parseJsonItems(text, baseUrl);
  if (normalized === "html_scrape") return parseHtmlItems(text, baseUrl);
  if (looksXml || normalized === "rss" || normalized === "atom") return parseXmlItems(text, baseUrl);
  return parseHtmlItems(text, baseUrl);
}

function detectBotBlock(status: number, text: string): boolean {
  if ([401, 403, 406, 429, 503].includes(status)) return true;
  return /incapsula|_Incapsula_Resource|access denied|captcha|forbidden/i.test(text.slice(0, 20_000));
}

function extractCookies(headers: Headers): string {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  const cookies = withGetSetCookie.getSetCookie?.() ?? [];
  const fallback = headers.get("set-cookie");
  if (fallback) cookies.push(fallback);
  return cookies
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function fetchAuthorityUrl(url: string, timeoutMs: number): Promise<{ status: number; text: string; contentType: string }> {
  const first = await fetch(url, {
    headers: BROWSER_HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  let text = await first.text();
  const cookie = extractCookies(first.headers);

  if (detectBotBlock(first.status, text) && cookie) {
    const retry = await fetch(url, {
      headers: {
        ...BROWSER_HEADERS,
        "cookie": cookie,
        "referer": new URL(url).origin + "/",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    text = await retry.text();
    return {
      status: retry.status,
      text,
      contentType: retry.headers.get("content-type") ?? "",
    };
  }

  return {
    status: first.status,
    text,
    contentType: first.headers.get("content-type") ?? "",
  };
}

function classifyImpact(item: FeedItem): string {
  const haystack = `${item.title} ${item.summary ?? ""}`.toLowerCase();
  if (/permit|permitting|oversize|overweight|special transport|abnormal load/.test(haystack)) return "permit_update";
  if (/closed|closure|detour|lane|restriction|roadwork|construction|incident|crash|ferry|bridge|tunnel/.test(haystack)) return "route_restriction";
  if (/flood|storm|snow|ice|wind|cyclone|hurricane|weather|fire/.test(haystack)) return "weather_risk";
  if (/border|customs|port|crossing|international/.test(haystack)) return "cross_border_update";
  if (/law|regulation|rule|enforcement|compliance/.test(haystack)) return "regulatory_update";
  return "authority_update";
}

function classifySeverity(item: FeedItem): string {
  const haystack = `${item.title} ${item.summary ?? ""}`.toLowerCase();
  if (/emergency|fatal|evacuation|major closure|closed until further notice|do not travel/.test(haystack)) return "critical";
  if (/closure|closed|severe|flood|wildfire|crash|incident|detour|restriction/.test(haystack)) return "high";
  if (/delay|maintenance|roadwork|construction|advisory|warning/.test(haystack)) return "medium";
  return "low";
}

function affectedRoles(item: FeedItem): string[] {
  const haystack = `${item.title} ${item.summary ?? ""}`.toLowerCase();
  const roles = new Set<string>(["heavy_haul_carrier"]);
  if (/escort|pilot car|abnormal load|oversize|overweight/.test(haystack)) roles.add("pilot_car_operator");
  if (/permit|authority|compliance/.test(haystack)) roles.add("permit_service");
  if (/port|terminal|border|customs/.test(haystack)) roles.add("broker");
  return Array.from(roles);
}

function sourceConfidence(source: AlertSource): number {
  const raw = Number(source.confidence_score ?? 0.8);
  if (!Number.isFinite(raw)) return 0.8;
  return Math.max(0.1, Math.min(1, raw));
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "authority-alert";
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function alertSlug(source: AlertSource, item: FeedItem): Promise<string> {
  const fingerprint = await sha256Hex(`${source.source_slug}|${item.guid}|${item.link ?? ""}|${item.title}`);
  return `${source.source_slug}-${slugify(item.title)}-${fingerprint.slice(0, 12)}`;
}

async function processSource(
  supabase: ReturnType<typeof createClient>,
  source: AlertSource,
  options: { dryRun: boolean; force: boolean; maxItems: number; timeoutMs: number; now: Date },
): Promise<PollResult> {
  if (!source.feed_url) {
    return { source_slug: source.source_slug, ok: true, skipped: "missing_feed_url", items_extracted: 0, items_persisted: 0 };
  }

  if (!options.force && !isDue(source, options.now)) {
    return { source_slug: source.source_slug, ok: true, skipped: "not_due", items_extracted: 0, items_persisted: 0 };
  }

  let rawPollId: string | null = null;

  try {
    const fetched = await fetchAuthorityUrl(source.feed_url, options.timeoutMs);
    const responseText = fetched.text.slice(0, RAW_RESPONSE_LIMIT);

    if (!options.dryRun) {
      const { data: rawPoll, error: pollErr } = await supabase
        .from("hc_alert_raw_polls")
        .insert({
          source_slug: source.source_slug,
          http_status: fetched.status,
          response_text: responseText,
          parse_status: "pending",
        })
        .select("id")
        .maybeSingle();
      if (pollErr) throw pollErr;
      rawPollId = rawPoll?.id ?? null;
    }

    if (fetched.status < 200 || fetched.status >= 300) {
      throw new Error(`HTTP ${fetched.status}`);
    }

    const parsed = parseItems(fetched.text, source.feed_format, fetched.contentType, source.feed_url)
      .slice(0, options.maxItems);
    let persisted = 0;

    for (const item of parsed) {
      const slug = await alertSlug(source, item);
      const row = {
        alert_slug: slug,
        title: item.title,
        country_code: source.country_code,
        region_code: source.region_code,
        impact_category: classifyImpact(item),
        severity: classifySeverity(item),
        affected_load_types: ["oversize", "overweight", "project_cargo"],
        affected_routes: [] as string[],
        affected_role_keys: affectedRoles(item),
        effective_date: item.published_at,
        published_at: item.published_at,
        what_happened: item.summary || item.title,
        who_affected: "Heavy-haul carriers, pilot car operators, brokers, shippers, and permit teams operating in the affected jurisdiction.",
        required_action: "Review the official source and confirm route, permit, escort, and timing requirements before dispatch.",
        source_url: item.link || source.feed_url,
        source_name: source.source_name,
        source_type: source.source_type,
        confidence_score: sourceConfidence(source),
        human_review_status: "pending",
        publish_state: "draft",
        updated_at: new Date().toISOString(),
      };

      if (!options.dryRun) {
        const { error } = await supabase.from("hc_alerts").upsert(row, { onConflict: "alert_slug" });
        if (error) throw error;
      }
      persisted++;
    }

    if (!options.dryRun) {
      if (rawPollId) {
        await supabase
          .from("hc_alert_raw_polls")
          .update({
            parse_status: "parsed",
            items_extracted: parsed.length,
            items_persisted: persisted,
            completed_at: new Date().toISOString(),
          })
          .eq("id", rawPollId);
      }

      await supabase
        .from("hc_alert_sources")
        .update({
          last_polled_at: new Date().toISOString(),
          last_success_at: new Date().toISOString(),
          consecutive_failures: 0,
        })
        .eq("source_slug", source.source_slug);
    }

    return {
      source_slug: source.source_slug,
      ok: true,
      http_status: fetched.status,
      items_extracted: parsed.length,
      items_persisted: persisted,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!options.dryRun) {
      if (rawPollId) {
        await supabase
          .from("hc_alert_raw_polls")
          .update({
            parse_status: "failed",
            error_message: message.slice(0, 1_000),
            completed_at: new Date().toISOString(),
          })
          .eq("id", rawPollId);
      }

      await supabase
        .from("hc_alert_sources")
        .update({
          last_polled_at: new Date().toISOString(),
          consecutive_failures: Number(source.consecutive_failures ?? 0) + 1,
        })
        .eq("source_slug", source.source_slug);
    }

    return {
      source_slug: source.source_slug,
      ok: false,
      items_extracted: 0,
      items_persisted: 0,
      error_message: message,
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return json(200, { ok: true });
  if (req.method !== "POST") return json(405, { ok: false, error: "Method not allowed" });

  const startedAt = Date.now();
  const internal = isInternalRequest(req);
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const dryRun = Boolean(body.dry_run);
  const force = internal && Boolean(body.force);
  const includeInactive = internal && Boolean(body.include_inactive);
  const requestedLimit = Number(body.limit ?? (internal ? DEFAULT_AUTH_LIMIT : DEFAULT_LIMIT));
  const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : DEFAULT_LIMIT, internal ? 50 : DEFAULT_LIMIT));
  const maxItems = Math.max(1, Math.min(Number(body.max_items_per_source ?? DEFAULT_MAX_ITEMS_PER_SOURCE), internal ? 50 : DEFAULT_MAX_ITEMS_PER_SOURCE));
  const timeoutMs = Math.max(3_000, Math.min(Number(body.fetch_timeout_ms ?? DEFAULT_FETCH_TIMEOUT_MS), 60_000));
  const sourceSlugs = Array.isArray(body.source_slugs)
    ? body.source_slugs.map(String).filter(Boolean)
    : typeof body.source_slug === "string"
    ? [body.source_slug]
    : [];

  if (!internal && (force || includeInactive || sourceSlugs.length > 1)) {
    return json(401, { ok: false, error: "Unauthorized manual alert ingest request" });
  }

  const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

  let query = supabase
    .from("hc_alert_sources")
    .select("source_slug,source_name,source_type,country_code,region_code,feed_url,feed_format,scrape_selector,poll_interval_minutes,last_polled_at,consecutive_failures,is_active,confidence_score")
    .not("feed_url", "is", null)
    .order("last_polled_at", { ascending: true, nullsFirst: true })
    .limit(limit * 3);

  if (!includeInactive) query = query.eq("is_active", true);
  if (sourceSlugs.length > 0) query = query.in("source_slug", sourceSlugs);

  const { data: sources, error } = await query;
  if (error) return json(500, { ok: false, error: error.message });

  const now = new Date();
  const dueSources = (sources ?? [])
    .filter((source: AlertSource) => force || isDue(source, now))
    .slice(0, limit);

  const results: PollResult[] = [];
  for (const source of dueSources) {
    results.push(await processSource(supabase, source as AlertSource, {
      dryRun,
      force,
      maxItems,
      timeoutMs,
      now,
    }));
  }

  return json(200, {
    ok: results.every((result) => result.ok),
    dry_run: dryRun,
    internal,
    sources_checked: results.length,
    items_extracted: results.reduce((sum, result) => sum + result.items_extracted, 0),
    items_persisted: results.reduce((sum, result) => sum + result.items_persisted, 0),
    elapsed_ms: Date.now() - startedAt,
    results,
  });
});
