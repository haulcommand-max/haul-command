import { HcVariantGroupReviewServer } from "@/components/admin/HcVariantGroupReviewServer";
import Link from "next/link";

export const metadata = {
  title: "Variant Review - HAUL COMMAND Admin",
};

export const dynamic = "force-dynamic";

export default async function AiReviewPage() {
  const adminSecret = process.env.HC_ADMIN_SECRET || "";

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#CBD5E1", letterSpacing: "0.05em", margin: 0 }}>
            ðŸ"¬ VARIANT REVIEW
          </h1>
          <p style={{ fontSize: "12px", color: "#5a6f82", marginTop: "4px" }}>
            Compare A/B variants "¢ Pick winners "¢ Archive losers "¢ Rollback
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
            âš¡ Image Engine
          </Link>
          <Link aria-label="Navigation Link"
            href="/admin/ai-assets"
            style={{
              background: "#111820",
              border: "1px solid #1E2A36",
              borderRadius: "6px",
              padding: "6px 14px",
              color: "#C6923A",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ðŸ"‚ Asset Library
          </Link>
        </div>
      </div>

      <HcVariantGroupReviewServer adminSecret={adminSecret} />
    </div>
  );
}