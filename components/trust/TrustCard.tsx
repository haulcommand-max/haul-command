"use client";

import { useEffect, useState } from "react";

interface ComponentScore {
    good_sum: number;
    bad_sum: number;
    s_k: number;
}

interface CorridorScore {
    corridor_name: string;
    trust_score: number;
    confidence: number;
}

interface TrustProfile {
    profile_id: string;
    role: string;
    trust_score: number;
    trust_trend: number;
    confidence: number;
    trust_tier: "elite" | "strong" | "solid" | "watch" | "risk";
    confidence_band: "high" | "medium" | "low";
    trend_band: "improving" | "stable" | "declining";
    components: Record<string, ComponentScore>;
}

interface TrustCardProps {
    profileId: string;
    className?: string;
}

const TIER_COLORS: Record<string, string> = {
    elite: "text-hc-gold-400  border-hc-gold-400/40  bg-hc-gold-400/10",
    strong: "text-hc-success   border-hc-success/40   bg-hc-success/10",
    solid: "text-[#38BDF8]    border-[#38BDF8]/40    bg-[#38BDF8]/10",
    watch: "text-hc-warning   border-hc-warning/40   bg-hc-warning/10",
    risk: "text-hc-danger    border-hc-danger/40    bg-hc-danger/10",
};

const COMPONENT_LABELS: Record<string, string> = {
    reliability: "Reliability",
    communication: "Communication",
    safety: "Safety",
    execution: "Execution",
    professionalism: "Professionalism",
    admin: "Admin",
    payment: "Payment",
    load_quality: "Load Quality",
    site_preparedness: "Site Prep",
    turnaround: "Turnaround",
};

function TrendArrow({ band }: { band: string }) {
    if (band === "improving") return <span className="text-hc-success font-bold">↑</span>;
    if (band === "declining") return <span className="text-hc-danger font-bold">↓</span>;
    return <span className="text-hc-subtle">→</span>;
}

function ConfidencePip({ band }: { band: string }) {
    const dots = band === "high" ? 3 : band === "medium" ? 2 : 1;
    return (
        <span className="flex gap-0.5">
            {[1, 2, 3].map((d) => (
                <span
                    key={d}
                    className={`w-1.5 h-1.5 rounded-full ${d <= dots ? "bg-hc-gold-500" : "bg-hc-elevated"}`}
                />
            ))}
        </span>
    );
}

export function TrustCard({ profileId, className = "" }: TrustCardProps) {
    const [profile, setProfile] = useState<TrustProfile | null>(null);
    const [corridors, setCorridors] = useState<CorridorScore[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [pRes, cRes] = await Promise.all([
                    fetch(`/api/trust/profile/${profileId}`),
                    fetch(`/api/trust/corridors/${profileId}`),
                ]);
                if (pRes.ok) setProfile(await pRes.json());
                if (cRes.ok) setCorridors((await cRes.json()).corridors ?? []);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [profileId]);

    if (loading) {
        return (
            <div className={`rounded-2xl border border-hc-border bg-hc-surface p-5 ${className}`}>
                <div className="h-12 skeleton rounded-xl mb-4" />
                <div className="h-4 skeleton rounded mb-2 w-3/4" />
                <div className="h-4 skeleton rounded w-1/2" />
            </div>
        );
    }

    if (!profile) return null;

    // Sort components by s_k
    const sorted = Object.entries(profile.components ?? {})
        .filter(([, v]) => v.s_k != null)
        .sort(([, a], [, b]) => b.s_k - a.s_k);

    const strengths = sorted.slice(0, 3);
    const watchouts = sorted.slice(-2).reverse();

    const tierClass = TIER_COLORS[profile.trust_tier] ?? TIER_COLORS.risk;

    return (
        <div className={`rounded-2xl border border-hc-border bg-hc-surface overflow-hidden ${className}`}>
            {/* Header */}
            <div className="p-5 border-b border-hc-border">
                <div className="flex items-start justify-between gap-3">
                    {/* Trust score — hero placement, top-right per YAML trust_score_final */}
                    <div>
                        <div className="text-5xl font-black text-hc-text leading-none tabular-nums">
                            {Math.round(profile.trust_score)}
                        </div>
                        <div className="text-hc-muted text-[10px] font-bold uppercase tracking-widest mt-1">Trust Score</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${tierClass}`}>
                            {profile.trust_tier}
                        </span>
                        <div className="flex items-center gap-2">
                            <TrendArrow band={profile.trend_band} />
                            <ConfidencePip band={profile.confidence_band} />
                        </div>
                    </div>
                </div>

                {/* Score bar */}
                <div className="mt-4 h-1.5 rounded-full bg-hc-elevated overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-hc-gold-600 to-hc-gold-400 transition-all duration-700"
                        style={{ width: `${Math.min(100, profile.trust_score)}%` }}
                    />
                </div>
            </div>

            {/* Strengths */}
            {strengths.length > 0 && (
                <div className="px-5 pt-4 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-hc-subtle mb-2" style={{ opacity: 0.72 }}>Strengths</p>
                    <div className="flex flex-wrap gap-1.5">
                        {strengths.map(([key, val]) => (
                            <span
                                key={key}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-hc-success/10 border border-hc-success/20 text-hc-success text-xs font-semibold"
                            >
                                {COMPONENT_LABELS[key] ?? key}
                                <span className="opacity-60">{Math.round(val.s_k * 100)}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Watch-outs */}
            {watchouts.length > 0 && watchouts[0][1].s_k < 0.6 && (
                <div className="px-5 pb-4 pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-hc-subtle mb-2" style={{ opacity: 0.72 }}>Watch-outs</p>
                    <div className="flex flex-wrap gap-1.5">
                        {watchouts.map(([key, val]) => (
                            val.s_k < 0.7 && (
                                <span
                                    key={key}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-hc-warning/10 border border-hc-warning/20 text-hc-warning text-xs font-semibold"
                                >
                                    {COMPONENT_LABELS[key] ?? key}
                                    <span className="opacity-60">{Math.round(val.s_k * 100)}</span>
                                </span>
                            )
                        ))}
                    </div>
                </div>
            )}

            {/* Corridor scores */}
            {corridors.length > 0 && (
                <div className="px-5 py-4 border-t border-hc-border">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-hc-subtle mb-3" style={{ opacity: 0.72 }}>Top Corridors</p>
                    <div className="space-y-2">
                        {corridors.slice(0, 5).map((c) => (
                            <div key={c.corridor_name} className="flex items-center gap-3">
                                <span className="text-xs text-hc-muted w-20 truncate">{c.corridor_name}</span>
                                <div className="flex-1 h-1.5 rounded-full bg-hc-elevated overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-hc-gold-600 to-hc-gold-400"
                                        style={{ width: `${Math.min(100, c.trust_score)}%` }}
                                    />
                                </div>
                                <span className="text-xs text-hc-muted w-7 text-right tabular-nums">
                                    {Math.round(c.trust_score)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
