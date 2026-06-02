import type { Metadata } from "next";
import { AlertTriangle, BarChart3, CheckCircle2, MousePointerClick, Palette, RadioTower, Target } from "lucide-react";
import { getAdgridCreativePerformanceReadModel } from "@/lib/admin/adgrid/creative-performance-read-model";

export const metadata: Metadata = {
  title: "AdGrid Creative Performance - Haul Command Admin",
  description: "Canonical AdGrid creative, impression, click, conversion, and revenue performance dashboard.",
};

export const dynamic = "force-dynamic";

function money(value: number) {
  return `$${value.toFixed(value >= 100 ? 0 : 2)}`;
}

function percent(value: number) {
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

export default async function CreativePerformanceDashboard() {
  const model = await getAdgridCreativePerformanceReadModel();

  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: "0 auto", color: "#fff" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, lineHeight: 1.1, fontWeight: 900, margin: 0 }}>AdGrid Creative Performance</h1>
          <p style={{ margin: "6px 0 0", color: "#8a93a3", fontSize: 12 }}>
            Canonical creative telemetry from <code>hc_ad_creatives</code>, <code>hc_adgrid_impressions</code>, <code>hc_adgrid_clicks</code>, and outcome events.
          </p>
        </div>
        <div style={{ textAlign: "right", color: "#8a93a3", fontSize: 11 }}>
          <div>Updated {new Date(model.asOf).toLocaleString()}</div>
          <div>Attribution: {model.source.attributionBasis}</div>
        </div>
      </header>

      {model.error && (
        <section style={{ display: "flex", gap: 10, alignItems: "center", padding: 14, borderRadius: 10, border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.08)", color: "#F59E0B", marginBottom: 18 }}>
          <AlertTriangle size={18} />
          <div>
            <strong>Live creative performance unavailable.</strong>
            <span style={{ marginLeft: 6, color: "#f8c471" }}>{model.error}</span>
          </div>
        </section>
      )}

      {model.activationGaps.length > 0 && (
        <section style={{ display: "grid", gap: 8, marginBottom: 18 }}>
          {model.activationGaps.map((gap) => (
            <div key={gap} style={{ display: "flex", gap: 10, alignItems: "center", padding: 12, borderRadius: 10, border: "1px solid rgba(59,130,246,0.25)", background: "rgba(59,130,246,0.06)", color: "#93C5FD", fontSize: 12 }}>
              <RadioTower size={15} />
              {gap}
            </div>
          ))}
        </section>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 24 }}>
        {kpi("Creatives", model.totals.creatives.toLocaleString(), `${model.totals.activeCreatives.toLocaleString()} active`, "#A78BFA")}
        {kpi("Approved", model.totals.approvedCreatives.toLocaleString(), "Active or approved inactive", "#22C55E")}
        {kpi("Event Backed", model.totals.eventBackedCreatives.toLocaleString(), "Has performance or revenue signal", "#3B82F6")}
        {kpi("Impressions", model.totals.impressions.toLocaleString(), `${model.totals.clicks.toLocaleString()} clicks`, "#F59E0B")}
        {kpi("CTR", percent(model.totals.ctr), "Canonical impression/click basis", "#38BDF8")}
        {kpi("Revenue", money(model.totals.revenueUsd), `${model.totals.conversions.toLocaleString()} outcomes`, "#C6923A")}
      </section>

      <section style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <BarChart3 size={16} color="#C6923A" />
          <h2 style={{ fontSize: 15, fontWeight: 850, margin: 0 }}>Creative Winners and Gaps</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1060 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["Creative", "Advertiser", "Market", "Surface", "Type", "Score", "Impr.", "Clicks", "CTR", "Conv.", "Revenue", "Status"].map((heading) => (
                  <th key={heading} style={{ padding: "9px 12px", fontSize: 9, fontWeight: 850, color: "#8a93a3", textTransform: "uppercase", textAlign: ["Creative", "Advertiser"].includes(heading) ? "left" : "right" }}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {model.rows.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: 24, color: "#8a93a3", fontSize: 13 }}>No canonical AdGrid creatives have been created yet.</td>
                </tr>
              ) : model.rows.map((row) => (
                <tr key={row.creativeId} style={{ borderBottom: "1px solid rgba(255,255,255,0.035)" }}>
                  <td style={{ padding: "11px 12px", fontSize: 13, fontWeight: 850, color: "#fff", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.headline}</td>
                  <td style={{ padding: "11px 12px", fontSize: 12, color: "#cbd5e1", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.advertiserName}</td>
                  <td style={cellStyle}>{row.country}</td>
                  <td style={cellStyle}>{row.surface}</td>
                  <td style={cellStyle}>{row.creativeType}</td>
                  <td style={{ ...cellStyle, color: row.scoreComposite >= 0.7 ? "#22C55E" : "#F59E0B", fontWeight: 850 }}>{percent(row.scoreComposite * 100)}</td>
                  <td style={cellStyle}>{row.impressions.toLocaleString()}</td>
                  <td style={cellStyle}>{row.clicks.toLocaleString()}</td>
                  <td style={{ ...cellStyle, color: row.ctr > 2 ? "#22C55E" : "#cbd5e1", fontWeight: 850 }}>{percent(row.ctr)}</td>
                  <td style={cellStyle}>{row.conversions.toLocaleString()}</td>
                  <td style={{ ...cellStyle, color: "#C6923A", fontWeight: 850 }}>{money(row.revenueUsd)}</td>
                  <td style={{ ...cellStyle, color: row.status === "active" ? "#22C55E" : "#8a93a3", fontWeight: 850 }}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        <div style={panelStyle}>
          <div style={panelTitleStyle("#22C55E")}><CheckCircle2 size={14} /> Canonical Source</div>
          <p style={panelCopyStyle}>
            This dashboard no longer depends on a missing client route. It reads the same canonical creative and telemetry tables used by the serving, click, and attribution paths.
          </p>
        </div>
        <div style={panelStyle}>
          <div style={panelTitleStyle("#C6923A")}><Palette size={14} /> Creative Status</div>
          {Object.entries(model.statusCounts).length === 0 ? (
            <div style={{ color: "#8a93a3", fontSize: 13 }}>No creative states recorded.</div>
          ) : Object.entries(model.statusCounts).map(([status, count]) => (
            <div key={status} style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: 13, padding: "5px 0" }}>
              <span>{status}</span>
              <strong>{count.toLocaleString()}</strong>
            </div>
          ))}
        </div>
        <div style={panelStyle}>
          <div style={panelTitleStyle("#3B82F6")}><MousePointerClick size={14} /> Winner Rule</div>
          <p style={panelCopyStyle}>
            Creatives are ranked by attached outcome revenue first, then impressions, then quality score. Rows without events stay visible as activation gaps instead of silently disappearing.
          </p>
        </div>
        <div style={panelStyle}>
          <div style={panelTitleStyle("#A78BFA")}><Target size={14} /> Money Path</div>
          <p style={panelCopyStyle}>
            Impression, click, and conversion rows now show whether each creative can support sponsor reporting, A/B winner selection, and paid AdGrid performance review.
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

const panelStyle = {
  padding: 16,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.025)",
};

function panelTitleStyle(color: string) {
  return {
    display: "flex",
    gap: 8,
    alignItems: "center",
    color,
    fontSize: 11,
    fontWeight: 850,
    textTransform: "uppercase" as const,
    marginBottom: 10,
  };
}

const panelCopyStyle = {
  margin: 0,
  color: "#8a93a3",
  fontSize: 12,
  lineHeight: 1.5,
};
