export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Directory Truth Dashboard | Haul Command Admin",
  robots: "noindex, nofollow",
};

type HealthRow = {
  total_operators?: number;
  total_listings?: number;
  operators_with_state?: number;
  operators_with_city?: number;
  national_scope_operators?: number;
  unclaimed?: number;
  claimed?: number;
  verified?: number;
  orphan_count?: number;
  link_mesh_edges?: number;
  last_rehydrate_at?: string | null;
  index_freshness_minutes?: number | null;
  last_pipeline_status?: string | null;
  truck_stops?: number;
  hotels?: number;
  terminals?: number;
};

type EntityHealth = {
  entity_type: string;
  total: number;
  missing_city: number;
  missing_region: number;
  missing_geo: number;
  hidden: number;
  unclaimed: number;
  avg_rank_score: string | number | null;
  avg_completeness: string | number | null;
};

type PipelineRun = {
  id: string;
  run_type: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  entities_scanned: number;
  entities_upserted: number;
  orphans_fixed: number;
  errors: number;
  error_sample: string | null;
};

type QueueHealth = {
  queue_name: string;
  queue_state: string;
  item_count: number | string;
  oldest_created_at: string | null;
  newest_updated_at: string | null;
  operational_state: string;
};

function number(value: unknown) {
  return Number(value ?? 0).toLocaleString();
}

function pct(numerator = 0, denominator = 0) {
  if (!denominator) return "0.0";
  return ((numerator / denominator) * 100).toFixed(1);
}

function healthColor(state?: string) {
  if (!state) return "#94a3b8";
  if (state.includes("backlog") || state.includes("ingestion")) return "#f59e0b";
  if (state.includes("quarantined") || state.includes("resolved") || state.includes("clear")) return "#22c55e";
  if (state.includes("review")) return "#ef4444";
  return "#38bdf8";
}

function card(label: string, value: string | number | undefined, color = "#d4950e") {
  return (
    <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: "1rem" }}>
      <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ color, fontSize: 24, fontWeight: 750, marginTop: 6 }}>{value ?? 0}</div>
    </div>
  );
}

export default async function DirectoryHealthPage() {
  const svc = getSupabaseAdmin();

  const [healthRes, entityRes, runsRes, queueRes] = await Promise.all([
    svc.from("directory_admin_health").select("*").single(),
    svc.from("directory_entity_health").select("*").order("total", { ascending: false }).limit(80),
    svc.from("pipeline_runs").select("*").order("started_at", { ascending: false }).limit(10),
    svc.from("v_hc_execution_queue_health").select("*").order("queue_name", { ascending: true }),
  ]);

  const health = (healthRes.data ?? {}) as HealthRow;
  const entities = (entityRes.data ?? []) as EntityHealth[];
  const runs = (runsRes.data ?? []) as PipelineRun[];
  const queues = (queueRes.data ?? []) as QueueHealth[];

  const totalOperators = Number(health.total_operators ?? 0);
  const statePct = pct(Number(health.operators_with_state ?? 0), totalOperators);
  const cityPct = pct(Number(health.operators_with_city ?? 0), totalOperators);
  const isFresh = Number(health.index_freshness_minutes ?? 999999) < 1500;
  const queueBacklog = queues.filter((q) => q.operational_state.includes("backlog") || q.operational_state.includes("ingestion"));
  const queueNeedsReview = queues.filter((q) => q.operational_state.includes("review"));

  return (
    <main style={{ padding: "2rem", maxWidth: 1280, margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif", color: "#e5e7eb" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <p style={{ color: "#d4950e", margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Haul Command Admin
        </p>
        <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: "0.25rem 0" }}>Directory Truth Dashboard</h1>
        <p style={{ color: "#94a3b8", maxWidth: 860, margin: 0 }}>
          Source-of-truth status for directory coverage, claim pressure, execution queues, ingestion, and index activation.
          Pending queues are active work; quarantined rows are intentionally held out of SEO until they are enriched.
        </p>
      </header>

      {(healthRes.error || entityRes.error || runsRes.error || queueRes.error) && (
        <section style={{ background: "#451a03", border: "1px solid #92400e", borderRadius: 8, padding: "1rem", marginBottom: "1.5rem" }}>
          <strong style={{ color: "#fbbf24" }}>Dashboard data gap</strong>
          <p style={{ color: "#fde68a", margin: "0.5rem 0 0" }}>
            One or more health views could not be read. Check Supabase view grants, migrations, and admin service-role env wiring.
          </p>
        </section>
      )}

      {queueNeedsReview.length > 0 && (
        <section style={{ background: "#450a0a", border: "1px solid #b91c1c", borderRadius: 8, padding: "1rem", marginBottom: "1.5rem" }}>
          <strong style={{ color: "#fca5a5" }}>Queue review required</strong>
          <p style={{ color: "#fecaca", margin: "0.5rem 0 0" }}>
            {queueNeedsReview.length} queue state(s) need manual review before claiming full operational health.
          </p>
        </section>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {card("Operators", number(health.total_operators), "#60a5fa")}
        {card("Listings", number(health.total_listings), "#a78bfa")}
        {card("With State", `${statePct}%`, Number(statePct) > 95 ? "#22c55e" : "#f59e0b")}
        {card("With City", `${cityPct}%`, Number(cityPct) > 50 ? "#22c55e" : "#f59e0b")}
        {card("Orphans", number(health.orphan_count), Number(health.orphan_count ?? 0) === 0 ? "#22c55e" : "#ef4444")}
        {card("Unclaimed", number(health.unclaimed), "#f59e0b")}
        {card("Verified", number(health.verified), "#22c55e")}
        {card("Freshness", isFresh ? "Fresh" : "Stale", isFresh ? "#22c55e" : "#ef4444")}
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "end", marginBottom: "0.75rem" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Execution Queue Health</h2>
            <p style={{ color: "#94a3b8", margin: "0.25rem 0 0", fontSize: 13 }}>
              {queueBacklog.length} active backlog state(s). Backlog is acceptable when newest timestamps are moving.
            </p>
          </div>
        </div>
        <div style={{ overflowX: "auto", border: "1px solid #1f2937", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0f172a", color: "#94a3b8" }}>
                {["Queue", "State", "Items", "Operational State", "Oldest", "Newest"].map((h) => (
                  <th key={h} style={{ padding: "0.65rem", textAlign: "left", fontWeight: 650 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queues.map((q) => (
                <tr key={`${q.queue_name}:${q.queue_state}`} style={{ borderTop: "1px solid #1f2937" }}>
                  <td style={{ padding: "0.65rem", fontWeight: 700 }}>{q.queue_name}</td>
                  <td style={{ padding: "0.65rem" }}>{q.queue_state}</td>
                  <td style={{ padding: "0.65rem", color: "#d4950e", fontWeight: 700 }}>{number(q.item_count)}</td>
                  <td style={{ padding: "0.65rem", color: healthColor(q.operational_state), fontWeight: 700 }}>{q.operational_state}</td>
                  <td style={{ padding: "0.65rem", color: "#94a3b8" }}>{q.oldest_created_at ? new Date(q.oldest_created_at).toLocaleString() : "-"}</td>
                  <td style={{ padding: "0.65rem", color: "#94a3b8" }}>{q.newest_updated_at ? new Date(q.newest_updated_at).toLocaleString() : "-"}</td>
                </tr>
              ))}
              {queues.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "1rem", color: "#94a3b8" }}>
                    No queue health rows returned. Verify v_hc_execution_queue_health exists and is granted to the runtime role.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {card("Truck Stops", number(health.truck_stops), "#60a5fa")}
        {card("Hotels", number(health.hotels), "#a78bfa")}
        {card("Terminals", number(health.terminals), "#38bdf8")}
        {card("Link Mesh Edges", number(health.link_mesh_edges), "#22c55e")}
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>Entity Health by Type</h2>
        <div style={{ overflowX: "auto", border: "1px solid #1f2937", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0f172a", color: "#94a3b8" }}>
                {["Type", "Total", "No City", "No State", "No Geo", "Hidden", "Unclaimed", "Avg Rank", "Avg Complete"].map((h) => (
                  <th key={h} style={{ padding: "0.65rem", textAlign: "left", fontWeight: 650 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entities.map((e) => (
                <tr key={e.entity_type} style={{ borderTop: "1px solid #1f2937" }}>
                  <td style={{ padding: "0.65rem", fontWeight: 700 }}>{e.entity_type}</td>
                  <td style={{ padding: "0.65rem", color: "#60a5fa" }}>{number(e.total)}</td>
                  <td style={{ padding: "0.65rem", color: e.missing_city > 0 ? "#f59e0b" : "#22c55e" }}>{number(e.missing_city)}</td>
                  <td style={{ padding: "0.65rem", color: e.missing_region > 0 ? "#f59e0b" : "#22c55e" }}>{number(e.missing_region)}</td>
                  <td style={{ padding: "0.65rem", color: e.missing_geo > 0 ? "#94a3b8" : "#22c55e" }}>{number(e.missing_geo)}</td>
                  <td style={{ padding: "0.65rem" }}>{number(e.hidden)}</td>
                  <td style={{ padding: "0.65rem" }}>{number(e.unclaimed)}</td>
                  <td style={{ padding: "0.65rem" }}>{e.avg_rank_score ?? "-"}</td>
                  <td style={{ padding: "0.65rem" }}>{Number(e.avg_completeness ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>Pipeline Run History</h2>
        <div style={{ overflowX: "auto", border: "1px solid #1f2937", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0f172a", color: "#94a3b8" }}>
                {["Type", "Started", "Finished", "Status", "Scanned", "Upserted", "Orphans Fixed", "Errors"].map((h) => (
                  <th key={h} style={{ padding: "0.65rem", textAlign: "left", fontWeight: 650 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #1f2937" }}>
                  <td style={{ padding: "0.65rem", fontWeight: 700 }}>{r.run_type}</td>
                  <td style={{ padding: "0.65rem", color: "#94a3b8" }}>{r.started_at ? new Date(r.started_at).toLocaleString() : "-"}</td>
                  <td style={{ padding: "0.65rem", color: "#94a3b8" }}>{r.finished_at ? new Date(r.finished_at).toLocaleString() : "-"}</td>
                  <td style={{ padding: "0.65rem", color: r.status === "success" ? "#22c55e" : r.status === "running" ? "#60a5fa" : "#f87171", fontWeight: 700 }}>{r.status}</td>
                  <td style={{ padding: "0.65rem" }}>{number(r.entities_scanned)}</td>
                  <td style={{ padding: "0.65rem" }}>{number(r.entities_upserted)}</td>
                  <td style={{ padding: "0.65rem" }}>{number(r.orphans_fixed)}</td>
                  <td style={{ padding: "0.65rem", color: r.errors > 0 ? "#ef4444" : "#94a3b8" }}>
                    {number(r.errors)}{r.error_sample ? ` - ${r.error_sample}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
