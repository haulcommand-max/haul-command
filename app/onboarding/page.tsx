"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { MapPin, Zap, ToggleLeft, ArrowRight, CheckCircle } from "lucide-react";
import { ProfileStrengthMeter } from "@/components/onboarding/ProfileStrengthMeter";
import { track } from "@/lib/analytics/track";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Step = 1 | 2 | 3;

const CAPABILITIES = [
    { key: "chase_only", label: "Chase only" },
    { key: "lead", label: "Lead car" },
    { key: "height_pole", label: "Height pole" },
    { key: "night_moves", label: "Night moves" },
    { key: "weekend", label: "Weekend runs" },
    { key: "multi_state", label: "Multi-state" },
] as const;

const US_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
    "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
    "VA", "WA", "WV", "WI", "WY",
];

// Mirror the DB compute_profile_strength function client-side
function computeStrength({
    full_name, home_base_state, phone_verified, vehicle_type, coverage_radius,
}: {
    full_name: string; home_base_state: string; phone_verified: boolean;
    vehicle_type: string; coverage_radius: number;
}) {
    let pts = 0;
    if (full_name?.trim()) pts += 5;
    if (phone_verified) pts += 15;
    if (home_base_state) pts += 10;
    if (vehicle_type) pts += 10;
    if (coverage_radius > 0) pts += 10;
    return Math.min(pts, 100);
}

function getVisibilityTier(s: number) {
    if (s >= 80) return "featured" as const;
    if (s >= 50) return "standard" as const;
    if (s >= 25) return "limited" as const;
    return "hidden" as const;
}

export default function OnboardingPage() {
    const [step, setStep] = useState<Step>(1);
    const [userId, setUserId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Step 1
    const [homeCity, setHomeCity] = useState("");
    const [homeState, setHomeState] = useState("FL");
    const [radius, setRadius] = useState(150);

    // Step 2
    const [caps, setCaps] = useState<Record<string, boolean>>({ chase_only: true });

    // Step 3
    const [availability, setAvailability] = useState<"available" | "busy" | "offline">("available");

    const capsJson = useMemo(() => {
        const out: Record<string, boolean> = {};
        for (const c of CAPABILITIES) out[c.key] = !!caps[c.key];
        return out;
    }, [caps]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    }, []);

    // Compute real-time strength
    const strength = computeStrength({
        full_name: homeCity, // proxy — name captured in step 1
        home_base_state: homeState,
        phone_verified: false,
        vehicle_type: Object.keys(caps).find(k => caps[k]) ?? "",
        coverage_radius: radius,
    });
    const tier = getVisibilityTier(strength);

    async function save(patch: Record<string, any>) {
        if (!userId) return;
        const res = await fetch("/api/onboarding/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, patch }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error ?? "Save failed");
    }

    async function next() {
        setSaving(true);
        setError("");
        try {
            if (step === 1) {
                if (!homeCity.trim()) throw new Error("Enter your home city.");
                await save({
                    home_base_city: homeCity.trim(),
                    home_base_state: homeState,
                    radius_miles: radius,
                    city: homeCity.trim(),
                    state: homeState,
                    onboarding_step: 1,
                });
                setStep(2);
            } else if (step === 2) {
                await save({ capabilities: capsJson, onboarding_step: 2 });
                setStep(3);
            } else {
                const t0 = performance.now();
                await save({
                    availability,
                    onboarding_step: 3,
                    onboarding_completed_at: new Date().toISOString(),
                });
                const latency_ms = Math.round(performance.now() - t0);

                // Fire after successful save — never before
                track.onboardingCompleted({
                    latency_ms,
                    steps_completed: 3,
                });

                window.location.href = "/directory";
            }
        } catch (e: any) {
            setError(e.message ?? "Unexpected error.");
        } finally {
            setSaving(false);
        }
    }

    const stepMeta = [
        { icon: MapPin, label: "Home Base" },
        { icon: Zap, label: "Capabilities" },
        { icon: ToggleLeft, label: "Availability" },
    ];

    return (
        <div className="min-h-screen bg-hc-bg flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md space-y-6">

                {/* Header */}
                <div className="text-center">
                    <div className="text-[10px] text-hc-subtle uppercase tracking-widest font-bold mb-2">Haul Command</div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">Get set up in 60 seconds</h1>
                    <p className="text-hc-muted text-sm mt-1">Fast entry now. Refine details later.</p>
                </div>

                {/* Live strength meter — shows from step 1 onward */}
                <ProfileStrengthMeter strength={strength} tier={tier} compact />

                {/* Progress steps */}
                <div className="flex gap-2">
                    {stepMeta.map(({ icon: Icon, label }, i) => {
                        const n = i + 1;
                        const active = n === step;
                        const done = n < step;
                        return (
                            <div key={n} className="flex-1 flex flex-col items-center gap-1.5">
                                <div className={`w-full h-1.5 rounded-full transition-all duration-500 ${done ? "bg-hc-gold-500" : active ? "bg-hc-gold-500/40" : "bg-hc-elevated"}`} />
                                <div className="flex items-center gap-1">
                                    <Icon className={`w-3 h-3 ${done || active ? "text-hc-gold-500" : "text-hc-border"}`} />
                                    <span className={`text-[9px] uppercase tracking-wider font-bold ${done || active ? "text-hc-gold-500" : "text-hc-border"}`}>{label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Step 1 — Home Base */}
                {step === 1 && (
                    <div className="hc-card p-6 space-y-5">
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Where are you based?</h2>
                            <p className="text-hc-muted text-sm mt-0.5">Powers "loads near you" notifications.</p>
                        </div>
                        <div>
                            <label className="block text-[10px] text-hc-muted uppercase font-black tracking-[0.2em] mb-2">Home City</label>
                            <input
                                value={homeCity}
                                onChange={e => setHomeCity(e.target.value)}
                                placeholder="e.g. Gainesville"
                                className="w-full px-4 py-3 bg-hc-elevated border border-hc-border text-hc-text rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-hc-gold-500/30 focus:border-hc-gold-500/50 placeholder:text-hc-subtle min-h-[48px]"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-hc-muted uppercase font-black tracking-[0.2em] mb-2">Home State</label>
                            <select
                                value={homeState}
                                onChange={e => setHomeState(e.target.value)}
                                className="w-full px-4 py-3 bg-hc-elevated border border-hc-border text-hc-text rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-hc-gold-500/30 min-h-[48px]"
                            >
                                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] text-hc-muted uppercase font-black tracking-[0.2em] mb-2">
                                Run Radius — <span className="text-hc-gold-500">{radius} miles</span>
                            </label>
                            <input
                                type="range" min={25} max={500} step={25}
                                value={radius}
                                onChange={e => setRadius(Number(e.target.value))}
                                className="w-full accent-hc-gold-500 mt-2"
                            />
                            <div className="flex justify-between text-[10px] text-hc-subtle mt-0.5">
                                <span>25 mi</span><span>500 mi</span>
                            </div>
                        </div>
                        {error && <div className="text-hc-danger text-sm">{error}</div>}
                        <button
                            onClick={next} disabled={saving}
                            className="w-full py-3.5 bg-hc-gold-500 hover:bg-hc-gold-600 disabled:opacity-50 text-hc-bg font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all min-h-[52px] uppercase tracking-widest"
                        >
                            Continue <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Step 2 — Capabilities */}
                {step === 2 && (
                    <div className="hc-card p-6 space-y-5">
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">What can you run?</h2>
                            <p className="text-hc-muted text-sm mt-0.5">Helps brokers find the right match. Change anytime.</p>
                        </div>
                        <div className="space-y-2">
                            {CAPABILITIES.map(({ key, label }) => (
                                <label
                                    key={key}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all min-h-[48px] ${caps[key] ? "border-hc-gold-500/40 bg-hc-gold-500/5" : "border-hc-border bg-hc-elevated"}`}
                                >
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border flex-shrink-0 transition-all ${caps[key] ? "bg-hc-gold-500 border-hc-gold-500" : "border-hc-border"}`}>
                                        {caps[key] && <CheckCircle className="w-3.5 h-3.5 text-hc-bg" />}
                                    </div>
                                    <input type="checkbox" checked={!!caps[key]} onChange={e => setCaps(p => ({ ...p, [key]: e.target.checked }))} className="sr-only" />
                                    <span className="text-sm font-medium text-hc-text">{label}</span>
                                </label>
                            ))}
                        </div>
                        {error && <div className="text-hc-danger text-sm">{error}</div>}
                        <button
                            onClick={next} disabled={saving}
                            className="w-full py-3.5 bg-hc-gold-500 hover:bg-hc-gold-600 disabled:opacity-50 text-hc-bg font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all min-h-[52px] uppercase tracking-widest"
                        >
                            Continue <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Step 3 — Availability */}
                {step === 3 && (
                    <div className="hc-card p-6 space-y-5">
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Turn on availability</h2>
                            <p className="text-hc-muted text-sm mt-0.5">Brokers only see you if you're available. Change anytime.</p>
                        </div>
                        <div className="space-y-2">
                            {(["available", "busy", "offline"] as const).map(v => {
                                const labels = { available: "Available — show me loads", busy: "Busy — light alerts only", offline: "Offline — no alerts" };
                                const dotColors = { available: "bg-hc-success", busy: "bg-hc-warning", offline: "bg-hc-subtle" };
                                const active = availability === v;
                                return (
                                    <label key={v} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all min-h-[48px] ${active ? "border-hc-border-high bg-hc-elevated" : "border-hc-border"}`} onClick={() => setAvailability(v)}>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${active ? "border-hc-gold-500" : "border-hc-border"}`}>
                                            {active && <div className={`w-2.5 h-2.5 rounded-full ${dotColors[v]}`} />}
                                        </div>
                                        <span className="text-sm font-medium text-hc-text">{labels[v]}</span>
                                    </label>
                                );
                            })}
                        </div>
                        <div className="p-4 bg-hc-elevated border border-hc-border rounded-xl">
                            <div className="text-sm font-bold text-hc-text mb-1">Enable push alerts</div>
                            <div className="text-hc-muted text-xs mb-3">Loads near your radius hit your phone first.</div>
                            <button type="button" onClick={() => { if ("Notification" in window) Notification.requestPermission(); }} className="w-full py-2.5 border border-hc-gold-500/30 text-hc-gold-500 text-sm font-bold rounded-lg hover:bg-hc-gold-500/5 transition-all min-h-[44px]">
                                Enable Alerts
                            </button>
                        </div>
                        {error && <div className="text-hc-danger text-sm">{error}</div>}
                        <button onClick={next} disabled={saving} className="w-full py-3.5 bg-hc-gold-500 hover:bg-hc-gold-600 disabled:opacity-50 text-hc-bg font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all min-h-[52px] uppercase tracking-widest">
                            Finish Setup <Zap className="w-4 h-4" />
                        </button>
                        <p className="text-center text-[10px] text-hc-subtle">Redirects to the live directory.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
