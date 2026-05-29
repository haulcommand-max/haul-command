import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type QueueSupplyAcquisitionOptions = {
  limit?: number;
  dryRun?: boolean;
  queueStates?: string[];
};

type SupplyAcquisitionRow = {
  id: string;
  country_code: string;
  role_key: string;
  tier: string | null;
  current_operators: number | null;
  target_operators: number | null;
  supply_state: string | null;
  priority: number | null;
  hunt_status: string | null;
  planned_source_name: string | null;
  planned_source_url: string | null;
  planned_source_method: string | null;
  planned_priority_tier: string | null;
  planned_entity_estimate: number | null;
  monetization_impact: string | null;
};

const DEFAULT_READY_STATES = ["queued", "ready", "pending", "open"];
const CLOSED_STATES = new Set(["in_progress", "completed", "failed", "blocked", "dismissed"]);

function normalizeLimit(limit: number | undefined) {
  if (!Number.isFinite(limit ?? 0)) return 50;
  return Math.max(1, Math.min(Math.trunc(limit ?? 50), 250));
}

function isQueueable(row: SupplyAcquisitionRow, readyStates: string[]) {
  const status = String(row.hunt_status ?? "").trim().toLowerCase();
  if (!status) return true;
  if (CLOSED_STATES.has(status)) return false;
  return readyStates.includes(status);
}

function buildSupplyTaskPayload(row: SupplyAcquisitionRow) {
  return {
    supply_queue_id: row.id,
    country_code: row.country_code,
    role_key: row.role_key,
    tier: row.tier,
    current_operators: row.current_operators ?? 0,
    target_operators: row.target_operators ?? 0,
    supply_state: row.supply_state,
    planned_source_name: row.planned_source_name,
    planned_source_url: row.planned_source_url,
    planned_source_method: row.planned_source_method,
    planned_priority_tier: row.planned_priority_tier,
    planned_entity_estimate: row.planned_entity_estimate,
    monetization_impact: row.monetization_impact,
  };
}

export async function queueSupplyAcquisitionTasks(options: QueueSupplyAcquisitionOptions = {}) {
  const supabase = getSupabaseAdmin();
  const limit = normalizeLimit(options.limit);
  const readyStates = (options.queueStates?.length ? options.queueStates : DEFAULT_READY_STATES)
    .map((state) => state.trim().toLowerCase())
    .filter(Boolean);

  const { data, error } = await supabase
    .from("hc_supply_acquisition_queue")
    .select(
      "id,country_code,role_key,tier,current_operators,target_operators,supply_state,priority,hunt_status,planned_source_name,planned_source_url,planned_source_method,planned_priority_tier,planned_entity_estimate,monetization_impact",
    )
    .order("priority", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(limit * 3);

  if (error) {
    throw new Error(`Failed to read hc_supply_acquisition_queue: ${error.message}`);
  }

  const candidates = ((data ?? []) as SupplyAcquisitionRow[])
    .filter((row) => isQueueable(row, readyStates))
    .slice(0, limit);

  if (options.dryRun || candidates.length === 0) {
    return {
      ok: true,
      dryRun: Boolean(options.dryRun),
      candidates: candidates.length,
      tasksCreated: 0,
      queuedIds: candidates.map((row) => row.id),
    };
  }

  const taskRows = candidates.map((row) => ({
    title: `Acquire ${row.role_key.replace(/_/g, " ")} supply in ${row.country_code}`,
    description: `Create source-backed directory supply for ${row.role_key} in ${row.country_code}. Current operators: ${row.current_operators ?? 0}; target: ${row.target_operators ?? 0}.`,
    status: "pending",
    priority: row.priority ?? 50,
    domain: "directory",
    market: row.country_code,
    target_entity_type: "role_country_supply",
    requires_proof: true,
    task_type: "supply.acquire",
    agent_slug: "supply-acquisition-worker",
    payload: buildSupplyTaskPayload(row),
    country_code: row.country_code,
    max_attempts: 3,
    run_after: new Date().toISOString(),
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("hc_command_tasks")
    .insert(taskRows)
    .select("id");

  if (insertError) {
    throw new Error(`Failed to create supply acquisition command tasks: ${insertError.message}`);
  }

  const queuedIds = candidates.map((row) => row.id);
  const { error: updateError } = await supabase
    .from("hc_supply_acquisition_queue")
    .update({ hunt_status: "queued", last_hunted_at: new Date().toISOString() })
    .in("id", queuedIds);

  if (updateError) {
    throw new Error(`Created tasks but failed to mark queue rows queued: ${updateError.message}`);
  }

  return {
    ok: true,
    dryRun: false,
    candidates: candidates.length,
    tasksCreated: inserted?.length ?? taskRows.length,
    queuedIds,
  };
}

export async function getSupplyAcquisitionQueueSummary() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("hc_supply_acquisition_queue")
    .select("hunt_status, priority, country_code, role_key")
    .order("priority", { ascending: false, nullsFirst: false })
    .limit(500);

  if (error) {
    throw new Error(`Failed to summarize hc_supply_acquisition_queue: ${error.message}`);
  }

  const rows = data ?? [];
  const byStatus = rows.reduce<Record<string, number>>((acc, row: any) => {
    const key = row.hunt_status || "unqueued";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return {
    sampled: rows.length,
    byStatus,
    top: rows.slice(0, 10),
  };
}
