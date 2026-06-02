import { getSupabaseAdmin } from "@/lib/supabase/admin";

type StatusRow = {
  id?: string | null;
  load_id?: string | null;
  status?: string | null;
  created_at?: string | null;
  uncovered_since?: string | null;
  offered_at?: string | null;
  sent_at?: string | null;
  responded_at?: string | null;
  expires_at?: string | null;
  outcome?: string | null;
  alert_tier?: string | null;
  notified?: boolean | null;
  resolved_at?: string | null;
  candidate_kind?: string | null;
  candidate_count?: number | null;
  match_score?: number | null;
  notification_sent?: boolean | null;
  responded?: boolean | null;
  origin_country?: string | null;
  dest_country?: string | null;
  origin_state?: string | null;
  dest_state?: string | null;
  service_required?: string | null;
};

export type ActivationTableHealth = {
  table: string;
  label: string;
  total: number;
  statusCounts: Record<string, number>;
  error?: string;
};

export type MatchingLoadBoardReadModel = {
  asOf: string;
  sourceTables: string[];
  tables: ActivationTableHealth[];
  totals: {
    openLoads: number;
    pendingOffers: number;
    acceptedMatches: number;
    staleOffers: number;
    staleMatchRequests: number;
    matchingQueueRows: number;
    queuedLoads: number;
    uncoveredMarketGapRows: number;
    unrespondedQueueRows: number;
    notificationPendingQueueRows: number;
    queueResponseRate: number;
    avgMatchScore: number | null;
    queueScoreBands: Record<string, number>;
    uncoveredAlerts: number;
    criticalUncoveredAlerts: number;
    unnotifiedUncoveredAlerts: number;
    staleUncoveredAlerts: number;
    declinedLastHour: number;
    outcomesLastHour: number;
    declineRateLastHour: number;
    countriesTouched: number;
  };
  recentLoads: Array<{
    id: string;
    status: string;
    lane: string;
    service: string;
    createdAt: string | null;
  }>;
  uncoveredMarkets: Array<{
    loadRef: string;
    tier: string;
    ageMinutes: number;
    notified: boolean;
    nextAction: string;
    createdAt: string | null;
  }>;
  activationGaps: string[];
};

const TABLES = [
  { table: "loads", label: "Canonical loads" },
  { table: "match_offers", label: "Canonical match offers" },
  { table: "matches", label: "Accepted matches" },
  { table: "match_requests", label: "Match request queue" },
  { table: "hc_load_matching_queue", label: "Load matching candidates" },
  { table: "uncovered_load_alerts", label: "Uncovered load alerts" },
  { table: "match_outcomes", label: "Match outcomes" },
  { table: "hc_pay_revenue", label: "Revenue attribution" },
] as const;

const OPEN_LOAD_STATUSES = new Set(["open", "active", "published"]);
const OPEN_OFFER_STATUSES = new Set(["offered", "viewed"]);
const ACCEPTED_MATCH_STATUSES = new Set(["accepted", "in_progress", "completed"]);
const RESPONSE_TIMEOUT_MS = 45 * 60 * 1000;

function countStatuses(rows: StatusRow[], field: "status" | "outcome" = "status") {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const key = row[field] ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function parseTime(value?: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function isStaleOffer(row: StatusRow, nowMs: number) {
  if (!OPEN_OFFER_STATUSES.has(row.status ?? "")) return false;
  if (row.responded_at) return false;
  const expiresAt = parseTime(row.expires_at);
  if (expiresAt !== null && expiresAt < nowMs) return true;
  const offeredAt = parseTime(row.offered_at ?? row.sent_at);
  return offeredAt !== null && nowMs - offeredAt > RESPONSE_TIMEOUT_MS;
}

function lane(row: StatusRow) {
  const origin = [row.origin_country, row.origin_state].filter(Boolean).join("-");
  const destination = [row.dest_country, row.dest_state].filter(Boolean).join("-");
  if (!origin && !destination) return "Unspecified lane";
  return `${origin || "unknown"} -> ${destination || "unknown"}`;
}

function activeAlert(row: StatusRow) {
  return !row.resolved_at;
}

function alertAgeMinutes(row: StatusRow, nowMs: number) {
  const start = parseTime(row.uncovered_since ?? row.created_at);
  if (start === null) return 0;
  return Math.max(0, Math.floor((nowMs - start) / 60000));
}

function nextActionForAlert(row: StatusRow, nowMs: number) {
  if (row.notified) return "Monitor response and promote if still uncovered.";
  const tier = row.alert_tier ?? "warning";
  if (tier === "emergency" || tier === "critical" || alertAgeMinutes(row, nowMs) > 60) {
    return "Notify operators and create provider recruitment task.";
  }
  return "Send first uncovered-load notification.";
}

function loadRef(value?: string | null) {
  if (!value) return "unknown";
  return `load-${value.slice(-8)}`;
}

function scoreBand(score?: number | null) {
  if (score === null || score === undefined) return "unscored";
  if (score <= 0) return "0";
  if (score < 50) return "1-49";
  if (score < 75) return "50-74";
  return "75+";
}

function queueScoreBands(rows: StatusRow[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const band = scoreBand(row.match_score);
    acc[band] = (acc[band] ?? 0) + 1;
    return acc;
  }, {});
}

async function readRows(table: string, select: string, orderColumn = "created_at", limit = 5000) {
  const supabase = getSupabaseAdmin();
  const { data, error, count } = await supabase
    .from(table)
    .select(select, { count: "exact" })
    .order(orderColumn, { ascending: false })
    .limit(limit);

  return {
    rows: (data ?? []) as StatusRow[],
    error: error?.message,
    count: count ?? (data?.length ?? 0),
  };
}

async function readQueueRows() {
  const supabase = getSupabaseAdmin();
  const { data, error, count } = await supabase
    .from("hc_load_matching_queue" as never)
    .select("load_id,candidate_kind,match_score,notification_sent,responded", { count: "exact" })
    .limit(5000);

  return {
    rows: (data ?? []) as StatusRow[],
    error: error?.message,
    count: count ?? (data?.length ?? 0),
  };
}

export async function getMatchingLoadBoardReadModel(): Promise<MatchingLoadBoardReadModel> {
  const now = Date.now();
  const asOf = new Date(now).toISOString();

  const [loads, offers, matches, requests, matchingQueue, uncoveredAlerts, outcomes, revenue] = await Promise.all([
    readRows("loads", "id,status,created_at,origin_country,origin_state,dest_country,dest_state,service_required", "created_at", 5000),
    readRows("match_offers", "id,status,offered_at,sent_at,responded_at,expires_at", "offered_at", 5000),
    readRows("matches", "id,status,created_at", "created_at", 5000),
    readRows("match_requests", "id,status,created_at,candidate_count", "created_at", 5000),
    readQueueRows(),
    readRows("uncovered_load_alerts", "id,load_id,uncovered_since,duration_minutes,alert_tier,notified,resolved_at,created_at", "created_at", 5000),
    readRows("match_outcomes", "id,outcome,created_at", "created_at", 5000),
    readRows("hc_pay_revenue", "id,status,created_at", "created_at", 5000),
  ]);

  const tables: ActivationTableHealth[] = [
    { table: "loads", label: "Canonical loads", total: loads.count, statusCounts: countStatuses(loads.rows), error: loads.error },
    { table: "match_offers", label: "Canonical match offers", total: offers.count, statusCounts: countStatuses(offers.rows), error: offers.error },
    { table: "matches", label: "Accepted matches", total: matches.count, statusCounts: countStatuses(matches.rows), error: matches.error },
    { table: "match_requests", label: "Match request queue", total: requests.count, statusCounts: countStatuses(requests.rows), error: requests.error },
    { table: "hc_load_matching_queue", label: "Load matching candidates", total: matchingQueue.count, statusCounts: countStatuses(matchingQueue.rows, "candidate_kind"), error: matchingQueue.error },
    { table: "uncovered_load_alerts", label: "Uncovered load alerts", total: uncoveredAlerts.count, statusCounts: countStatuses(uncoveredAlerts.rows, "alert_tier"), error: uncoveredAlerts.error },
    { table: "match_outcomes", label: "Match outcomes", total: outcomes.count, statusCounts: countStatuses(outcomes.rows, "outcome"), error: outcomes.error },
    { table: "hc_pay_revenue", label: "Revenue attribution", total: revenue.count, statusCounts: countStatuses(revenue.rows), error: revenue.error },
  ];

  const oneHourAgo = now - 60 * 60 * 1000;
  const recentOutcomes = outcomes.rows.filter((row) => {
    const createdAt = parseTime(row.created_at);
    return createdAt !== null && createdAt >= oneHourAgo;
  });
  const declinedLastHour = recentOutcomes.filter((row) => row.outcome === "declined").length;

  const countries = new Set<string>();
  for (const row of loads.rows) {
    if (row.origin_country) countries.add(row.origin_country);
    if (row.dest_country) countries.add(row.dest_country);
  }

  const activationGaps: string[] = [];
  for (const table of tables) {
    if (table.error) activationGaps.push(`${table.table} is not readable: ${table.error}`);
  }
  if (!offers.error && offers.count === 0) activationGaps.push("No canonical match_offers records are visible yet.");
  if (!matches.error && matches.count === 0) activationGaps.push("No accepted matches are visible yet.");
  if (!matchingQueue.error && matchingQueue.count === 0) activationGaps.push("No hc_load_matching_queue rows are visible, so failed-fill candidate routing is not measurable yet.");
  if (!uncoveredAlerts.error && uncoveredAlerts.count === 0) activationGaps.push("No uncovered_load_alerts rows are visible, so open-load supply gaps are not being surfaced to ops yet.");
  if (!revenue.error && revenue.count === 0) activationGaps.push("No hc_pay_revenue attribution rows are visible for matching yet.");

  const activeUncoveredAlerts = uncoveredAlerts.rows.filter(activeAlert);
  const criticalUncoveredAlerts = activeUncoveredAlerts.filter((row) => row.alert_tier === "critical" || row.alert_tier === "emergency");
  const scoredQueueRows = matchingQueue.rows.filter((row) => typeof row.match_score === "number");
  const queueResponses = matchingQueue.rows.filter((row) => row.responded).length;
  const queuedLoadIds = new Set(matchingQueue.rows.map((row) => row.load_id).filter(Boolean));

  return {
    asOf,
    sourceTables: TABLES.map(({ table }) => table),
    tables,
    totals: {
      openLoads: loads.rows.filter((row) => OPEN_LOAD_STATUSES.has(row.status ?? "")).length,
      pendingOffers: offers.rows.filter((row) => OPEN_OFFER_STATUSES.has(row.status ?? "")).length,
      acceptedMatches: matches.rows.filter((row) => ACCEPTED_MATCH_STATUSES.has(row.status ?? "")).length,
      staleOffers: offers.rows.filter((row) => isStaleOffer(row, now)).length,
      staleMatchRequests: requests.rows.filter((row) => {
        const createdAt = parseTime(row.created_at);
        return row.status === "scored" && createdAt !== null && now - createdAt > RESPONSE_TIMEOUT_MS;
      }).length,
      matchingQueueRows: matchingQueue.count,
      queuedLoads: queuedLoadIds.size,
      uncoveredMarketGapRows: matchingQueue.rows.filter((row) => row.candidate_kind === "uncovered_market_gap").length,
      unrespondedQueueRows: matchingQueue.rows.filter((row) => !row.responded).length,
      notificationPendingQueueRows: matchingQueue.rows.filter((row) => !row.notification_sent).length,
      queueResponseRate: matchingQueue.rows.length > 0 ? queueResponses / matchingQueue.rows.length : 0,
      avgMatchScore: scoredQueueRows.length > 0
        ? scoredQueueRows.reduce((sum, row) => sum + (row.match_score ?? 0), 0) / scoredQueueRows.length
        : null,
      queueScoreBands: queueScoreBands(matchingQueue.rows),
      uncoveredAlerts: activeUncoveredAlerts.length,
      criticalUncoveredAlerts: criticalUncoveredAlerts.length,
      unnotifiedUncoveredAlerts: activeUncoveredAlerts.filter((row) => !row.notified).length,
      staleUncoveredAlerts: activeUncoveredAlerts.filter((row) => alertAgeMinutes(row, now) > 60).length,
      declinedLastHour,
      outcomesLastHour: recentOutcomes.length,
      declineRateLastHour: recentOutcomes.length ? declinedLastHour / recentOutcomes.length : 0,
      countriesTouched: countries.size,
    },
    recentLoads: loads.rows.slice(0, 8).map((row) => ({
      id: row.id ?? "unknown",
      status: row.status ?? "unknown",
      lane: lane(row),
      service: row.service_required ?? "unspecified",
      createdAt: row.created_at ?? null,
    })),
    uncoveredMarkets: activeUncoveredAlerts.slice(0, 8).map((row) => ({
      loadRef: loadRef(row.load_id),
      tier: row.alert_tier ?? "warning",
      ageMinutes: alertAgeMinutes(row, now),
      notified: Boolean(row.notified),
      nextAction: nextActionForAlert(row, now),
      createdAt: row.created_at ?? row.uncovered_since ?? null,
    })),
    activationGaps,
  };
}
