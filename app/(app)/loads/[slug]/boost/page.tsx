"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const BOOST_TIERS = [
    {
        id: "fast_fill",
        name: "Fast Fill",
        bid_cpm_micros: 1500000,
        daily_budget_micros: 10000000,
        label: "$1.50 CPM",
        description: "Priority dispatch to top matched escorts. Typical fill improvement: 35%.",
        badge: "bg-blue-500/20 text-blue-400 border-blue-400/30",
    },
    {
        id: "corridor_priority",
        name: "Corridor Priority",
        bid_cpm_micros: 2500000,
        daily_budget_micros: 20000000,
        label: "$2.50 CPM",
        description: "Priority dispatch + corridor glow highlight on the live map. Typical fill improvement: 55%.",
        badge: "bg-orange-500/20 text-orange-400 border-orange-400/30",
        recommended: true,
    },
    {
        id: "emergency_fill",
        name: "Emergency Fill",
        bid_cpm_micros: 5000000,
        daily_budget_micros: 50000000,
        label: "$5.00 CPM",
        description: "Maximum visibility. Expanded radius, highest trust gate, immediate push to top 10 escorts.",
        badge: "bg-red-500/20 text-red-400 border-red-400/30",
    },
];

export default function LoadBoostPage() {
    const params = useParams<{ slug: string }>();
    const [selected, setSelected] = useState(BOOST_TIERS[1]);
    const [cap, setCap] = useState(20);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    async function boost() {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/loads/${params.slug}/boost`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bid_cpm_micros: selected.bid_cpm_micros,
                    daily_budget_micros: cap * 1_000_000,
                    total_budget_micros: cap * 5 * 1_000_000,
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
                <div className="text-5xl">🚀</div>
                <h1 className="text-2xl font-black text-white">Boost Active!</h1>
                <p className="text-gray-400">Priority dispatch is now live for this load.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <header className="px-5 pt-8 pb-4 border-b border-gray-800">
                <h1 className="text-2xl font-black">Boost This Load</h1>
                <p className="text-gray-400 text-sm mt-1">Priority routing gets you filled faster.</p>
            </header>

            <div className="px-5 py-6 space-y-4 max-w-xl">
                {BOOST_TIERS.map((tier) => (
                    <button
                        key={tier.id}
                        onClick={() => setSelected(tier)}
                        className={`w-full text-left rounded-2xl border p-4 transition-all ${selected.id === tier.id
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-gray-800 bg-gray-900/60 hover:border-gray-700"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{tier.name}</span>
                                {tier.recommended && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-400/30 font-bold uppercase">
                                        Recommended
                                    </span>
                                )}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${tier.badge}`}>{tier.label}</span>
                        </div>
                        <p className="text-gray-400 text-sm">{tier.description}</p>
                    </button>
                ))}

                {/* Daily cap */}
                <div className="pt-2">
                    <div className="flex justify-between mb-2">
                        <p className="font-semibold">Daily Spend Cap</p>
                        <span className="text-orange-400 font-bold">${cap}/day</span>
                    </div>
                    <input type="range" min={5} max={100} step={5} value={cap}
                        onChange={(e) => setCap(Number(e.target.value))}
                        className="w-full accent-orange-500"
                    />
                </div>

                <div className="bg-gray-900 rounded-xl p-4 text-sm text-gray-400 space-y-1">
                    <div className="flex justify-between"><span>Estimated impressions/day</span><span className="text-white font-bold">{Math.round((cap * 1_000_000) / selected.bid_cpm_micros * 1000)}</span></div>
                    <div className="flex justify-between"><span>Trust gate</span><span className="text-white font-bold">{selected.id === "emergency_fill" ? "80+" : "70+"}</span></div>
                    <div className="flex justify-between"><span>Expected fill speed boost</span><span className="text-green-400 font-bold">{selected.id === "fast_fill" ? "~35%" : selected.id === "corridor_priority" ? "~55%" : "~70%"}</span></div>
                </div>

                <button
                    onClick={boost}
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-black text-lg disabled:opacity-60 transition-all"
                >
                    {submitting ? "Activating…" : "Activate Boost"}
                </button>
            </div>
        </div>
    );
}
