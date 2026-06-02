import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MAX_SOURCE_ROWS = 5000;
const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type QueryResult<T> = {
  data: T[] | null;
  error?: { message?: string } | null;
  count?: number | null;
};

type ClaimStatusRow = {
  id?: string | null;
  status?: string | null;
  claim_status?: string | null;
  country_code?: string | null;
  surface_type?: string | null;
  claim_priority_score?: number | string | null;
  pressure_stage?: number | string | null;
  priority_score?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  sent_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  verified_at?: string | null;
  action?: string | null;
  enabled?: boolean | null;
  contact_type?: string | null;
  reason?: string | null;
  completion_percent?: number | string | null;
  wizard_step?: string | null;
  place_id?: string | null;
};

type ClaimKpiRow = {
  country_code: string | null;
  surface_type: string | null;
  total_surfaces: number | string | null;
  claimed: number | string | null;
  claimable: number | string | null;
  pending: number | string | null;
  claimed_pct: number | string | null;
  avg_priority_score: number | string | null;
  tier_a_count: number | string | null;
  tier_b_count: number | string | null;
};

export type ClaimsOpsTableHealth = {
  table: string;
  label: string;
  total: number;
  statusCounts: Record<string, number>;
  error?: string;
  note?: string;
};

export type ClaimsOpsReadModel = {
  asOf: string;
  sourceTables: string[];
  tables: ClaimsOpsTableHealth[];
  totals: {
    surfacesVisible: number;
    claimableSurfaces: number;
    claimedSurfaces: number;
    pendingSurfaceClaims: number;
    pendingDirectoryRequests: number;
    pendingLegacyClaims: number;
    activeClaimSessions: number;
    openPressureTargets: number;
    pausedGovernorRules: number;
    outreachQueued: number;
    outreachSentLast7d: number;
    suppressionRules: number;
    auditEventsLast7d: number;
    countriesWithKpis: number;
    coveragePct: number;
  };
  topCountries: Array<{
    countryCode: string;
    surfaceType: string;
    total: number;
    claimed: number;
    claimable: number;
    pending: number;
    coveragePct: number;
    avgPriorityScore: number | null;
    tierAB: number;
  }>;
  pressure: {
    stagedTargets: Record<string, number>;
    topOpenPriorityScore: number | null;
  };
  guardrails: string[];
  activationGaps: string[];
};

const CLAIM_SOURCE_TABLES = [
  "surfaces",
  "claims",
  "claim_kpi_summary",
  "hc_claim_requests",
  "listing_claims",
  "hc_claim_sessions",
  "hc_claim_pressure_state",
  "hc_claim_pressure_targets",
  "outreach_events",
  "claim_governor",
  "outreach_suppressions",
  "claim_audit_log",
] as const;

const PENDING_STATUSES = new Set(["pending", "pending_verification", "initiated", "otp_sent", "claim_started", "manual_review"]);
const CLAIMED_SURFACE_STATUSES = new Set(["claimed", "verified", "approved"]);
const CLAIMABLE_SURFACE_STATUSES = new Set(["claimable", "unclaimed"]);
const OPEN_PRESSURE_STATUSES = new Set(["open", "queued", "active"]);
const ACTIVE_SESSION_STATUSES = new Set(["claim_started", "identity_verification", "in_progress", "pending_review"]);

export async function getClaimsOpsReadModel(): Promise<ClaimsOpsReadModel> {
  const asOf = new Date().toISOString();
  const recentSinceMs = Date.now() - RECENT_WINDOW_MS;

  const [
    surfaces,
    claims,
    kpis,
    directoryRequests,
    legacyClaims,
    claimSessions,
    pressureState,
    pressureTargets,
    outreach,
    governor,
    suppressions,
    audit,
  ] = await Promise.all([
    readRows("surfaces", "id,country_code,surface_type,claim_status,claim_priority_score,created_at,updated_at", "updated_at"),
    readRows("claims", "id,country_code,status,created_at,updated_at,approved_at,rejected_at,verification_route", "created_at"),
    readRows("claim_kpi_summary", "country_code,surface_type,total_surfaces,claimed,claimable,pending,claimed_pct,avg_priority_score,tier_a_count,tier_b_count", "total_surfaces"),
    readRows("hc_claim_requests", "id,status,place_id,created_at", "created_at"),
    readRows("listing_claims", "id,claim_status,created_at,verified_at", "created_at"),
    readRows("hc_claim_sessions", "id,claim_status,started_at,completed_at,completion_percent,wizard_step", "started_at"),
    readRows("hc_claim_pressure_state", "entity_id,country_code,pressure_stage,claim_status,last_nudge_at,nudge_count,updated_at", "updated_at"),
    readRows("hc_claim_pressure_targets", "id,country_code,status,priority_score,updated_at", "priority_score"),
    readRows("outreach_events", "id,status,channel,created_at,sent_at,replied_at", "created_at"),
    readRows("claim_governor", "id,enabled,updated_at", "updated_at"),
    readRows("outreach_suppressions", "id,contact_type,reason,created_at", "created_at"),
    readRows("claim_audit_log", "id,action,created_at", "created_at"),
  ]);

  const tableHealth: ClaimsOpsTableHealth[] = [
    health("surfaces", "Claimable surface spine", surfaces, "claim_status"),
    health("claims", "Canonical claim requests", claims),
    health("claim_kpi_summary", "Claim KPI rollup view", kpis, undefined, "Aggregate view; not a lifecycle table."),
    health("hc_claim_requests", "Moderated directory claims", directoryRequests, undefined, "PII evidence intentionally excluded from this admin read model."),
    health("listing_claims", "Legacy token claims", legacyClaims, "claim_status"),
    health("hc_claim_sessions", "Entity claim wizard sessions", claimSessions, "claim_status"),
    health("hc_claim_pressure_state", "Claim pressure state", pressureState, "claim_status"),
    health("hc_claim_pressure_targets", "Open pressure targets", pressureTargets),
    health("outreach_events", "Claim outreach events", outreach),
    health("claim_governor", "Outreach governor", governor, undefined, "Governor values intentionally excluded."),
    health("outreach_suppressions", "Outreach suppressions", suppressions, undefined, "Contact values intentionally excluded."),
    health("claim_audit_log", "Claim audit log", audit, "action"),
  ];

  const kpiRows = rows<ClaimKpiRow>(kpis);
  const surfaceRows = rows<ClaimStatusRow>(surfaces);
  const directoryRows = rows<ClaimStatusRow>(directoryRequests);
  const legacyRows = rows<ClaimStatusRow>(legacyClaims);
  const sessionRows = rows<ClaimStatusRow>(claimSessions);
  const pressureTargetRows = rows<ClaimStatusRow>(pressureTargets);
  const pressureRows = rows<ClaimStatusRow>(pressureState);
  const outreachRows = rows<ClaimStatusRow>(outreach);
  const governorRows = rows<ClaimStatusRow>(governor);
  const auditRows = rows<ClaimStatusRow>(audit);
  const suppressionRows = rows<ClaimStatusRow>(suppressions);

  const totalsFromKpis = aggregateKpis(kpiRows);
  const claimableSurfaces = totalsFromKpis.total > 0
    ? totalsFromKpis.claimable
    : surfaceRows.filter((row) => CLAIMABLE_SURFACE_STATUSES.has(row.claim_status ?? "")).length;
  const claimedSurfaces = totalsFromKpis.total > 0
    ? totalsFromKpis.claimed
    : surfaceRows.filter((row) => CLAIMED_SURFACE_STATUSES.has(row.claim_status ?? "")).length;
  const pendingSurfaceClaims = totalsFromKpis.total > 0
    ? totalsFromKpis.pending
    : surfaceRows.filter((row) => PENDING_STATUSES.has(row.claim_status ?? "")).length;

  const pendingDirectoryRequests = directoryRows.filter((row) => isPending(row.status)).length;
  const openPressureTargets = pressureTargetRows.filter((row) => OPEN_PRESSURE_STATUSES.has(row.status ?? "")).length;

  return {
    asOf,
    sourceTables: [...CLAIM_SOURCE_TABLES],
    tables: tableHealth,
    totals: {
      surfacesVisible: surfaces.count ?? 0,
      claimableSurfaces,
      claimedSurfaces,
      pendingSurfaceClaims,
      pendingDirectoryRequests,
      pendingLegacyClaims: legacyRows.filter((row) => isPending(row.claim_status)).length,
      activeClaimSessions: sessionRows.filter((row) => ACTIVE_SESSION_STATUSES.has(row.claim_status ?? "")).length,
      openPressureTargets,
      pausedGovernorRules: governorRows.filter((row) => row.enabled && isPauseRule(row.id)).length,
      outreachQueued: outreachRows.filter((row) => row.status === "queued").length,
      outreachSentLast7d: outreachRows.filter((row) => isRecent(row.sent_at ?? row.created_at, recentSinceMs)).length,
      suppressionRules: suppressionRows.length,
      auditEventsLast7d: auditRows.filter((row) => isRecent(row.created_at, recentSinceMs)).length,
      countriesWithKpis: new Set(kpiRows.map((row) => row.country_code).filter(Boolean)).size,
      coveragePct: totalsFromKpis.total ? round((totalsFromKpis.claimed / totalsFromKpis.total) * 100, 1) : 0,
    },
    topCountries: kpiRows
      .map((row) => ({
        countryCode: row.country_code ?? "unknown",
        surfaceType: row.surface_type ?? "unknown",
        total: asNumber(row.total_surfaces) ?? 0,
        claimed: asNumber(row.claimed) ?? 0,
        claimable: asNumber(row.claimable) ?? 0,
        pending: asNumber(row.pending) ?? 0,
        coveragePct: asNumber(row.claimed_pct) ?? 0,
        avgPriorityScore: asNumber(row.avg_priority_score),
        tierAB: (asNumber(row.tier_a_count) ?? 0) + (asNumber(row.tier_b_count) ?? 0),
      }))
      .sort((a, b) => (b.claimable + b.tierAB) - (a.claimable + a.tierAB))
      .slice(0, 10),
    pressure: {
      stagedTargets: countBy(pressureRows, (row) => String(row.pressure_stage ?? "unknown")),
      topOpenPriorityScore: maxNumber(pressureTargetRows.map((row) => asNumber(row.priority_score))),
    },
    guardrails: buildGuardrails(governorRows, suppressionRows, pressureTargets.error, directoryRequests.error),
    activationGaps: buildActivationGaps({
      tables: tableHealth,
      surfaces,
      claims,
      directoryRequests,
      claimSessions,
      pressureTargets,
      outreach,
      claimableSurfaces,
      pendingDirectoryRequests,
      openPressureTargets,
    }),
  };
}

async function readRows(table: string, select: string, orderColumn: string, limit = MAX_SOURCE_ROWS): Promise<QueryResult<ClaimStatusRow | ClaimKpiRow>> {
  const supabase = getSupabaseAdmin();
  const { data, error, count } = await supabase
    .from(table)
    .select(select, { count: "exact" })
    .order(orderColumn, { ascending: false })
    .limit(limit);

  return {
    data: data ?? [],
    error,
    count: count ?? (data?.length ?? 0),
  };
}

function health(
  table: string,
  label: string,
  result: QueryResult<ClaimStatusRow | ClaimKpiRow>,
  statusField: "status" | "claim_status" | "action" | undefined = "status",
  note?: string,
): ClaimsOpsTableHealth {
  return {
    table,
    label,
    total: result.count ?? 0,
    statusCounts: statusField ? countBy(rows<ClaimStatusRow>(result), (row) => String(row[statusField] ?? "unknown")) : {},
    error: result.error?.message ? "Unreadable" : undefined,
    note,
  };
}

function aggregateKpis(kpiRows: ClaimKpiRow[]) {
  return kpiRows.reduce(
    (acc, row) => {
      acc.total += asNumber(row.total_surfaces) ?? 0;
      acc.claimed += asNumber(row.claimed) ?? 0;
      acc.claimable += asNumber(row.claimable) ?? 0;
      acc.pending += asNumber(row.pending) ?? 0;
      return acc;
    },
    { total: 0, claimed: 0, claimable: 0, pending: 0 },
  );
}

function buildActivationGaps(input: {
  tables: ClaimsOpsTableHealth[];
  surfaces: QueryResult<ClaimStatusRow | ClaimKpiRow>;
  claims: QueryResult<ClaimStatusRow | ClaimKpiRow>;
  directoryRequests: QueryResult<ClaimStatusRow | ClaimKpiRow>;
  claimSessions: QueryResult<ClaimStatusRow | ClaimKpiRow>;
  pressureTargets: QueryResult<ClaimStatusRow | ClaimKpiRow>;
  outreach: QueryResult<ClaimStatusRow | ClaimKpiRow>;
  claimableSurfaces: number;
  pendingDirectoryRequests: number;
  openPressureTargets: number;
}) {
  const gaps: string[] = [];
  for (const table of input.tables) {
    if (table.error) gaps.push(`${table.table} is not readable by the Claims Ops read model.`);
  }
  if (!input.surfaces.error?.message && input.claimableSurfaces > 0 && !input.claims.error?.message && input.claims.count === 0) {
    gaps.push("Claimable surfaces exist, but canonical claims has no visible lifecycle rows.");
  }
  if (!input.directoryRequests.error?.message && input.pendingDirectoryRequests > 0) {
    gaps.push("Moderated directory claim requests are pending review.");
  }
  if (!input.claimSessions.error?.message && input.claimSessions.count === 0) {
    gaps.push("No hc_claim_sessions rows are visible for the entity claim wizard.");
  }
  if (!input.pressureTargets.error?.message && input.openPressureTargets === 0) {
    gaps.push("No open hc_claim_pressure_targets are visible for claim-priority follow-up.");
  }
  if (!input.outreach.error?.message && input.outreach.count === 0) {
    gaps.push("No outreach_events rows are visible; claim outreach is not producing trackable outcomes yet.");
  }
  return gaps;
}

function buildGuardrails(governorRows: ClaimStatusRow[], suppressionRows: ClaimStatusRow[], pressureTargetError?: { message?: string } | null, directoryRequestError?: { message?: string } | null) {
  const guardrails = [
    "Dashboard is read-only and server-side; it does not approve, reject, or message claimants.",
    "hc_claim_requests evidence/contact payloads are not selected or rendered.",
    "outreach_suppressions contact values and claim_governor JSON values are intentionally excluded.",
  ];
  if (governorRows.some((row) => row.enabled && isPauseRule(row.id))) {
    guardrails.push("One or more claim/outreach pause rules are enabled.");
  }
  if (suppressionRows.length > 0) {
    guardrails.push(`${suppressionRows.length.toLocaleString()} outreach suppressions are visible and must be respected by workers.`);
  }
  if (pressureTargetError?.message) {
    guardrails.push("Pressure targets are treated as unverified until hc_claim_pressure_targets is readable.");
  }
  if (directoryRequestError?.message) {
    guardrails.push("Directory claim moderation is protected by RLS/service-role boundaries.");
  }
  return guardrails;
}

function rows<T>(result: QueryResult<unknown>): T[] {
  return Array.isArray(result.data) ? (result.data as T[]) : [];
}

function countBy<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function isPending(status?: string | null) {
  return PENDING_STATUSES.has(status ?? "");
}

function isPauseRule(id?: string | null) {
  return (id ?? "").includes("pause");
}

function isRecent(value: string | null | undefined, sinceMs: number) {
  if (!value) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && time >= sinceMs;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function maxNumber(values: Array<number | null>) {
  const numbers = values.filter((value): value is number => value !== null);
  return numbers.length ? Math.max(...numbers) : null;
}

function round(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
