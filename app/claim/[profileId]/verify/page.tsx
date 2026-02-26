"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, CheckCircle } from "lucide-react";

export default function ClaimVerifyPage({ params }: { params: { profileId: string } }) {
    const { profileId } = params;
    const router = useRouter();
    const [code, setCode] = useState("");
    const [claimRequestId, setClaimRequestId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [devCode, setDevCode] = useState("");

    useEffect(() => {
        const id = sessionStorage.getItem("claimRequestId") ?? "";
        const dc = sessionStorage.getItem("devCode") ?? "";
        setClaimRequestId(id);
        setDevCode(dc);
    }, []);

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await fetch("/api/claim/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ claimRequestId, code }),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            setError(data.error ?? "Verification failed.");
            return;
        }

        sessionStorage.removeItem("devCode");
        router.push(`/claim/${profileId}/success`);
    }

    return (
        <div className="min-h-screen bg-[#070707] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4">
                        <KeyRound className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">Enter Your Code</h1>
                    <p className="text-[#666] text-sm">Check your {claimRequestId ? "message" : "SMS/email"} for a 6-digit code.</p>
                </div>

                {devCode && (
                    <div className="mb-4 px-4 py-3 bg-[#F1A91B]/10 border border-[#F1A91B]/20 rounded-lg text-center">
                        <div className="text-[10px] text-[#F1A91B] uppercase font-bold tracking-widest mb-1">Dev Mode — Your Code</div>
                        <div className="text-2xl font-black text-[#F1A91B] tracking-[0.3em]">{devCode}</div>
                    </div>
                )}

                <form onSubmit={handleVerify} className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] text-[#555] uppercase font-bold tracking-widest mb-2">6-Digit Code</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={code}
                            onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            required
                            className="w-full px-4 py-4 bg-[#111] border border-[#222] text-white rounded-xl text-2xl text-center font-black tracking-[0.4em] focus:outline-none focus:border-[#F1A91B]/50"
                        />
                    </div>

                    {error && (
                        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || code.length < 6}
                        className="w-full py-3.5 bg-[#F1A91B] hover:bg-[#d4911a] disabled:opacity-50 text-black font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /><span>Verify Identity</span></>}
                    </button>
                </form>
            </div>
        </div>
    );
}
