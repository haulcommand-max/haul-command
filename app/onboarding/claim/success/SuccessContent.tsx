"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Crown, ArrowRight, Star, Shield, Zap } from "lucide-react";
import { useState } from "react";

function UpgradeButton({ priceKey, label, color }: { priceKey: string; label: string; color: string }) {
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceKey,
                    successUrl: window.location.origin + '/dashboard/operator?upgraded=true',
                    cancelUrl: window.location.href,
                }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                window.location.href = '/plans';
            }
        } catch {
            window.location.href = '/plans';
        }
    };

    return (
        <button onClick={handleUpgrade} disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all"
            style={{ background: color, color: '#000', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Opening Stripe…' : label}
        </button>
    );
}

export default function SuccessContent() {
    const searchParams = useSearchParams();
    const plan = searchParams.get("plan");
    const isPremium = plan === "premium";

    return (
        <div className="bg-hc-bg min-h-screen flex items-center justify-center text-hc-text p-4 font-sans">
            <div className="max-w-lg w-full space-y-6">
                {/* Success header */}
                <div className="text-center space-y-4">
                    <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center border
                        ${isPremium ? "bg-[#C6923A]/10 border-[#C6923A]/30 text-[#C6923A]" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"}`}>
                        {isPremium ? <Crown className="w-10 h-10" /> : <CheckCircle className="w-10 h-10" />}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight mb-2">Profile Claimed!</h1>
                        <p className="text-gray-400 text-sm">
                            {isPremium
                                ? "Your Premium Profile is activated and pending review."
                                : "Your free profile is claimed. Brokers can now find you."}
                        </p>
                    </div>
                </div>

                {/* Next steps */}
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold font-mono mb-2">Next Steps</p>
                    <ul className="text-left text-sm text-gray-300 space-y-2">
                        <li>1. Verification in 2–4 hours. Watch for email.</li>
                        <li>2. Your profile is now searchable in the directory.</li>
                        <li>3. Add certifications, equipment, and service area to rank higher.</li>
                    </ul>
                </div>

                {/* UPSELL — only show for free claim, not already premium */}
                {!isPremium && (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-4">
                        <div className="text-center">
                            <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">Upgrade Your Profile</p>
                            <h2 className="text-lg font-black text-white">Get Found 5× More Often</h2>
                            <p className="text-xs text-gray-400 mt-1">Free profiles are listed. Pro profiles get matched, boosted, and preferred by brokers.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {/* Commander Pro */}
                            <div className="rounded-xl border border-amber-500/25 bg-black/30 p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Star className="w-4 h-4 text-amber-400" />
                                            <span className="text-sm font-black text-white">Commander Pro — $29/mo</span>
                                        </div>
                                        <p className="text-xs text-gray-400">Priority dispatch · Unlimited loads · Route Survey Generator</p>
                                    </div>
                                </div>
                                <UpgradeButton priceKey="escort_pro_monthly" label="Upgrade to Pro →" color="#F1A91B" />
                            </div>

                            {/* Founding Sponsor */}
                            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <Shield className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-white">Founding Sponsor — from $299 one-time</p>
                                        <p className="text-xs text-gray-400">Permanent badge · Corridor placement · Early-adopter price locked forever</p>
                                    </div>
                                </div>
                                <Link href="/advertise/founding-sponsor"
                                    className="block w-full py-3 rounded-xl font-bold text-sm text-center border border-white/15 text-gray-300 hover:text-white hover:border-white/30 transition-all">
                                    View Founding Sponsor Packages →
                                </Link>
                            </div>

                            {/* Corridor sponsor */}
                            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <Zap className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-white">Corridor Sponsorship — $199/mo</p>
                                        <p className="text-xs text-gray-400">Exclusive placement on your most active route. Shown to every broker searching that corridor.</p>
                                    </div>
                                </div>
                                <UpgradeButton priceKey="corridor_sponsor_monthly" label="Sponsor a Corridor →" color="#3B82F6" />
                            </div>
                        </div>

                        <p className="text-center text-xs text-gray-500">No commitment required. Cancel subscriptions any time.</p>
                    </div>
                )}

                <Link href="/directory"
                    className="inline-flex w-full items-center justify-center gap-2 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all">
                    Go to Directory <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
