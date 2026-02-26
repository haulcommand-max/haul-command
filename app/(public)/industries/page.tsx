import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Truck, MapPin } from "lucide-react";
import { LOAD_TYPES, PILOT_CAR_STATES } from "@/lib/seo/pilot-car-taxonomy";

export const metadata: Metadata = {
    title: "Oversize Load Escort by Industry | Haul Command",
    description: "Pilot car and oversize escort guides by industry vertical — wind turbines, mobile homes, heavy equipment, oil field, power transformers, and more. State-specific requirements and operator matching.",
    alternates: { canonical: "/industries" },
};

export default function IndustriesIndexPage() {
    const highDemandStates = PILOT_CAR_STATES.filter((s) => s.demandTier === "high");

    return (
        <main className="min-h-screen" style={{ background: "#050505" }}>
            <div className="border-b border-white/5 px-6 py-3">
                <div className="max-w-5xl mx-auto flex items-center gap-1.5 text-[11px] text-white/30">
                    <Link href="/" className="hover:text-white/60 transition-colors">Haul Command</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-white/60">Industries</span>
                </div>
            </div>

            <div className="px-6 py-12 border-b border-white/5" style={{ background: "linear-gradient(135deg, rgba(241,169,27,0.04) 0%, transparent 60%)" }}>
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 mb-4">
                        <Truck className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Industry Verticals</span>
                    </div>
                    <h1 className="text-3xl font-black text-white mb-3">Oversize Escort by Load Type</h1>
                    <p className="text-sm text-white/50 max-w-xl leading-relaxed">
                        Specialized pilot car and oversize escort guides by cargo type. Requirements, escort configuration, and permit guidance unique to each industry vertical.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {LOAD_TYPES.map((lt) => (
                        <Link
                            key={lt.slug}
                            href={`/industries/${lt.slug}`}
                            className="group rounded-2xl border p-5 flex flex-col gap-3 transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                        >
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-amber-400/60 mb-1.5">
                                    Escort width trigger: {lt.escortRequiredWidth}ft+
                                </div>
                                <h2 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                                    {lt.name} Escort
                                </h2>
                            </div>
                            <p className="text-[12px] text-white/40 leading-relaxed flex-1">{lt.description.slice(0, 110)}…</p>
                            <div className="flex flex-wrap gap-1">
                                {lt.industries.map((ind) => (
                                    <span key={ind} className="text-[9px] text-white/25 border border-white/7 rounded px-1.5 py-0.5">
                                        {ind}
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-amber-400/50 group-hover:text-amber-400 transition-colors font-bold">
                                View escort guide <ChevronRight className="w-3 h-3" />
                            </div>
                        </Link>
                    ))}
                </div>

                <div>
                    <h2 className="text-base font-black text-white mb-4">Pilot Car by State</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {highDemandStates.map((s) => (
                            <Link key={s.slug} href={`/pilot-car/${s.slug}`}
                                className="group flex items-center gap-2 rounded-lg px-3 py-2.5 border text-[11px] transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]">
                                <MapPin className="w-3 h-3 text-amber-400/40" />
                                <span className="font-bold text-white/60 group-hover:text-amber-300 transition-colors">{s.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
