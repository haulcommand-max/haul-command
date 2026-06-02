import { getSupabaseAdmin } from "@/lib/supabase/admin";

type StatusRow = {
  id?: string | null;
  status?: string | null;
  created_at?: string | null;
  offered_at?: string | null;
  sent_at?: string | null;
  responded_at?: string | null;
  expires_at?: string | null;
  outcome?: string | null;
  candidate_count?: number | null;
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
  activationGaps: string[];
};

const TABLES = [
  { table: "loads", label: "Canonical loads" },
  { table: "match_offers", label: "Canonical match offers" },
  { table: "matches", label: "Accepted matches" },
  { table: "match_requests", label: "Match request queue" },
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

export async function getMatchingLoadBoardReadModel(): Promise<MatchingLoadBoardReadModel> {
  const now = Date.now();
  const asOf = new Date(now).toISOString();

  const [loads, offers, matches, requests, outcomes, revenue] = await Promise.all([
    readRows("loads", "id,status,created_at,origin_country,origin_state,dest_country,dest_state,service_required", "created_at", 5000),
    readRows("match_offers", "id,status,offered_at,sent_at,responded_at,expires_at", "offered_at", 5000),
    readRows("matches", "id,status,created_at", "created_at", 5000),
    readRows("match_requests", "id,status,created_at,candidate_count", "created_at", 5000),
    readRows("match_outcomes", "id,outcome,created_at", "created_at", 5000),
    readRows("hc_pay_revenue", "id,status,created_at", "created_at", 5000),
  ]);

  const tables: ActivationTableHealth[] = [
    { table: "loads", label: "Canonical loads", total: loads.count, statusCounts: countStatuses(loads.rows), error: loads.error },
    { table: "match_offers", label: "Canonical match offers", total: offers.count, statusCounts: countStatuses(offers.rows), error: offers.error },
    { table: "matches", label: "Accepted matches", total: matches.count, statusCounts: countStatuses(matches.rows), error: matches.error },
    { table: "match_requests", label: "Match request queue", total: requests.count, statusCounts: countStatuses(requests.rows), error: requests.error },
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
  if (!revenue.error && revenue.count === 0) activationGaps.push("No hc_pay_revenue attribution rows are visible for matching yet.");

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
    activationGaps,
  };
}
