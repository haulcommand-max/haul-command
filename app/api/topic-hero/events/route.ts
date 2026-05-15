import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_EVENTS = new Set([
  "hero_impression",
  "hero_search_submit",
  "hero_ask_submit",
  "hero_no_result",
  "hero_result_click",
  "hero_chip_click",
  "hero_cta_click",
  "hero_next_step_click",
  "hero_scroll_depth",
]);

const MAX_STRING_LENGTH = 180;

function hashString(input: string) {
  return createHash("sha256").update(input).digest("hex").slice(0, 24);
}

function sanitizeString(value: unknown) {
  if (typeof value !== "string") return null;
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]")
    .trim()
    .slice(0, MAX_STRING_LENGTH);
}

function sanitizeMeta(body: Record<string, unknown>) {
  const allowed = [
    "label",
    "href",
    "intent",
    "depth",
    "queryLength",
    "metadataStatus",
    "hasHouseAd",
    "hasSearch",
    "claimIntent",
    "loadPostIntent",
    "sponsorIntent",
    "proIntent",
    "toolIntent",
    "regulationIntent",
    "glossaryIntent",
    "providerIntent",
    "noResult",
    "clickedResult",
    "nextAction",
  ];

  return Object.fromEntries(
    allowed
      .filter((key) => body[key] !== undefined)
      .map((key) => {
        const value = body[key];
        return [key, typeof value === "string" ? sanitizeString(value) : value];
      }),
  );
}

export async function POST(req: NextRequest) {
  const consent = req.cookies.get("hc_consent")?.value;
  if (consent !== "full") {
    return new NextResponse(null, { status: 204 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = sanitizeString(body.eventType);
  if (!eventType || !VALID_EVENTS.has(eventType)) {
    return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  const ua = req.headers.get("user-agent") ?? "unknown";
  const ipHash = hashString(ip);
  const uaHash = hashString(ua);

  const row = {
    event_type: eventType,
    page_family: sanitizeString(body.pageFamily),
    page_topic: sanitizeString(body.pageTopic),
    route_pattern: sanitizeString(body.routePattern),
    hero_tier: sanitizeString(body.heroTier),
    search_scope: sanitizeString(body.searchScope),
    ask_scope: sanitizeString(body.askScope),
    query_redacted: sanitizeString(body.query),
    country_intent: sanitizeString(body.countryIntent),
    region_intent: sanitizeString(body.regionIntent),
    city_intent: sanitizeString(body.cityIntent),
    corridor_intent: sanitizeString(body.corridorIntent),
    role_intent: sanitizeString(body.roleIntent),
    ip_hash: ipHash,
    ua_hash: uaHash,
    meta: sanitizeMeta(body),
  };

  try {
    const supabase = getSupabaseAdmin() as any;
    const { error } = await supabase.from("hc_topic_hero_events").insert(row);
    if (error) {
      console.warn("[topic-hero/events] event accepted but not stored", error.message);
      return NextResponse.json({ ok: true, stored: false }, { status: 202 });
    }
  } catch (error) {
    console.warn("[topic-hero/events] event accepted but storage unavailable", error);
    return NextResponse.json({ ok: true, stored: false }, { status: 202 });
  }

  return new NextResponse(null, { status: 204 });
}
