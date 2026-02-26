"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Phone, Truck, Map, ShieldCheck, Zap,
    ChevronRight, CheckCircle2, ArrowLeft, Clock
} from "lucide-react";
import { ProfileStrengthMeter } from "@/components/onboarding/ProfileStrengthMeter";

// ══════════════════════════════════════════════════════════════
// OnboardingWizard — Haul Command Progressive Onboarding Engine
// Phase 1 (skill spec §13): steps + meter + tiering (no admin review yet)
// Design rules (skill spec §4.2):
//   • every step < 90 seconds
//   • show "why it matters" + tier thresholds
//   • allow skip (except role + quick profile)
// ══════════════════════════════════════════════════════════════

type Role = "escort" | "broker";

interface WizardState {
    role?: Role;
    step: number;          // 0 = role, 1 = profile, 2 = phone, 3 = vehicle, 4 = coverage, 5 = done
    full_name: string;
    home_base_city: string;
    home_base_state: string;
    vehicle_type: string;
    coverage_radius: number;
    phone: string;
    phone_verified: boolean;
}

const STEPS = [
    { id: "role", icon: User, label: "Role", seconds: 30, required: true },
    { id: "profile", icon: User, label: "Profile", seconds: 60, required: true },
    { id: "phone", icon: Phone, label: "Verify", seconds: 60, required: false },
    { id: "vehicle", icon: Truck, label: "Vehicle", seconds: 45, required: false },
    { id: "coverage", icon: Map, label: "Corridor", seconds: 45, required: false },
    { id: "done", icon: CheckCircle2, label: "Done", seconds: 0, required: false },
];

const US_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
    "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
    "VA", "WA", "WV", "WI", "WY",
];

const VEHICLE_TYPES = [
    "Pilot Car", "High Pole Car", "Lead Car", "Chase Car",
    "Steersman", "Boom Truck", "Flag Car", "Other",
];

// Compute strength from wizard state (mirrors the SQL function offline)
function computeStrength(s: WizardState): number {
    let pts = 0;
    if (s.full_name?.trim()) pts += 5;
    if (s.phone_verified) pts += 15;
    if (s.home_base_state) pts += 10;
    if (s.vehicle_type) pts += 10;
    if (s.coverage_radius > 0) pts += 10;
    return Math.min(pts, 100);
}

function getVisibilityTier(strength: number) {
    if (strength >= 80) return "featured" as const;
    if (strength >= 50) return "standard" as const;
    if (strength >= 25) return "limited" as const;
    return "hidden" as const;
}

// ── Step screens ─────────────────────────────────────────────

function StepRoleSelect({ onSelect }: { onSelect: (role: Role) => void }) {
    return (
        <div className="space-y-4">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                    What brings you here?
                </h2>
                <p className="text-sm text-hc-muted">Takes 30 seconds. No credit card.</p>
            </div>
            <button
                onClick={() => onSelect("escort")}
                className="w-full flex items-center gap-4 p-6 bg-hc-surface border border-hc-border hover:border-hc-gold-500 rounded-2xl text-left transition-all duration-200 group min-h-[88px]"
            >
                <div className="w-12 h-12 rounded-xl bg-hc-gold-500/10 border border-hc-gold-500/20 flex items-center justify-center shrink-0">
                    <Truck className="w-6 h-6 text-hc-gold-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-hc-text uppercase tracking-tight">I'm a Pilot Car Operator</p>
                    <p className="text-xs text-hc-muted mt-0.5">Find loads, get discovered, build your reputation</p>
                </div>
                <ChevronRight className="w-5 h-5 text-hc-subtle group-hover:text-hc-gold-500 transition-colors shrink-0" />
            </button>
            <button
                onClick={() => onSelect("broker")}
                className="w-full flex items-center gap-4 p-6 bg-hc-surface border border-hc-border hover:border-hc-gold-500 rounded-2xl text-left transition-all duration-200 group min-h-[88px]"
            >
                <div className="w-12 h-12 rounded-xl bg-hc-gold-500/10 border border-hc-gold-500/20 flex items-center justify-center shrink-0">
                    <Map className="w-6 h-6 text-hc-gold-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-hc-text uppercase tracking-tight">I'm a Freight Broker / Carrier</p>
                    <p className="text-xs text-hc-muted mt-0.5">Post loads, find escorts fast, track performance</p>
                </div>
                <ChevronRight className="w-5 h-5 text-hc-subtle group-hover:text-hc-gold-500 transition-colors shrink-0" />
            </button>
        </div>
    );
}

function StepQuickProfile({ value: s, onChange }: {
    value: WizardState;
    onChange: (patch: Partial<WizardState>) => void;
}) {
    return (
        <div className="space-y-5">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Quick Profile</h2>
                <p className="text-xs text-hc-muted">Adds 15 pts · appears in directory</p>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="block text-[10px] font-black text-hc-muted uppercase tracking-[0.2em] mb-2">
                        Full Name / Company Name *
                    </label>
                    <input
                        type="text"
                        value={s.full_name}
                        onChange={e => onChange({ full_name: e.target.value })}
                        placeholder="Texas Eagle Pilot Services"
                        className="w-full px-4 py-3 bg-hc-elevated border border-hc-border rounded-xl text-hc-text placeholder:text-hc-subtle focus:outline-none focus:ring-2 focus:ring-hc-gold-500/30 focus:border-hc-gold-500/50 min-h-[48px]"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-black text-hc-muted uppercase tracking-[0.2em] mb-2">City</label>
                        <input
                            type="text"
                            value={s.home_base_city}
                            onChange={e => onChange({ home_base_city: e.target.value })}
                            placeholder="Houston"
                            className="w-full px-4 py-3 bg-hc-elevated border border-hc-border rounded-xl text-hc-text placeholder:text-hc-subtle focus:outline-none focus:ring-2 focus:ring-hc-gold-500/30 focus:border-hc-gold-500/50 min-h-[48px]"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-hc-muted uppercase tracking-[0.2em] mb-2">State *</label>
                        <select
                            value={s.home_base_state}
                            onChange={e => onChange({ home_base_state: e.target.value })}
                            className="w-full px-4 py-3 bg-hc-elevated border border-hc-border rounded-xl text-hc-text focus:outline-none focus:ring-2 focus:ring-hc-gold-500/30 focus:border-hc-gold-500/50 min-h-[48px]"
                        >
                            <option value="">Select</option>
                            {US_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepPhoneVerify({ value: s, onChange }: {
    value: WizardState;
    onChange: (patch: Partial<WizardState>) => void;
}) {
    const [codeSent, setCodeSent] = useState(false);
    const [code, setCode] = useState("");
    return (
        <div className="space-y-5">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Verify Phone</h2>
                <p className="text-xs text-hc-muted">Adds 15 pts · unlocks broker messaging</p>
            </div>
            <div>
                <label className="block text-[10px] font-black text-hc-muted uppercase tracking-[0.2em] mb-2">Mobile Number</label>
                <div className="flex gap-2">
                    <input
                        type="tel"
                        value={s.phone}
                        onChange={e => onChange({ phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="flex-1 px-4 py-3 bg-hc-elevated border border-hc-border rounded-xl text-hc-text placeholder:text-hc-subtle focus:outline-none focus:ring-2 focus:ring-hc-gold-500/30 focus:border-hc-gold-500/50 min-h-[48px]"
                    />
                    <button
                        onClick={() => setCodeSent(true)}
                        className="px-4 py-3 bg-hc-gold-500 hover:bg-hc-gold-600 text-hc-bg font-black text-xs uppercase tracking-widest rounded-xl transition-colors min-h-[48px] min-w-[80px]"
                    >
                        Send
                    </button>
                </div>
            </div>
            <AnimatePresence>
                {codeSent && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        <label className="block text-[10px] font-black text-hc-muted uppercase tracking-[0.2em]">
                            Enter 6-digit code
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                maxLength={6}
                                placeholder="000000"
                                className="flex-1 px-4 py-3 bg-hc-elevated border border-hc-border rounded-xl text-hc-text placeholder:text-hc-subtle focus:outline-none focus:ring-2 focus:ring-hc-gold-500/30 focus:border-hc-gold-500/50 min-h-[48px] text-center tracking-[0.5em] text-lg font-black"
                            />
                            <button
                                onClick={() => onChange({ phone_verified: true })}
                                className="px-4 py-3 bg-hc-success hover:bg-hc-success/80 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors min-h-[48px] min-w-[80px]"
                            >
                                Verify
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {s.phone_verified && (
                <div className="flex items-center gap-2 text-hc-success text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Phone verified — +15 pts added
                </div>
            )}
        </div>
    );
}

function StepVehicleAdd({ value: s, onChange }: {
    value: WizardState;
    onChange: (patch: Partial<WizardState>) => void;
}) {
    return (
        <div className="space-y-5">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Your Vehicle</h2>
                <p className="text-xs text-hc-muted">Adds 10 pts · determines which loads you see</p>
            </div>
            <div>
                <label className="block text-[10px] font-black text-hc-muted uppercase tracking-[0.2em] mb-2">Vehicle Type</label>
                <div className="grid grid-cols-2 gap-2">
                    {VEHICLE_TYPES.map(v => (
                        <button
                            key={v}
                            onClick={() => onChange({ vehicle_type: v })}
                            className={cn(
                                "px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-widest text-left transition-all min-h-[48px]",
                                s.vehicle_type === v
                                    ? "bg-hc-gold-500 border-hc-gold-500 text-hc-bg"
                                    : "bg-hc-elevated border-hc-border text-hc-muted hover:border-hc-border-high"
                            )}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StepCoverageSetup({ value: s, onChange }: {
    value: WizardState;
    onChange: (patch: Partial<WizardState>) => void;
}) {
    const radii = [50, 100, 200, 350, 500, 999];
    return (
        <div className="space-y-5">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Coverage Radius</h2>
                <p className="text-xs text-hc-muted">Adds 10 pts · puts you on broker radar</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {radii.map(r => (
                    <button
                        key={r}
                        onClick={() => onChange({ coverage_radius: r })}
                        className={cn(
                            "px-4 py-4 rounded-xl border text-sm font-black uppercase tracking-widest transition-all min-h-[56px]",
                            s.coverage_radius === r
                                ? "bg-hc-gold-500 border-hc-gold-500 text-hc-bg"
                                : "bg-hc-elevated border-hc-border text-hc-muted hover:border-hc-border-high"
                        )}
                    >
                        {r === 999 ? "National" : `${r}mi`}
                    </button>
                ))}
            </div>
        </div>
    );
}

function StepDone({ name }: { name: string }) {
    return (
        <div className="text-center space-y-6 py-6">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-20 h-20 rounded-full bg-hc-success/10 border-2 border-hc-success flex items-center justify-center mx-auto"
            >
                <CheckCircle2 className="w-10 h-10 text-hc-success" />
            </motion.div>
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                    You're In, {name.split(" ")[0] || "Operator"}
                </h2>
                <p className="text-sm text-hc-muted leading-relaxed max-w-xs mx-auto">
                    Your profile is live. Upload your insurance to unlock Standard tier and appear higher in broker searches.
                </p>
            </div>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <a
                    href="/app"
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-hc-gold-500 hover:bg-hc-gold-600 text-hc-bg font-black text-sm uppercase tracking-widest rounded-xl transition-colors shadow-dispatch min-h-[52px]"
                >
                    <Zap className="w-4 h-4" />
                    Open Today Panel
                </a>
                <a
                    href="/directory"
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-hc-elevated border border-hc-border text-hc-muted hover:text-hc-text font-bold text-sm uppercase tracking-widest rounded-xl transition-colors min-h-[52px]"
                >
                    Browse Directory
                </a>
            </div>
        </div>
    );
}

// ── Main Wizard ───────────────────────────────────────────────

export function OnboardingWizard({ className }: { className?: string }) {
    const [state, setState] = useState<WizardState>({
        step: 0,
        full_name: "",
        home_base_city: "",
        home_base_state: "",
        vehicle_type: "",
        coverage_radius: 0,
        phone: "",
        phone_verified: false,
    });

    const update = useCallback((patch: Partial<WizardState>) => {
        setState(prev => ({ ...prev, ...patch }));
    }, []);

    const strength = computeStrength(state);
    const tier = getVisibilityTier(strength);
    const totalSteps = state.role === "broker" ? 3 : STEPS.length - 1;
    const progress = state.step === 0 ? 0 : Math.round((state.step / totalSteps) * 100);

    function advance() {
        setState(prev => {
            // Brokers skip vehicle + coverage steps
            if (prev.role === "broker" && prev.step === 2) {
                return { ...prev, step: 5 }; // jump to done
            }
            return { ...prev, step: prev.step + 1 };
        });
    }

    function back() {
        setState(prev => ({ ...prev, step: Math.max(0, prev.step - 1) }));
    }

    const canAdvance = (() => {
        if (state.step === 0) return !!state.role;
        if (state.step === 1) return !!state.full_name?.trim() && !!state.home_base_state;
        return true; // all other steps are skippable
    })();

    const currentStep = STEPS[state.step] ?? STEPS[STEPS.length - 1];
    const isDone = state.step >= 5;

    return (
        <div className={cn("min-h-screen bg-hc-bg flex flex-col", className)}>

            {/* Progress bar */}
            {!isDone && (
                <div className="w-full h-1 bg-hc-elevated">
                    <motion.div
                        className="h-full bg-hc-gold-500"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                </div>
            )}

            <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-8 gap-6">

                {/* Strength meter — visible from step 1 onward */}
                {state.step >= 1 && !isDone && (
                    <ProfileStrengthMeter
                        strength={strength}
                        tier={tier}
                        compact
                    />
                )}

                {/* Step counter */}
                {!isDone && state.step > 0 && (
                    <div className="flex items-center justify-between">
                        <button
                            onClick={back}
                            className="flex items-center gap-1 text-xs text-hc-muted hover:text-hc-text transition-colors min-h-[44px] px-1"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: totalSteps }, (_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "h-1 rounded-full transition-all duration-300",
                                        i < state.step ? "bg-hc-gold-500 w-6" : "bg-hc-border w-4"
                                    )}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-hc-subtle">
                            <Clock className="w-3.5 h-3.5" />
                            {currentStep.seconds}s
                        </div>
                    </div>
                )}

                {/* Step content */}
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={state.step}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                            {state.step === 0 && (
                                <StepRoleSelect onSelect={role => { update({ role }); advance(); }} />
                            )}
                            {state.step === 1 && <StepQuickProfile value={state} onChange={update} />}
                            {state.step === 2 && <StepPhoneVerify value={state} onChange={update} />}
                            {state.step === 3 && <StepVehicleAdd value={state} onChange={update} />}
                            {state.step === 4 && <StepCoverageSetup value={state} onChange={update} />}
                            {isDone && <StepDone name={state.full_name} />}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Next / Skip */}
                {!isDone && state.step > 0 && (
                    <div className="flex flex-col gap-2 pb-safe">
                        <button
                            onClick={advance}
                            disabled={!canAdvance}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all min-h-[52px]",
                                canAdvance
                                    ? "bg-hc-gold-500 hover:bg-hc-gold-600 text-hc-bg shadow-dispatch"
                                    : "bg-hc-elevated border border-hc-border text-hc-subtle cursor-not-allowed"
                            )}
                        >
                            {state.step === totalSteps - 1 ? (
                                <><CheckCircle2 className="w-4 h-4" /> Finish</>
                            ) : (
                                <>Continue <ChevronRight className="w-4 h-4" /></>
                            )}
                        </button>
                        {!currentStep.required && (
                            <button
                                onClick={advance}
                                className="text-xs text-hc-subtle hover:text-hc-muted transition-colors py-2 min-h-[44px]"
                            >
                                Skip this step →
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default OnboardingWizard;
