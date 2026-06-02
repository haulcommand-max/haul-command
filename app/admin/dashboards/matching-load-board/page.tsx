import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AlertTriangle, CircleDollarSign, Clock, RadioTower, Route, Truck } from "lucide-react";
import { getMatchingLoadBoardReadModel } from "@/lib/admin/matching-load-board/read-model";

export const metadata: Metadata = {
  title: "Matching Load Board Activation - Haul Command Admin",
  description: "Supabase-backed activation console for loads, match offers, matches, stale queues, and revenue attribution.",
};

export const dynamic = "force-dynamic";

function percent(value: number) {
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

export default async function MatchingLoadBoardDashboard() {
  const model = await getMatchingLoadBoardReadModel();

  return (
    <main style={{ padding: 24, maxWidth: 1320, margin: "0 auto", color: "#fff" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, lineHeight: 1.1, fontWeight: 900, margin: 0 }}>Matching Load Board Activation</h1>
          <p style={{ margin: "6px 0 0", color: "#8a93a3", fontSize: 12 }}>
            Real ops telemetry from <code>loads</code>, <code>match_offers</code>, <code>matches</code>, <code>match_requests</code>, <code>match_outcomes</code>, and <code>hc_pay_revenue</code>.
          </p>
        </div>
        <div style={{ textAlign: "right", color: "#8a93a3", fontSize: 11 }}>
          <div>Updated {new Date(model.asOf).toLocaleString()}</div>
          <div>{model.sourceTables.length} source tables monitored</div>
        </div>
      </header>

      {model.activationGaps.length > 0 && (
        <section style={{ display: "grid", gap: 8, marginBottom: 18 }}>
          {model.activationGaps.slice(0, 5).map((gap) => (
            <div key={gap} style={{ display: "flex", gap: 10, alignItems: "center", padding: 12, borderRadius: 10, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.07)", color: "#F59E0B", fontSize: 12 }}>
              <AlertTriangle size={15} />
              {gap}
            </div>
          ))}
        </section>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 24 }}>
        {kpi("Open Loads", model.totals.openLoads.toLocaleString(), "load-board demand visible now", "#3B82F6")}
        {kpi("Pending Offers", model.totals.pendingOffers.toLocaleString(), "canonical match_offers open/viewed", "#C6923A")}
        {kpi("Accepted Matches", model.totals.acceptedMatches.toLocaleString(), "matches accepted/in progress/completed", "#22C55E")}
        {kpi("Stale Work", (model.totals.staleOffers + model.totals.staleMatchRequests).toLocaleString(), "offers or scored requests past 45 minutes", "#F59E0B")}
        {kpi("Decline Rate", percent(model.totals.declineRateLastHour), `${model.totals.outcomesLastHour} outcomes last hour`, "#EF4444")}
        {kpi("Countries", model.totals.countriesTouched.toLocaleString(), "load origin/destination coverage", "#A78BFA")}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 420px)", gap: 16, marginBottom: 18 }}>
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <RadioTower size={16} color="#C6923A" />
            <h2 style={{ fontSize: 15, fontWeight: 850, margin: 0 }}>Canonical Table Health</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {["Table", "Records", "Top Statuses", "State"].map((heading) => (
                    <th key={heading} style={{ padding: "9px 12px", fontSize: 9, fontWeight: 850, color: "#8a93a3", textTransform: "uppercase", textAlign: heading === "Table" ? "left" : "right" }}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.tables.map((table) => (
                  <tr key={table.table} style={{ borderBottom: "1px solid rgba(255,255,255,0.035)" }}>
                    <td style={{ padding: "11px 12px" }}>
                      <div style={{ color: "#fff", fontWeight: 850, fontSize: 13 }}>{table.label}</div>
                      <div style={{ color: "#8a93a3", fontSize: 10 }}>{table.table}</div>
                    </td>
                    <td style={cellStyle}>{table.error ? "Unreadable" : table.total.toLocaleString()}</td>
                    <td style={cellStyle}>{topStatuses(table.statusCounts)}</td>
                    <td style={{ ...cellStyle, color: table.error ? "#EF4444" : "#22C55E", fontWeight: 850 }}>{table.error ? "Gap" : "Live"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside style={{ display: "grid", gap: 12 }}>
          <OpsCard icon={<Clock size={15} />} label="Stale Offer Watch" value={model.totals.staleOffers.toLocaleString()} body="Open/viewed offers that are expired or have sat past the 45-minute response window." />
          <OpsCard icon={<Route size={15} />} label="Stale Match Queue" value={model.totals.staleMatchRequests.toLocaleString()} body="Scored match requests that have not moved to accepted matches fast enough." />
          <OpsCard icon={<CircleDollarSign size={15} />} label="Revenue Attribution" value={(model.tables.find((table) => table.table === "hc_pay_revenue")?.total ?? 0).toLocaleString()} body="Rows available to prove match-to-money conversion instead of decorative marketplace activity." />
        </aside>
      </section>

      <section style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)", padding: 18 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
          <Truck size={16} color="#3B82F6" />
          <h2 style={{ fontSize: 15, fontWeight: 850, margin: 0 }}>Recent Loads</h2>
        </div>
        {model.recentLoads.length === 0 ? (
          <div style={{ color: "#8a93a3", fontSize: 13 }}>No recent loads visible from the canonical load table.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {model.recentLoads.map((load) => (
              <div key={load.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 110px 130px", gap: 10, alignItems: "center", padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                <div>
                  <div style={{ color: "#fff", fontSize: 13, fontWeight: 850 }}>{load.lane}</div>
                  <div style={{ color: "#8a93a3", fontSize: 10 }}>{load.id}</div>
                </div>
                <div style={{ color: "#cbd5e1", fontSize: 12, textAlign: "right" }}>{load.service}</div>
                <div style={{ color: "#C6923A", fontSize: 12, fontWeight: 850, textAlign: "right" }}>{load.status}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function topStatuses(statusCounts: Record<string, number>) {
  const entries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return entries.length ? entries.map(([status, count]) => `${status}: ${count}`).join(", ") : "None";
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
