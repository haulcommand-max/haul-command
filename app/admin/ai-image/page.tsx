import { HcImageGenerator } from "@/components/admin/HcImageGenerator";
import { HcImageEditor } from "@/components/admin/HcImageEditor";
import { HcVariantTemplateStudio } from "@/components/admin/HcVariantTemplateStudio";
import { HcGeneratePackShortcuts } from "@/components/admin/HcGeneratePackShortcuts";
import Link from "next/link";

export const metadata = {
  title: "AI Image Engine - HAUL COMMAND Admin",
};

export default function AiImagePage() {
  const adminSecret = process.env.HC_ADMIN_SECRET || "";

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#CBD5E1", letterSpacing: "0.05em", margin: 0 }}>
            AI IMAGE ENGINE
          </h1>
          <p style={{ fontSize: "12px", color: "#5a6f82", marginTop: "4px" }}>
            Generate "¢ Edit "¢ Template "¢ Pack "¢ Review
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
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
            ðŸ"‚ Asset Library →
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
            ðŸ"¬ Variant Review →
          </Link>
        </div>
      </div>

      {/* Row 1: Generate + Edit */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div style={{ background: "#0D1117", border: "1px solid #1E2A36", borderRadius: "12px", padding: "20px" }}>
          <HcImageGenerator adminSecret={adminSecret} />
        </div>
        <div style={{ background: "#0D1117", border: "1px solid #1E2A36", borderRadius: "12px", padding: "20px" }}>
          <HcImageEditor adminSecret={adminSecret} />
        </div>
      </div>

      {/* Row 2: Template Studio */}
      <div style={{ marginBottom: "24px" }}>
        <HcVariantTemplateStudio adminSecret={adminSecret} />
      </div>

      {/* Row 3: Quick Pack demo (no entity selected) */}
      <div style={{
        background: "#0D1117",
        border: "1px dashed #1E2A36",
        borderRadius: "12px",
        padding: "24px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "13px", color: "#5a6f82" }}>
          ðŸ’¡ <strong>Pack Generation</strong> and <strong>Variant Generation</strong> are available on entity admin pages.
        </div>
        <div style={{ fontSize: "11px", color: "#3d4f5f", marginTop: "6px" }}>
          Navigate to a directory listing, broker profile, or other entity to generate image packs and run A/B variant tests.
        </div>
      </div>
    </div>
  );
}