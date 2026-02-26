"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Mail, ArrowRight, Loader2 } from "lucide-react";

export default function ClaimStartPage({ params }: { params: { profileId: string } }) {
    const { profileId } = params;
    const router = useRouter();
    const [method, setMethod] = useState<"sms" | "email">("sms");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await fetch("/api/claim/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId, phone: phone || undefined, email: email || undefined, method }),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            setError(data.error ?? "Something went wrong.");
            return;
        }

        // Store claim request ID for the verify step
        sessionStorage.setItem("claimRequestId", data.claimRequestId);
        if (data.dev_code) {
            sessionStorage.setItem("devCode", data.dev_code);
        }

        router.push(`/claim/${profileId}/verify`);
    }

    return (
        <div className="min-h-screen bg-[#070707] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-[#F1A91B]/10 border border-[#F1A91B]/20 rounded-xl mb-4">
                        <span className="text-[#F1A91B] font-black text-lg">HC</span>
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">Claim Your Profile</h1>
                    <p className="text-[#666] text-sm leading-relaxed">
                        Verify ownership to unlock direct dispatch offers, real-time availability, and full contact visibility.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 space-y-6">
                    {/* Method toggle */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setMethod("sms")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${method === "sms" ? "bg-[#F1A91B] text-black" : "bg-[#111] text-[#666] border border-[#1a1a1a]"}`}
                        >
                            <Phone className="w-4 h-4" /> SMS
                        </button>
                        <button
                            type="button"
                            onClick={() => setMethod("email")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${method === "email" ? "bg-[#F1A91B] text-black" : "bg-[#111] text-[#666] border border-[#1a1a1a]"}`}
                        >
                            <Mail className="w-4 h-4" /> Email
                        </button>
                    </div>

                    {method === "sms" ? (
                        <div>
                            <label className="block text-[10px] text-[#555] uppercase font-bold tracking-widest mb-2">Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="+1 (555) 000-0000"
                                required
                                className="w-full px-4 py-3 bg-[#111] border border-[#222] text-white rounded-xl text-sm focus:outline-none focus:border-[#F1A91B]/50"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-[10px] text-[#555] uppercase font-bold tracking-widest mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full px-4 py-3 bg-[#111] border border-[#222] text-white rounded-xl text-sm focus:outline-none focus:border-[#F1A91B]/50"
                            />
                        </div>
                    )}

                    {error && (
                        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-[#F1A91B] hover:bg-[#d4911a] disabled:opacity-50 text-black font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Send Verification Code</span><ArrowRight className="w-4 h-4" /></>}
                    </button>

                    <p className="text-center text-[10px] text-[#444]">
                        Free forever. No card required. Claiming takes 2 minutes.
                    </p>
                </form>
            </div>
        </div>
    );
}
