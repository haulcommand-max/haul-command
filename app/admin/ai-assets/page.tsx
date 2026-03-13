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

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#CBD5E1", letterSpacing: "0.05em" }}>
          AI ASSET LIBRARY
        </h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link
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
        </div>
      </div>

      <div style={{ fontSize: "13px", color: "#5a6f82", marginBottom: "20px" }}>
        {(assets || []).length} asset{(assets || []).length !== 1 ? "s" : ""}
      </div>

      <HcAssetLibrary initialAssets={assets || []} adminSecret={adminSecret} />
    </div>
  );
}
