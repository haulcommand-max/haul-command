"use client";

import { useState } from "react";

interface HcImageGeneratorProps {
  adminSecret: string;
  defaultKind?: string;
  entityType?: string;
  entityId?: string;
  onGenerated?: (asset: any) => void;
}

const KIND_OPTIONS = [
  { value: "hero", label: "Hero / Cover" },
  { value: "banner", label: "Banner" },
  { value: "og", label: "OG / Social Preview" },
  { value: "listing-photo", label: "Listing Photo" },
  { value: "icon", label: "Icon / Logo" },
  { value: "ad-creative", label: "Ad Creative" },
  { value: "general", label: "General" },
];

export function HcImageGenerator({
  adminSecret,
  defaultKind = "general",
  entityType,
  entityId,
  onGenerated,
}: HcImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [kind, setKind] = useState(defaultKind);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/ai/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hc-admin-secret": adminSecret,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          kind,
          entityType: entityType || undefined,
          entityId: entityId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Generation failed");
      } else {
        setResult(data);
        onGenerated?.(data.asset);
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hc-image-gen">
      <h3 style={{ margin: "0 0 16px 0", fontWeight: 700, fontSize: "15px", letterSpacing: "0.05em", textTransform: "uppercase", color: "#C6923A" }}>
        ⚡ Generate Image
      </h3>

      <textarea
        placeholder="Describe the image you want Gemini to generate…"
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
          fontSize: "14px",
          resize: "vertical",
          fontFamily: "inherit",
        }}
      />

      <div style={{ display: "flex", gap: "12px", marginTop: "12px", alignItems: "center" }}>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          style={{
            background: "#0A0F14",
            border: "1px solid #1E2A36",
            borderRadius: "6px",
            padding: "8px 12px",
            color: "#CBD5E1",
            fontSize: "13px",
          }}
        >
          {KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          style={{
            background: loading ? "#1E2A36" : "linear-gradient(135deg, #C6923A, #A87A2F)",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "8px 20px",
            fontWeight: 700,
            fontSize: "13px",
            cursor: loading ? "wait" : "pointer",
            opacity: loading || !prompt.trim() ? 0.6 : 1,
            transition: "all 0.2s",
          }}
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: "12px", padding: "10px 14px", background: "#1a0000", border: "1px solid #ff2d2d33", borderRadius: "6px", color: "#ff6b6b", fontSize: "13px" }}>
          ❌ {error}
        </div>
      )}

      {result?.asset && (
        <div style={{ marginTop: "16px" }}>
          <img
            src={result.asset.public_url}
            alt="Generated"
            style={{
              maxWidth: "100%",
              maxHeight: "400px",
              borderRadius: "10px",
              border: "1px solid #1E2A36",
            }}
          />
          {result.text && (
            <p style={{ marginTop: "8px", fontSize: "13px", color: "#8fa3b8", fontStyle: "italic" }}>
              {result.text}
            </p>
          )}
          <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
            <button
              onClick={() => navigator.clipboard.writeText(result.asset.public_url)}
              style={{
                background: "#111820",
                border: "1px solid #1E2A36",
                borderRadius: "4px",
                padding: "4px 10px",
                color: "#8fa3b8",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              📋 Copy URL
            </button>
            <a
              href={result.asset.public_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#111820",
                border: "1px solid #1E2A36",
                borderRadius: "4px",
                padding: "4px 10px",
                color: "#8fa3b8",
                fontSize: "11px",
                textDecoration: "none",
              }}
            >
              🔗 Open
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
