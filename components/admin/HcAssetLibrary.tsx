"use client";

import { useState } from "react";

interface Asset {
  id: string;
  created_at: string;
  source: string;
  model?: string;
  prompt?: string;
  kind: string;
  entity_type?: string;
  entity_id?: string;
  public_url: string;
  mime_type?: string;
  notes?: string;
  is_archived: boolean;
}

interface HcAssetLibraryProps {
  initialAssets: Asset[];
  adminSecret: string;
}

export function HcAssetLibrary({ initialAssets, adminSecret }: HcAssetLibraryProps) {
  const [assets] = useState<Asset[]>(initialAssets);
  const [selected, setSelected] = useState<Asset | null>(null);

  if (assets.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#5a6f82", fontSize: "14px" }}>
        No generated assets yet. Use the Image Generator to create some.
      </div>
    );
  }

  return (
    <div>
      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {assets.map((a) => (
          <div
            key={a.id}
            onClick={() => setSelected(selected?.id === a.id ? null : a)}
            style={{
              background: selected?.id === a.id ? "#111820" : "#0A0F14",
              border: `1px solid ${selected?.id === a.id ? "#C6923A" : "#1E2A36"}`,
              borderRadius: "10px",
              overflow: "hidden",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div style={{ aspectRatio: "16/10", overflow: "hidden", background: "#060A0F" }}>
              <img
                src={a.public_url}
                alt={a.kind}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                loading="lazy"
              />
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#C6923A", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {a.kind}
              </div>
              <div style={{ fontSize: "11px", color: "#5a6f82", marginTop: "4px" }}>
                {new Date(a.created_at).toLocaleDateString()}
              </div>
              {a.prompt && (
                <div style={{ fontSize: "12px", color: "#8fa3b8", marginTop: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.prompt.length > 60 ? a.prompt.slice(0, 60) + "…" : a.prompt}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              background: "#0D1117",
              border: "1px solid #1E2A36",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "640px",
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selected.public_url}
              alt={selected.kind}
              style={{ width: "100%", borderRadius: "10px", marginBottom: "16px" }}
            />

            <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
              <tbody>
                {([
                  ["Kind", selected.kind],
                  ["Model", selected.model || "—"],
                  ["Source", selected.source],
                  ["Entity", selected.entity_type ? `${selected.entity_type} / ${selected.entity_id}` : "—"],
                  ["MIME", selected.mime_type || "—"],
                  ["Created", new Date(selected.created_at).toLocaleString()],
                ] as [string, string][]).map(([label, val]) => (
                  <tr key={label}>
                    <td style={{ padding: "6px 10px 6px 0", color: "#5a6f82", fontWeight: 600, whiteSpace: "nowrap" }}>{label}</td>
                    <td style={{ padding: "6px 0", color: "#CBD5E1" }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selected.prompt && (
              <div style={{ marginTop: "12px" }}>
                <div style={{ fontSize: "11px", color: "#5a6f82", fontWeight: 600, marginBottom: "4px" }}>PROMPT</div>
                <div style={{ fontSize: "13px", color: "#8fa3b8", background: "#0A0F14", padding: "10px 12px", borderRadius: "6px", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                  {selected.prompt}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button
                onClick={() => navigator.clipboard.writeText(selected.public_url)}
                style={{
                  background: "#111820",
                  border: "1px solid #1E2A36",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  color: "#CBD5E1",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                📋 Copy URL
              </button>
              <button
                onClick={() => {
                  if (selected.prompt) navigator.clipboard.writeText(selected.prompt);
                }}
                style={{
                  background: "#111820",
                  border: "1px solid #1E2A36",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  color: "#CBD5E1",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                📝 Copy Prompt
              </button>
              <button
                onClick={() => setSelected(null)}
                style={{
                  marginLeft: "auto",
                  background: "transparent",
                  border: "1px solid #1E2A36",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  color: "#5a6f82",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
