import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AlertTriangle, FileCheck2, Gauge, LockKeyhole, RadioTower, ShieldCheck, UserCheck } from "lucide-react";
import { getClaimsOpsReadModel } from "@/lib/admin/claims-ops/read-model";

export const metadata: Metadata = {
  title: "Claims Ops Dashboard - Haul Command Admin",
  description: "Supabase-backed claim activation console for surfaces, moderated claim requests, claim sessions, pressure targets, outreach, and guardrails.",
};

export const dynamic = "force-dynamic";

function kpi(label: string, value: string, sub: string, color: string) {
  return (
    <div style={{ padding: 18, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
      <div style={{ color, fontSize: 10, fontWeight: 850, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ color: "#fff", fontSize: 27, fontWeight: 900 }}>{value}</div>
      <div style={{ color: "#8a93a3", fontSize: 11, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

export default async function ClaimsOpsDashboard() {
  // Admin access for /admin/* is enforced in proxy.ts before this service-role read model runs.
  const model = await getClaimsOpsReadModel();

  return (
    <main style={{ padding: 24, maxWidth: 1360, margin: "0 auto", color: "#fff" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, lineHeight: 1.1, fontWeight: 900, margin: 0 }}>Claims Ops</h1>
          <p style={{ margin: "6px 0 0", color: "#8a93a3", fontSize: 12 }}>
            Read-only claim activation telemetry across <code>surfaces</code>, <code>claims</code>, <code>hc_claim_requests</code>, <code>listing_claims</code>, <code>hc_claim_sessions</code>, pressure, outreach, and governor tables.
          </p>
        </div>
        <div style={{ textAlign: "right", color: "#8a93a3", fontSize: 11 }}>
          <div>Updated {new Date(model.asOf).toLocaleString()}</div>
          <div>{model.sourceTables.length} source tables monitored</div>
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
        {kpi("Claimable Surfaces", model.totals.claimableSurfaces.toLocaleString(), `${model.totals.surfacesVisible.toLocaleString()} surfaces visible`, "#3B82F6")}
        {kpi("Claim Coverage", `${model.totals.coveragePct.toFixed(1)}%`, `${model.totals.claimedSurfaces.toLocaleString()} claimed surfaces`, "#22C55E")}
        {kpi("Pending Review", (model.totals.pendingDirectoryRequests + model.totals.pendingSurfaceClaims).toLocaleString(), "directory requests and surface pending claims", "#C6923A")}
        {kpi("Active Sessions", model.totals.activeClaimSessions.toLocaleString(), "entity claim wizard sessions", "#A78BFA")}
        {kpi("Pressure Targets", model.totals.openPressureTargets.toLocaleString(), "open claim pressure actions", "#F59E0B")}
        {kpi("Outreach Guardrails", (model.totals.pausedGovernorRules + model.totals.suppressionRules).toLocaleString(), "pause rules plus suppressions", "#EF4444")}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 420px)", gap: 16, marginBottom: 18 }}>
        <Panel title="Source System Health" icon={<RadioTower size={16} color="#C6923A" />}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {["System", "Records", "Top States", "State"].map((heading) => (
                    <th key={heading} style={{ padding: "9px 12px", fontSize: 9, fontWeight: 850, color: "#8a93a3", textTransform: "uppercase", textAlign: heading === "System" ? "left" : "right" }}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.tables.map((table) => (
                  <tr key={table.table} style={{ borderBottom: "1px solid rgba(255,255,255,0.035)" }}>
                    <td style={{ padding: "11px 12px" }}>
                      <div style={{ color: "#fff", fontWeight: 850, fontSize: 13 }}>{table.label}</div>
                      <div style={{ color: "#8a93a3", fontSize: 10 }}>{table.table}{table.note ? ` - ${table.note}` : ""}</div>
                    </td>
                    <td style={cellStyle}>{table.error ? "Unreadable" : table.total.toLocaleString()}</td>
                    <td style={cellStyle}>{topStatuses(table.statusCounts)}</td>
                    <td style={{ ...cellStyle, color: table.error ? "#EF4444" : "#22C55E", fontWeight: 850 }}>{table.error ? "Gap" : "Live"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <aside style={{ display: "grid", gap: 12 }}>
          <OpsCard icon={<ShieldCheck size={15} />} label="Outreach Queue" value={model.totals.outreachQueued.toLocaleString()} body={`${model.totals.outreachSentLast7d.toLocaleString()} outreach events sent or created in the last 7 days.`} />
          <OpsCard icon={<Gauge size={15} />} label="Pressure Score" value={model.pressure.topOpenPriorityScore === null ? "Unmeasured" : model.pressure.topOpenPriorityScore.toFixed(1)} body="Top open claim-pressure priority score, if the target table is readable." />
          <OpsCard icon={<FileCheck2 size={15} />} label="Audit Trail" value={model.totals.auditEventsLast7d.toLocaleString()} body="Claim audit events recorded in the last 7 days without exposing payloads." />
        </aside>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 420px)", gap: 16 }}>
        <Panel title="Top Claim Markets" icon={<UserCheck size={16} color="#3B82F6" />}>
          {model.topCountries.length === 0 ? (
            <div style={{ color: "#8a93a3", fontSize: 13 }}>No claim KPI markets visible from <code>claim_kpi_summary</code>.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {model.topCountries.map((market) => (
                <div key={`${market.countryCode}-${market.surfaceType}`} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 110px 100px", gap: 10, alignItems: "center", padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                  <div>
                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 850 }}>{market.countryCode.toUpperCase()} / {market.surfaceType}</div>
                    <div style={{ color: "#8a93a3", fontSize: 10 }}>{market.claimable.toLocaleString()} claimable - {market.tierAB.toLocaleString()} tier A/B</div>
                  </div>
                  <div style={{ color: "#cbd5e1", fontSize: 12, textAlign: "right" }}>{market.total.toLocaleString()} total</div>
                  <div style={{ color: "#22C55E", fontSize: 12, fontWeight: 850, textAlign: "right" }}>{market.coveragePct.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Safety Guardrails" icon={<LockKeyhole size={16} color="#EF4444" />}>
          {model.guardrails.map((guardrail) => (
            <div key={guardrail} style={{ padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#cbd5e1", fontSize: 12, lineHeight: 1.45 }}>
              {guardrail}
            </div>
          ))}
        </Panel>
      </section>
    </main>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
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

function topStatuses(statusCounts: Record<string, number>) {
  const entries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return entries.length ? entries.map(([status, count]) => `${status}: ${count}`).join(", ") : "Aggregate";
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
