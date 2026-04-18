// supabase/functions/_shared/command-heartbeat.ts
// =====================================================================
// Universal Command Layer Heartbeat for Deno Edge Functions
//
// Provides the same protocol as lib/command-heartbeat.ts but works in
// the Supabase Edge Function Deno runtime. Every edge function imports
// this to report its work to the Command Layer.
//
// Usage:
//   import { withCommandHeartbeat } from "../_shared/command-heartbeat.ts";
//   
//   serve(async (req) => {
//     return withCommandHeartbeat("ad-decision-engine", req, async (ctx) => {
//       // ... do work ...
//       ctx.setMetrics({ ads_scored: 42, fraud_blocked: 3 });
//       ctx.logMoney("revenue", 15000, "ad_impression");
//       return { ok: true };
//     });
//   });
// =====================================================================

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface HeartbeatContext {
  supabase: SupabaseClient;
  agentId: string | null;
  runId: string | null;
  setMetrics: (metrics: Record<string, unknown>) => void;
  logMoney: (type: "revenue" | "cost", amountCents: number, source: string, market?: string) => Promise<void>;
}

export async function withCommandHeartbeat(
  agentSlug: string,
  req: Request,
  handler: (ctx: HeartbeatContext) => Promise<Record<string, unknown>>
): Promise<Response> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const startTime = Date.now();

  let agentId: string | null = null;
  let runId: string | null = null;
  let metrics: Record<string, unknown> = {};

  // Resolve agent
  try {
    const { data: agent } = await supabase
      .from("hc_command_agents")
      .select("id, budget_limit_cents, budget_spent_cents, status")
      .eq("slug", agentSlug)
      .single();

    if (agent) {
      agentId = agent.id;

      // Budget check
      if (agent.budget_limit_cents && agent.budget_spent_cents >= agent.budget_limit_cents) {
        return new Response(JSON.stringify({
          error: "budget_exceeded",
          agent: agentSlug,
          budget_limit: agent.budget_limit_cents,
          budget_spent: agent.budget_spent_cents,
        }), { status: 429, headers: { "Content-Type": "application/json" } });
      }

      // Pause check
      if (agent.status === "paused") {
        return new Response(JSON.stringify({
          error: "agent_paused",
          agent: agentSlug,
        }), { status: 503, headers: { "Content-Type": "application/json" } });
      }

      // Create run record
      const { data: run } = await supabase
        .from("hc_command_runs")
        .insert({
          agent_id: agentId,
          status: "running",
          started_at: new Date().toISOString(),
          trigger: "edge_function",
        })
        .select("id")
        .single();

      runId = run?.id ?? null;

      // Update agent heartbeat
      await supabase
        .from("hc_command_agents")
        .update({ last_heartbeat: new Date().toISOString(), health: "healthy" })
        .eq("id", agentId);
    }
  } catch (err) {
    console.warn(`[Heartbeat] Agent resolution failed for ${agentSlug}:`, err);
  }

  const ctx: HeartbeatContext = {
    supabase,
    agentId,
    runId,
    setMetrics: (m) => { metrics = { ...metrics, ...m }; },
    logMoney: async (type, amountCents, source, market) => {
      if (!agentId) return;
      await supabase.from("hc_command_money_events").insert({
        agent_id: agentId,
        run_id: runId,
        event_type: type,
        amount_cents: amountCents,
        currency: "usd",
        source,
        market: market ?? "US",
      });
    },
  };

  try {
    const result = await handler(ctx);
    const durationMs = Date.now() - startTime;

    // Complete the run
    if (runId) {
      await supabase
        .from("hc_command_runs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          result: { ...result, ...metrics },
          duration_ms: durationMs,
          entities_processed: (metrics.entities_processed as number) || 0,
          pages_published: (metrics.pages_published as number) || 0,
        })
        .eq("id", runId);
    }

    // Update agent health
    if (agentId) {
      await supabase
        .from("hc_command_agents")
        .update({ last_heartbeat: new Date().toISOString(), health: "healthy" })
        .eq("id", agentId);
    }

    return new Response(JSON.stringify({
      ok: true,
      command_layer: { agent: agentSlug, run_id: runId, duration_ms: durationMs },
      ...result,
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    const durationMs = Date.now() - startTime;

    // Record failure
    if (runId) {
      await supabase
        .from("hc_command_runs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error: String(err),
          duration_ms: durationMs,
          result: metrics,
        })
        .eq("id", runId);
    }

    if (agentId) {
      await supabase
        .from("hc_command_agents")
        .update({ last_heartbeat: new Date().toISOString(), health: "degraded" })
        .eq("id", agentId);
    }

    return new Response(JSON.stringify({
      error: String(err),
      command_layer: { agent: agentSlug, run_id: runId, status: "failed", duration_ms: durationMs },
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
