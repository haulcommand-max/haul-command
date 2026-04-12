"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, CheckCircle, ExternalLink, AlertCircle, ArrowRight, CreditCard, Banknote } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ConnectStripeClient() {
    const searchParams = useSearchParams();
    const isSuccess = searchParams.get("success") === "1";
    const isRefresh = searchParams.get("refresh") === "1";

    const [loading, setLoading] = useState(false);
    const [account, setAccount] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        loadAccount();
    }, []);

    async function loadAccount() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from("hc_stripe_accounts")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (data) setAccount(data);
    }

    async function startOnboarding() {
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");
            const { data: { session } } = await supabase.auth.getSession();

            const res = await supabase.functions.invoke("hc-connect-onboarding", {
                body: {
                    user_id: user.id,
                    entity_id: user.id,
                    email: user.email,
                    country_code: "US",
                },
            });

            if (res.error) throw res.error;
            if (res.data?.onboarding_url) {
                window.location.href = res.data.onboarding_url;
            }
        } catch (err: any) {
            setError(err.message || "Failed to start onboarding");
        } finally {
            setLoading(false);
        }
    }

    const isComplete = account?.charges_enabled && account?.payouts_enabled;

    return (
        <div className=" bg-hc-bg text-white">
            <div className="max-w-lg mx-auto px-4 py-16">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4"
                        style={{
                            background: isComplete ? "rgba(34,197,94,0.08)" : "rgba(198,146,58,0.08)",
                            borderColor: isComplete ? "rgba(34,197,94,0.2)" : "rgba(198,146,58,0.2)",
                        }}>
                        {isComplete ? (
                            <><CheckCircle className="w-4 h-4 text-emerald-400" /><span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Connected</span></>
                        ) : (
                            <><CreditCard className="w-4 h-4 text-[#C6923A]" /><span className="text-xs font-bold text-[#C6923A] uppercase tracking-wider">Connect Payments</span></>
                        )}
                    </div>
                    <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                        {isComplete ? "Payments Active" : "Set Up Payouts"}
                    </h1>
                    <p className="text-white/50 mt-3 text-sm max-w-sm mx-auto leading-relaxed">
                        {isComplete
                            ? "You're receiving payouts via Stripe Express. Funds release after each verified job."
                            : "Connect your bank account to receive payouts for completed escorts. Powered by Stripe."
                        }
                    </p>
                </div>

                {isSuccess && !isComplete && (
                    <div className="mb-8 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="font-bold text-sm text-emerald-300">Onboarding submitted</div>
                            <div className="text-xs text-white/40 mt-1">Stripe is reviewing your details. This usually takes a few minutes.</div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-8 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-300">{error}</div>
                    </div>
                )}

                {isComplete ? (
                    <div className="space-y-4">
                        <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-white/60">Account Status</span>
                                <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400 uppercase">Active</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Charges</div>
                                    <div className="text-emerald-400 font-semibold">Enabled</div>
                                </div>
                                <div>
                                    <div className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Payouts</div>
                                    <div className="text-emerald-400 font-semibold">Enabled</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
                            <Banknote className="w-5 h-5 text-[#C6923A]" />
                            <div className="flex-1">
                                <div className="text-sm font-semibold">Payout schedule</div>
                                <div className="text-xs text-white/40">Funds released 2 business days after verified completion</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                            <h3 className="font-bold text-sm mb-4">How it works</h3>
                            <ol className="space-y-3">
                                {[
                                    "Connect your Stripe Express account (2 min)",
                                    "Accept loads and complete escorts as normal",
                                    "Funds auto-release to your bank after each verified job",
                                ].map((step, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-[#C6923A]/30 text-[#C6923A] bg-[#C6923A]/10 flex-shrink-0 mt-0.5">
                                            {i + 1}
                                        </span>
                                        <span className="text-sm text-white/60">{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        <button aria-label="Interactive Button"
                            onClick={startOnboarding}
                            disabled={loading}
                            className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider text-white"
                            style={{
                                background: "linear-gradient(135deg, #C6923A, #E0B05C)",
                                minHeight: "56px",
                                cursor: loading ? "wait" : "pointer",
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            {loading ? "Setting up..." : "Connect with Stripe"}
                            <ExternalLink className="w-4 h-4 inline ml-2" />
                        </button>

                        <p className="text-center text-[10px] text-white/20">
                            Powered by Stripe. Your banking details are never stored on our servers.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
