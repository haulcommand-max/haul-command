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
  status: string;
  variant_group_id?: string;
  variant_index?: number;
  usage_slot?: string;
  template_id?: string;
}

interface VariantGroup {
  groupId: string;
  assets: Asset[];
}

interface HcVariantGroupReviewProps {
  adminSecret: string;
  groups: Record<string, Asset[]>;
  onRefresh?: () => void;
}

export function HcVariantGroupReview({
  adminSecret,
  groups,
  onRefresh,
}: HcVariantGroupReviewProps) {
  const [acting, setActing] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<Record<string, string>>({});

  const headers = {
    "Content-Type": "application/json",
    "x-hc-admin-secret": adminSecret,
  };

  const groupList: VariantGroup[] = Object.entries(groups).map(([groupId, assets]) => ({
    groupId,
    assets: assets.sort((a, b) => (a.variant_index || 0) - (b.variant_index || 0)),
  }));

  async function doAction(action: string, params: Record<string, any>, resultKey: string) {
    setActing(resultKey);
    try {
      const res = await fetch("/api/admin/ai/variant-groups", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ action, ...params }),
      });
      const data = await res.json();
      setActionResult((prev) => ({
        ...prev,
        [resultKey]: data.ok ? `✅ ${action} done` : `❌ ${data.error || "Failed"}`,
      }));
      if (data.ok) onRefresh?.();
    } catch (err: any) {
      setActionResult((prev) => ({
        ...prev,
        [resultKey]: `❌ ${err.message}`,
      }));
    }
    setActing(null);
  }

  if (groupList.length === 0) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#5a6f82", fontSize: "13px" }}>
        No variant groups to review.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {groupList.map(({ groupId, assets }) => {
        const firstAsset = assets[0];
        const entityLabel = `${firstAsset?.entity_type || "?"} / ${firstAsset?.entity_id || "?"}`;

        return (
          <div
            key={groupId}
            style={{
              background: "#0D1117",
              border: "1px solid #1E2A36",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#CBD5E1" }}>
                  {firstAsset?.usage_slot?.toUpperCase() || "VARIANT"} Group
                </div>
                <div style={{ fontSize: "11px", color: "#5a6f82", marginTop: "2px" }}>
                  {entityLabel} · {assets.length} variant{assets.length !== 1 ? "s" : ""} · {groupId.slice(0, 8)}…
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => doAction("archive_losers", { variant_group_id: groupId }, `archive-${groupId}`)}
                  disabled={acting === `archive-${groupId}`}
                  style={{
                    background: "#1a0000",
                    border: "1px solid #ff2d2d33",
                    borderRadius: "4px",
                    padding: "4px 10px",
                    color: "#ff6b6b",
                    fontSize: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: acting === `archive-${groupId}` ? 0.5 : 1,
                  }}
                >
                  🗑 Archive Losers
                </button>
              </div>
            </div>

            {actionResult[`archive-${groupId}`] && (
              <div style={{ fontSize: "11px", color: "#8fa3b8", marginBottom: "8px" }}>
                {actionResult[`archive-${groupId}`]}
              </div>
            )}

            {/* Asset grid */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(assets.length, 4)}, 1fr)`, gap: "10px" }}>
              {assets.map((asset) => {
                const btnKey = `action-${asset.id}`;
                const isArchived = asset.status === "archived" || asset.is_archived;

                return (
                  <div
                    key={asset.id}
                    style={{
                      background: "#0A0F14",
                      border: `1px solid ${isArchived ? "#333" : "#1E2A36"}`,
                      borderRadius: "8px",
                      overflow: "hidden",
                      opacity: isArchived ? 0.4 : 1,
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <img
                        src={asset.public_url}
                        alt={`Variant ${asset.variant_index}`}
                        style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }}
                        loading="lazy"
                      />
                      {/* Status badge */}
                      <div
                        style={{
                          position: "absolute",
                          top: "6px",
                          left: "6px",
                          background:
                            asset.status === "published" ? "#22c55e"
                            : asset.status === "approved" ? "#3B82F6"
                            : asset.status === "rejected" ? "#ef4444"
                            : "#C6923A",
                          color: "#fff",
                          fontSize: "9px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "3px",
                          textTransform: "uppercase",
                        }}
                      >
                        {asset.status}
                      </div>
                      {/* Variant index */}
                      <div
                        style={{
                          position: "absolute",
                          top: "6px",
                          right: "6px",
                          background: "rgba(0,0,0,0.6)",
                          color: "#CBD5E1",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "3px",
                        }}
                      >
                        #{(asset.variant_index || 0) + 1}
                      </div>
                    </div>

                    {/* Actions */}
                    {!isArchived && (
                      <div style={{ padding: "6px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        <button
                          onClick={() => doAction("make_primary", { asset_id: asset.id }, `primary-${asset.id}`)}
                          disabled={acting === `primary-${asset.id}`}
                          title="Set as primary"
                          style={{
                            background: "#0D2818",
                            border: "1px solid #22c55e33",
                            borderRadius: "3px",
                            padding: "3px 6px",
                            color: "#22c55e",
                            fontSize: "9px",
                            fontWeight: 700,
                            cursor: "pointer",
                            flex: 1,
                          }}
                        >
                          ⭐ Primary
                        </button>
                        <button
                          onClick={() => doAction("make_live", { asset_id: asset.id }, `live-${asset.id}`)}
                          disabled={acting === `live-${asset.id}`}
                          title="Publish"
                          style={{
                            background: "#0D1630",
                            border: "1px solid #3B82F633",
                            borderRadius: "3px",
                            padding: "3px 6px",
                            color: "#3B82F6",
                            fontSize: "9px",
                            fontWeight: 700,
                            cursor: "pointer",
                            flex: 1,
                          }}
                        >
                          🚀 Live
                        </button>
                        <button
                          onClick={() => doAction("reject", { asset_id: asset.id }, `reject-${asset.id}`)}
                          disabled={acting === `reject-${asset.id}`}
                          title="Reject"
                          style={{
                            background: "#1a0a0a",
                            border: "1px solid #ef444433",
                            borderRadius: "3px",
                            padding: "3px 6px",
                            color: "#ef4444",
                            fontSize: "9px",
                            fontWeight: 700,
                            cursor: "pointer",
                            flex: 1,
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}

                    {actionResult[`primary-${asset.id}`] && (
                      <div style={{ padding: "0 6px 4px", fontSize: "9px", color: "#8fa3b8" }}>
                        {actionResult[`primary-${asset.id}`]}
                      </div>
                    )}
                    {actionResult[`live-${asset.id}`] && (
                      <div style={{ padding: "0 6px 4px", fontSize: "9px", color: "#8fa3b8" }}>
                        {actionResult[`live-${asset.id}`]}
                      </div>
                    )}
                    {actionResult[`reject-${asset.id}`] && (
                      <div style={{ padding: "0 6px 4px", fontSize: "9px", color: "#8fa3b8" }}>
                        {actionResult[`reject-${asset.id}`]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
