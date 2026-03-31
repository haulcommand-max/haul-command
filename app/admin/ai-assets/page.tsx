import { supabaseAdmin } from "@/lib/supabase/admin";
import { HcAssetLibrary } from "@/components/admin/HcAssetLibrary";
import Link from "next/link";

export const metadata = {
  title: "AI Asset Library – HAUL COMMAND Admin",
};

export const dynamic = "force-dynamic";

export default async function AiAssetsPage() {
  const adminSecret = process.env.HC_ADMIN_SECRET || "";

  const { data: assets } = await supabaseAdmin
    .from("hc_generated_assets")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: stats } = await supabaseAdmin
    .from("hc_generated_assets")
    .select("status", { count: "exact", head: false });

  const statusCounts: Record<string, number> = {};
  for (const row of stats || []) {
    statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#CBD5E1", letterSpacing: "0.05em", margin: 0 }}>
            AI ASSET LIBRARY
          </h1>
          <p style={{ fontSize: "12px", color: "#5a6f82", marginTop: "4px" }}>
            All generated images with status and lineage tracking
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link aria-label="Navigation Link"
            href="/admin/ai-image"
            style={{
              background: "linear-gradient(135deg, #C6923A, #A87A2F)",
              borderRadius: "6px",
              padding: "6px 14px",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ⚡ Generate New
          </Link>
          <Link aria-label="Navigation Link"
            href="/admin/ai-review"
            style={{
              background: "#111820",
              border: "1px solid #1E2A36",
              borderRadius: "6px",
              padding: "6px 14px",
              color: "#8B5CF6",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            🔬 Variant Review
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ fontSize: "13px", color: "#CBD5E1", fontWeight: 700 }}>
          {(assets || []).length} asset{(assets || []).length !== 1 ? "s" : ""}
        </div>
        {Object.entries(statusCounts).map(([status, count]) => (
          <span
            key={status}
            style={{
              background: "#0A0F14",
              border: "1px solid #1E2A36",
              borderRadius: "4px",
              padding: "2px 8px",
              fontSize: "11px",
              color:
                status === "published" ? "#22c55e"
                : status === "approved" ? "#3B82F6"
                : status === "rejected" ? "#ef4444"
                : status === "archived" ? "#5a6f82"
                : "#C6923A",
              fontWeight: 700,
            }}
          >
            {status}: {count}
          </span>
        ))}
      </div>

      <HcAssetLibrary initialAssets={assets || []} adminSecret={adminSecret} />
    </div>
  );
}
