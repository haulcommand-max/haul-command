"use client";

/**
 * /profile â€” Operator Trust Report Card
 *
 * ROUTING NOTE: This file MUST live at app/profile/page.tsx (top-level),
 * NOT inside app/(public)/profile, to take priority over the
 * app/[country]/layout.tsx catch-all which calls notFound() for unknown slugs.
 *
 * Static route always beats dynamic [country] segment in Next.js App Router.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
    ShieldCheck, Clock, Zap, TrendingUp, MapPin, Award,
    Star, BarChart3, Users, CheckCircle, Edit, ChevronRight,
    Truck, Radio
} from "lucide-react";

// â”€â”€ Design tokens (matching command center theme) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const T = {
    bg: "#060b12",
    surface: "rgba(255,255,255,0.03)",
    surfaceElevated: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.08)",
    borderStrong: "rgba(255,255,255,0.14)",
    gold: "#F1A91B",
    green: "#22c55e",
    blue: "#3ba4ff",
    red: "#f87171",
    textPrimary: "#ffffff",
    textBody: "#cfd8e3",
    textMuted: "#8fa3b8",
    textSubtle: "#5A6577",
} as const;

// â”€â”€ Trust meter ring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TrustRing({ score, label, color }: { score: number; label: string; color: string }) {
    const r = 52;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    return (
        <div className="relative flex flex-col items-center">
            <svg width="132" height="132" viewBox="0 0 132 132">
                <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <circle
                    cx="66" cy="66" r={r} fill="none"
                    stroke={color} strokeWidth="10"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 66 66)"
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-white leading-none">{score}</span>
                <span className="text-[9px] uppercase tracking-widest font-bold mt-1" style={{ color }}>{label}</span>
            </div>
        </div>
    );
}

// â”€â”€ Metric mini-card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MetricCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) {
    return (
        <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: T.textSubtle }}>{label}</span>
            </div>
            <div className="text-2xl font-black text-white leading-none">{value}</div>
            {sub && <div className="text-[10px]" style={{ color: T.textMuted }}>{sub}</div>}
        </div>
    );
}

// â”€â”€ Equipment badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EquipmentBadge({ label }: { label: string }) {
    return (
        <span className="px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide"
            style={{ background: T.surfaceElevated, border: `1px solid ${T.border}`, color: T.textBody }}>
            {label}
        </span>
    );
}

// â”€â”€ Service type display labels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SERVICE_LABEL: Record<string, string> = {
    pevo_lead_chase: "Lead Chase",
    pevo_pilot: "Pilot Car",
    pevo_high_pole: "High Pole",
    pevo_steersman: "Steersman",
    pevo_route_survey: "Route Survey",
    pevo_superload: "Superload",
    escort: "Escort",
    pilot_car: "Pilot Car",
    high_pole: "High Pole",
    steersman: "Steersman",
    route_survey: "Route Survey",
    bucket_truck: "Bucket Truck",
    police_escort: "Police Escort",
};

function fmtLastActive(ts: string | null | undefined): string {
    if (!ts) return "Unknown";
    const diff = Date.now() - new Date(ts).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

// â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ProfilePage() {
    const supabase = createClient();

    const [profileData, setProfileData] = useState<{
        full_name?: string;
        city?: string;
        state?: string;
        profile_strength?: number;
        claimed?: boolean;
        email?: string;
    } | null>(null);

    const [operatorData, setOperatorData] = useState<{
        jobs_completed?: number | null;
        avg_response_minutes?: number | null;
        on_time_rate_pct?: number | null;
        avg_rating?: number | null;
        last_active_at?: string | null;
        service_types?: string[] | null;
        coverage_regions?: string[] | null;
        is_verified?: boolean | null;
    } | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            // Parallel fetch: profiles + operators
            const [{ data: prof }, { data: op }] = await Promise.all([
                supabase
                    .from("profiles")
                    .select("full_name, city, state, profile_strength, claimed, email")
                    .eq("id", user.id)
                    .single(),
                supabase
                    .from("operators")
                    .select("jobs_completed, avg_response_minutes, on_time_rate_pct, avg_rating, last_active_at, service_types, coverage_regions, is_verified")
                    .eq("profile_id", user.id)
                    .maybeSingle(),
            ]);

            setProfileData(prof);
            setOperatorData(op);
            setLoading(false);
        }
        load();
    }, []);

    const profile = profileData; // alias for backwards compat in JSX below
    const trustScore = Math.min(99, Math.round((profileData?.profile_strength ?? 0) * 0.85)) || 72;
    const tier = trustScore >= 85 ? { label: "Elite", color: T.gold } :
        trustScore >= 70 ? { label: "Strong", color: T.green } :
            trustScore >= 55 ? { label: "Solid", color: T.blue } :
                { label: "Building", color: T.textMuted };

    // Operator-derived display values
    const jobsDone = operatorData?.jobs_completed ?? null;
    const avgResp = operatorData?.avg_response_minutes ?? null;
    const onTimeRate = operatorData?.on_time_rate_pct ?? null;
    const avgRating = operatorData?.avg_rating ?? null;
    const lastActive = fmtLastActive(operatorData?.last_active_at);
    const serviceTypes: string[] = (operatorData?.service_types ?? []).map(
        (slug: string) => SERVICE_LABEL[slug] ?? slug.replace(/_/g, ' ')
    );
    const regions: string[] = operatorData?.coverage_regions ?? [];
    const profileCompletion = profileData ? Math.min(100, 30
        + (profileData.claimed ? 20 : 0)
        + (serviceTypes.length > 0 ? 20 : 0)
        + (regions.length > 0 ? 15 : 0)
        + (jobsDone ? 15 : 0)) : 30;

    return (
        <div className="min-h-screen text-white" style={{ background: T.bg, fontFamily: "var(--font-body)" }}>

            {/* â”€â”€ Ambient glow â”€â”€ */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(241,169,27,0.07),transparent_70%)]" />
            </div>

            {/* â”€â”€ Header bar â”€â”€ */}
            <div className="relative z-10 border-b" style={{ borderColor: T.border, background: "rgba(6,11,18,0.9)", backdropFilter: "blur(12px)" }}>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: T.textSubtle }}>Command Profile</span>
                        {lastActive !== "Unknown" && (
                            <span className="ml-3 text-[10px]" style={{ color: T.textSubtle }}>Last active: {lastActive}</span>
                        )}
                    </div>
                    <Link href="/onboarding/start"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
                        style={{ background: `${T.gold}12`, border: `1px solid ${T.gold}28`, color: T.gold }}>
                        <Edit className="w-3 h-3" />
                        Edit Profile
                    </Link>
                </div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                    IDENTITY BLOCK
                â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                <div className="grid lg:grid-cols-3 gap-6 mb-8">

                    {/* Left: Identity */}
                    <div className="lg:col-span-2 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }}>

                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-2xl text-black shadow-lg"
                            style={{ background: `linear-gradient(135deg, ${T.gold}, #C6923A)` }}>
                            {loading ? "â€¦" : (profileData?.full_name?.[0] ?? "?")}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="text-2xl font-black text-white">
                                    {loading ? "Loadingâ€¦" : (profileData?.full_name ?? "Your Name")}
                                </h1>
                                {(profileData?.claimed || operatorData?.is_verified) && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                                        style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: T.green }}>
                                        <ShieldCheck className="w-3 h-3" />
                                        Verified
                                    </span>
                                )}
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                                    style={{ background: `${tier.color}12`, border: `1px solid ${tier.color}28`, color: tier.color }}>
                                    {tier.label}
                                </span>
                            </div>

                            {(profileData?.city || profileData?.state) && (
                                <div className="flex items-center gap-1.5 text-sm mb-3" style={{ color: T.textMuted }}>
                                    <MapPin className="w-3.5 h-3.5" />
                                    {[profileData.city, profileData.state].filter(Boolean).join(", ")}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 mt-3">
                                <Link href="/loads"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                    style={{ background: T.gold, color: "#000" }}>
                                    Browse Loads <ChevronRight className="w-3 h-3" />
                                </Link>
                                <Link href="/directory"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                    style={{ background: T.surfaceElevated, border: `1px solid ${T.border}`, color: T.textBody }}>
                                    View Directory
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right: Trust Score */}
                    <div className="rounded-3xl p-6 flex flex-col items-center gap-4"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <span className="text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: T.textSubtle }}>
                            Network Trust Score
                        </span>
                        <TrustRing score={trustScore} label={tier.label} color={tier.color} />
                        <div className="w-full space-y-2 mt-2">
                            {[
                                { label: "Profile completion", val: profileCompletion },
                                { label: "Verification status", val: (profileData?.claimed || operatorData?.is_verified) ? 100 : 20 },
                            ].map(({ label, val }) => (
                                <div key={label}>
                                    <div className="flex justify-between text-[10px] mb-1" style={{ color: T.textMuted }}>
                                        <span>{label}</span>
                                        <span className="font-bold">{val}%</span>
                                    </div>
                                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                                        <div className="h-full rounded-full" style={{ width: `${val}%`, background: tier.color, transition: "width 1s ease" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                    PERFORMANCE METRICS GRID
                â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    <MetricCard icon={CheckCircle} label="Jobs Completed"
                        value={jobsDone !== null ? jobsDone : "â€”"}
                        sub={jobsDone !== null ? "Verified jobs" : "No data yet"}
                        color={T.green} />
                    <MetricCard icon={Clock} label="Avg Response"
                        value={avgResp !== null ? `${avgResp}m` : "â€”"}
                        sub={avgResp !== null ? "to first contact" : "No data yet"}
                        color={T.gold} />
                    <MetricCard icon={TrendingUp} label="On-Time Rate"
                        value={onTimeRate !== null ? `${Math.round(onTimeRate)}%` : "â€”"}
                        sub={onTimeRate !== null ? "of dispatches" : "No data yet"}
                        color={T.blue} />
                    <MetricCard icon={Star} label="Avg Rating"
                        value={avgRating !== null ? avgRating.toFixed(1) : "â€”"}
                        sub={avgRating !== null ? "out of 5.0" : "No reviews yet"}
                        color={T.gold} />
                </div>

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                    LOWER GRID: Capabilities + Activity
                â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                <div className="grid lg:grid-cols-3 gap-6">

                    {/* Service capabilities */}
                    <div className="lg:col-span-2 rounded-3xl p-6 sm:p-8"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4" style={{ color: T.gold }} />
                                <h2 className="text-sm font-black uppercase tracking-[0.15em]" style={{ color: T.textMuted }}>
                                    Service Capabilities
                                </h2>
                            </div>
                            <Link href="/onboarding/start" className="text-[10px] font-bold uppercase tracking-wider transition-colors" style={{ color: T.gold }}>
                                Edit â†’
                            </Link>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {serviceTypes.length > 0
                                ? serviceTypes.map(s => <EquipmentBadge key={s} label={s} />)
                                : ["Lead Chase", "High Pole", "Pilot Car", "Route Survey"].map(s => (
                                    <EquipmentBadge key={s} label={s} />
                                ))
                            }
                            <Link href="/onboarding/start"
                                className="px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide border-dashed transition-colors hover:opacity-70"
                                style={{ border: `1px dashed ${T.border}`, color: T.textSubtle }}>
                                + Add More
                            </Link>
                        </div>

                        <div className="border-t pt-6" style={{ borderColor: T.border }}>
                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: T.textSubtle }}>
                                Service Regions
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {(regions.length > 0 ? regions : ["Texas", "Oklahoma", "Louisiana", "Arkansas"]).map(r => (
                                    <span key={r} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                                        style={{ background: T.surfaceElevated, border: `1px solid ${T.border}`, color: T.textBody }}>
                                        <MapPin className="w-2.5 h-2.5" style={{ color: T.gold }} />
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right sidebar: verification + badges */}
                    <div className="space-y-4">
                        {/* Verification checklist */}
                        <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <div className="flex items-center gap-2 mb-4">
                                <Award className="w-4 h-4" style={{ color: T.gold }} />
                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: T.textSubtle }}>
                                    Verification Status
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: "Profile claimed", done: profileData?.claimed ?? false },
                                    { label: "Operator verified", done: operatorData?.is_verified ?? false },
                                    { label: "First job completed", done: (jobsDone ?? 0) > 0 },
                                    { label: "Response rate tracked", done: avgResp !== null },
                                ].map(({ label, done }) => (
                                    <div key={label} className="flex items-center gap-2.5">
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0`}
                                            style={{ background: done ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${done ? "rgba(34,197,94,0.3)" : T.border}` }}>
                                            {done && <CheckCircle className="w-2.5 h-2.5" style={{ color: T.green }} />}
                                        </div>
                                        <span className="text-xs" style={{ color: done ? T.textBody : T.textSubtle }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: T.textSubtle }}>
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                {[
                                    { label: "View Load Board", href: "/loads", icon: BarChart3 },
                                    { label: "Check Leaderboard", href: "/leaderboards", icon: Radio },
                                    { label: "Browse Directory", href: "/directory", icon: Users },
                                ].map(({ label, href, icon: Icon }) => (
                                    <Link key={href} href={href}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                                        style={{ background: T.surfaceElevated, border: `1px solid ${T.border}`, color: T.textBody }}>
                                        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: T.gold }} />
                                        <span className="text-xs font-medium">{label}</span>
                                        <ChevronRight className="w-3 h-3 ml-auto" style={{ color: T.textSubtle }} />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* â”€â”€ Footer nudge â”€â”€ */}
                <div className="mt-10 text-center">
                    <p className="text-xs" style={{ color: T.textSubtle }}>
                        Trust scores update every 24 hours from job completion data and platform signals.
                        <Link href="/leaderboards" className="ml-1 font-bold hover:text-white transition-colors" style={{ color: T.gold }}>
                            See how you rank â†’
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );

}
