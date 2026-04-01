"use client";

import { useState, useRef } from "react";

interface HcImageEditorProps {
  adminSecret: string;
  defaultKind?: string;
  entityType?: string;
  entityId?: string;
  sourceAssetId?: string;
  initialImageUrl?: string;
  onEdited?: (asset: any) => void;
}

export function HcImageEditor({
  adminSecret,
  defaultKind = "edited-image",
  entityType,
  entityId,
  sourceAssetId,
  initialImageUrl,
  onEdited,
}: HcImageEditorProps) {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialImageUrl || null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith("image/")) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }

  async function handleEdit() {
    if (!prompt.trim() || !file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prompt", prompt.trim());
      formData.append("kind", defaultKind);
      if (entityType) formData.append("entityType", entityType);
      if (entityId) formData.append("entityId", entityId);
      if (sourceAssetId) formData.append("sourceAssetId", sourceAssetId);

      const res = await fetch("/api/admin/ai/edit-image", {
        method: "POST",
        headers: { "x-hc-admin-secret": adminSecret },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Edit failed");
      } else {
        setResult(data);
        onEdited?.(data.asset);
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hc-image-editor">
      <h3 style={{ margin: "0 0 16px 0", fontWeight: 700, fontSize: "15px", letterSpacing: "0.05em", textTransform: "uppercase", color: "#C6923A" }}>
        ✏️ Edit Image
      </h3>

      {/* Drop zone / file input */}
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: "2px dashed #1E2A36",
          borderRadius: "10px",
          padding: "24px",
          textAlign: "center",
          cursor: "pointer",
          background: "#0A0F14",
          transition: "border-color 0.2s",
          position: "relative",
        }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f && f.type.startsWith("image/")) {
            setFile(f);
            setPreview(URL.createObjectURL(f));
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        {preview ? (
          <img
            src={preview}
            alt="Source"
            style={{ maxWidth: "100%", maxHeight: "250px", borderRadius: "8px" }}
          />
        ) : (
          <div style={{ color: "#5a6f82", fontSize: "14px" }}>
            📷 Click or drop an image here
          </div>
        )}
      </div>

      <textarea
        placeholder="Describe how to edit this image…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={2}
        style={{
          width: "100%",
          marginTop: "12px",
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

      <div style={{ marginTop: "12px" }}>
        <button
          onClick={handleEdit}
          disabled={loading || !prompt.trim() || !file}
          style={{
            background: loading ? "#1E2A36" : "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "8px 20px",
            fontWeight: 700,
            fontSize: "13px",
            cursor: loading ? "wait" : "pointer",
            opacity: loading || !prompt.trim() || !file ? 0.6 : 1,
            transition: "all 0.2s",
          }}
        >
          {loading ? "Editing…" : "Edit Image"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: "12px", padding: "10px 14px", background: "#1a0000", border: "1px solid #ff2d2d33", borderRadius: "6px", color: "#ff6b6b", fontSize: "13px" }}>
          ❌ {error}
        </div>
      )}

      {result?.asset && (
        <div style={{ marginTop: "16px" }}>
          <div style={{ fontSize: "11px", color: "#5a6f82", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Result
          </div>
          <img
            src={result.asset.public_url}
            alt="Edited"
            style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "10px", border: "1px solid #1E2A36" }}
          />
          {result.notes && (
            <p style={{ marginTop: "8px", fontSize: "13px", color: "#8fa3b8", fontStyle: "italic" }}>
              {result.notes}
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
          </div>
        </div>
      )}
    </div>
  );
}
