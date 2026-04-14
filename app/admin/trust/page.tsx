/**
 * Admin Trust Dashboard  
 * /admin/trust — Trust Graph Engine control center
 */
import Link from "next/link";

export const metadata = {
    title: "Trust Graph Engine - HAUL COMMAND Admin",
};

export default function TrustDashboardPage() {
    const panels = [
        {
            title: "ðŸ›¡ï¸ Trust Score Compute",
            desc: "Run single or batch trust score computation. Persists to hc_trust_score_breakdown.",
            endpoint: "/api/admin/trust/compute",
            methods: "POST { account_id } or { batch: [...ids] }",
            color: "#3B82F6",
        },
        {
            title: "ðŸŽ¯ Anti-Gaming Scanner",
            desc: "Detect fake reviews, location spoofing, score tampering, sock puppets.",
            endpoint: "/api/admin/trust/anti-gaming",
            methods: "POST { user_id }",
            color: "#EF4444",
        },
        {
            title: "🔍 Fraud Detection Scan",
            desc: "Scan reviews for fraud signals. Auto-holds ≥0.85 probability. Shadowbans ≥0.65.",
            endpoint: "/api/admin/trust/fraud-scan",
            methods: "POST { target_id?, limit? }",
            color: "#F59E0B",
        },
        {
            title: "ðŸ§¬ Evidence Vault",
            desc: "Persistent provenance for every verified data point. Auditability + trust.",
            endpoint: "/api/admin/trust/evidence",
            methods: "GET { entity_id } | POST { entityId, fieldName, value, sourceUrl }",
            color: "#8B5CF6",
        },
        {
            title: "ðŸ¤ Dual Confirmation",
            desc: "Job completion state machine: posted → assigned → confirmed → ledger_locked.",
            endpoint: "/api/admin/trust/confirmations",
            methods: "POST { action: create|confirm|dispute, job_id, role? }",
            color: "#10B981",
        },
        {
            title: "📊 Trust Scores",
            desc: "Public-facing trust score endpoint using 3-layer composite engine.",
            endpoint: "/api/v1/trust/score",
            methods: "GET { user_id }",
            color: "#06B6D4",
        },
        {
            title: "â­ Trust Ratings",
            desc: "Submit and query trust ratings. Integrates with fraud detection.",
            endpoint: "/api/v1/trust/ratings",
            methods: "GET { user_id } | POST { rated_user_id, rating, ... }",
            color: "#F97316",
        },
        {
            title: "âš–ï¸ Disputes",
            desc: "File, view, and manage disputes with rebuttal/evidence workflow.",
            endpoint: "/api/v1/trust/disputes",
            methods: "GET { user_id } | POST (file) | PATCH (rebuttal)",
            color: "#EC4899",
        },
    ];

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#CBD5E1", letterSpacing: "0.05em", margin: 0 }}>
                    TRUST GRAPH ENGINE
                </h1>
                <p style={{ fontSize: "12px", color: "#5a6f82", marginTop: "4px" }}>
                    7-Phase Trust Infrastructure • Score • Detect • Confirm • Vault • Resolve
                </p>
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    <Link aria-label="Navigation Link"
                        href="/admin/ai-image"
                        style={{
                            background: "#111820", border: "1px solid #1E293B", borderRadius: "6px",
                            padding: "6px 14px", fontSize: "11px", color: "#94A3B8", textDecoration: "none",
                        }}
                    >
                        â† AI Image Engine
                    </Link>
                    <Link aria-label="Navigation Link"
                        href="/admin/ops"
                        style={{
                            background: "#111820", border: "1px solid #1E293B", borderRadius: "6px",
                            padding: "6px 14px", fontSize: "11px", color: "#94A3B8", textDecoration: "none",
                        }}
                    >
                        Ops Center →
                    </Link>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
                {panels.map((p) => (
                    <div
                        key={p.endpoint}
                        style={{
                            background: "#0B1120",
                            border: "1px solid #1E293B",
                            borderRadius: "12px",
                            padding: "20px",
                            borderLeft: `3px solid ${p.color}`,
                        }}
                    >
                        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#E2E8F0", margin: "0 0 6px" }}>
                            {p.title}
                        </h3>
                        <p style={{ fontSize: "12px", color: "#64748B", margin: "0 0 12px", lineHeight: "1.5" }}>
                            {p.desc}
                        </p>
                        <code
                            style={{
                                display: "block",
                                fontSize: "10px",
                                color: "#94A3B8",
                                background: "#111827",
                                padding: "8px",
                                borderRadius: "6px",
                                fontFamily: "monospace",
                            }}
                        >
                            {p.endpoint}
                            <br />
                            {p.methods}
                        </code>
                    </div>
                ))}
            </div>

            <div
                style={{
                    marginTop: "32px",
                    background: "#0B1120",
                    border: "1px solid #1E293B",
                    borderRadius: "12px",
                    padding: "20px",
                }}
            >
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#CBD5E1", margin: "0 0 12px" }}>
                    Trust Engine Architecture
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                    {[
                        { phase: "P1", name: "Score v3", status: "âœ…" },
                        { phase: "P2", name: "Composite", status: "âœ…" },
                        { phase: "P3", name: "Dual Confirm", status: "âœ…" },
                        { phase: "P4", name: "Evidence Vault", status: "âœ…" },
                        { phase: "P5", name: "Fraud Detect", status: "âœ…" },
                        { phase: "P6", name: "Anti-Gaming", status: "âœ…" },
                        { phase: "P7", name: "Visibility", status: "âœ…" },
                    ].map((p) => (
                        <div
                            key={p.phase}
                            style={{
                                background: "#111827",
                                borderRadius: "6px",
                                padding: "8px",
                                textAlign: "center",
                            }}
                        >
                            <div style={{ fontSize: "10px", color: "#64748B" }}>{p.phase}</div>
                            <div style={{ fontSize: "11px", color: "#CBD5E1", fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: "14px", marginTop: "2px" }}>{p.status}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}