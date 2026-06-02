import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  type ClearanceCheckSample,
  type CrowdReportSample,
  type EtaObservationSample,
  type GpsBreadcrumbSample,
  type PaidMapProvider,
  type PaidProviderUsageSample,
  type RouteIntelBenchmark,
  type RouteIntelLoadClass,
  buildRouteIntelBenchmark,
} from "@/lib/routes/routeintel-benchmarking";

const DEFAULT_WINDOW_DAYS = 7;
const MAX_SOURCE_ROWS = 5000;

type QueryResult<T> = {
  data: T[] | null;
  error?: { message?: string } | null;
  count?: number | null;
};

type GpsBreadcrumbRow = {
  job_id: string | null;
  recorded_at: string | null;
  accuracy: number | string | null;
  source: string | null;
};

type RouteEventRow = {
  route_session_id: string | null;
  event_type: string | null;
  accuracy_meters: number | string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};

type CrowdSignalRow = {
  id: string | null;
  corridor_id: string | null;
  corridor_slug: string | null;
  created_at: string | null;
  verified_count: number | string | null;
};

type CrowdVoteRow = {
  signal_id: string | null;
  vote: string | null;
  created_at: string | null;
};

type UsageEventRow = {
  endpoint: string | null;
  endpoint_family: string | null;
  compute_cost_units: number | string | null;
  created_at: string | null;
};

type MotiveConnectionRow = {
  id: string;
  status: string | null;
  last_sync_at: string | null;
};

type MotiveWebhookRow = {
  id: string;
  occurred_at: string | null;
  error: string | null;
};

type GpsDeviceRow = {
  id: string;
  created_at: string | null;
};

type GpsLatestPositionRow = {
  traccar_device_id: string | null;
  recorded_at: string | null;
  updated_at: string | null;
};

export type RouteIntelDashboardReadModel = {
  asOf: string;
  window: {
    days: number;
    since: string;
    maxSourceRows: number;
  };
  source: {
    benchmark: "buildRouteIntelBenchmark";
    tables: string[];
  };
  benchmark: RouteIntelBenchmark;
  gps: {
    breadcrumbCount: number;
    routeEventGpsCount: number;
    uniqueRoutes: number;
    latestBreadcrumbAt: string | null;
    averageAccuracyM: number | null;
    phoneGpsCount: number;
    motiveCount: number;
    traccarCount: number;
  };
  crowd: {
    reportCount: number;
    voteCount: number;
    confirmedReports: number;
    latestReportAt: string | null;
  };
  routeEvents: {
    total: number;
    clearanceChecks: number;
    etaObservations: number;
    latestEventAt: string | null;
  };
  paidProvider: {
    usageEvents: number;
    routeUsageEvents: number;
    computeCostUnits: number;
    uniqueRouteEndpoints: number;
  };
  motive: {
    activeConnections: number;
    totalConnections: number;
    webhookEventsLast24h: number;
    syncErrors: number;
    lastSyncAt: string | null;
  };
  traccar: {
    registeredDevices: number;
    latestPositions: number;
    latestPositionAt: string | null;
  };
  warnings: string[];
  nextActions: string[];
  error?: string;
};

export async function getRouteIntelDashboardReadModel(days = DEFAULT_WINDOW_DAYS): Promise<RouteIntelDashboardReadModel> {
  const asOf = new Date().toISOString();
  const windowDays = clampNumber(days, 1, 30);
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const model = emptyModel(asOf, windowDays, since);

  try {
    const supabase = getSupabaseAdmin();
    const [
      gpsResult,
      routeEventsResult,
      crowdResult,
      votesResult,
      usageResult,
      motiveConnectionsResult,
      motiveWebhookResult,
      gpsDevicesResult,
      latestPositionsResult,
    ] = await Promise.all([
      supabase
        .from("gps_breadcrumbs")
        .select("job_id,recorded_at,accuracy,source")
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: false })
        .limit(MAX_SOURCE_ROWS),
      supabase
        .from("hc_route_events")
        .select("route_session_id,event_type,accuracy_meters,metadata,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(MAX_SOURCE_ROWS),
      supabase
        .from("crowd_road_signals")
        .select("id,corridor_id,corridor_slug,created_at,verified_count")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(MAX_SOURCE_ROWS),
      supabase
        .from("hc_crowd_signal_votes")
        .select("signal_id,vote,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(MAX_SOURCE_ROWS),
      supabase
        .from("enterprise_usage_events")
        .select("endpoint,endpoint_family,compute_cost_units,created_at")
        .gte("created_at", since)
        .ilike("endpoint_family", "%route%")
        .order("created_at", { ascending: false })
        .limit(MAX_SOURCE_ROWS),
      supabase
        .from("motive_connections")
        .select("id,status,last_sync_at")
        .limit(MAX_SOURCE_ROWS),
      supabase
        .from("motive_webhook_events")
        .select("id,occurred_at,error")
        .gte("occurred_at", last24h)
        .order("occurred_at", { ascending: false })
        .limit(MAX_SOURCE_ROWS),
      supabase
        .from("hc_gps_devices")
        .select("id,created_at")
        .limit(MAX_SOURCE_ROWS),
      supabase
        .from("hc_gps_latest_position")
        .select("traccar_device_id,recorded_at,updated_at")
        .order("updated_at", { ascending: false })
        .limit(MAX_SOURCE_ROWS),
    ]);

    addWarnings(model, [
      ["gps_breadcrumbs", gpsResult],
      ["hc_route_events", routeEventsResult],
      ["crowd_road_signals", crowdResult],
      ["hc_crowd_signal_votes", votesResult],
      ["enterprise_usage_events", usageResult],
      ["motive_connections", motiveConnectionsResult],
      ["motive_webhook_events", motiveWebhookResult],
      ["hc_gps_devices", gpsDevicesResult],
      ["hc_gps_latest_position", latestPositionsResult],
    ]);

    const gpsRows = rows<GpsBreadcrumbRow>(gpsResult);
    const routeEventRows = rows<RouteEventRow>(routeEventsResult);
    const crowdRows = rows<CrowdSignalRow>(crowdResult);
    const voteRows = rows<CrowdVoteRow>(votesResult);
    const usageRows = rows<UsageEventRow>(usageResult);
    const motiveRows = rows<MotiveConnectionRow>(motiveConnectionsResult);
    const motiveWebhookRows = rows<MotiveWebhookRow>(motiveWebhookResult);
    const gpsDeviceRows = rows<GpsDeviceRow>(gpsDevicesResult);
    const latestPositionRows = rows<GpsLatestPositionRow>(latestPositionsResult);

    const gpsSamples = [...mapGpsBreadcrumbs(gpsRows), ...mapRouteEventGps(routeEventRows)];
    const crowdSamples = mapCrowdReports(crowdRows, voteRows);
    const clearanceSamples = mapClearanceChecks(routeEventRows);
    const etaSamples = mapEtaObservations(routeEventRows);
    const paidProviderSamples = mapPaidProviderUsage(usageRows);

    model.benchmark = buildRouteIntelBenchmark({
      generatedAt: asOf,
      gpsBreadcrumbs: gpsSamples,
      crowdReports: crowdSamples,
      clearanceChecks: clearanceSamples,
      etaObservations: etaSamples,
      paidProviderUsage: paidProviderSamples,
    });
    model.nextActions = model.benchmark.nextActions;

    hydrateGps(model, gpsRows, routeEventRows);
    hydrateCrowd(model, crowdRows, voteRows, crowdSamples);
    hydrateRouteEvents(model, routeEventRows, clearanceSamples, etaSamples);
    hydratePaidProvider(model, usageRows);
    hydrateMotive(model, motiveRows, motiveWebhookRows);
    hydrateTraccar(model, gpsDeviceRows, latestPositionRows);

    if (model.benchmark.status === "insufficient_data") {
      model.warnings.push("RouteIntel is not ready for broad paid proof claims until benchmark sample blockers clear.");
    }
    if (model.traccar.registeredDevices === 0 && model.motive.activeConnections === 0) {
      model.warnings.push("No Motive or Traccar device spine is visible in the admin read model.");
    }

    return model;
  } catch (error) {
    return {
      ...model,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function emptyModel(asOf: string, days: number, since: string): RouteIntelDashboardReadModel {
  return {
    asOf,
    window: { days, since, maxSourceRows: MAX_SOURCE_ROWS },
    source: {
      benchmark: "buildRouteIntelBenchmark",
      tables: [
        "gps_breadcrumbs",
        "hc_route_events",
        "crowd_road_signals",
        "hc_crowd_signal_votes",
        "enterprise_usage_events",
        "motive_connections",
        "motive_webhook_events",
        "hc_gps_devices",
        "hc_gps_latest_position",
      ],
    },
    benchmark: buildRouteIntelBenchmark({ generatedAt: asOf }),
    gps: {
      breadcrumbCount: 0,
      routeEventGpsCount: 0,
      uniqueRoutes: 0,
      latestBreadcrumbAt: null,
      averageAccuracyM: null,
      phoneGpsCount: 0,
      motiveCount: 0,
      traccarCount: 0,
    },
    crowd: {
      reportCount: 0,
      voteCount: 0,
      confirmedReports: 0,
      latestReportAt: null,
    },
    routeEvents: {
      total: 0,
      clearanceChecks: 0,
      etaObservations: 0,
      latestEventAt: null,
    },
    paidProvider: {
      usageEvents: 0,
      routeUsageEvents: 0,
      computeCostUnits: 0,
      uniqueRouteEndpoints: 0,
    },
    motive: {
      activeConnections: 0,
      totalConnections: 0,
      webhookEventsLast24h: 0,
      syncErrors: 0,
      lastSyncAt: null,
    },
    traccar: {
      registeredDevices: 0,
      latestPositions: 0,
      latestPositionAt: null,
    },
    warnings: [],
    nextActions: [],
  };
}

function hydrateGps(model: RouteIntelDashboardReadModel, gpsRows: GpsBreadcrumbRow[], routeRows: RouteEventRow[]) {
  const accuracyValues = gpsRows.map((row) => asNumber(row.accuracy)).filter(isFiniteNumber);
  const routeIds = new Set<string>();
  for (const row of gpsRows) {
    if (row.job_id) routeIds.add(row.job_id);
    const source = (row.source ?? "").toLowerCase();
    if (source.includes("motive")) model.gps.motiveCount += 1;
    else if (source.includes("traccar") || source.includes("navixy")) model.gps.traccarCount += 1;
    else model.gps.phoneGpsCount += 1;
  }

  const routeEventGpsRows = routeRows.filter((row) => row.route_session_id && row.accuracy_meters !== null);
  for (const row of routeEventGpsRows) {
    if (row.route_session_id) routeIds.add(row.route_session_id);
  }

  model.gps.breadcrumbCount = gpsRows.length;
  model.gps.routeEventGpsCount = routeEventGpsRows.length;
  model.gps.uniqueRoutes = routeIds.size;
  model.gps.latestBreadcrumbAt = latestDate([
    ...gpsRows.map((row) => row.recorded_at),
    ...routeEventGpsRows.map((row) => row.created_at),
  ]);
  model.gps.averageAccuracyM = accuracyValues.length
    ? round(accuracyValues.reduce((sum, value) => sum + value, 0) / accuracyValues.length, 1)
    : null;
}

function hydrateCrowd(
  model: RouteIntelDashboardReadModel,
  crowdRows: CrowdSignalRow[],
  voteRows: CrowdVoteRow[],
  crowdSamples: CrowdReportSample[],
) {
  model.crowd.reportCount = crowdRows.length;
  model.crowd.voteCount = voteRows.length;
  model.crowd.confirmedReports = crowdSamples.filter((sample) => sample.confirmedAt).length;
  model.crowd.latestReportAt = latestDate(crowdRows.map((row) => row.created_at));
}

function hydrateRouteEvents(
  model: RouteIntelDashboardReadModel,
  routeRows: RouteEventRow[],
  clearanceSamples: ClearanceCheckSample[],
  etaSamples: EtaObservationSample[],
) {
  model.routeEvents.total = routeRows.length;
  model.routeEvents.clearanceChecks = clearanceSamples.length;
  model.routeEvents.etaObservations = etaSamples.length;
  model.routeEvents.latestEventAt = latestDate(routeRows.map((row) => row.created_at));
}

function hydratePaidProvider(model: RouteIntelDashboardReadModel, usageRows: UsageEventRow[]) {
  model.paidProvider.usageEvents = usageRows.length;
  model.paidProvider.routeUsageEvents = usageRows.filter((row) => (row.endpoint_family ?? "").toLowerCase().includes("route")).length;
  model.paidProvider.computeCostUnits = round(
    usageRows.reduce((sum, row) => sum + (asNumber(row.compute_cost_units) ?? 0), 0),
    2,
  );
  model.paidProvider.uniqueRouteEndpoints = new Set(usageRows.map((row) => row.endpoint).filter(Boolean)).size;
}

function hydrateMotive(model: RouteIntelDashboardReadModel, connections: MotiveConnectionRow[], webhooks: MotiveWebhookRow[]) {
  model.motive.totalConnections = connections.length;
  model.motive.activeConnections = connections.filter((row) => row.status === "active").length;
  model.motive.webhookEventsLast24h = webhooks.length;
  model.motive.syncErrors = webhooks.filter((row) => row.error).length;
  model.motive.lastSyncAt = latestDate(connections.map((row) => row.last_sync_at));
}

function hydrateTraccar(model: RouteIntelDashboardReadModel, devices: GpsDeviceRow[], positions: GpsLatestPositionRow[]) {
  model.traccar.registeredDevices = devices.length;
  model.traccar.latestPositions = positions.length;
  model.traccar.latestPositionAt = latestDate(positions.map((row) => row.updated_at ?? row.recorded_at));
}

function mapGpsBreadcrumbs(gpsRows: GpsBreadcrumbRow[]): GpsBreadcrumbSample[] {
  return gpsRows
    .map((row) => {
      if (!row.recorded_at) return null;
      return {
        routeId: row.job_id || "unassigned",
        recordedAt: row.recorded_at,
        accuracyM: asNumber(row.accuracy),
      };
    })
    .filter(isPresent);
}

function mapRouteEventGps(routeRows: RouteEventRow[]): GpsBreadcrumbSample[] {
  return routeRows
    .map((row) => {
      const routeId = row.route_session_id;
      const recordedAt = row.created_at;
      const accuracyM = asNumber(row.accuracy_meters);
      if (!routeId || !recordedAt || accuracyM === null) return null;

      return {
        routeId,
        recordedAt,
        accuracyM,
        matchedDistanceErrorM: asNumber(asRecord(row.metadata).matched_distance_error_m),
      };
    })
    .filter(isPresent);
}

function mapCrowdReports(signals: CrowdSignalRow[], votes: CrowdVoteRow[]): CrowdReportSample[] {
  const confirmationBySignal = new Map<string, string>();
  for (const vote of votes) {
    if (!vote.signal_id || !vote.created_at || !isConfirmingVote(vote.vote)) continue;
    if (!confirmationBySignal.has(vote.signal_id)) confirmationBySignal.set(vote.signal_id, vote.created_at);
  }

  return signals
    .map((signal) => {
      if (!signal.id || !signal.created_at) return null;
      return {
        reportId: signal.id,
        routeId: signal.corridor_id || signal.corridor_slug || undefined,
        createdAt: signal.created_at,
        confirmedAt: confirmationBySignal.get(signal.id) ?? null,
        confirmationCount: asNumber(signal.verified_count) ?? 0,
      };
    })
    .filter(isPresent);
}

function mapClearanceChecks(routeRows: RouteEventRow[]): ClearanceCheckSample[] {
  return routeRows
    .map((row) => {
      const metadata = asRecord(row.metadata);
      const routeId = row.route_session_id;
      const predictedBlocked = asBoolean(metadata.predicted_blocked);
      const actualBlocked = asNullableBoolean(metadata.actual_blocked);
      if (!routeId || predictedBlocked === null || actualBlocked === undefined) return null;

      return {
        routeId,
        predictedBlocked,
        actualBlocked,
        source: coerceClearanceSource(asString(metadata.clearance_source)),
      };
    })
    .filter(isPresent);
}

function mapEtaObservations(routeRows: RouteEventRow[]): EtaObservationSample[] {
  return routeRows
    .map((row) => {
      const metadata = asRecord(row.metadata);
      const routeId = row.route_session_id;
      const loadClass = coerceLoadClass(asString(metadata.load_class));
      const predictedArrivalAt = asString(metadata.predicted_arrival_at);
      const actualArrivalAt = asString(metadata.actual_arrival_at);
      if (!routeId || !loadClass || !predictedArrivalAt || !actualArrivalAt) return null;

      return { routeId, loadClass, predictedArrivalAt, actualArrivalAt };
    })
    .filter(isPresent);
}

function mapPaidProviderUsage(usageRows: UsageEventRow[]): PaidProviderUsageSample[] {
  return usageRows
    .map((row) => {
      const endpoint = row.endpoint || "";
      const computeCostUnits = asNumber(row.compute_cost_units);
      if (computeCostUnits === null) return null;
      return {
        routeId: routeIdFromEndpoint(endpoint),
        provider: providerFromEndpoint(endpoint),
        capability: endpoint || row.endpoint_family || "routeintel",
        costUsd: computeCostUnits,
      };
    })
    .filter(isPresent);
}

function addWarnings(model: RouteIntelDashboardReadModel, results: Array<[string, QueryResult<unknown>]>) {
  for (const [label, result] of results) {
    if (result.error?.message) model.warnings.push(`${label}: ${result.error.message}`);
  }
}

function rows<T>(result: QueryResult<T>): T[] {
  return Array.isArray(result.data) ? result.data : [];
}

function isConfirmingVote(vote: string | null): boolean {
  return ["confirm", "confirmed", "verified", "yes", "up", "upvote", "true"].includes((vote ?? "").toLowerCase());
}

function coerceLoadClass(value: string | null): RouteIntelLoadClass | null {
  if (value === "standard" || value === "oversize" || value === "superload" || value === "project_cargo") return value;
  return null;
}

function coerceClearanceSource(value: string | null): ClearanceCheckSample["source"] {
  if (value === "dot" || value === "crowd" || value === "survey" || value === "permit") return value;
  return "unknown";
}

function providerFromEndpoint(endpoint: string): PaidMapProvider {
  const normalized = endpoint.toLowerCase();
  if (normalized.includes("mapbox")) return "mapbox";
  if (normalized.includes("here")) return "here";
  if (normalized.includes("google")) return "google";
  return "other";
}

function routeIdFromEndpoint(endpoint: string): string {
  const routeMatch = endpoint.match(/route[_/-]([a-z0-9-]+)/i);
  return routeMatch?.[1] ?? "unassigned";
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function latestDate(values: Array<string | null>): string | null {
  const timestamps = values
    .map((value) => (value ? Date.parse(value) : Number.NaN))
    .filter(Number.isFinite);
  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  return null;
}

function asNullableBoolean(value: unknown): boolean | null | undefined {
  if (value === null) return null;
  if (typeof value === "boolean") return value;
  return undefined;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

function round(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
