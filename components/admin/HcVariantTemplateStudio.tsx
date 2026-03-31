"use client";

import { useState, useEffect } from "react";

interface Template {
  id: string;
  name: string;
  slug: string;
  version: number;
  entity_type: string | null;
  usage_slot: string;
  prompt_template: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  win_count: number;
  use_count: number;
}

interface HcVariantTemplateStudioProps {
  adminSecret: string;
  entityType?: string;
  entityId?: string;
}

const SLOT_OPTIONS = [
  { value: "hero", label: "Hero / Cover" },
  { value: "thumbnail", label: "Thumbnail" },
  { value: "og", label: "OG / Social" },
  { value: "logo", label: "Logo" },
  { value: "gallery", label: "Gallery" },
  { value: "post", label: "Post" },
  { value: "story", label: "Story" },
  { value: "ad-creative", label: "Ad Creative" },
];

export function HcVariantTemplateStudio({
  adminSecret,
  entityType,
  entityId,
}: HcVariantTemplateStudioProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  // New template form
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSlot, setFormSlot] = useState("hero");
  const [formPrompt, setFormPrompt] = useState("");
  const [formDesc, setFormDesc] = useState("");

  // Generate controls
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [variantCount, setVariantCount] = useState(3);
  const [genResult, setGenResult] = useState<any>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const headers = {
    "Content-Type": "application/json",
    "x-hc-admin-secret": adminSecret,
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityType) params.set("entityType", entityType);
      const res = await fetch(`/api/admin/ai/prompt-templates?${params}`, { headers });
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  async function handleCreate() {
    if (!formName.trim() || !formPrompt.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/ai/prompt-templates", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: formName.trim(),
          prompt_template: formPrompt.trim(),
          usage_slot: formSlot,
          entity_type: entityType || null,
          description: formDesc.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setShowForm(false);
        setFormName("");
        setFormPrompt("");
        setFormDesc("");
        loadTemplates();
      }
    } catch {
      /* ignore */
    }
    setCreating(false);
  }

  async function handleGenerate() {
    if (!selectedTemplate || !entityType || !entityId) return;
    setGenerating(true);
    setGenResult(null);
    setGenError(null);

    try {
      const res = await fetch("/api/admin/ai/generate-variants", {
        method: "POST",
        headers,
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          template_id: selectedTemplate,
          variant_count: variantCount,
          auto_attach: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setGenError(data.error || "Generation failed");
      } else {
        setGenResult(data);
      }
    } catch (err: any) {
      setGenError(err.message);
    }
    setGenerating(false);
  }

  async function toggleActive(id: string, is_active: boolean) {
    await fetch("/api/admin/ai/prompt-templates", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, is_active: !is_active }),
    });
    loadTemplates();
  }

  return (
    <div style={{ background: "#0D1117", border: "1px solid #1E2A36", borderRadius: "12px", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: "15px", letterSpacing: "0.05em", textTransform: "uppercase", color: "#C6923A" }}>
          🎨 Prompt Templates
        </h3>
        <button aria-label="Interactive Button"
          onClick={() => setShowForm(!showForm)}
          style={{
            background: showForm ? "#1E2A36" : "linear-gradient(135deg, #C6923A, #A87A2F)",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "6px 14px",
            fontWeight: 700,
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "+ New Template"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ background: "#0A0F14", border: "1px solid #1E2A36", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
          <input
            placeholder="Template name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            style={{ width: "100%", background: "#060A0F", border: "1px solid #1E2A36", borderRadius: "6px", padding: "8px 12px", color: "#CBD5E1", fontSize: "13px", marginBottom: "8px" }}
          />
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <select
              value={formSlot}
              onChange={(e) => setFormSlot(e.target.value)}
              style={{ background: "#060A0F", border: "1px solid #1E2A36", borderRadius: "6px", padding: "8px 12px", color: "#CBD5E1", fontSize: "13px", flex: 1 }}
            >
              {SLOT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Prompt template — use {{entity_name}}, {{entity_type}}, {{slot}} as placeholders…"
            value={formPrompt}
            onChange={(e) => setFormPrompt(e.target.value)}
            rows={4}
            style={{ width: "100%", background: "#060A0F", border: "1px solid #1E2A36", borderRadius: "6px", padding: "10px 12px", color: "#CBD5E1", fontSize: "13px", resize: "vertical", fontFamily: "monospace", marginBottom: "8px" }}
          />
          <input
            placeholder="Description (optional)"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            style={{ width: "100%", background: "#060A0F", border: "1px solid #1E2A36", borderRadius: "6px", padding: "8px 12px", color: "#CBD5E1", fontSize: "13px", marginBottom: "12px" }}
          />
          <button aria-label="Interactive Button"
            onClick={handleCreate}
            disabled={creating || !formName.trim() || !formPrompt.trim()}
            style={{
              background: creating ? "#1E2A36" : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "8px 18px",
              fontWeight: 700,
              fontSize: "12px",
              cursor: creating ? "wait" : "pointer",
              opacity: creating || !formName.trim() || !formPrompt.trim() ? 0.6 : 1,
            }}
          >
            {creating ? "Creating…" : "Save Template"}
          </button>
        </div>
      )}

      {/* Template list */}
      {loading ? (
        <div style={{ color: "#5a6f82", fontSize: "13px", padding: "12px" }}>Loading…</div>
      ) : templates.length === 0 ? (
        <div style={{ color: "#5a6f82", fontSize: "13px", padding: "12px" }}>No templates yet. Create one above.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {templates.map((t) => (
            <div
              key={t.id}
              style={{
                background: selectedTemplate === t.id ? "#111C28" : "#0A0F14",
                border: `1px solid ${selectedTemplate === t.id ? "#C6923A" : "#1E2A36"}`,
                borderRadius: "8px",
                padding: "12px 14px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onClick={() => setSelectedTemplate(selectedTemplate === t.id ? null : t.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "#CBD5E1" }}>{t.name}</span>
                  {t.is_system && (
                    <span style={{ marginLeft: "6px", background: "#1E2A36", color: "#8fa3b8", fontSize: "10px", padding: "2px 6px", borderRadius: "3px" }}>
                      SYSTEM
                    </span>
                  )}
                  <span style={{ marginLeft: "6px", background: "#0A0F14", color: "#5a6f82", fontSize: "10px", padding: "2px 6px", borderRadius: "3px", border: "1px solid #1E2A36" }}>
                    {t.usage_slot}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "11px", color: "#5a6f82" }}>
                  <span title="Wins">🏆 {t.win_count}</span>
                  <span title="Uses">📊 {t.use_count}</span>
                  <button aria-label="Interactive Button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActive(t.id, t.is_active);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: t.is_active ? "#22c55e" : "#ef4444",
                      fontSize: "10px",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    {t.is_active ? "● ACTIVE" : "○ INACTIVE"}
                  </button>
                </div>
              </div>

              {selectedTemplate === t.id && (
                <div style={{ marginTop: "10px" }}>
                  <div style={{ fontSize: "12px", color: "#8fa3b8", fontFamily: "monospace", background: "#060A0F", padding: "8px 10px", borderRadius: "4px", whiteSpace: "pre-wrap", marginBottom: "8px" }}>
                    {t.prompt_template.length > 300 ? t.prompt_template.slice(0, 300) + "…" : t.prompt_template}
                  </div>
                  {t.description && (
                    <div style={{ fontSize: "11px", color: "#5a6f82", marginBottom: "8px" }}>{t.description}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Generate section */}
      {entityType && entityId && selectedTemplate && (
        <div style={{ marginTop: "16px", background: "#0A0F14", border: "1px solid #C6923A33", borderRadius: "8px", padding: "14px" }}>
          <div style={{ fontSize: "12px", color: "#C6923A", fontWeight: 700, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            ⚡ Generate Variants
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label style={{ fontSize: "12px", color: "#8fa3b8" }}>Count:</label>
            <select
              value={variantCount}
              onChange={(e) => setVariantCount(Number(e.target.value))}
              style={{ background: "#060A0F", border: "1px solid #1E2A36", borderRadius: "4px", padding: "4px 8px", color: "#CBD5E1", fontSize: "12px" }}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <button aria-label="Interactive Button"
              onClick={handleGenerate}
              disabled={generating}
              style={{
                background: generating ? "#1E2A36" : "linear-gradient(135deg, #C6923A, #A87A2F)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 16px",
                fontWeight: 700,
                fontSize: "12px",
                cursor: generating ? "wait" : "pointer",
                opacity: generating ? 0.6 : 1,
              }}
            >
              {generating ? "Generating…" : `Generate ${variantCount} Variant${variantCount > 1 ? "s" : ""}`}
            </button>
          </div>

          {genError && (
            <div style={{ marginTop: "10px", padding: "8px 12px", background: "#1a0000", border: "1px solid #ff2d2d33", borderRadius: "6px", color: "#ff6b6b", fontSize: "12px" }}>
              ❌ {genError}
            </div>
          )}

          {genResult && (
            <div style={{ marginTop: "10px" }}>
              <div style={{ fontSize: "12px", color: "#22c55e", marginBottom: "8px" }}>
                ✅ Generated {genResult.generated}/{genResult.requested} variants
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "8px" }}>
                {(genResult.assets || []).map((a: any) => (
                  <div key={a.id} style={{ borderRadius: "6px", overflow: "hidden", border: "1px solid #1E2A36" }}>
                    <img src={a.public_url} alt={`Variant ${a.variant_index}`} style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover" }} loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
