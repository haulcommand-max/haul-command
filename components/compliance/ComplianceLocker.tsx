"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// ══════════════════════════════════════════════════════════════════════════════
// ComplianceLocker — upload + view cert/insurance docs
// Reads from verification_artifacts table.
// Lists each doc type, its expiry, verification status, and upload action.
// ══════════════════════════════════════════════════════════════════════════════

interface VerificationArtifact {
    id: string;
    doc_type: string;
    file_url: string | null;
    verified: boolean;
    expires_at: string | null;
    uploaded_at: string | null;
    notes: string | null;
}

const DOC_TYPES: { key: string; label: string; icon: string; points: number; required: boolean }[] = [
    { key: "insurance", label: "Insurance COI", icon: "🛡️", points: 20, required: true },
    { key: "drivers_license", label: "Driver's License", icon: "🪪", points: 15, required: true },
    { key: "vehicle_reg", label: "Vehicle Registration", icon: "📋", points: 10, required: true },
    { key: "pilot_cert", label: "Pilot Car Cert", icon: "✅", points: 15, required: false },
    { key: "odsna_cert", label: "ODSNA Certification", icon: "🏛️", points: 10, required: false },
    { key: "twic_card", label: "TWIC Card", icon: "🔑", points: 10, required: false },
    { key: "defensive_driving", label: "Defensive Driving", icon: "🚗", points: 5, required: false },
];

function daysUntil(isoDate: string) {
    return Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86400000);
}

function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
    const days = daysUntil(expiresAt);
    const color = days < 0 ? "#ef4444" : days < 30 ? "#f59e0b" : "#10b981";
    const label = days < 0 ? "Expired" : days < 30 ? `${days}d left` : `${days}d`;
    return (
        <span style={{
            padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 800,
            background: `${color}15`, color, border: `1px solid ${color}40`,
        }}>
            {label}
        </span>
    );
}

interface ComplianceLockerProps {
    className?: string;
}

export function ComplianceLocker({ className = "" }: ComplianceLockerProps) {
    const [artifacts, setArtifacts] = useState<VerificationArtifact[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("verification_artifacts")
                .select("id, doc_type, file_url, verified, expires_at, uploaded_at, notes")
                .eq("user_id", user.id);

            if (data) setArtifacts(data as VerificationArtifact[]);
            setLoading(false);
        }
        load();
    }, []);

    async function handleUpload(docType: string, file: File) {
        setUploading(docType);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const ext = file.name.split(".").pop();
            const path = `compliance/${user.id}/${docType}_${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from("verification-docs")
                .upload(path, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from("verification-docs").getPublicUrl(path);

            // Upsert into verification_artifacts
            const { data: art, error: artError } = await supabase
                .from("verification_artifacts")
                .upsert({
                    user_id: user.id,
                    doc_type: docType,
                    file_url: publicUrl,
                    verified: false,
                    uploaded_at: new Date().toISOString(),
                }, { onConflict: "user_id, doc_type" })
                .select()
                .single();

            if (artError) throw artError;

            setArtifacts(prev => {
                const existing = prev.findIndex(a => a.doc_type === docType);
                if (existing >= 0) {
                    const next = [...prev];
                    next[existing] = art as VerificationArtifact;
                    return next;
                }
                return [...prev, art as VerificationArtifact];
            });
        } catch (err: any) {
            console.error("Upload failed:", err.message);
        } finally {
            setUploading(null);
        }
    }

    const artifactMap = Object.fromEntries(artifacts.map(a => [a.doc_type, a]));

    return (
        <div className={className}>
            <h2 style={{
                fontSize: 12, fontWeight: 900, textTransform: "uppercase",
                letterSpacing: "0.12em", color: "var(--hc-muted, #888)", margin: "0 0 16px",
            }}>
                Compliance Locker
            </h2>

            {loading ? (
                <div style={{ color: "var(--hc-muted, #888)", fontSize: 13, padding: 12 }}>Loading…</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {DOC_TYPES.map(doc => {
                        const existing = artifactMap[doc.key];
                        const hasFile = !!existing?.file_url;
                        const isUploading = uploading === doc.key;

                        return (
                            <div key={doc.key} style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "12px 16px",
                                background: hasFile ? "rgba(16,185,129,0.04)" : "var(--hc-panel, #141414)",
                                border: `1px solid ${hasFile ? "rgba(16,185,129,0.2)" : "var(--hc-border, #222)"}`,
                                borderRadius: 12,
                                transition: "all 0.15s",
                            }}>
                                {/* Icon */}
                                <span style={{ fontSize: 20, flexShrink: 0 }}>{doc.icon}</span>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--hc-text, #f5f5f5)" }}>
                                            {doc.label}
                                        </span>
                                        {doc.required && !hasFile && (
                                            <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 20, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", fontWeight: 700, textTransform: "uppercase" }}>
                                                Required
                                            </span>
                                        )}
                                        {existing?.verified && (
                                            <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 20, background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", fontWeight: 700, textTransform: "uppercase" }}>
                                                ✓ Verified
                                            </span>
                                        )}
                                        {existing?.expires_at && <ExpiryBadge expiresAt={existing.expires_at} />}
                                    </div>
                                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--hc-muted, #888)" }}>
                                        {hasFile ? `+${doc.points} pts` : `Upload to earn +${doc.points} pts`}
                                    </p>
                                </div>

                                {/* Upload / View action */}
                                {hasFile ? (
                                    <a
                                        href={existing.file_url!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                                            background: "var(--hc-elevated, #1e1e1e)",
                                            border: "1px solid var(--hc-border, #333)",
                                            color: "var(--hc-text, #f5f5f5)",
                                            textDecoration: "none", flexShrink: 0,
                                        }}
                                    >
                                        View
                                    </a>
                                ) : (
                                    <label style={{
                                        padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                                        background: isUploading ? "rgba(107,114,128,0.1)" : "rgba(217,119,6,0.12)",
                                        border: `1px solid ${isUploading ? "rgba(107,114,128,0.2)" : "rgba(217,119,6,0.35)"}`,
                                        color: isUploading ? "#6b7280" : "#d97706",
                                        cursor: isUploading ? "wait" : "pointer",
                                        flexShrink: 0,
                                    }}>
                                        {isUploading ? "Uploading…" : "Upload"}
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png,.heic"
                                            style={{ display: "none" }}
                                            disabled={isUploading}
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) handleUpload(doc.key, file);
                                                e.target.value = "";
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ComplianceLocker;
