export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
    title: "Directory Truth Dashboard | Haul Command Admin",
    robots: "noindex, nofollow",
};

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

type HealthRow = {
    total_operators: number;
    total_listings: number;
    operators_with_state: number;
    operators_with_city: number;
    national_scope_operators: number;
    unclaimed: number;
    claimed: number;
    verified: number;
    orphan_count: number;
    link_mesh_edges: number;
    last_rehydrate_at: string | null;
    index_freshness_minutes: number | null;
    last_pipeline_status: string | null;
    truck_stops: number;
    hotels: number;
    terminals: number;
};

type EntityHealth = {
    entity_type: string;
    total: number;
    missing_city: number;
    missing_region: number;
    missing_geo: number;
    hidden: number;
    unclaimed: number;
    claimed: number;
    verified: number;
    avg_rank_score: string;
    avg_completeness: string;
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

export default async function DirectoryHealthPage() {
    const svc = getSupabase();

    const [healthRes, entityRes, runsRes] = await Promise.all([
        svc.from("directory_admin_health").select("*").single(),
        svc.from("directory_entity_health").select("*"),
        svc.from("pipeline_runs").select("*").order("started_at", { ascending: false }).limit(10),
    ]);

    const health = (healthRes.data as HealthRow) || {} as HealthRow;
    const entities = (entityRes.data as EntityHealth[]) || [];
    const runs = (runsRes.data as PipelineRun[]) || [];

    const statePct = health.total_operators
        ? ((health.operators_with_state / health.total_operators) * 100).toFixed(1)
        : "0";
    const cityPct = health.total_operators
        ? ((health.operators_with_city / health.total_operators) * 100).toFixed(1)
        : "0";

    const isOrphanAlert = health.orphan_count > 0;
    const isCronAlert = health.last_pipeline_status === "failed";
    const isFreshness = (health.index_freshness_minutes ?? 999) < 1500; // 25 hours

    return (
        <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif", color: "#e2e8f0" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                🛡️ Directory Truth Dashboard
            </h1>
            <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>
                Real-time health of the Haul Command entity index. Supabase is source of truth.
            </p>

            {/* Alert Banner */}
            {(isOrphanAlert || isCronAlert) && (
                <div style={{
                    background: "#7f1d1d", border: "1px solid #dc2626", borderRadius: 8,
                    padding: "1rem", marginBottom: "1.5rem",
                }}>
                    <strong style={{ color: "#fca5a5" }}>🚨 CRITICAL ALERTS</strong>
                    {isOrphanAlert && <p style={{ color: "#fecaca", margin: "0.5rem 0 0" }}>
                        {health.orphan_count} orphan provider(s) detected — entities in Supabase not in directory index
                    </p>}
                    {isCronAlert && <p style={{ color: "#fecaca", margin: "0.5rem 0 0" }}>
                        Last pipeline run failed — check pipeline_runs table
                    </p>}
                </div>
            )}

            {/* Top Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                {[
                    { label: "Operators", value: health.total_operators, color: "#3b82f6" },
                    { label: "Listings", value: health.total_listings, color: "#8b5cf6" },
                    { label: "% w/ State", value: `${statePct}%`, color: parseFloat(statePct) > 95 ? "#22c55e" : "#f59e0b" },
                    { label: "% w/ City", value: `${cityPct}%`, color: parseFloat(cityPct) > 50 ? "#22c55e" : "#f59e0b" },
                    { label: "Orphans", value: health.orphan_count, color: health.orphan_count === 0 ? "#22c55e" : "#ef4444" },
                    { label: "Link Mesh", value: health.link_mesh_edges, color: "#06b6d4" },
                    { label: "National Scope", value: health.national_scope_operators, color: "#a855f7" },
                    { label: "Freshness", value: isFreshness ? "✅ Fresh" : "⚠️ Stale", color: isFreshness ? "#22c55e" : "#ef4444" },
                ].map((s, i) => (
                    <div key={i} style={{
                        background: "#1e293b", borderRadius: 8, padding: "1rem",
                        borderLeft: `4px solid ${s.color}`,
                    }}>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {s.label}
                        </div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color, marginTop: 4 }}>
                            {s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Claim Status */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
                <div style={{ background: "#1e293b", borderRadius: 8, padding: "1rem", textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#94a3b8" }}>{health.unclaimed}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Unclaimed</div>
                </div>
                <div style={{ background: "#1e293b", borderRadius: 8, padding: "1rem", textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f59e0b" }}>{health.claimed}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Claimed</div>
                </div>
                <div style={{ background: "#1e293b", borderRadius: 8, padding: "1rem", textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#22c55e" }}>{health.verified}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Verified</div>
                </div>
            </div>

            {/* Support Listings */}
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.75rem", color: "#e2e8f0" }}>
                Support Listings Density
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
                <div style={{ background: "#1e293b", borderRadius: 8, padding: "1rem" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#3b82f6" }}>🛻 {health.truck_stops}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Truck Stops</div>
                </div>
                <div style={{ background: "#1e293b", borderRadius: 8, padding: "1rem" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#8b5cf6" }}>🏨 {health.hotels}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Hotels</div>
                </div>
                <div style={{ background: "#1e293b", borderRadius: 8, padding: "1rem" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#06b6d4" }}>🏗️ {health.terminals}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Terminals</div>
                </div>
            </div>

            {/* Entity Health Table */}
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.75rem", color: "#e2e8f0" }}>
                Entity Health by Type
            </h2>
            <div style={{ overflowX: "auto", marginBottom: "2rem" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #334155" }}>
                            {["Type", "Total", "No City", "No State", "No Geo", "Hidden", "Unclaimed", "Avg Rank", "Avg Complete"].map((h) => (
                                <th key={h} style={{ padding: "0.5rem", textAlign: "left", color: "#94a3b8", fontWeight: 500 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {entities.map((e, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #1e293b" }}>
                                <td style={{ padding: "0.5rem", fontWeight: 600, color: "#e2e8f0" }}>{e.entity_type}</td>
                                <td style={{ padding: "0.5rem", color: "#3b82f6" }}>{e.total}</td>
                                <td style={{ padding: "0.5rem", color: e.missing_city > 0 ? "#f59e0b" : "#22c55e" }}>{e.missing_city}</td>
                                <td style={{ padding: "0.5rem", color: e.missing_region > 0 ? "#f59e0b" : "#22c55e" }}>{e.missing_region}</td>
                                <td style={{ padding: "0.5rem", color: e.missing_geo > 0 ? "#94a3b8" : "#22c55e" }}>{e.missing_geo}</td>
                                <td style={{ padding: "0.5rem" }}>{e.hidden}</td>
                                <td style={{ padding: "0.5rem" }}>{e.unclaimed}</td>
                                <td style={{ padding: "0.5rem" }}>{e.avg_rank_score}</td>
                                <td style={{ padding: "0.5rem" }}>{(parseFloat(e.avg_completeness) * 100).toFixed(0)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pipeline Runs */}
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.75rem", color: "#e2e8f0" }}>
                Pipeline Run History
            </h2>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #334155" }}>
                            {["Type", "Started", "Finished", "Status", "Scanned", "Upserted", "Orphans Fixed", "Errors"].map((h) => (
                                <th key={h} style={{ padding: "0.5rem", textAlign: "left", color: "#94a3b8", fontWeight: 500 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {runs.map((r, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #1e293b" }}>
                                <td style={{ padding: "0.5rem", color: "#e2e8f0" }}>{r.run_type}</td>
                                <td style={{ padding: "0.5rem", color: "#94a3b8", fontSize: "0.75rem" }}>
                                    {r.started_at ? new Date(r.started_at).toLocaleString() : "-"}
                                </td>
                                <td style={{ padding: "0.5rem", color: "#94a3b8", fontSize: "0.75rem" }}>
                                    {r.finished_at ? new Date(r.finished_at).toLocaleString() : "-"}
                                </td>
                                <td style={{ padding: "0.5rem" }}>
                                    <span style={{
                                        padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 600,
                                        background: r.status === "success" ? "#052e16" : r.status === "running" ? "#1e3a5f" : "#450a0a",
                                        color: r.status === "success" ? "#4ade80" : r.status === "running" ? "#60a5fa" : "#f87171",
                                    }}>
                                        {r.status}
                                    </span>
                                </td>
                                <td style={{ padding: "0.5rem" }}>{r.entities_scanned}</td>
                                <td style={{ padding: "0.5rem" }}>{r.entities_upserted}</td>
                                <td style={{ padding: "0.5rem" }}>{r.orphans_fixed}</td>
                                <td style={{ padding: "0.5rem", color: r.errors > 0 ? "#ef4444" : "#94a3b8" }}>
                                    {r.errors}{r.error_sample ? ` — ${r.error_sample}` : ""}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Last Rehydrate */}
            <div style={{ marginTop: "2rem", padding: "1rem", background: "#0f172a", borderRadius: 8, border: "1px solid #1e293b" }}>
                <span style={{ color: "#64748b", fontSize: "0.8rem" }}>Last successful rehydration: </span>
                <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
                    {health.last_rehydrate_at ? new Date(health.last_rehydrate_at).toLocaleString() : "Never"}
                </span>
                <span style={{ color: "#64748b", fontSize: "0.8rem", marginLeft: "1rem" }}>Freshness: </span>
                <span style={{ color: isFreshness ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                    {health.index_freshness_minutes != null ? `${Math.round(health.index_freshness_minutes)} min` : "Unknown"}
                </span>
            </div>
        </div>
    );
}
