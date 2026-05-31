import { getSupabaseAdmin } from "@/lib/supabase/admin";

type MatchCandidate = {
  id?: string | null;
  entity_id?: string | null;
  operator_id?: string | null;
  profile_id?: string | null;
  score?: number | null;
  match_score?: number | null;
  reason?: unknown;
  match_reason?: unknown;
  kind?: string | null;
};

type LoadMatchQueueInput = {
  loadId: string;
  jobId?: string | null;
  corridorSlug?: string | null;
  countryCode?: string | null;
  serviceRequired?: string | null;
  wave?: number | null;
  candidates?: MatchCandidate[] | null;
  source?: string | null;
  edgeStatus?: number | null;
  edgeOk?: boolean | null;
  error?: string | null;
};

type LoadMatchQueueResult = {
  recorded: boolean;
  rowsCreated: number;
  uncoveredAlertCreated: boolean;
  errors: string[];
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const uuidOrNull = (value?: string | null) => {
  if (!value) return null;
  return UUID_RE.test(value) ? value : null;
};

export async function recordLoadMatchQueue(input: LoadMatchQueueInput): Promise<LoadMatchQueueResult> {
  const loadId = uuidOrNull(input.loadId);
  if (!loadId) {
    return {
      recorded: false,
      rowsCreated: 0,
      uncoveredAlertCreated: false,
      errors: ["valid load_id is required"],
    };
  }

  const admin = getSupabaseAdmin();
  const candidates = Array.isArray(input.candidates) ? input.candidates.filter(Boolean) : [];
  const baseReason = {
    job_id: input.jobId || null,
    corridor_slug: input.corridorSlug || null,
    country_code: input.countryCode || null,
    service_required: input.serviceRequired || null,
    wave: input.wave || null,
    source: input.source || "load_dispatch",
    edge_status: input.edgeStatus || null,
    edge_ok: input.edgeOk,
    error: input.error || null,
  };

  const errors: string[] = [];
  let rowsCreated = 0;
  let uncoveredAlertCreated = false;

  if (candidates.length === 0) {
    const { error: queueError } = await admin
      .from("hc_load_matching_queue" as never)
      .insert({
        load_id: loadId,
        candidate_kind: "uncovered_market_gap",
        candidate_entity_id: null,
        match_score: 0,
        match_reason: {
          ...baseReason,
          reason: input.error || "No candidate matches returned by dispatch.",
        },
        notification_sent: false,
        responded: false,
      } as never);

    if (queueError) {
      errors.push(queueError.message);
    } else {
      rowsCreated += 1;
    }

    const { error: alertError } = await admin
      .from("uncovered_load_alerts" as never)
      .upsert({
        load_id: loadId,
        uncovered_since: new Date().toISOString(),
        alert_tier: input.error ? "critical" : "warning",
        notified: false,
      } as never, { onConflict: "load_id" });

    if (alertError) {
      errors.push(alertError.message);
    } else {
      uncoveredAlertCreated = true;
    }
  } else {
    const rows = candidates.slice(0, 25).map((candidate) => {
      const candidateEntityId = uuidOrNull(
        candidate.entity_id || candidate.operator_id || candidate.profile_id || candidate.id || null,
      );
      return {
        load_id: loadId,
        candidate_entity_id: candidateEntityId,
        candidate_kind: candidate.kind || "operator",
        match_score: Number(candidate.match_score ?? candidate.score ?? 50),
        match_reason: {
          ...baseReason,
          candidate,
          candidate_entity_id_missing: !candidateEntityId,
          reason: candidate.match_reason ?? candidate.reason ?? null,
        },
        notification_sent: false,
        responded: false,
      };
    });

    const { error: queueError } = await admin
      .from("hc_load_matching_queue" as never)
      .insert(rows as never);

    if (queueError) {
      errors.push(queueError.message);
    } else {
      rowsCreated += rows.length;
    }
  }

  return {
    recorded: errors.length === 0 && rowsCreated > 0,
    rowsCreated,
    uncoveredAlertCreated,
    errors,
  };
}
