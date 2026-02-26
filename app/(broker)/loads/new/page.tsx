"use client";

import React, { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PostingCoachPanel } from "@/components/rates/PostingCoachPanel";

type ServiceType =
    | "pevo_lead_chase"
    | "height_pole"
    | "bucket_truck"
    | "route_survey"
    | "police_state"
    | "police_local";

export default function CreateLoadPage() {
    const supabase = useMemo(() => createClient(), []);

    const [country, setCountry] = useState<"us" | "ca">("us");
    const [region, setRegion] = useState<string>("southeast"); // from geo_regions mapping
    const [serviceType, setServiceType] = useState<ServiceType>("pevo_lead_chase");

    const [originCity, setOriginCity] = useState("");
    const [originAdmin1, setOriginAdmin1] = useState("fl");
    const [destCity, setDestCity] = useState("");
    const [destAdmin1, setDestAdmin1] = useState("fl");

    // Canonical approach: store total + cached miles
    const [miles, setMiles] = useState<number | null>(null);
    const [rateTotal, setRateTotal] = useState<number | null>(null);

    const [instantMatch, setInstantMatch] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const isCompetitive = useMemo(() => {
        if (!miles || !rateTotal) return false;
        return (rateTotal / miles) >= 2.40;
    }, [miles, rateTotal]);

    async function computeMilesServerSide(): Promise<number | null> {
        // Best practice: RPC that computes miles once and caches it.
        // You’ll implement compute_miles_and_cache() in backend later (HERE/Google optional).
        // For now, return what broker typed or null.
        return miles;
    }

    async function onSubmit(status: "active" | "draft" = "active") {
        setMsg(null);

        // Block active if miles missing
        if (status === "active" && (!miles || miles <= 0)) {
            setMsg("Miles required to publish. Loads with full route data fill significantly faster.");
            return;
        }

        setSubmitting(true);
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) {
            setMsg("Please log in first.");
            setSubmitting(false);
            return;
        }

        const { error } = await supabase.from("loads").insert({
            status: status,
            posted_at: new Date().toISOString(),
            origin_country: country,
            origin_admin1: originAdmin1,
            origin_city: originCity,
            dest_country: country,
            dest_admin1: destAdmin1,
            dest_city: destCity,
            service_required: serviceType,
            miles: miles,
            rate_amount: rateTotal,
            rate_currency: "USD",
        });

        if (error) {
            setMsg(error.message);
        } else {
            if (status === "active" && instantMatch) {
                setMsg("One-Tap Dispatch Initiated! Fetching top candidates...");
            } else {
                setMsg(status === "active" ? "Load posted." : "Draft saved.");
            }
        }

        setSubmitting(false);
    }

    const showMilesWarning = !miles || miles <= 0;

    return (
        <div style={{ maxWidth: 920, margin: "0 auto", padding: 18, color: "var(--hc-text)" }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 10 }}>Post a Load</h1>

            {showMilesWarning && (
                <div style={{
                    padding: 12,
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    borderRadius: 12,
                    marginBottom: 20,
                    fontSize: 13,
                    color: "#f59e0b",
                    fontWeight: "bold"
                }}>
                    ⚠️ Miles required to publish. Loads with full route data fill significantly faster.
                </div>
            )}

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                <label>
                    Country
                    <select value={country} onChange={(e) => setCountry(e.target.value as any)} style={sel()}>
                        <option value="us">United States</option>
                        <option value="ca">Canada</option>
                    </select>
                </label>

                <label>
                    Region (pricing region)
                    <select value={region} onChange={(e) => setRegion(e.target.value)} style={sel()}>
                        <option value="southeast">Southeast</option>
                        <option value="midwest">Midwest</option>
                        <option value="northeast">Northeast</option>
                        <option value="southwest">Southwest</option>
                        <option value="west_coast">West Coast</option>
                        <option value="midwest_northeast">Midwest/Northeast</option>
                        <option value="west_coast_canada">West Coast/Canada</option>
                    </select>
                </label>

                <label>
                    Service Type
                    <select value={serviceType} onChange={(e) => setServiceType(e.target.value as any)} style={sel()}>
                        <option value="pevo_lead_chase">PEVO Lead/Chase</option>
                        <option value="height_pole">Height Pole</option>
                        <option value="bucket_truck">Bucket Truck Escort</option>
                        <option value="route_survey">Route Survey</option>
                        <option value="police_state">Police Escort (State)</option>
                        <option value="police_local">Police Escort (Local)</option>
                    </select>
                </label>

                <label>
                    Miles {showMilesWarning && <span style={{ color: "#f59e0b" }}>*Required</span>}
                    <input
                        value={miles ?? ""}
                        onChange={(e) => setMiles(e.target.value ? Number(e.target.value) : null)}
                        placeholder="e.g. 304"
                        style={{ ...inp(), borderColor: showMilesWarning ? "#f59e0b" : "var(--hc-border)" }}
                    />
                </label>

                <label>
                    Origin City
                    <input value={originCity} onChange={(e) => setOriginCity(e.target.value)} style={inp()} />
                </label>

                <label>
                    Origin State/Prov
                    <input value={originAdmin1} onChange={(e) => setOriginAdmin1(e.target.value)} style={inp()} />
                </label>

                <label>
                    Destination City
                    <input value={destCity} onChange={(e) => setDestCity(e.target.value)} style={inp()} />
                </label>

                <label>
                    Destination State/Prov
                    <input value={destAdmin1} onChange={(e) => setDestAdmin1(e.target.value)} style={inp()} />
                </label>

                <label style={{ gridColumn: "1 / -1" }}>
                    Total Rate (canonical)
                    <input
                        value={rateTotal ?? ""}
                        onChange={(e) => setRateTotal(e.target.value ? Number(e.target.value) : null)}
                        placeholder="e.g. 850"
                        style={inp()}
                    />
                </label>
            </div>

            <div style={{ marginTop: 14 }}>
                <PostingCoachPanel
                    country={country}
                    region={region}
                    serviceType={serviceType}
                    miles={miles}
                    rateTotal={rateTotal}
                    onSetRateTotal={setRateTotal}
                />
            </div>

            {/* Instant Match Toggle */}
            <div style={{
                marginTop: 20,
                padding: 16,
                background: instantMatch ? "rgba(245, 158, 11, 0.05)" : "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: instantMatch ? "1.5px solid var(--hc-gold-600)" : "1px solid var(--hc-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                transition: "all 0.2s"
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                        ⚡ Instant Match & One-Tap Dispatch
                        {isCompetitive && <span style={{ fontSize: 10, background: "var(--hc-gold-600)", color: "#000", padding: "2px 6px", borderRadius: 4 }}>RECOMMENDED</span>}
                    </div>
                    <p style={{ fontSize: 11, color: "var(--hc-muted)", margin: "4px 0 0 0" }}>
                        Bypass the load board. Automatically award this load to verified Elite providers matching your rate.
                    </p>
                </div>
                <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, cursor: isCompetitive ? "pointer" : "not-allowed", opacity: isCompetitive ? 1 : 0.5 }}>
                    <input
                        type="checkbox"
                        disabled={!isCompetitive}
                        checked={instantMatch}
                        onChange={(e) => setInstantMatch(e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                        position: "absolute", borderRadius: 34, top: 0, left: 0, right: 0, bottom: 0,
                        background: instantMatch ? "var(--hc-gold-600)" : "#333", transition: "0.2s"
                    }}>
                        <span style={{
                            position: "absolute", height: 18, width: 18, left: instantMatch ? 22 : 3, bottom: 3,
                            background: "white", borderRadius: "50%", transition: "0.2s"
                        }} />
                    </span>
                </label>
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 12, alignItems: "center" }}>
                <button
                    onClick={() => onSubmit("active")}
                    disabled={submitting || showMilesWarning}
                    style={{
                        flex: 1.5,
                        padding: "18px",
                        borderRadius: 14,
                        background: (submitting || showMilesWarning) ? "var(--hc-border)" : "var(--hc-gold-600)",
                        color: "#111",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        cursor: (submitting || showMilesWarning) ? "not-allowed" : "pointer",
                        opacity: showMilesWarning ? 0.5 : 1,
                        transition: "all 0.2s",
                        boxShadow: (instantMatch && !submitting) ? "0 0 20px rgba(245, 158, 11, 0.4)" : "none"
                    }}
                >
                    {submitting ? "Processing..." : instantMatch ? "Confirm & One-Tap Dispatch" : "Activate & Publish"}
                </button>
                <button
                    onClick={() => onSubmit("draft")}
                    disabled={submitting}
                    style={{
                        flex: 1,
                        padding: "16px",
                        borderRadius: 12,
                        background: "transparent",
                        border: "1px solid var(--hc-border)",
                        color: "var(--hc-text)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        cursor: submitting ? "not-allowed" : "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    Save Draft
                </button>
            </div>
            {msg && <div style={{ marginTop: 12, color: "var(--hc-gold-600)", fontSize: 13, textAlign: "center", fontWeight: "bold" }}>{msg}</div>}
        </div>
    );
}

function inp(): React.CSSProperties {
    return {
        width: "100%",
        marginTop: 6,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--hc-border)",
        background: "var(--hc-panel)",
        color: "var(--hc-text)",
        outline: "none",
    };
}

function sel(): React.CSSProperties {
    return { ...inp(), appearance: "auto" };
}
