import type { NextFetchEvent, NextRequest } from "next/server";

export type RequestLogPayload = {
  ip: string;
  user_agent: string;
  path: string;
  is_bot: boolean;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

const STATIC_PATH_PATTERN =
  /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|css|js|map|woff|woff2|ttf|otf)$/i;

const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|linkedinbot|pinterest|semrush|ahrefs|mj12bot|duckduckbot/i;

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function decodeHeaderValue(value: string | null) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseCoordinate(value: string | null) {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function shouldLogRequestPath(pathname: string) {
  if (!pathname || pathname.startsWith("/_next/")) return false;
  if (pathname === "/favicon.ico") return false;
  return !STATIC_PATH_PATTERN.test(pathname);
}

export function buildRequestLogPayload(url: string | URL, headers: Headers): RequestLogPayload {
  const requestUrl = typeof url === "string" ? new URL(url) : url;
  const userAgent = headers.get("user-agent") || "unknown";

  return {
    ip:
      firstHeaderValue(headers.get("x-forwarded-for")) ||
      headers.get("cf-connecting-ip") ||
      headers.get("x-real-ip") ||
      "unknown",
    user_agent: userAgent,
    path: requestUrl.pathname,
    is_bot: BOT_USER_AGENT_PATTERN.test(userAgent),
    country: headers.get("x-vercel-ip-country") || null,
    city: decodeHeaderValue(headers.get("x-vercel-ip-city")),
    latitude: parseCoordinate(headers.get("x-vercel-ip-latitude")),
    longitude: parseCoordinate(headers.get("x-vercel-ip-longitude")),
  };
}

export function scheduleRequestLog(request: NextRequest, event?: NextFetchEvent) {
  if (!shouldLogRequestPath(request.nextUrl.pathname)) return;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return;

  const payload = buildRequestLogPayload(request.url, request.headers);
  const write = fetch(`${supabaseUrl}/rest/v1/request_log`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  }).catch(() => undefined);

  if (event) {
    event.waitUntil(write);
    return;
  }

  void write;
}
