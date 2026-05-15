import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type InternalRequest = Request | NextRequest;

const INTERNAL_TOKEN_ENV_KEYS = [
  "INTERNAL_WORKER_TOKEN",
  "HC_ADMIN_SECRET",
  "CRON_SECRET",
  "ADMIN_API_KEY",
] as const;

function configuredTokens() {
  return INTERNAL_TOKEN_ENV_KEYS
    .map((key) => process.env[key])
    .filter((value): value is string => Boolean(value?.trim()));
}

function providedToken(request: InternalRequest) {
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  return (
    request.headers.get("x-internal-token")?.trim() ||
    request.headers.get("x-admin-secret")?.trim() ||
    bearer ||
    ""
  );
}

export function getInternalRequestToken() {
  return configuredTokens()[0] ?? null;
}

export function buildInternalRequestHeaders(base: Record<string, string> = {}) {
  const token = getInternalRequestToken();
  return token ? { ...base, "x-internal-token": token } : base;
}

export function isAuthorizedInternalRequest(request: InternalRequest) {
  const tokens = configuredTokens();
  if (tokens.length === 0) return false;
  return tokens.includes(providedToken(request));
}

export function getInternalRequestAuthFailure(request: InternalRequest) {
  if (isAuthorizedInternalRequest(request)) return null;

  const status = configuredTokens().length === 0 ? 503 : 401;
  const error =
    status === 503
      ? "Internal authorization is not configured."
      : "Missing or invalid internal authorization.";

  return NextResponse.json({ ok: false, error }, { status });
}

export const requireInternalRequest = getInternalRequestAuthFailure;
