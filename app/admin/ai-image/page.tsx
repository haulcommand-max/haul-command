import { HcImageGenerator } from "@/components/admin/HcImageGenerator";
import { HcImageEditor } from "@/components/admin/HcImageEditor";
import Link from "next/link";

export const metadata = {
  title: "AI Image Engine – HAUL COMMAND Admin",
};

export default function AiImagePage() {
  const adminSecret = process.env.HC_ADMIN_SECRET || "";

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#CBD5E1", letterSpacing: "0.05em" }}>
          AI IMAGE ENGINE
        </h1>
        <Link
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
          📂 Asset Library →
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div style={{ background: "#0D1117", border: "1px solid #1E2A36", borderRadius: "12px", padding: "20px" }}>
          <HcImageGenerator adminSecret={adminSecret} />
        </div>
        <div style={{ background: "#0D1117", border: "1px solid #1E2A36", borderRadius: "12px", padding: "20px" }}>
          <HcImageEditor adminSecret={adminSecret} />
        </div>
      </div>
    </div>
  );
}
