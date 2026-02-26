"use client";
import { useEffect, useState } from "react";

interface TrustData {
    trust_score: number;
    trust_tier: string;
    confidence: number;
}

const DAILY_CAPS = [5, 10, 20, 30, 50];

export default function ProfileFeaturedPage() {
    const [trust, setTrust] = useState<TrustData | null>(null);
    const [dailyCap, setDailyCap] = useState(10);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const TRUST_MIN = 70;
    const qualifies = (trust?.trust_score ?? 0) >= TRUST_MIN;

    useEffect(() => {
        fetch("/api/trust/me").then((r) => r.json()).then(setTrust).catch(() => { });
    }, []);

    async function activate() {
        setSubmitting(true);
        try {
            const res = await fetch("/api/profile/featured", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    daily_budget_micros: dailyCap * 1_000_000,
                    total_budget_micros: dailyCap * 30 * 1_000_000,
                    bid_cpm_micros: 2000000,
                }),
            });
            if (res.ok) setDone(true);
        } finally {
            setSubmitting(false);
        }
    }

    if (done) return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-center space-y-3">
                <div className="text-5xl">⭐</div>
                <h1 className="text-2xl font-black text-white">You're Featured!</h1>
                <p className="text-gray-400">Your profile is now highlighted in matching results.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <header className="px-5 pt-8 pb-4 border-b border-gray-800">
                <h1 className="text-2xl font-black">Get Featured</h1>
                <p className="text-gray-400 text-sm mt-1">
                    Appear first in escort searches and matching.
                </p>
            </header>

            <div className="px-5 py-6 max-w-xl space-y-6">
                {/* What you get */}
                <div className="bg-gray-900 rounded-2xl p-5">
                    <h2 className="font-bold text-lg mb-4">What you get</h2>
                    <ul className="space-y-3 text-gray-300 text-sm">
                        {[
                            "First placement in corridor and cell searches",
                            "\"Featured\" label on map escort dots",
                            "Priority routing when loads are dispatched",
                            "Featured section in load broker matching view",
                        ].map((item) => (
                            <li key={item} className="flex items-start gap-2">
                                <span className="text-orange-400 mt-0.5">✓</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Trust gate */}
                {trust && (
                    <div className={`rounded-2xl border p-5 ${qualifies ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"}`}>
                        <p className="text-sm font-bold mb-1">{qualifies ? "✓ You qualify" : "⚠ Trust gate not met"}</p>
                        <p className="text-gray-400 text-sm">
                            Your trust score: <span className="font-bold text-white">{Math.round(trust.trust_score)}</span>
                            {" "}/ Required: <span className="font-bold">{TRUST_MIN}+</span>
                        </p>
                        {!qualifies && (
                            <p className="text-orange-400 text-sm mt-2">
                                Complete more loads or improve ratings to qualify for featured placement.
                            </p>
                        )}
                    </div>
                )}

                {/* Daily spend cap */}
                <div>
                    <p className="font-semibold mb-3">Daily Spend Cap</p>
                    <div className="flex gap-2">
                        {DAILY_CAPS.map((cap) => (
                            <button
                                key={cap}
                                onClick={() => setDailyCap(cap)}
                                className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all ${dailyCap === cap
                                        ? "bg-orange-500 border-orange-500 text-white"
                                        : "border-gray-700 text-gray-400 hover:border-gray-500"
                                    }`}
                            >
                                ${cap}
                            </button>
                        ))}
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                        Est. {Math.round((dailyCap * 1_000_000) / 2_000_000 * 1000)} impressions/day
                    </p>
                </div>

                <button
                    onClick={activate}
                    disabled={submitting || !qualifies}
                    className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-black text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    {submitting ? "Activating…" : `Activate Featured — $${dailyCap}/day`}
                </button>

                <p className="text-gray-600 text-xs text-center">
                    Only visible to loads and brokers that match your profile. No banner ads.
                </p>
            </div>
        </div>
    );
}
