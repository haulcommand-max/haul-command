import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type Json = Record<string, unknown>;

type TrustEventIn = {
  entity_profile_id: string;
  event_type: string;
  role?: string | null;
  severity?: number | null;
  verified?: boolean | null;
  occurred_at?: string | null;
  corridor_id?: string | null;
  meta?: Json | null;
};

type BatchBody = TrustEventIn | { events: TrustEventIn[] };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function badRequest(msg: string, extra: Json = {}) {
  return jsonResponse({ ok: false, error: msg, ...extra }, 400);
}

function unauthorized(msg = "Unauthorized") {
  return jsonResponse({ ok: false, error: msg }, 401);
}

const REQUIRE_AUTH = true;
const ALLOWED_ROLES = new Set(["owner_admin", "admin", "moderator", "support", "finance"]);
const MAX_BATCH = 500;
const INSERT_CHUNK = 200;

function isUuidLike(s: unknown) {
  return typeof s === "string" && s.length >= 32;
}

function safeMeta(v: unknown): Json {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Json;
  return {};
}

function normalizeBody(body: BatchBody): TrustEventIn[] {
  if ((body as any)?.events && Array.isArray((body as any).events)) {
    return (body as any).events as TrustEventIn[];
  }
  return [body as TrustEventIn];
}

function validateEvent(e: TrustEventIn, idx: number) {
  const errs: string[] = [];
  if (!e || typeof e !== "object") errs.push("event must be an object");
  if (!isUuidLike(e.entity_profile_id)) errs.push("entity_profile_id missing/invalid");
  if (!e.event_type || typeof e.event_type !== "string") errs.push("event_type missing/invalid");
  if (e.occurred_at && typeof e.occurred_at !== "string") errs.push("occurred_at must be ISO string");
  if (e.role != null && typeof e.role !== "string") errs.push("role must be string or null");
  if (e.severity != null && typeof e.severity !== "number") errs.push("severity must be number or null");
  if (e.verified != null && typeof e.verified !== "boolean") errs.push("verified must be boolean or null");
  if (e.corridor_id != null && typeof e.corridor_id !== "string") errs.push("corridor_id must be uuid string or null");
  if (e.meta != null && (typeof e.meta !== "object" || Array.isArray(e.meta))) errs.push("meta must be object or null");
  return errs.length ? { idx, errors: errs } : null;
}

async function resolveBestCorridorsByLoadId(
  supabaseAdmin: ReturnType<typeof createClient>,
  loadIds: string[],
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  for (const loadId of loadIds) {
    if (!isUuidLike(loadId)) { map.set(loadId, null); continue; }
    const { data, error } = await supabaseAdmin.rpc("best_corridor_for_load", { p_load_id: loadId });
    map.set(loadId, (!error && data) ? String(data) : null);
  }
  return map;
}

serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "POST only" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return jsonResponse({ ok: false, error: "Missing env vars" }, 500);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Auth gate
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (REQUIRE_AUTH) {
    if (!token) return unauthorized("Missing Bearer token");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) return unauthorized("Invalid token");
    const role =
      (userData.user.app_metadata as any)?.role ??
      (userData.user.user_metadata as any)?.role ?? null;
    if (role && !ALLOWED_ROLES.has(String(role))) return unauthorized("Insufficient role");
  }

  // Parse
  let body: BatchBody;
  try { body = await req.json(); }
  catch { return badRequest("Invalid JSON body"); }

  const events = normalizeBody(body);
  if (!events.length) return badRequest("No events provided");
  if (events.length > MAX_BATCH) return badRequest("Batch too large", { max: MAX_BATCH });

  // Validate
  const validationErrors: Array<{ idx: number; errors: string[] }> = [];
  for (let i = 0; i < events.length; i++) {
    const err = validateEvent(events[i], i);
    if (err) validationErrors.push(err);
  }
  if (validationErrors.length) return badRequest("Validation failed", { validationErrors });

  // Corridor resolution: unique load_ids only
  const uniqueLoadIds: string[] = [];
  const seen = new Set<string>();
  for (const e of events) {
    const meta = safeMeta(e.meta);
    const loadId = typeof meta.load_id === "string" ? meta.load_id : null;
    if (!e.corridor_id && loadId && !seen.has(loadId)) {
      seen.add(loadId); uniqueLoadIds.push(loadId);
    }
  }

  const corridorMap = uniqueLoadIds.length
    ? await resolveBestCorridorsByLoadId(supabaseAdmin, uniqueLoadIds)
    : new Map<string, string | null>();

  // Build rows
  const rows: Record<string, unknown>[] = events.map((e) => {
    const meta = safeMeta(e.meta);
    const loadId = typeof meta.load_id === "string" ? meta.load_id : null;
    const corridor_id = e.corridor_id ?? (loadId ? corridorMap.get(loadId) ?? null : null);
    return {
      entity_profile_id: e.entity_profile_id,
      event_type: e.event_type,
      role: e.role ?? null,
      severity: e.severity ?? null,
      verified: e.verified ?? true,
      occurred_at: e.occurred_at ?? new Date().toISOString(),
      corridor_id,
      meta,
      source: (e as any).source ?? null,
      source_event_id: (e as any).source_event_id ?? null,
    };
  });

  // Mode switch
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "fast";

  if (mode === "strict") {
    const { data, error } = await supabaseAdmin.rpc("trust_events_ingest_strict", {
      p_events: { events: rows },
    });
    if (error) return jsonResponse({ ok: false, error: error.message }, 500);
    return jsonResponse({
      ok: true,
      mode: "strict",
      requested: rows.length,
      corridor_resolution: {
        unique_load_ids_seen: uniqueLoadIds.length,
        resolved_corridors: Array.from(corridorMap.values()).filter(Boolean).length,
      },
      strict: data,
    });
  }

  // mode === "fast": chunked inserts
  const inserted: unknown[] = [];
  const insertErrors: Array<{ chunkStart: number; chunkEnd: number; error: string }> = [];

  for (let start = 0; start < rows.length; start += INSERT_CHUNK) {
    const chunk = rows.slice(start, start + INSERT_CHUNK);
    const { data, error } = await supabaseAdmin
      .from("trust_events")
      .insert(chunk)
      .select("id, entity_profile_id, event_type, role, severity, verified, occurred_at, corridor_id");

    if (error) {
      insertErrors.push({
        chunkStart: start,
        chunkEnd: Math.min(start + INSERT_CHUNK - 1, rows.length - 1),
        error: error.message,
      });
      continue;
    }
    if (data?.length) inserted.push(...data);
  }

  return jsonResponse({
    ok: insertErrors.length === 0,
    mode: "fast",
    requested: rows.length,
    inserted: inserted.length,
    corridor_resolution: {
      unique_load_ids_seen: uniqueLoadIds.length,
      resolved_corridors: Array.from(corridorMap.values()).filter(Boolean).length,
    },
    insertErrors,
    trust_events: inserted,
  });
});
