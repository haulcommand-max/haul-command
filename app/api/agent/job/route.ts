import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { processAgentQueue } from "@/workers/agentRunner";
import {
  buildWorkerContext,
  workerQueued,
  workerFailed,
} from "@/workers/_shared/types";

const WORKER_NAME = "agent_job_runner";

export async function POST(request: NextRequest) {
  const request_id =
    request.headers.get("x-request-id") ?? crypto.randomUUID();
  const actor =
    request.headers.get("x-actor") ??
    request.headers.get("x-user-id") ??
    "system";
  const ctx = buildWorkerContext(request_id, actor, WORKER_NAME);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    const result = workerFailed(ctx, "INVALID_JSON", "Request body is not valid JSON.");
    return NextResponse.json(result, { status: 400 });
  }

  const { job_type, payload, agent_name, target_type, target_id, priority } =
    body as Record<string, unknown>;

  // Accept both spec shape (job_type+payload+actor) and legacy shape
  const resolved_agent = (agent_name as string) ?? (payload as Record<string,unknown>)?.agent_name;
  const resolved_target_type = (target_type as string) ?? (payload as Record<string,unknown>)?.target_type;
  const resolved_target_id = (target_id as string) ?? (payload as Record<string,unknown>)?.target_id;

  if (!resolved_agent || !job_type || !resolved_target_type || !resolved_target_id) {
    const result = workerFailed(
      ctx,
      "MISSING_REQUIRED_FIELDS",
      "Required: agent_name (or payload.agent_name), job_type, target_type, target_id.",
    );
    return NextResponse.json(result, { status: 400 });
  }

  const { data: job, error } = await supabaseAdmin
    .from("hc_agent_jobs")
    .insert({
      agent_name: resolved_agent,
      job_type: job_type as string,
      target_type: resolved_target_type,
      target_id: resolved_target_id,
      input_payload_json: (payload as Record<string, unknown>) ?? {},
      status: "queued",
      priority: (priority as number) ?? 100,
    })
    .select("*")
    .single();

  if (error || !job) {
    const result = workerFailed(ctx, "QUEUE_INSERT_FAILED", error?.message ?? "Failed to insert job.");
    return NextResponse.json(result, { status: 500 });
  }

  // Fire-and-forget: trigger queue processing without blocking response
  processAgentQueue().catch((e) =>
    console.error(JSON.stringify({ level: "error", worker_name: WORKER_NAME, request_id, error: e?.message })),
  );

  const result = workerQueued(ctx, {
    job_id: job.id as string,
    message: `Agent job queued: ${resolved_agent}/${job_type}`,
  });
  return NextResponse.json(result, { status: 202 });
}
