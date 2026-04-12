"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function KycStepUpPage() {
    const supabase = createClient();
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMsg(null);

        try {
            const { data: authData } = await supabase.auth.getUser();
            if (!authData?.user) throw new Error("Please log in.");

            // In a real flow, this would upload a document to Supabase Storage and mark profile pending
            // For now, we simulate the submission
            await supabase.from("event_log").insert({
                actor_profile_id: authData.user.id,
                actor_role: "operator",
                event_type: "kyc.document_submitted",
                entity_type: "operator_profiles",
                entity_id: authData.user.id,
                payload: { level: 2, status: "pending_review" }
            });

            // Update profile
            await supabase.from("operator_profiles").update({ 
                kyc_status: "pending_l2" 
            }).eq("user_id", authData.user.id);

            setMsg({ text: "Documents submitted successfully. You will be notified once reviewed.", type: "success" });
        } catch (err: any) {
            setMsg({ text: err.message, type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, paddingBottom: 64, color: "var(--hc-text)" }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>Identity Verification Required</h1>
            <p style={{ color: "var(--hc-muted)", marginBottom: 24, lineHeight: 1.5 }}>
                Your account requires Level 2 KYC verification. This could be triggered by high-value load
                requirements or an automated risk flag. Please upload a government-issued ID and commercial insurance certificate.
            </p>

            <div style={{
                background: "var(--hc-panel)",
                border: "1px solid var(--hc-border)",
                borderRadius: 16,
                padding: 24,
            }}>
                <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 8, fontWeight: 600 }}>
                        Government Issued ID (Driver's License or Passport)
                        <input type="file" required style={{ 
                            padding: 12, 
                            border: "1px dashed var(--hc-border)", 
                            borderRadius: 8,
                            background: "rgba(255,255,255,0.02)"
                        }} />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 8, fontWeight: 600 }}>
                        Commercial Liability Certificate (COI)
                        <input type="file" required style={{ 
                            padding: 12, 
                            border: "1px dashed var(--hc-border)", 
                            borderRadius: 8,
                            background: "rgba(255,255,255,0.02)"
                        }} />
                    </label>
                    <p style={{ fontSize: 13, color: "var(--hc-muted)", marginTop: -8 }}>
                        Max file size: 10MB per document. Supported formats: .JPG, .PNG, .PDF
                    </p>

                    {msg && (
                        <div style={{
                            padding: 12,
                            borderRadius: 8,
                            background: msg.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            color: msg.type === "success" ? "#22c55e" : "#ef4444",
                            fontWeight: 600,
                            fontSize: 14
                        }}>
                            {msg.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            marginTop: 12,
                            padding: 16,
                            borderRadius: 12,
                            background: submitting ? "var(--hc-border)" : "var(--hc-gold-600)",
                            color: "#111",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            cursor: submitting ? "not-allowed" : "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        {submitting ? "Uploading Documents..." : "Submit for Verification"}
                    </button>
                </form>
            </div>
        </div>
    );
}