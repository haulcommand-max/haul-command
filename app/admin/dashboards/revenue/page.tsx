import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AlertTriangle, CircleDollarSign, Database, Globe2, ReceiptText, TrendingUp } from "lucide-react";
import { getRevenueCommandReadModel } from "@/lib/admin/revenue/read-model";

export const metadata: Metadata = {
  title: "Revenue Command Dashboard - Haul Command Admin",
  description: "Server-side monetization command surface for AdGrid, data products, HC Pay, checkout intent, abandoned checkout, billing, and payment rails.",
};

export const dynamic = "force-dynamic";

const money = (value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const trendGlyph = (value: string) => (value === "up" ? "UP" : value === "down" ? "DOWN" : "FLAT");
const statusColor = (status: string) => {
  if (status === "live") return "#22C55E";
  if (status === "pipeline") return "#F59E0B";
  if (status === "planned") return "#38BDF8";
  return "#EF4444";
};

function kpi(label: string, value: string, sub: string, color: string) {
  return (
    <div style={{ padding: 18, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
      <div style={{ color, fontSize: 10, fontWeight: 850, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ color: "#fff", fontSize: 27, fontWeight: 900 }}>{value}</div>
      <div style={{ color: "#8a93a3", fontSize: 11, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

export default async function RevenueDashboard() {
  const model = await getRevenueCommandReadModel();

  return (
    <main style={{ padding: 24, maxWidth: 1320, margin: "0 auto", color: "#fff" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, lineHeight: 1.1, fontWeight: 900, margin: 0 }}>Revenue Command</h1>
          <p style={{ margin: "6px 0 0", color: "#8a93a3", fontSize: 12 }}>
            Server-side money telemetry from <code>hc_adgrid_events</code>, <code>data_purchases</code>, <code>hc_pay_revenue</code>, <code>hc_checkout_intents</code>, <code>hc_abandoned_checkouts</code>, <code>hc_billing_prices</code>, and <code>payments</code>.
          </p>
        </div>
        <div style={{ textAlign: "right", color: "#8a93a3", fontSize: 11 }}>
          <div>Updated {new Date(model.asOf).toLocaleString()}</div>
          <div>{model.sourceTables.length} money tables monitored</div>
        </div>
      </header>

      {model.activationGaps.length > 0 && (
        <section style={{ display: "grid", gap: 8, marginBottom: 18 }}>
          {model.activationGaps.slice(0, 6).map((gap) => (
            <div key={gap} style={{ display: "flex", gap: 10, alignItems: "center", padding: 12, borderRadius: 10, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.07)", color: "#F59E0B", fontSize: 12 }}>
              <AlertTriangle size={15} />
              {gap}
            </div>
          ))}
        </section>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 24 }}>
        {kpi("Earned Today", money(model.totals.todayUsd), "recognized live money rows", "#22C55E")}
        {kpi("Earned 7 Days", money(model.totals.weekUsd), "AdGrid, data, HC Pay, payments", "#3B82F6")}
        {kpi("Earned 30 Days", money(model.totals.monthUsd), "server-read canonical rails", "#C6923A")}
        {kpi("Total Earned", money(model.totals.totalUsd), "not counting planned pipeline", "#A78BFA")}
        {kpi("Pipeline / Planned", money(model.totals.pendingUsd), "checkout, abandoned, price readiness", "#F59E0B")}
        {kpi("Gaps", model.totals.gapCount.toLocaleString(), "unreadable or empty rails", "#EF4444")}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 420px)", gap: 16, marginBottom: 18 }}>
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <CircleDollarSign size={16} color="#C6923A" />
            <h2 style={{ fontSize: 15, fontWeight: 850, margin: 0 }}>Revenue by Surface</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {["Surface", "Today", "7 Days", "30 Days", "Total", "Pipeline", "State", "Trend"].map((heading) => (
                    <th key={heading} style={{ padding: "9px 12px", fontSize: 9, fontWeight: 850, color: "#8a93a3", textTransform: "uppercase", textAlign: heading === "Surface" ? "left" : "right" }}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.surfaces.map((row) => (
                  <tr key={row.surface} style={{ borderBottom: "1px solid rgba(255,255,255,0.035)" }}>
                    <td style={{ padding: "11px 12px" }}>
                      <div style={{ color: "#fff", fontWeight: 850, fontSize: 13 }}>{row.surface}</div>
                      <div style={{ color: "#8a93a3", fontSize: 10 }}>{row.sourceTable}</div>
                      <div style={{ color: "#64748b", fontSize: 10 }}>{row.basis}</div>
                    </td>
                    <td style={cellStyle}>{money(row.todayUsd)}</td>
                    <td style={cellStyle}>{money(row.weekUsd)}</td>
                    <td style={cellStyle}>{money(row.monthUsd)}</td>
                    <td style={cellStyle}>{money(row.totalUsd)}</td>
                    <td style={cellStyle}>{money(row.pendingUsd)}</td>
                    <td style={{ ...cellStyle, color: statusColor(row.status), fontWeight: 850 }}>{row.status.toUpperCase()}</td>
                    <td style={{ ...cellStyle, color: row.trend === "up" ? "#22C55E" : row.trend === "down" ? "#EF4444" : "#8a93a3", fontWeight: 850 }}>{trendGlyph(row.trend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside style={{ display: "grid", gap: 12 }}>
          <OpsCard icon={<ReceiptText size={15} />} label="Live Surfaces" value={model.totals.liveSurfaces.toLocaleString()} body="Surfaces with readable earned-revenue telemetry." />
          <OpsCard icon={<TrendingUp size={15} />} label="Pipeline Surfaces" value={model.totals.pipelineSurfaces.toLocaleString()} body="Checkout intent, abandoned checkout, and price-readiness pools that need conversion follow-up." />
          <OpsCard icon={<Database size={15} />} label="Source Tables" value={model.sourceTables.length.toLocaleString()} body="Canonical money rails monitored without browser admin-secret fetches or placeholder zero rows." />
        </aside>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16 }}>
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Globe2 size={16} color="#38BDF8" />
            <h2 style={{ fontSize: 15, fontWeight: 850, margin: 0 }}>Country Money Signals</h2>
          </div>
          {model.countries.length === 0 ? (
            <p style={{ margin: 0, padding: 18, color: "#8a93a3", fontSize: 12 }}>No country-tagged checkout or data-product money signals are visible yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 8, padding: 14 }}>
              {model.countries.map((country) => (
                <div key={country.code} style={{ display: "grid", gridTemplateColumns: "70px 1fr 1fr 70px", gap: 10, alignItems: "center", padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                  <div style={{ color: "#fff", fontWeight: 900 }}>{country.code}</div>
                  <div style={{ color: "#22C55E", fontSize: 12 }}>Earned {money(country.revenueUsd)}</div>
                  <div style={{ color: "#F59E0B", fontSize: 12 }}>Pipeline {money(country.pendingUsd)}</div>
                  <div style={{ color: "#8a93a3", fontSize: 11, textAlign: "right" }}>{country.records} rows</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Database size={16} color="#A78BFA" />
            <h2 style={{ fontSize: 15, fontWeight: 850, margin: 0 }}>Money Table Health</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {["Table", "Rows", "State", "Basis"].map((heading) => (
                    <th key={heading} style={{ padding: "9px 12px", fontSize: 9, fontWeight: 850, color: "#8a93a3", textTransform: "uppercase", textAlign: heading === "Table" ? "left" : "right" }}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.tableHealth.map((table) => (
                  <tr key={table.table} style={{ borderBottom: "1px solid rgba(255,255,255,0.035)" }}>
                    <td style={{ padding: "11px 12px", color: "#fff", fontSize: 12, fontWeight: 850 }}>{table.table}</td>
                    <td style={cellStyle}>{table.records.toLocaleString()}</td>
                    <td style={{ ...cellStyle, color: table.state === "live" ? "#22C55E" : "#EF4444", fontWeight: 850 }}>{table.state.toUpperCase()}</td>
                    <td style={cellStyle}>{table.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function OpsCard({ icon, label, value, body }: { icon: ReactNode; label: string; value: string; body: string }) {
  return (
    <div style={{ padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#C6923A", fontSize: 11, fontWeight: 850, textTransform: "uppercase", marginBottom: 8 }}>
        {icon}
        {label}
      </div>
      <div style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginBottom: 6 }}>{value}</div>
      <p style={{ color: "#8a93a3", fontSize: 12, lineHeight: 1.45, margin: 0 }}>{body}</p>
    </div>
  );
}

const cellStyle = {
  padding: "11px 12px",
  textAlign: "right" as const,
  fontSize: 12,
  color: "#cbd5e1",
};
