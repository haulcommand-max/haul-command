import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import {
  evaluateSkillInvocation,
  resolveSkillOrError,
  type AgentSkillPolicyRecord,
  type AgentSkillRiskLevel,
} from "./policy.ts";

type RouterRequest = {
  skill_key?: string;
  input?: unknown;
  idempotency_key?: string;
  request_id?: string;
  caller_agent_key?: string;
  caller_role?: string;
  approval_id?: string;
};

type InvocationLog = {
  id?: string;
  skill_key: string;
  function_slug: string;
  caller_user_id: string | null;
  caller_agent_key: string | null;
  caller_role: string | null;
  risk_level: AgentSkillRiskLevel | null;
  request_id: string;
  idempotency_key: string | null;
  input_hash: string | null;
  status: "started" | "succeeded" | "failed";
  error_code?: string | null;
  error_message?: string | null;
  duration_ms?: number | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-agent-skill-secret, x-idempotency-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(
  status: number,
  requestId: string,
  skillKey: string,
  code: string,
  message: string,
) {
  return json(status, {
    ok: false,
    request_id: requestId,
    skill_key: skillKey,
    error: { code, message },
  });
}

async function sha256(input: unknown) {
  const encoded = new TextEncoder().encode(JSON.stringify(input ?? null));
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function bearerToken(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice("bearer ".length).trim();
}

async function logInvocation(
  supabase: ReturnType<typeof createClient>,
  log: InvocationLog,
) {
  if (log.id) {
    const { error } = await supabase
      .from("hc_agent_skill_invocations")
      .update({
        status: log.status,
        error_code: log.error_code ?? null,
        error_message: log.error_message ?? null,
        duration_ms: log.duration_ms ?? null,
      })
      .eq("id", log.id);

    if (error) console.error("[agent-skill-router] invocation update failed", error);
    return log.id;
  }

  const { data, error } = await supabase
    .from("hc_agent_skill_invocations")
    .insert(log)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[agent-skill-router] invocation insert failed", error);
    return null;
  }

  return data?.id ?? null;
}

async function getApprovalStatus(
  supabase: ReturnType<typeof createClient>,
  approvalId: string | undefined,
  skillKey: string,
) {
  if (!approvalId) return null;

  const { data, error } = await supabase
    .from("hc_agent_skill_approvals")
    .select("status, expires_at")
    .eq("id", approvalId)
    .eq("skill_key", skillKey)
    .maybeSingle();

  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return "expired";
  return data.status as "approved" | "pending" | "rejected" | "expired";
}

async function isRateLimited(
  supabase: ReturnType<typeof createClient>,
  skillKey: string,
  body: RouterRequest,
  userId: string | null,
  limit: number,
) {
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  let query = supabase
    .from("hc_agent_skill_invocations")
    .select("id", { count: "exact", head: true })
    .eq("skill_key", skillKey)
    .gte("created_at", oneMinuteAgo);

  if (userId) {
    query = query.eq("caller_user_id", userId);
  } else if (body.caller_agent_key) {
    query = query.eq("caller_agent_key", body.caller_agent_key);
  } else {
    query = query.eq("caller_role", body.caller_role ?? "unknown");
  }

  const { count, error } = await query;

  if (error) {
    console.error("[agent-skill-router] rate-limit query failed", error);
    return false;
  }

  return (count ?? 0) >= limit;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return errorResponse(405, "req_unsupported_method", "unknown", "METHOD_NOT_ALLOWED", "Use POST.");
  }

  const startedAt = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const internalSecret = Deno.env.get("AGENT_SKILL_INTERNAL_SECRET");

  if (!supabaseUrl || !serviceRoleKey) {
    return errorResponse(
      500,
      "req_missing_env",
      "unknown",
      "ROUTER_MISCONFIGURED",
      "Missing Supabase router environment variables.",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  let body: RouterRequest;
  try {
    body = (await req.json()) as RouterRequest;
  } catch {
    return errorResponse(400, "req_invalid_json", "unknown", "INVALID_JSON", "Request body must be JSON.");
  }

  const requestId = body.request_id || crypto.randomUUID();
  const skillKey = body.skill_key?.trim() || "unknown";
  const inputHash = await sha256(body.input ?? {});
  const token = bearerToken(req);
  const providedInternalSecret = req.headers.get("x-agent-skill-secret");
  const hasInternalSecret =
    !!internalSecret && !!providedInternalSecret && providedInternalSecret === internalSecret;

  let callerUserId: string | null = null;
  if (token) {
    const authClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data } = await authClient.auth.getUser(token);
    callerUserId = data.user?.id ?? null;
  }

  if (!callerUserId && !hasInternalSecret) {
    await logInvocation(supabase, {
      skill_key: skillKey,
      function_slug: "unknown",
      caller_user_id: null,
      caller_agent_key: body.caller_agent_key ?? null,
      caller_role: body.caller_role ?? null,
      risk_level: null,
      request_id: requestId,
      idempotency_key: body.idempotency_key ?? null,
      input_hash: inputHash,
      status: "failed",
      error_code: "AUTH_REQUIRED",
      error_message: "JWT or internal worker secret is required.",
      duration_ms: Date.now() - startedAt,
    });
    return errorResponse(401, requestId, skillKey, "AUTH_REQUIRED", "JWT or internal worker secret is required.");
  }

  const { data: skill, error: skillError } = await supabase
    .from("hc_agent_skills")
    .select(
      "skill_key, enabled, agent_callable, requires_human_approval, requires_idempotency_key, allowed_agent_roles, risk_level, function_slug, rate_limit_per_minute",
    )
    .eq("skill_key", skillKey)
    .maybeSingle();

  if (skillError) {
    await logInvocation(supabase, {
      skill_key: skillKey,
      function_slug: "unknown",
      caller_user_id: callerUserId,
      caller_agent_key: body.caller_agent_key ?? null,
      caller_role: body.caller_role ?? null,
      risk_level: null,
      request_id: requestId,
      idempotency_key: body.idempotency_key ?? null,
      input_hash: inputHash,
      status: "failed",
      error_code: "SKILL_LOOKUP_FAILED",
      error_message: skillError.message,
      duration_ms: Date.now() - startedAt,
    });
    return errorResponse(500, requestId, skillKey, "SKILL_LOOKUP_FAILED", "Skill metadata lookup failed.");
  }

  const resolved = resolveSkillOrError(skill as AgentSkillPolicyRecord | null);
  if (!resolved.ok) {
    await logInvocation(supabase, {
      skill_key: skillKey,
      function_slug: "unknown",
      caller_user_id: callerUserId,
      caller_agent_key: body.caller_agent_key ?? null,
      caller_role: body.caller_role ?? null,
      risk_level: null,
      request_id: requestId,
      idempotency_key: body.idempotency_key ?? null,
      input_hash: inputHash,
      status: "failed",
      error_code: resolved.code,
      error_message: resolved.message,
      duration_ms: Date.now() - startedAt,
    });
    return errorResponse(404, requestId, skillKey, resolved.code, resolved.message);
  }

  const skillRecord = skill as AgentSkillPolicyRecord & {
    function_slug: string;
    rate_limit_per_minute: number;
  };
  const approvalStatus = await getApprovalStatus(supabase, body.approval_id, skillKey);
  const policyResult = evaluateSkillInvocation(skillRecord, {
    caller_role: body.caller_role ?? null,
    idempotency_key: body.idempotency_key ?? req.headers.get("x-idempotency-key"),
    approval_status: approvalStatus,
  });

  if (!policyResult.ok) {
    await logInvocation(supabase, {
      skill_key: skillKey,
      function_slug: skillRecord.function_slug,
      caller_user_id: callerUserId,
      caller_agent_key: body.caller_agent_key ?? null,
      caller_role: body.caller_role ?? null,
      risk_level: skillRecord.risk_level,
      request_id: requestId,
      idempotency_key: body.idempotency_key ?? req.headers.get("x-idempotency-key"),
      input_hash: inputHash,
      status: "failed",
      error_code: policyResult.code,
      error_message: policyResult.message,
      duration_ms: Date.now() - startedAt,
    });
    const status = policyResult.code === "APPROVAL_REQUIRED" ? 409 : 403;
    return errorResponse(status, requestId, skillKey, policyResult.code, policyResult.message);
  }

  const limited = await isRateLimited(
    supabase,
    skillKey,
    body,
    callerUserId,
    skillRecord.rate_limit_per_minute,
  );

  if (limited) {
    await logInvocation(supabase, {
      skill_key: skillKey,
      function_slug: skillRecord.function_slug,
      caller_user_id: callerUserId,
      caller_agent_key: body.caller_agent_key ?? null,
      caller_role: body.caller_role ?? null,
      risk_level: skillRecord.risk_level,
      request_id: requestId,
      idempotency_key: body.idempotency_key ?? req.headers.get("x-idempotency-key"),
      input_hash: inputHash,
      status: "failed",
      error_code: "RATE_LIMITED",
      error_message: "Skill invocation rate limit exceeded.",
      duration_ms: Date.now() - startedAt,
    });
    return errorResponse(429, requestId, skillKey, "RATE_LIMITED", "Skill invocation rate limit exceeded.");
  }

  const invocationId = await logInvocation(supabase, {
    skill_key: skillKey,
    function_slug: skillRecord.function_slug,
    caller_user_id: callerUserId,
    caller_agent_key: body.caller_agent_key ?? null,
    caller_role: body.caller_role ?? null,
    risk_level: skillRecord.risk_level,
    request_id: requestId,
    idempotency_key: body.idempotency_key ?? req.headers.get("x-idempotency-key"),
    input_hash: inputHash,
    status: "started",
  });

  try {
    const upstream = await fetch(`${supabaseUrl}/functions/v1/${skillRecord.function_slug}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        "x-agent-skill-router": "true",
        "x-request-id": requestId,
        "x-idempotency-key": body.idempotency_key ?? req.headers.get("x-idempotency-key") ?? "",
      },
      body: JSON.stringify(body.input ?? {}),
    });

    const text = await upstream.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!upstream.ok) {
      await logInvocation(supabase, {
        id: invocationId ?? undefined,
        skill_key: skillKey,
        function_slug: skillRecord.function_slug,
        caller_user_id: callerUserId,
        caller_agent_key: body.caller_agent_key ?? null,
        caller_role: body.caller_role ?? null,
        risk_level: skillRecord.risk_level,
        request_id: requestId,
        idempotency_key: body.idempotency_key ?? req.headers.get("x-idempotency-key"),
        input_hash: inputHash,
        status: "failed",
        error_code: "UPSTREAM_FAILED",
        error_message: `Underlying function returned ${upstream.status}.`,
        duration_ms: Date.now() - startedAt,
      });
      return json(upstream.status, {
        ok: false,
        request_id: requestId,
        skill_key: skillKey,
        error: {
          code: "UPSTREAM_FAILED",
          message: `Underlying function returned ${upstream.status}.`,
        },
        data,
      });
    }

    await logInvocation(supabase, {
      id: invocationId ?? undefined,
      skill_key: skillKey,
      function_slug: skillRecord.function_slug,
      caller_user_id: callerUserId,
      caller_agent_key: body.caller_agent_key ?? null,
      caller_role: body.caller_role ?? null,
      risk_level: skillRecord.risk_level,
      request_id: requestId,
      idempotency_key: body.idempotency_key ?? req.headers.get("x-idempotency-key"),
      input_hash: inputHash,
      status: "succeeded",
      duration_ms: Date.now() - startedAt,
    });

    return json(200, {
      ok: true,
      request_id: requestId,
      skill_key: skillKey,
      data,
      warnings: [],
      next_actions: [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected router failure.";
    await logInvocation(supabase, {
      id: invocationId ?? undefined,
      skill_key: skillKey,
      function_slug: skillRecord.function_slug,
      caller_user_id: callerUserId,
      caller_agent_key: body.caller_agent_key ?? null,
      caller_role: body.caller_role ?? null,
      risk_level: skillRecord.risk_level,
      request_id: requestId,
      idempotency_key: body.idempotency_key ?? req.headers.get("x-idempotency-key"),
      input_hash: inputHash,
      status: "failed",
      error_code: "ROUTER_EXCEPTION",
      error_message: message,
      duration_ms: Date.now() - startedAt,
    });
    return errorResponse(500, requestId, skillKey, "ROUTER_EXCEPTION", message);
  }
});
