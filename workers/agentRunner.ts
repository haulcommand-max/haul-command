type JsonRecord = Record<string, unknown>;

export interface AgentJobRow {
  id: string;
  agent_name: string;
  job_type: string;
  target_type: string;
  target_id?: string | null;
  input_payload_json?: JsonRecord | null;
  priority?: number | null;
}

export interface CommandTaskInsert {
  title: string;
  description: string;
  status: "todo";
  priority: number;
  domain: string;
  market: string | null;
  target_entity_type: string;
  target_entity_id: string | null;
  requires_proof: boolean;
  revenue_impact_cents: number;
  cost_cents: number;
  result: JsonRecord;
}

export interface AgentQueueResult {
  processed_count: number;
  task_count: number;
  prospect_count: number;
  money_event_count: number;
  failed_count: number;
  failed_job_ids: string[];
}

interface ProcessAgentQueueOptions {
  limit?: number;
  supabase?: SupabaseLike;
}

type SupabaseLike = {
  from(table: string): QueryLike;
};

type QueryLike = {
  select(columns?: string, options?: unknown): QueryLike;
  eq(column: string, value: unknown): QueryLike;
  in?(column: string, values: unknown[]): QueryLike;
  order?(column: string, options?: unknown): QueryLike;
  limit(count: number): QueryLike;
  maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>;
  single(): Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>;
  insert(values: Record<string, unknown>): QueryLike;
  update(values: Record<string, unknown>): QueryLike;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONEY_JOB_TYPES = new Set([
  "money_moves",
  "adgrid_prospect",
  "directory_candidate",
  "data_product_signal",
  "provider_candidate",
]);
const MONEY_EVENT_TYPES = new Set([
  "revenue_earned",
  "revenue_pending",
  "cost_incurred",
  "recovery_sent",
  "recovery_collected",
  "refund_issued",
  "sponsor_payment",
  "data_product_sale",
  "affiliate_commission",
  "claim_conversion",
]);

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asFiniteCents(value: unknown): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? Math.max(0, Math.round(numeric)) : 0;
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asIntegerInRange(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

async function getDefaultSupabase() {
  const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
  return getSupabaseAdmin();
}

export function mapAgentJobPriorityToCommandPriority(priority: unknown): number {
  const numeric = Number(priority ?? 100);
  if (!Number.isFinite(numeric)) return 10;
  if (numeric <= 10) return Math.min(10, Math.max(1, Math.round(numeric)));
  return Math.min(10, Math.max(1, Math.ceil(numeric / 10)));
}

export function buildCommandTaskFromAgentJob(job: AgentJobRow): CommandTaskInsert {
  const payload = asRecord(job.input_payload_json);
  const market =
    asStringOrNull(payload.market) ??
    asStringOrNull(payload.country_code) ??
    asStringOrNull(payload.corridor_slug);

  return {
    title: `${job.agent_name}: ${job.job_type}`,
    description: `Queued from hc_agent_jobs ${job.id} for ${job.target_type}${job.target_id ? ` ${job.target_id}` : ""}.`,
    status: "todo",
    priority: mapAgentJobPriorityToCommandPriority(job.priority),
    domain: job.agent_name,
    market,
    target_entity_type: job.target_type,
    target_entity_id: isUuid(job.target_id) ? job.target_id : null,
    requires_proof: payload.requires_proof === true,
    revenue_impact_cents: asFiniteCents(payload.revenue_impact_cents),
    cost_cents: asFiniteCents(payload.cost_cents),
    result: {
      source: "hc_agent_jobs",
      agent_job_id: job.id,
      input_payload_json: payload,
    },
  };
}

export function isMoneyMoveAgentJob(job: AgentJobRow): boolean {
  return MONEY_JOB_TYPES.has(job.job_type) || MONEY_JOB_TYPES.has(job.target_type);
}

function firstString(payload: JsonRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = asStringOrNull(payload[key]);
    if (value) return value;
  }
  return null;
}

function moneyEventTypeForJob(job: AgentJobRow, payload: JsonRecord): string {
  const requested = asStringOrNull(payload.money_event_type ?? payload.event_type);
  if (requested && MONEY_EVENT_TYPES.has(requested)) return requested;
  if (job.job_type === "data_product_signal") return "data_product_sale";
  if (job.job_type === "directory_candidate" || job.job_type === "provider_candidate") return "claim_conversion";
  if (job.job_type === "adgrid_prospect") return "sponsor_payment";
  return "revenue_pending";
}

function revenueEstimateCents(payload: JsonRecord): number {
  return asFiniteCents(
    payload.revenue_impact_cents ??
      payload.estimated_revenue_cents ??
      payload.amount_cents ??
      payload.expected_value_cents ??
      payload.monthly_value_cents,
  );
}

async function findOrCreateMoneyMoveProspect(supabase: SupabaseLike, job: AgentJobRow) {
  const payload = asRecord(job.input_payload_json);
  const companyName =
    firstString(payload, ["company_name", "company", "business_name", "provider_name", "advertiser_name", "prospect_name"]) ??
    `${job.agent_name} ${job.job_type}`;
  const countryCode = (
    firstString(payload, ["country_code", "country", "market_country"]) ?? "GLOBAL"
  ).toUpperCase();
  const category = firstString(payload, ["category", "role_key", "service_category", "monetization_type"]) ?? job.job_type;
  const contactEmail = firstString(payload, ["contact_email", "email"]);
  const leadScore = asIntegerInRange(
    payload.lead_score ?? payload.confidence_score ?? payload.priority_score,
    70,
    0,
    100,
  );

  let query = supabase
    .from("prospects")
    .select("id")
    .eq("company_name", companyName)
    .eq("country_code", countryCode)
    .limit(1);

  if (contactEmail) query = query.eq("contact_email", contactEmail);

  const { data: existing, error: existingError } = await query.maybeSingle();
  if (existingError) throw new Error(existingError.message ?? "Failed to inspect existing prospect.");
  if (existing?.id) return { id: existing.id as string, created: false };

  const { data: prospect, error: prospectError } = await supabase
    .from("prospects")
    .insert({
      company_name: companyName,
      country_code: countryCode,
      prospect_tier: firstString(payload, ["prospect_tier", "tier"]) ?? "B",
      category,
      industry_segment: firstString(payload, ["industry_segment", "segment", "role_focus"]),
      contact_name: firstString(payload, ["contact_name", "person_name", "owner_name"]),
      contact_email: contactEmail,
      contact_phone: firstString(payload, ["contact_phone", "phone"]),
      website_url: firstString(payload, ["website_url", "website"]),
      lead_score: leadScore,
      lead_status: "new",
      notes: `Created from ${job.job_type} agent job ${job.id}.`,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (prospectError || !prospect?.id) {
    throw new Error(prospectError?.message ?? "Failed to create money-move prospect.");
  }

  return { id: prospect.id as string, created: true };
}

export async function processMoneyMoveAgentJob(supabase: SupabaseLike, job: AgentJobRow) {
  const payload = asRecord(job.input_payload_json);
  const prospect = await findOrCreateMoneyMoveProspect(supabase, job);
  const market =
    firstString(payload, ["market", "market_key", "country_code", "corridor_slug", "region"]) ??
    null;
  const amountCents = revenueEstimateCents(payload);

  const { data: activity, error: activityError } = await supabase
    .from("prospect_activities")
    .insert({
      prospect_id: prospect.id,
      activity_type: "money_move_detected",
      performed_by: job.agent_name,
      notes: `Detected ${job.job_type} from hc_agent_jobs ${job.id}. Next action: ${firstString(payload, ["next_action", "outreach_angle", "offer"]) ?? "review and route"}.`,
    })
    .select("id")
    .single();

  if (activityError || !activity?.id) {
    throw new Error(activityError?.message ?? "Failed to create prospect activity.");
  }

  let moneyEventId: string | null = null;
  if (amountCents > 0) {
    const { data: moneyEvent, error: moneyError } = await supabase
      .from("hc_command_money_events")
      .insert({
        event_type: moneyEventTypeForJob(job, payload),
        amount_cents: amountCents,
        currency: firstString(payload, ["currency"]) ?? "USD",
        entity_type: "prospect",
        entity_id: prospect.id,
        market,
        metadata: {
          source: "hc_agent_jobs",
          agent_job_id: job.id,
          job_type: job.job_type,
          target_type: job.target_type,
          target_id: job.target_id ?? null,
          payload,
        },
      })
      .select("id")
      .single();

    if (moneyError || !moneyEvent?.id) {
      throw new Error(moneyError?.message ?? "Failed to create command money event.");
    }
    moneyEventId = moneyEvent.id as string;
  }

  const taskRow = buildCommandTaskFromAgentJob({
    ...job,
    target_type: "prospect",
    target_id: prospect.id,
    input_payload_json: {
      ...payload,
      market,
      revenue_impact_cents: amountCents,
    },
  });
  taskRow.title = `Money move: ${job.job_type}`;
  taskRow.description = `Review and act on ${job.job_type} prospect created from hc_agent_jobs ${job.id}.`;
  taskRow.domain = "money_moves";
  taskRow.result = {
    ...taskRow.result,
    action: "money_move_records_created",
    prospect_id: prospect.id,
    prospect_created: prospect.created,
    prospect_activity_id: activity.id as string,
    money_event_id: moneyEventId,
  };

  const { data: task, error: taskError } = await supabase
    .from("hc_command_tasks")
    .insert(taskRow)
    .select("id")
    .single();

  if (taskError || !task?.id) {
    throw new Error(taskError?.message ?? "Failed to create money-move command task.");
  }

  return {
    action: "money_move_records_created",
    prospect_id: prospect.id,
    prospect_created: prospect.created,
    prospect_activity_id: activity.id as string,
    money_event_id: moneyEventId,
    command_task_id: task.id as string,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? "Unknown error");
}

export async function processAgentQueue(options: ProcessAgentQueueOptions = {}): Promise<AgentQueueResult> {
  const supabase = options.supabase ?? await getDefaultSupabase();
  const limit = Math.min(Math.max(options.limit ?? 10, 1), 50);

  const { data: jobs, error } = await supabase
    .from("hc_agent_jobs")
    .select("*")
    .eq("status", "queued")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message ?? "Failed to load queued agent jobs.");

  const result: AgentQueueResult = {
    processed_count: 0,
    task_count: 0,
    prospect_count: 0,
    money_event_count: 0,
    failed_count: 0,
    failed_job_ids: [],
  };

  for (const job of (jobs ?? []) as AgentJobRow[]) {
    try {
      const startedAt = new Date().toISOString();
      const { data: claimed, error: claimError } = await supabase
        .from("hc_agent_jobs")
        .update({ status: "running", started_at: startedAt, error_text: null })
        .eq("id", job.id)
        .eq("status", "queued")
        .select("id")
        .maybeSingle();

      if (claimError) throw new Error(claimError.message ?? "Failed to claim agent job.");
      if (!claimed) continue;

      const output = isMoneyMoveAgentJob(job)
        ? await processMoneyMoveAgentJob(supabase, job)
        : null;

      let commandTaskId = output?.command_task_id ?? null;
      if (!output) {
        const taskRow = buildCommandTaskFromAgentJob(job);
        const { data: task, error: taskError } = await supabase
          .from("hc_command_tasks")
          .insert(taskRow)
          .select("id")
          .single();

        if (taskError) throw new Error(taskError.message ?? "Failed to create command task.");
        commandTaskId = task?.id ?? null;
      }

      const { error: completeError } = await supabase
        .from("hc_agent_jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          output_payload_json: {
            action: output?.action ?? "command_task_created",
            command_task_id: commandTaskId,
            ...(output ?? {}),
          },
        })
        .eq("id", job.id);

      if (completeError) throw new Error(completeError.message ?? "Failed to complete agent job.");

      result.processed_count += 1;
      result.task_count += 1;
      if (output?.prospect_created) result.prospect_count += 1;
      if (output?.money_event_id) result.money_event_count += 1;
    } catch (error) {
      result.failed_count += 1;
      result.failed_job_ids.push(job.id);
      await supabase
        .from("hc_agent_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_text: errorMessage(error),
        })
        .eq("id", job.id);
    }
  }

  return result;
}
