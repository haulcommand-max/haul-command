
"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface PostingCoachPanelProps {
    country: string;
    region: string;
    serviceType: string;
    miles: number | null;
    rateTotal: number | null;
    onSetRateTotal: (rate: number) => void;
}

export const PostingCoachPanel: React.FC<PostingCoachPanelProps> = ({
    country,
    region,
    serviceType,
    miles,
    rateTotal,
    onSetRateTotal,
}) => {
    const supabase = createClient();
    const [hint, setHint] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchHint() {
            if (!miles || miles <= 0) return;
            setLoading(true);

            // Placeholder RPC call
            const { data, error } = await supabase.rpc("get_posting_rate_hint", {
                p_country: country,
                p_region: region,
                p_service: serviceType,
                p_miles: miles
            });

            if (!error && data) {
                setHint(data);
            } else {
                // Mock data for demo purposes if RPC doesn't exist yet
                setHint({
                    benchmark_rate: miles * 2.5,
                    confidence_score: 85,
                    coaching_message: "Loads in this corridor fill 30% faster when priced above $2.40/mile.",
                    fill_speed_hours: 4,
                    demand_multiplier: 1.2
                });
            }
            setLoading(false);
        }

        fetchHint();
    }, [country, region, serviceType, miles]);

    if (!miles || miles <= 0) {
        return (
            <div style={{ padding: 16, background: "rgba(255,255,255,0.05)", borderRadius: 12, border: "1px dashed var(--hc-border)" }}>
                <p style={{ fontSize: 12, color: "var(--hc-muted)", margin: 0 }}>
                    Enter miles to unlock the Posting Coach & Market Alpha.
                </p>
            </div>
        );
    }

    if (loading) return <div style={{ fontSize: 12, color: "var(--hc-muted)" }}>Calculating Market Alpha...</div>;
    if (!hint) return null;

    const currentRpm = rateTotal ? (rateTotal / miles).toFixed(2) : "0.00";
    const benchmarkRpm = (hint.benchmark_rate / miles).toFixed(2);
    const isCompetitive = rateTotal && rateTotal >= hint.benchmark_rate;

    return (
        <div style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid var(--hc-border)",
            borderRadius: 16,
            padding: 16,
            backdropFilter: "blur(10px)"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>🧠</span>
                <div>
                    <h3 style={{ fontSize: 12, fontWeight: 900, margin: 0, textTransform: "uppercase" }}>Posting Coach</h3>
                    <p style={{ fontSize: 10, color: "var(--hc-muted)", margin: 0, textTransform: "uppercase" }}>Real-time Signal</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                    <p style={{ fontSize: 10, color: "var(--hc-muted)", margin: 0 }}>MARKET AVG</p>
                    <p style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>${hint.benchmark_rate}</p>
                    <p style={{ fontSize: 10, color: "var(--hc-muted)", margin: 0 }}>${benchmarkRpm}/mi</p>
                </div>
                <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 10, color: "var(--hc-muted)", margin: 0 }}>CURRENT RPM</p>
                    <p style={{ fontSize: 18, fontWeight: 900, margin: 0, color: isCompetitive ? "var(--hc-gold-600)" : "#ff4d4d" }}>
                        ${currentRpm}/mi
                    </p>
                    <p style={{ fontSize: 10, color: isCompetitive ? "var(--hc-gold-600)" : "#ff4d4d", margin: 0 }}>
                        {isCompetitive ? "COMPETITIVE" : "BELOW MARKET"}
                    </p>
                </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.05)", padding: 10, borderRadius: 8, borderLeft: "4px solid var(--hc-gold-600)" }}>
                <p style={{ fontSize: 11, margin: 0, lineHeight: 1.4 }}>
                    <strong>Coach:</strong> {hint.coaching_message}
                </p>
            </div>

            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: "bold", color: "var(--hc-muted)" }}>
                <span>DEMAND: {hint.demand_multiplier}x</span>
                <span>FILL EST: {hint.fill_speed_hours}h</span>
                <span style={{ color: "var(--hc-gold-600)" }}>CONFIDENCE: {hint.confidence_score}%</span>
            </div>
        </div>
    );
};
