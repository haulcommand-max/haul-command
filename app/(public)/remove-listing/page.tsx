"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, AlertTriangle, Search, CheckCircle2, Loader2 } from "lucide-react";

type RequestType = "remove" | "correct" | "claim" | "hide_contact";

export default function RemoveListingPage() {
    const [step, setStep] = useState<"form" | "submitting" | "done">("form");
    const [requestType, setRequestType] = useState<RequestType>("remove");
    const [businessName, setBusinessName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [details, setDetails] = useState("");
    const [error, setError] = useState<string | null>(null);

    const options: { value: RequestType; label: string; desc: string; icon: string }[] = [
        { value: "remove", label: "Remove Listing", desc: "Completely remove this listing from the directory.", icon: "ðŸ—‘ï¸" },
        { value: "correct", label: "Correct Information", desc: "Fix inaccurate information on an existing listing.", icon: "âœï¸" },
        { value: "claim", label: "Claim Listing", desc: "This is my business â€” I want to manage it.", icon: "ðŸ´" },
        { value: "hide_contact", label: "Hide Contact Info", desc: "Keep listing but remove phone, email, and address.", icon: "ðŸ”’" },
    ];

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!businessName.trim() || !email.trim()) {
            setError("Business name and email are required.");
            return;
        }

        setStep("submitting");

        try {
            const res = await fetch("/api/directory/remove-listing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    request_type: requestType,
                    business_name: businessName.trim(),
                    email: email.trim(),
                    phone: phone.trim() || null,
                    details: details.trim() || null,
                }),
            });

            if (!res.ok) throw new Error("Failed to submit request");
            setStep("done");
        } catch {
            setError("Something went wrong. Please try again or email support@haulcommand.com.");
            setStep("form");
        }
    }

    if (step === "done") {
        return (
            <div style={{
                minHeight: "100vh",
                background: "linear-gradient(160deg, #030712, #0c1222, #030712)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Inter', system-ui, sans-serif",
                padding: 24,
            }}>
                <div style={{ textAlign: "center", maxWidth: 480 }}>
                    <CheckCircle2 style={{ width: 64, height: 64, color: "#22c55e", margin: "0 auto 24px" }} />
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 12 }}>
                        Request Received
                    </h1>
                    <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7, marginBottom: 32 }}>
                        We've received your {requestType === "remove" ? "removal" : requestType === "correct" ? "correction" : requestType === "claim" ? "claim" : "privacy"} request.
                        You'll receive a confirmation email within 24 hours.
                        {requestType === "remove" && " Under GDPR, PIPEDA, LGPD, and POPIA, we process removal requests within 30 days."}
                    </p>
                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 24 }}>
                        Reference: HC-{Date.now().toString(36).toUpperCase()}
                    </div>
                    <Link aria-label="Navigation Link" href="/" style={{
                        display: "inline-block", padding: "12px 28px",
                        background: "#F1A91B", color: "#000", borderRadius: 12,
                        fontWeight: 800, fontSize: 13, textDecoration: "none",
                    }}>
                        Back to Haul Command
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(160deg, #030712, #0c1222, #030712)",
            color: "#e2e8f0",
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 24px 80px" }}>
                {/* Header */}
                <div style={{ marginBottom: 40 }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "6px 14px", borderRadius: 20,
                        background: "rgba(241,169,27,0.1)", border: "1px solid rgba(241,169,27,0.2)",
                        fontSize: 11, fontWeight: 800, color: "#F1A91B", marginBottom: 16,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>
                        <ShieldCheck style={{ width: 14, height: 14 }} />
                        Privacy & Data Control
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, marginBottom: 12, color: "#fff" }}>
                        Manage Your Listing
                    </h1>
                    <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7, maxWidth: 500 }}>
                        Haul Command is a logistics directory platform. We respect your right to control how your business information appears.
                        Use this form to remove, correct, claim, or restrict your listing.
                    </p>
                </div>

                {/* Compliance Banner */}
                <div style={{
                    padding: "14px 18px", borderRadius: 14, marginBottom: 32,
                    background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)",
                    display: "flex", alignItems: "flex-start", gap: 12,
                }}>
                    <AlertTriangle style={{ width: 18, height: 18, color: "#3b82f6", flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                        <strong style={{ color: "#fff" }}>Your rights:</strong> Under GDPR (EU), PIPEDA (Canada), LGPD (Brazil),
                        and POPIA (South Africa), you have the right to request removal or correction of your data.
                        Haul Command processes all requests within 30 days.
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Request Type */}
                    <div style={{ marginBottom: 28 }}>
                        <label style={{
                            display: "block", fontSize: 10, fontWeight: 800,
                            textTransform: "uppercase", letterSpacing: "0.12em",
                            color: "#64748b", marginBottom: 12,
                        }}>
                            What would you like to do?
                        </label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {options.map(opt => (
                                <button aria-label="Interactive Button"
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setRequestType(opt.value)}
                                    style={{
                                        padding: "16px",
                                        background: requestType === opt.value ? "rgba(241,169,27,0.08)" : "#0f172a",
                                        border: `1px solid ${requestType === opt.value ? "rgba(241,169,27,0.4)" : "#1e293b"}`,
                                        borderRadius: 14,
                                        textAlign: "left",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <div style={{ fontSize: 20, marginBottom: 6 }}>{opt.icon}</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{opt.label}</div>
                                    <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{opt.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Business Name */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={{
                            display: "block", fontSize: 10, fontWeight: 800,
                            textTransform: "uppercase", letterSpacing: "0.12em",
                            color: "#64748b", marginBottom: 8,
                        }}>
                            Business Name *
                        </label>
                        <input
                            type="text"
                            value={businessName}
                            onChange={e => setBusinessName(e.target.value)}
                            placeholder="e.g. Titan Escort Services"
                            required
                            style={{
                                width: "100%", padding: "12px 16px", borderRadius: 10,
                                background: "#0f172a", border: "1px solid #1e293b",
                                color: "#fff", fontSize: 14, outline: "none",
                            }}
                        />
                    </div>

                    {/* Email */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={{
                            display: "block", fontSize: 10, fontWeight: 800,
                            textTransform: "uppercase", letterSpacing: "0.12em",
                            color: "#64748b", marginBottom: 8,
                        }}>
                            Your Email *
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            required
                            style={{
                                width: "100%", padding: "12px 16px", borderRadius: 10,
                                background: "#0f172a", border: "1px solid #1e293b",
                                color: "#fff", fontSize: 14, outline: "none",
                            }}
                        />
                    </div>

                    {/* Phone (optional) */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={{
                            display: "block", fontSize: 10, fontWeight: 800,
                            textTransform: "uppercase", letterSpacing: "0.12em",
                            color: "#64748b", marginBottom: 8,
                        }}>
                            Phone (optional â€” for verification)
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="+1 555 123 4567"
                            style={{
                                width: "100%", padding: "12px 16px", borderRadius: 10,
                                background: "#0f172a", border: "1px solid #1e293b",
                                color: "#fff", fontSize: 14, outline: "none",
                            }}
                        />
                    </div>

                    {/* Details */}
                    <div style={{ marginBottom: 28 }}>
                        <label style={{
                            display: "block", fontSize: 10, fontWeight: 800,
                            textTransform: "uppercase", letterSpacing: "0.12em",
                            color: "#64748b", marginBottom: 8,
                        }}>
                            Additional Details
                        </label>
                        <textarea
                            value={details}
                            onChange={e => setDetails(e.target.value)}
                            placeholder={requestType === "correct" ? "What information needs to be corrected?" : "Any additional context..."}
                            rows={4}
                            style={{
                                width: "100%", padding: "12px 16px", borderRadius: 10,
                                background: "#0f172a", border: "1px solid #1e293b",
                                color: "#fff", fontSize: 14, outline: "none",
                                resize: "vertical", minHeight: 100,
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: "10px 16px", borderRadius: 10, marginBottom: 20,
                            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                            color: "#f87171", fontSize: 13, fontWeight: 600,
                        }}>
                            {error}
                        </div>
                    )}

                    <button aria-label="Interactive Button"
                        type="submit"
                        disabled={step === "submitting"}
                        style={{
                            width: "100%", padding: "14px 24px", borderRadius: 14,
                            background: "#F1A91B", color: "#000", border: "none",
                            fontSize: 14, fontWeight: 800, cursor: "pointer",
                            textTransform: "uppercase", letterSpacing: "0.06em",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            opacity: step === "submitting" ? 0.7 : 1,
                        }}
                    >
                        {step === "submitting" && <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />}
                        Submit Request
                    </button>
                </form>

                {/* Platform Disclaimer */}
                <div style={{
                    marginTop: 40, padding: "16px 18px", borderRadius: 12,
                    background: "rgba(255,255,255,0.02)", border: "1px solid #1e293b",
                }}>
                    <p style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
                        <strong style={{ color: "#64748b" }}>Platform Disclaimer:</strong> Haul Command is a logistics directory
                        and marketplace platform. We do not employ operators or brokers and are not responsible for
                        transactions between parties. Listing data is aggregated from public sources and user submissions.
                        Contact <a href="mailto:support@haulcommand.com" style={{ color: "#F1A91B" }}>support@haulcommand.com</a> for
                        urgent requests.
                    </p>
                </div>
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}