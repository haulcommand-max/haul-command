"use client";

import { useState } from "react";

interface HcGeneratePackShortcutsProps {
  adminSecret: string;
  entityType: string;
  entityId: string;
  entityLabel?: string;
}

const ENTITY_SLOT_MAP: Record<string, string[]> = {
  directory_listing: ["hero", "thumbnail", "og"],
  broker_profile: ["hero", "logo", "og"],
  partner_profile: ["hero", "thumbnail"],
  marketplace_item: ["hero", "gallery"],
  social_campaign: ["post", "story", "og"],
};

export function HcGeneratePackShortcuts({
  adminSecret,
  entityType,
  entityId,
  entityLabel,
}: HcGeneratePackShortcutsProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const slots = ENTITY_SLOT_MAP[entityType] || ENTITY_SLOT_MAP.directory_listing;

  async function handleGenPack() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/ai/generate-pack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hc-admin-secret": adminSecret,
        },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          base_prompt: prompt.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Pack generation failed");
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ background: "#0D1117", border: "1px solid #1E2A36", borderRadius: "12px", padding: "20px" }}>
      <h3 style={{ margin: "0 0 4px 0", fontWeight: 700, fontSize: "15px", letterSpacing: "0.05em", textTransform: "uppercase", color: "#C6923A" }}>
        📦 Generate Image Pack
      </h3>
      <div style={{ fontSize: "11px", color: "#5a6f82", marginBottom: "16px" }}>
        One click → {slots.join(" + ")} for{" "}
        <span style={{ color: "#8fa3b8" }}>{entityLabel || entityId}</span>
      </div>

      <textarea
        placeholder={`Describe this ${entityType.replace(/_/g, " ")}… The AI will generate ${slots.length} images (${slots.join(", ")}) from this prompt.`}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        style={{
          width: "100%",
          background: "#0A0F14",
          border: "1px solid #1E2A36",
          borderRadius: "8px",
          padding: "12px",
          color: "#CBD5E1",
          fontSize: "13px",
          resize: "vertical",
          fontFamily: "inherit",
        }}
      />

      <div style={{ marginTop: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
        {slots.map((slot) => (
          <span
            key={slot}
            style={{
              background: "#0A0F14",
              border: "1px solid #1E2A36",
              borderRadius: "4px",
              padding: "3px 8px",
              fontSize: "10px",
              color: "#C6923A",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {slot}
          </span>
        ))}
        <div style={{ flex: 1 }} />
        <button aria-label="Interactive Button"
          onClick={handleGenPack}
          disabled={loading || !prompt.trim()}
          style={{
            background: loading ? "#1E2A36" : "linear-gradient(135deg, #8B5CF6, #6D28D9)",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "8px 20px",
            fontWeight: 700,
            fontSize: "12px",
            cursor: loading ? "wait" : "pointer",
            opacity: loading || !prompt.trim() ? 0.6 : 1,
            transition: "all 0.2s",
          }}
        >
          {loading ? `Generating ${slots.length} images…` : `⚡ Generate Pack (${slots.length})`}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: "12px", padding: "10px 14px", background: "#1a0000", border: "1px solid #ff2d2d33", borderRadius: "6px", color: "#ff6b6b", fontSize: "12px" }}>
          ❌ {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: "16px" }}>
          <div style={{ fontSize: "12px", color: "#22c55e", marginBottom: "12px" }}>
            ✅ Generated {result.generated}/{result.total_slots} images
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(slots.length, 3)}, 1fr)`, gap: "12px" }}>
            {(result.results || []).map((r: any) => (
              <div key={r.slot} style={{ background: "#0A0F14", border: "1px solid #1E2A36", borderRadius: "8px", overflow: "hidden" }}>
                {r.asset ? (
                  <>
                    <img
                      src={r.asset.public_url}
                      alt={r.slot}
                      style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover" }}
                      loading="lazy"
                    />
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#C6923A", textTransform: "uppercase" }}>
                        {r.slot}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "20px", textAlign: "center" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "#ef4444", textTransform: "uppercase" }}>
                      {r.slot} — Failed
                    </div>
                    <div style={{ fontSize: "11px", color: "#5a6f82", marginTop: "4px" }}>
                      {r.error}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
