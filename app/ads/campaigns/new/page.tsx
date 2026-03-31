"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Megaphone, Target, DollarSign, Upload, ArrowRight,
    CheckCircle, MapPin, Tag, BarChart3
} from "lucide-react";

const SLOTS = [
    { id: "operator_profile_sidebar", label: "Operator Profile Sidebar", minBid: 200 },
    { id: "corridor_top_slot", label: "Corridor Page — Top", minBid: 500 },
    { id: "surface_directory_top", label: "Directory — Top", minBid: 300 },
    { id: "glossary_term_sidebar", label: "Glossary — Sidebar", minBid: 100 },
    { id: "homepage_mid", label: "Homepage — Mid Feed", minBid: 800 },
    { id: "booking_confirmation", label: "Booking Confirmation", minBid: 400 },
];

export default function NewCampaignPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [campaign, setCampaign] = useState({
        name: "",
        slot: "",
        bidCpm: 300,
        dailyBudget: 5000,
        targetCountries: ["US"],
        targetCorridors: [] as string[],
        headline: "",
        body: "",
        clickUrl: "",
        sponsorName: "",
    });
    const [submitting, setSubmitting] = useState(false);

    function update(field: string, value: any) {
        setCampaign(prev => ({ ...prev, [field]: value }));
    }

    async function handleSubmit() {
        setSubmitting(true);
        // In production, this calls the API to create the campaign
        await new Promise(r => setTimeout(r, 1500));
        setSubmitting(false);
        router.push("/ads/campaigns?created=1");
    }

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "14px 16px", borderRadius: 14,
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        color: "#fff", fontSize: 14, fontWeight: 500, outline: "none",
        transition: "border-color 0.2s", minHeight: 52,
    };

    return (
        <div className="min-h-screen bg-hc-bg text-white">
            <div className="max-w-xl mx-auto px-4 py-16">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C6923A]/10 border border-[#C6923A]/20 mb-4">
                        <Megaphone className="w-4 h-4 text-[#C6923A]" />
                        <span className="text-xs font-bold text-[#C6923A] uppercase tracking-wider">Self-Serve Ads</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                        Create a Campaign
                    </h1>
                    <p className="text-white/50 mt-2 text-sm">
                        Reach brokers and operators on the Haul Command network.
                    </p>
                </div>

                {/* Step 1: Basics */}
                {step === 1 && (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Campaign Name</label>
                            <input style={inputStyle} value={campaign.name} onChange={e => update("name", e.target.value)} placeholder="e.g., Q1 Corridor Campaign" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Sponsor Name</label>
                            <input style={inputStyle} value={campaign.sponsorName} onChange={e => update("sponsorName", e.target.value)} placeholder="Your company name" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Ad Placement</label>
                            <div className="grid gap-2">
                                {SLOTS.map(slot => (
                                    <button aria-label="Interactive Button" key={slot.id}
                                        onClick={() => update("slot", slot.id)}
                                        className="text-left p-3 rounded-xl border transition-all"
                                        style={{
                                            background: campaign.slot === slot.id ? "rgba(198,146,58,0.08)" : "rgba(255,255,255,0.02)",
                                            borderColor: campaign.slot === slot.id ? "rgba(198,146,58,0.3)" : "rgba(255,255,255,0.06)",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{slot.label}</span>
                                            <span className="text-[10px] text-white/30">min ${(slot.minBid / 100).toFixed(2)} CPM</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button aria-label="Interactive Button" onClick={() => setStep(2)} disabled={!campaign.name || !campaign.slot}
                            className="w-full py-4 rounded-2xl font-bold text-sm text-black"
                            style={{
                                background: campaign.name && campaign.slot ? "linear-gradient(135deg, #C6923A, #E0B05C)" : "rgba(255,255,255,0.06)",
                                color: campaign.name && campaign.slot ? "#000" : "rgba(255,255,255,0.3)",
                                minHeight: "56px", cursor: campaign.name && campaign.slot ? "pointer" : "not-allowed",
                            }}>
                            Next: Targeting <ArrowRight className="w-4 h-4 inline ml-2" />
                        </button>
                    </div>
                )}

                {/* Step 2: Targeting + Budget */}
                {step === 2 && (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                                <Target className="w-3 h-3 inline mr-1" />Target Countries
                            </label>
                            <input style={inputStyle} value={campaign.targetCountries.join(", ")} onChange={e => update("targetCountries", e.target.value.split(",").map(s => s.trim()))} placeholder="US, CA, AU" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                                <DollarSign className="w-3 h-3 inline mr-1" />Bid CPM (cents)
                            </label>
                            <input type="number" style={inputStyle} value={campaign.bidCpm} onChange={e => update("bidCpm", parseInt(e.target.value) || 0)} />
                            <p className="text-[10px] text-white/25 mt-1">Cost per 1,000 impressions. Second-price auction.</p>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                                <BarChart3 className="w-3 h-3 inline mr-1" />Daily Budget (cents)
                            </label>
                            <input type="number" style={inputStyle} value={campaign.dailyBudget} onChange={e => update("dailyBudget", parseInt(e.target.value) || 0)} />
                            <p className="text-[10px] text-white/25 mt-1">${(campaign.dailyBudget / 100).toFixed(2)}/day maximum spend</p>
                        </div>
                        <div className="flex gap-3">
                            <button aria-label="Interactive Button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-semibold">Back</button>
                            <button aria-label="Interactive Button" onClick={() => setStep(3)}
                                className="flex-1 py-3 rounded-xl font-bold text-sm text-black"
                                style={{ background: "linear-gradient(135deg, #C6923A, #E0B05C)", minHeight: "48px" }}>
                                Next: Creative <ArrowRight className="w-4 h-4 inline ml-1" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Creative + Submit */}
                {step === 3 && (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Headline</label>
                            <input style={inputStyle} value={campaign.headline} onChange={e => update("headline", e.target.value)} placeholder="e.g., Need escorts fast?" maxLength={60} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Body Text</label>
                            <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" as any }} value={campaign.body} onChange={e => update("body", e.target.value)} placeholder="e.g., Get matched in minutes on Haul Command." maxLength={120} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Click URL</label>
                            <input style={inputStyle} value={campaign.clickUrl} onChange={e => update("clickUrl", e.target.value)} placeholder="https://yourcompany.com/promo" />
                        </div>

                        {/* Preview */}
                        <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                            <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Preview</div>
                            <div className="p-3 rounded-xl bg-[#C6923A]/5 border border-[#C6923A]/10">
                                <div className="text-[10px] text-[#C6923A]/50 uppercase mb-1">Sponsored · {campaign.sponsorName || "Your Company"}</div>
                                <div className="font-bold text-sm mb-1">{campaign.headline || "Your headline"}</div>
                                <div className="text-xs text-white/50">{campaign.body || "Your body text"}</div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button aria-label="Interactive Button" onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-semibold">Back</button>
                            <button aria-label="Interactive Button" onClick={handleSubmit} disabled={submitting || !campaign.headline || !campaign.clickUrl}
                                className="flex-1 py-3 rounded-xl font-bold text-sm text-black"
                                style={{
                                    background: campaign.headline && campaign.clickUrl ? "linear-gradient(135deg, #C6923A, #E0B05C)" : "rgba(255,255,255,0.06)",
                                    color: campaign.headline && campaign.clickUrl ? "#000" : "rgba(255,255,255,0.3)",
                                    minHeight: "48px",
                                }}>
                                {submitting ? "Creating..." : "Launch Campaign"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
