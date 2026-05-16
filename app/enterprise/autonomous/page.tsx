import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Autonomous Freight Readiness | Haul Command",
  description:
    "RouteIntel readiness, AV-adjacent operator coverage, drone survey signals, and trust-labeled corridor intelligence for enterprise freight teams.",
  robots: "index,follow",
};

const DISCLAIMER_FALLBACK =
  "Autonomous and drone readiness signals are evidence labels, not endorsements, safety guarantees, or legal operating approvals. Verify each operator, corridor, permit, and jurisdiction before dispatch.";

type Snapshot = {
  disclaimer: string;
  sourceAvailable: boolean;
  operatorCount: number | null;
  avReadyCount: number | null;
  droneCapableCount: number | null;
  corridorCount: number | null;
  verifiedCorridorCount: number | null;
  lastVerifiedAt: string | null;
};

async function countRows(table: string, filters: Record<string, unknown> = {}, selectColumn = "source_id") {
  const supabase = getSupabaseAdmin();
  let query = supabase.from(table).select(selectColumn, { count: "exact", head: true });
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value as never);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function countAvOperatorRows(filters: Record<string, unknown> = {}) {
  const supabase = getSupabaseAdmin();
  let query = supabase.rpc("read_av_operator_universe").select("operator_id", { count: "exact", head: true });
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value as never);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function getAutonomousSnapshot(): Promise<Snapshot> {
  try {
    const supabase = getSupabaseAdmin();
    const [
      operatorCount,
      avReadyCount,
      droneCapableCount,
      corridorCount,
      verifiedCorridorCount,
      policyResult,
      lastVerifiedResult,
    ] = await Promise.all([
      countAvOperatorRows(),
      countAvOperatorRows({ av_ready: true }),
      countAvOperatorRows({ drone_survey_capable: true }),
      countRows("v_av_corridor_readiness_unified"),
      countRows("v_av_corridor_readiness_unified", { av_confidence_label: "verified" }),
      supabase.from("hc_policy").select("value").eq("key", "av.disclaimer.required_on_all_public_surfaces").maybeSingle(),
      supabase
        .from("v_av_corridor_readiness_unified")
        .select("av_last_verified_at")
        .not("av_last_verified_at", "is", null)
        .order("av_last_verified_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      disclaimer: String(policyResult.data?.value || DISCLAIMER_FALLBACK),
      sourceAvailable: true,
      operatorCount,
      avReadyCount,
      droneCapableCount,
      corridorCount,
      verifiedCorridorCount,
      lastVerifiedAt: lastVerifiedResult.data?.av_last_verified_at ?? null,
    };
  } catch {
    return {
      disclaimer: DISCLAIMER_FALLBACK,
      sourceAvailable: false,
      operatorCount: null,
      avReadyCount: null,
      droneCapableCount: null,
      corridorCount: null,
      verifiedCorridorCount: null,
      lastVerifiedAt: null,
    };
  }
}

function metric(value: number | null) {
  return value === null ? "Pending live check" : value.toLocaleString("en-US");
}

export default async function AutonomousEnterprisePage() {
  const snapshot = await getAutonomousSnapshot();

  return (
    <main style={{ minHeight: "100vh", background: "#f7f8f5", color: "#18211d" }}>
      <section style={{ borderBottom: "1px solid #d9ded4", background: "#ffffff" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 24px 44px" }}>
          <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, letterSpacing: 1.2, color: "#336a4f", textTransform: "uppercase" }}>
            RouteIntel enterprise readiness
          </p>
          <h1 style={{ margin: 0, maxWidth: 860, fontSize: 54, lineHeight: 1.02, letterSpacing: 0, color: "#111713" }}>
            Autonomous freight support without fake partner claims.
          </h1>
          <p style={{ margin: "22px 0 0", maxWidth: 760, fontSize: 18, lineHeight: 1.65, color: "#4d5b53" }}>
            Haul Command tracks AV-adjacent operator evidence, drone route survey capability, digital permit support,
            and corridor readiness as confidence-labeled intelligence. Enterprise teams get a readiness view they can
            verify before pilot planning, dispatch, or procurement.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
            <Link href="/contact?intent=enterprise-autonomous" style={{ padding: "13px 18px", borderRadius: 8, background: "#183b2b", color: "#fff", textDecoration: "none", fontWeight: 700 }}>
              Request pilot
            </Link>
            <Link href="/corridors" style={{ padding: "13px 18px", borderRadius: 8, border: "1px solid #b8c2b7", color: "#183b2b", textDecoration: "none", fontWeight: 700 }}>
              Review corridors
            </Link>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {[
            ["Operator universe", metric(snapshot.operatorCount)],
            ["AV-ready evidence", metric(snapshot.avReadyCount)],
            ["Drone survey capable", metric(snapshot.droneCapableCount)],
            ["Readiness corridors", metric(snapshot.corridorCount)],
            ["Verified corridors", metric(snapshot.verifiedCorridorCount)],
          ].map(([label, value]) => (
            <div key={label} style={{ border: "1px solid #d9ded4", background: "#fff", borderRadius: 8, padding: 18 }}>
              <div style={{ color: "#66746b", fontSize: 13, fontWeight: 700 }}>{label}</div>
              <div style={{ marginTop: 8, fontSize: 26, fontWeight: 800, color: "#111713" }}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)", gap: 20 }}>
          <div style={{ border: "1px solid #d9ded4", background: "#fff", borderRadius: 8, padding: 24 }}>
            <h2 style={{ margin: 0, fontSize: 24, color: "#111713" }}>What enterprise buyers can verify</h2>
            <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
              {[
                ["Unified operator data", "Reads through read_av_operator_universe, preferring mv_av_operator_universe when present and falling back to v_av_operator_universe."],
                ["Unified corridor data", "Reads from v_av_corridor_readiness_unified until the corridor canonical is resolved."],
                ["Trust trio", "Every readiness claim should show confidence label, source basis, and last verified date before operational use."],
                ["No named-partner shortcut", "This page no longer claims coverage for specific AV companies unless there is signed, source-backed evidence."],
              ].map(([title, copy]) => (
                <div key={title} style={{ borderTop: "1px solid #edf0ea", paddingTop: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
                  <p style={{ margin: "6px 0 0", color: "#526159", lineHeight: 1.6 }}>{copy}</p>
                </div>
              ))}
            </div>
          </div>

          <aside style={{ border: "1px solid #c7d6ca", background: "#eef5ee", borderRadius: 8, padding: 24 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Readiness status</h2>
            <p style={{ margin: "12px 0 0", color: "#526159", lineHeight: 1.55 }}>
              Data source: {snapshot.sourceAvailable ? "live unified AV views" : "live check unavailable"}
            </p>
            <p style={{ margin: "10px 0 0", color: "#526159", lineHeight: 1.55 }}>
              Last verified corridor signal: {snapshot.lastVerifiedAt ? new Date(snapshot.lastVerifiedAt).toLocaleDateString("en-US") : "Pending live check"}
            </p>
            <div style={{ marginTop: 18, borderTop: "1px solid #cddccc", paddingTop: 16, fontSize: 13, lineHeight: 1.55, color: "#405147" }}>
              {snapshot.disclaimer}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
