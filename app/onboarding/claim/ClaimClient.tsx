"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Shield, CheckCircle, Star, ArrowRight, Zap,
    Phone, Globe, Mail, ChevronRight, Crown, Sparkles,
} from "lucide-react";

const PREMIUM_PRICE = 99;
const PREMIUM_FEATURES = [
    { icon: Shield, label: "Proof Review", desc: "Eligible proof badge after source review" },
    { icon: Star, label: "Labeled Placement", desc: "Eligible sponsor surfaces where inventory exists" },
    { icon: Zap, label: "Request Alerts", desc: "Notifications for eligible support requests" },
    { icon: Mail, label: "Review Capture", desc: "Ask for feedback after confirmed platform jobs" },
    { icon: Globe, label: "Profile Schema", desc: "Structured profile page and richer entity context" },
    { icon: Phone, label: "Public Contact Path", desc: "Show the safest broker request route you approve" },
];

const VERIFICATION_METHODS = [
    { id: "phone", label: "Phone Contact", icon: Phone, desc: "Submit a business number for ownership review", time: "review step" },
    { id: "website", label: "Website Proof", icon: Globe, desc: "Submit website proof instructions for review", time: "review step" },
    { id: "email", label: "Domain Email", icon: Mail, desc: "Submit a company email for ownership review", time: "review step" },
];

export default function ClaimClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const surfaceId = searchParams.get("surface_id") || "";
    const surfaceName = searchParams.get("name") || "Your Business";

    const [step, setStep] = useState<"verify" | "plan" | "checkout">("verify");
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<"free" | "premium">("premium");

    async function handleVerify() {
        if (!selectedMethod) return;
        setVerifying(true);
        // Local ownership method selection only; proof review happens after submission.
        await new Promise(resolve => setTimeout(resolve, 2000));
        setVerifying(false);
        setStep("plan");
    }

    function handlePlanSelect() {
        if (selectedPlan === "premium") {
            router.push(`/onboarding/claim/checkout?surface_id=${surfaceId}&plan=premium`);
        } else {
            router.push(`/onboarding/claim/success?surface_id=${surfaceId}&plan=free`);
        }
    }

    return (
        <div className=" bg-hc-bg text-white">
            <div className="max-w-2xl mx-auto px-4 py-16">
                {/* Progress */}
                <div className="flex items-center justify-center gap-3 mb-12">
                    {["Claim", "Plan", "Submit"].map((label, i) => {
                        const stepIdx = i === 0 ? "verify" : i === 1 ? "plan" : "checkout";
                        const isActive = step === stepIdx || (step === "checkout" && i <= 2);
                        const isDone = (step === "plan" && i === 0) || (step === "checkout" && i <= 1);
                        return (
                            <div key={label} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${isDone ? "bg-emerald-500 border-emerald-500 text-white" : isActive ? "border-[#C6923A] text-[#C6923A]" : "border-white/10 text-white/30"}`}>
                                    {isDone ? <CheckCircle className="w-4 h-4" /> : i + 1}
                                </div>
                                <span className={`text-xs font-semibold uppercase tracking-wider ${isActive || isDone ? "text-white" : "text-white/30"}`}>
                                    {label}
                                </span>
                                {i < 2 && <ChevronRight className="w-3 h-3 text-white/20" />}
                            </div>
                        );
                    })}
                </div>

                {/* STEP 1: Verify */}
                {step === "verify" && (
                    <div className="space-y-8">
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C6923A]/10 border border-[#C6923A]/20 mb-4">
                                <Shield className="w-4 h-4 text-[#C6923A]" />
                                <span className="text-xs font-bold text-[#C6923A] uppercase tracking-wider">Claim Your Listing</span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight mt-4" style={{ fontFamily: "var(--font-display)" }}>
                                Verify {surfaceName}
                            </h1>
                            <p className="text-white/50 mt-2 text-sm">
                                Start the ownership step so you can correct public fields and submit proof for review.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {VERIFICATION_METHODS.map(method => (
                                <button aria-label="Interactive Button"
                                    key={method.id}
                                    onClick={() => setSelectedMethod(method.id)}
                                    className="w-full text-left p-4 rounded-2xl border transition-all"
                                    style={{
                                        background: selectedMethod === method.id ? "rgba(198,146,58,0.08)" : "rgba(255,255,255,0.02)",
                                        borderColor: selectedMethod === method.id ? "rgba(198,146,58,0.3)" : "rgba(255,255,255,0.06)",
                                        cursor: "pointer",
                                        minHeight: "72px",
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(198,146,58,0.1)" }}>
                                            <method.icon className="w-5 h-5 text-[#C6923A]" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-sm text-white">{method.label}</div>
                                            <div className="text-xs text-white/40">{method.desc}</div>
                                        </div>
                                        <span className="text-[10px] text-white/30 font-mono">{method.time}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button aria-label="Interactive Button"
                            onClick={handleVerify}
                            disabled={!selectedMethod || verifying}
                            className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all"
                            style={{
                                background: selectedMethod ? "linear-gradient(135deg, #C6923A, #E0B05C)" : "rgba(255,255,255,0.06)",
                                color: selectedMethod ? "#000" : "rgba(255,255,255,0.3)",
                                cursor: selectedMethod ? "pointer" : "not-allowed",
                                minHeight: "56px",
                            }}
                        >
                            {verifying ? "Submitting..." : "Submit Ownership Step"}
                        </button>
                    </div>
                )}

                {/* STEP 2: Plan Selection */}
                {step === "plan" && (
                    <div className="space-y-8">
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Ownership Step Submitted</span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight mt-4" style={{ fontFamily: "var(--font-display)" }}>
                                Choose Your Plan
                            </h1>
                        </div>

                        <div className="grid gap-4">
                            {/* Free */}
                            <button aria-label="Interactive Button"
                                onClick={() => setSelectedPlan("free")}
                                className="text-left p-6 rounded-2xl border transition-all"
                                style={{
                                    background: selectedPlan === "free" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.01)",
                                    borderColor: selectedPlan === "free" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
                                    cursor: "pointer",
                                }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-lg">Free Claim</h3>
                                    <span className="text-lg font-black text-white/50">$0</span>
                                </div>
                                <p className="text-sm text-white/40">Claim the listing, correct core fields, and submit proof when available.</p>
                            </button>

                            {/* Premium */}
                            <button aria-label="Interactive Button"
                                onClick={() => setSelectedPlan("premium")}
                                className="text-left p-6 rounded-2xl border transition-all relative overflow-hidden"
                                style={{
                                    background: selectedPlan === "premium" ? "rgba(198,146,58,0.08)" : "rgba(255,255,255,0.02)",
                                    borderColor: selectedPlan === "premium" ? "rgba(198,146,58,0.3)" : "rgba(255,255,255,0.06)",
                                    cursor: "pointer",
                                }}
                            >
                                <div className="absolute top-3 right-3">
                                    <span className="px-2 py-1 rounded-full bg-[#C6923A] text-[10px] font-black text-white uppercase">Recommended</span>
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Crown className="w-5 h-5 text-[#C6923A]" />
                                    <h3 className="font-bold text-lg text-[#C6923A]">Premium</h3>
                                </div>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-3xl font-black text-white">${PREMIUM_PRICE}</span>
                                    <span className="text-sm text-white/40">/month</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {PREMIUM_FEATURES.map(f => (
                                        <div key={f.label} className="flex items-start gap-2">
                                            <f.icon className="w-3.5 h-3.5 text-[#C6923A] mt-0.5 flex-shrink-0" />
                                            <div>
                                                <div className="text-xs font-semibold text-white">{f.label}</div>
                                                <div className="text-[10px] text-white/35">{f.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </button>
                        </div>

                        <button aria-label="Interactive Button"
                            onClick={handlePlanSelect}
                            className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider text-white"
                            style={{
                                background: "linear-gradient(135deg, #C6923A, #E0B05C)",
                                minHeight: "56px",
                                cursor: "pointer",
                            }}
                        >
                            {selectedPlan === "premium" ? `Continue to Checkout — $${PREMIUM_PRICE}/mo` : "Continue with Free"}
                            <ArrowRight className="w-4 h-4 inline ml-2" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
