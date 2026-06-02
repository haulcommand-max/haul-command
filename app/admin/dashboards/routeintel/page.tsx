import type { Metadata } from "next";
import { Activity, AlertTriangle, Gauge, MapPinned, RadioTower, Route, Satellite, ShieldCheck, Truck } from "lucide-react";
import { getRouteIntelDashboardReadModel } from "@/lib/admin/routeintel/read-model";

export const metadata: Metadata = {
  title: "RouteIntel and GPS Dashboard - Haul Command Admin",
  description: "Supabase-backed RouteIntel benchmark, GPS breadcrumb, Motive, Traccar, and paid-provider readiness dashboard.",
};

export const dynamic = "force-dynamic";

const statusColor = {
  passing: "#22C55E",
  warning: "#F59E0B",
  failing: "#EF4444",
  insufficient_data: "#94A3B8",
} as const;

function formatNumber(value: number | null, suffix = "") {
  if (value === null) return "Unmeasured";
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
}

function percent(value: number | null) {
  if (value === null) return "Unmeasured";
  return `${(value * 100).toFixed(1)}%`;
}

function kpi(label: string, value: string, sub: string, color: string) {
  return (
    <div style={{ padding: 18, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
      <div style={{ color, fontSize: 10, fontWeight: 850, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ color: "#fff", fontSize: 27, fontWeight: 900 }}>{value}</div>
      <div style={{ color: "#8a93a3", fontSize: 11, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

export default async function RouteIntelDashboard() {
  const model = await getRouteIntelDashboardReadModel();
  const benchmarkColor = statusColor[model.benchmark.status];

  return (
    <main style={{ padding: 24, maxWidth: 1360, margin: "0 auto", color: "#fff" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, lineHeight: 1.1, fontWeight: 900, margin: 0 }}>RouteIntel and GPS</h1>
          <p style={{ margin: "6px 0 0", color: "#8a93a3", fontSize: 12 }}>
            Real benchmark inputs from <code>gps_breadcrumbs</code>, <code>hc_route_events</code>, crowd signals, Motive, Traccar, and enterprise route usage.
          </p>
        </div>
        <div style={{ textAlign: "right", color: "#8a93a3", fontSize: 11 }}>
          <div>Updated {new Date(model.asOf).toLocaleString()}</div>
          <div>{model.window.days} day window since {new Date(model.window.since).toLocaleDateString()}</div>
        </div>
      </header>

      {(model.error || model.warnings.length > 0) && (
        <section style={{ display: "grid", gap: 8, marginBottom: 18 }}>
          {model.error && <Warning text={`Live RouteIntel telemetry unavailable: ${model.error}`} tone="#EF4444" />}
          {model.warnings.map((warning) => <Warning key={warning} text={warning} tone="#F59E0B" />)}
        </section>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 24 }}>
        {kpi("Benchmark Status", model.benchmark.status.replace("_", " "), model.benchmark.overallScore === null ? "Score unmeasured" : `${model.benchmark.overallScore.toFixed(1)} overall score`, benchmarkColor)}
        {kpi("GPS Proof", formatNumber(model.gps.breadcrumbCount + model.gps.routeEventGpsCount), `${model.gps.uniqueRoutes} routes with breadcrumb evidence`, "#3B82F6")}
        {kpi("Crowd Signals", formatNumber(model.crowd.reportCount), `${model.crowd.confirmedReports} confirmed reports`, "#22C55E")}
        {kpi("Clearance / ETA", formatNumber(model.routeEvents.clearanceChecks + model.routeEvents.etaObservations), `${model.routeEvents.total} route events`, "#C6923A")}
        {kpi("Paid Provider Cost", formatNumber(model.paidProvider.computeCostUnits), `${model.paidProvider.usageEvents} route usage events`, "#A78BFA")}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 420px)", gap: 16, marginBottom: 20 }}>
        <Panel title="Benchmark Gates" icon={<Gauge size={16} color="#C6923A" />}>
          <MetricRow label="GPS p95 accuracy" value={formatNumber(model.benchmark.metrics.gpsBreadcrumbAccuracy.p95AccuracyM, "m")} status={model.benchmark.metrics.gpsBreadcrumbAccuracy.status} />
          <MetricRow label="Crowd confirmation median" value={formatNumber(model.benchmark.metrics.crowdConfirmationSpeed.medianConfirmationMinutes, "m")} status={model.benchmark.metrics.crowdConfirmationSpeed.status} />
          <MetricRow label="Clearance false positives" value={percent(model.benchmark.metrics.clearanceFalsePositiveRate.falsePositiveRate)} status={model.benchmark.metrics.clearanceFalsePositiveRate.status} />
          <MetricRow label="Paid provider max spend" value={`$${model.benchmark.metrics.paidProviderSpend.maxRouteSpendUsd.toFixed(2)}`} status={model.benchmark.metrics.paidProviderSpend.status} />
        </Panel>

        <Panel title="Device Spine" icon={<Satellite size={16} color="#3B82F6" />}>
          <MetricRow label="Motive active connections" value={model.motive.activeConnections.toLocaleString()} />
          <MetricRow label="Motive webhooks 24h" value={model.motive.webhookEventsLast24h.toLocaleString()} />
          <MetricRow label="Motive sync errors" value={model.motive.syncErrors.toLocaleString()} status={model.motive.syncErrors > 0 ? "warning" : "passing"} />
          <MetricRow label="Traccar devices" value={model.traccar.registeredDevices.toLocaleString()} />
          <MetricRow label="Latest GPS position" value={model.traccar.latestPositionAt ? new Date(model.traccar.latestPositionAt).toLocaleString() : "Unmeasured"} />
        </Panel>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 20 }}>
        <SignalCard icon={<MapPinned size={18} />} title="GPS Breadcrumbs" accent="#3B82F6" rows={[
          ["Breadcrumb rows", model.gps.breadcrumbCount.toLocaleString()],
          ["Route-event GPS rows", model.gps.routeEventGpsCount.toLocaleString()],
          ["Average accuracy", formatNumber(model.gps.averageAccuracyM, "m")],
          ["Latest breadcrumb", model.gps.latestBreadcrumbAt ? new Date(model.gps.latestBreadcrumbAt).toLocaleString() : "Unmeasured"],
          ["Source mix", `${model.gps.phoneGpsCount} phone / ${model.gps.motiveCount} Motive / ${model.gps.traccarCount} Traccar`],
        ]} />
        <SignalCard icon={<RadioTower size={18} />} title="Crowd Route Intel" accent="#22C55E" rows={[
          ["Reports", model.crowd.reportCount.toLocaleString()],
          ["Votes", model.crowd.voteCount.toLocaleString()],
          ["Confirmed reports", model.crowd.confirmedReports.toLocaleString()],
          ["Latest report", model.crowd.latestReportAt ? new Date(model.crowd.latestReportAt).toLocaleString() : "Unmeasured"],
        ]} />
        <SignalCard icon={<Route size={18} />} title="Route Events" accent="#C6923A" rows={[
          ["Total events", model.routeEvents.total.toLocaleString()],
          ["Clearance checks", model.routeEvents.clearanceChecks.toLocaleString()],
          ["ETA observations", model.routeEvents.etaObservations.toLocaleString()],
          ["Latest event", model.routeEvents.latestEventAt ? new Date(model.routeEvents.latestEventAt).toLocaleString() : "Unmeasured"],
        ]} />
        <SignalCard icon={<Truck size={18} />} title="Enterprise Route Usage" accent="#A78BFA" rows={[
          ["Route usage events", model.paidProvider.routeUsageEvents.toLocaleString()],
          ["Unique endpoints", model.paidProvider.uniqueRouteEndpoints.toLocaleString()],
          ["Compute cost units", formatNumber(model.paidProvider.computeCostUnits)],
          ["Guardrail", model.benchmark.metrics.paidProviderSpend.target],
        ]} />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 420px)", gap: 16 }}>
        <Panel title="Next Actions" icon={<Activity size={16} color="#22C55E" />}>
          {model.nextActions.length === 0 ? (
            <p style={{ margin: 0, color: "#8a93a3", fontSize: 12 }}>No RouteIntel blockers are active in the current benchmark window.</p>
          ) : model.nextActions.map((action) => (
            <div key={action} style={{ padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#cbd5e1", fontSize: 12, lineHeight: 1.45 }}>
              {action}
            </div>
          ))}
        </Panel>

        <Panel title="Source Tables" icon={<ShieldCheck size={16} color="#94A3B8" />}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {model.source.tables.map((table) => (
              <span key={table} style={{ borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", padding: "5px 7px", color: "#cbd5e1", fontSize: 10, background: "rgba(255,255,255,0.035)" }}>
                {table}
              </span>
            ))}
          </div>
        </Panel>
      </section>
    </main>
  );
}

function Warning({ text, tone }: { text: string; tone: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", padding: 12, borderRadius: 10, border: `1px solid ${tone}55`, background: `${tone}12`, color: tone, fontSize: 12 }}>
      <AlertTriangle size={15} />
      {text}
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)", padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {icon}
        <h2 style={{ fontSize: 15, fontWeight: 850, margin: 0 }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MetricRow({ label, value, status }: { label: string; value: string; status?: keyof typeof statusColor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.045)" }}>
      <span style={{ color: "#8a93a3", fontSize: 12 }}>{label}</span>
      <span style={{ color: status ? statusColor[status] : "#fff", fontSize: 12, fontWeight: 850, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function SignalCard({ icon, title, accent, rows }: { icon: React.ReactNode; title: string; accent: string; rows: Array<[string, string]> }) {
  return (
    <article style={{ padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", color: accent, fontSize: 11, fontWeight: 850, textTransform: "uppercase", marginBottom: 10 }}>
        {icon}
        {title}
      </div>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 10, color: "#cbd5e1", fontSize: 12, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ color: "#8a93a3" }}>{label}</span>
          <strong style={{ textAlign: "right" }}>{value}</strong>
        </div>
      ))}
    </article>
  );
}
