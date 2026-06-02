import type { Metadata } from "next";
import { AlertTriangle, BarChart3, DollarSign, MousePointerClick, RadioTower, Target } from "lucide-react";
import { getAdgridFillYieldReadModel } from "@/lib/admin/adgrid/fill-yield-read-model";

export const metadata: Metadata = {
  title: "AdGrid Fill and Yield - Haul Command Admin",
  description: "Supabase-backed AdGrid request, impression, click, and yield readiness dashboard.",
};

export const dynamic = "force-dynamic";

function money(value: number | null) {
  if (value === null) return "Unmeasured";
  return `$${value.toFixed(value >= 100 ? 0 : 2)}`;
}

function percent(value: number | null) {
  if (value === null) return "Unmeasured";
  return `${value.toFixed(1)}%`;
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

export default async function FillYieldDashboard() {
  const model = await getAdgridFillYieldReadModel();

  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: "0 auto", color: "#fff" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, lineHeight: 1.1, fontWeight: 900, margin: 0 }}>AdGrid Fill and Yield</h1>
          <p style={{ margin: "6px 0 0", color: "#8a93a3", fontSize: 12 }}>
            Real telemetry from <code>hc_adgrid_events</code>, <code>hc_adgrid_outcome_events</code>, and <code>hc_ad_campaigns</code>.
          </p>
        </div>
        <div style={{ textAlign: "right", color: "#8a93a3", fontSize: 11 }}>
          <div>Updated {new Date(model.asOf).toLocaleString()}</div>
          <div>Revenue basis: {model.source.revenueBasis}</div>
        </div>
      </header>

      {model.error && (
        <section style={{ display: "flex", gap: 10, alignItems: "center", padding: 14, borderRadius: 10, border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.08)", color: "#F59E0B", marginBottom: 18 }}>
          <AlertTriangle size={18} />
          <div>
            <strong>Live AdGrid telemetry unavailable.</strong>
            <span style={{ marginLeft: 6, color: "#f8c471" }}>{model.error}</span>
          </div>
        </section>
      )}

      {model.measurementGaps.length > 0 && (
        <section style={{ display: "grid", gap: 8, marginBottom: 18 }}>
          {model.measurementGaps.map((gap) => (
            <div key={gap} style={{ display: "flex", gap: 10, alignItems: "center", padding: 12, borderRadius: 10, border: "1px solid rgba(59,130,246,0.25)", background: "rgba(59,130,246,0.06)", color: "#93C5FD", fontSize: 12 }}>
              <RadioTower size={15} />
              {gap}
            </div>
          ))}
        </section>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 24 }}>
        {kpi("Impressions", model.totals.impressions.toLocaleString(), "Canonical impression events", "#3B82F6")}
        {kpi("Clicks", model.totals.clicks.toLocaleString(), `${percent(model.totals.ctr)} CTR`, "#22C55E")}
        {kpi("Fill Rate", percent(model.totals.avgFillRate), `${model.totals.trackedRequests.toLocaleString()} request events`, "#F59E0B")}
        {kpi("Estimated Yield", money(model.totals.estimatedRevenueUsd), "Campaign spend + billed outcomes", "#C6923A")}
        {kpi("Active Campaigns", model.totals.activeCampaigns.toLocaleString(), `${model.totals.campaignCount.toLocaleString()} total campaigns`, "#A78BFA")}
      </section>

      <section style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <BarChart3 size={16} color="#C6923A" />
          <h2 style={{ fontSize: 15, fontWeight: 850, margin: 0 }}>Fill by Surface</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["Surface", "Requests", "Filled", "Fill", "Impressions", "Clicks", "CTR", "CPM", "CPC", "Yield"].map((heading) => (
                  <th key={heading} style={{ padding: "9px 12px", fontSize: 9, fontWeight: 850, color: "#8a93a3", textTransform: "uppercase", textAlign: heading === "Surface" ? "left" : "right" }}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {model.surfaces.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 24, color: "#8a93a3", fontSize: 13 }}>No AdGrid events have been recorded yet.</td>
                </tr>
              ) : model.surfaces.map((surface) => (
                <tr key={surface.surface} style={{ borderBottom: "1px solid rgba(255,255,255,0.035)" }}>
                  <td style={{ padding: "11px 12px", fontSize: 13, fontWeight: 800, color: "#fff" }}>{surface.surface}</td>
                  <td style={cellStyle}>{surface.trackedRequests.toLocaleString()}</td>
                  <td style={cellStyle}>{surface.filledImpressions.toLocaleString()}</td>
                  <td style={{ ...cellStyle, color: surface.fillRate === null ? "#8a93a3" : "#F59E0B", fontWeight: 850 }}>{percent(surface.fillRate)}</td>
                  <td style={cellStyle}>{surface.totalImpressions.toLocaleString()}</td>
                  <td style={cellStyle}>{surface.totalClicks.toLocaleString()}</td>
                  <td style={{ ...cellStyle, color: surface.ctr > 2 ? "#22C55E" : "#cbd5e1", fontWeight: 850 }}>{percent(surface.ctr)}</td>
                  <td style={cellStyle}>{money(surface.avgCpm)}</td>
                  <td style={cellStyle}>{money(surface.avgCpc)}</td>
                  <td style={{ ...cellStyle, color: "#C6923A", fontWeight: 850 }}>{money(surface.estimatedRevenueUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        <div style={{ padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#22C55E", fontSize: 11, fontWeight: 850, textTransform: "uppercase", marginBottom: 10 }}>
            <Target size={14} />
            Campaign Status
          </div>
          {Object.entries(model.statusCounts).length === 0 ? (
            <div style={{ color: "#8a93a3", fontSize: 13 }}>No campaign states recorded.</div>
          ) : Object.entries(model.statusCounts).map(([status, count]) => (
            <div key={status} style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: 13, padding: "5px 0" }}>
              <span>{status}</span>
              <strong>{count.toLocaleString()}</strong>
            </div>
          ))}
        </div>
        <div style={{ padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#C6923A", fontSize: 11, fontWeight: 850, textTransform: "uppercase", marginBottom: 10 }}>
            <DollarSign size={14} />
            Money Path
          </div>
          <p style={{ margin: 0, color: "#8a93a3", fontSize: 12, lineHeight: 1.5 }}>
            This dashboard now shows whether AdGrid is producing measurable impressions, clicks, outcomes, and active campaign yield. Missing request or outcome events are flagged as instrumentation gaps instead of hidden behind placeholder zeros.
          </p>
        </div>
        <div style={{ padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#3B82F6", fontSize: 11, fontWeight: 850, textTransform: "uppercase", marginBottom: 10 }}>
            <MousePointerClick size={14} />
            Next Instrumentation
          </div>
          <p style={{ margin: 0, color: "#8a93a3", fontSize: 12, lineHeight: 1.5 }}>
            Record explicit AdGrid request events in the serve path when you need true no-fill and fill-rate accounting across house ads, paid inventory, and blocked campaigns.
          </p>
        </div>
      </section>
    </main>
  );
}

const cellStyle = {
  padding: "11px 12px",
  textAlign: "right" as const,
  fontSize: 12,
  color: "#cbd5e1",
};
