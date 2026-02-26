import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, ChevronRight, BookOpen } from "lucide-react";
import { AI_ANSWER_SEEDS, LOAD_TYPES } from "@/lib/seo/pilot-car-taxonomy";

export const metadata: Metadata = {
    title: "Pilot Car & Oversize Escort Answers | Haul Command",
    description: "Expert answers to the most common questions about pilot car service, oversize load escort requirements, equipment, costs, and regulations — updated for 2025.",
    alternates: { canonical: "/answers" },
};

export default function AnswersIndexPage() {
    return (
        <main className="min-h-screen" style={{ background: "#050505" }}>
            <div className="border-b border-white/5 px-6 py-3">
                <div className="max-w-5xl mx-auto flex items-center gap-1.5 text-[11px] text-white/30">
                    <Link href="/" className="hover:text-white/60 transition-colors">Haul Command</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-white/60">Answers</span>
                </div>
            </div>

            <div className="px-6 py-12 border-b border-white/5" style={{ background: "linear-gradient(135deg, rgba(241,169,27,0.04) 0%, transparent 60%)" }}>
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 mb-4">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Expert Knowledge Base</span>
                    </div>
                    <h1 className="text-3xl font-black text-white mb-3">Pilot Car & Escort Answers</h1>
                    <p className="text-sm text-white/50 max-w-xl leading-relaxed">
                        Verified answers to the most common oversize escort and pilot car questions — written for freight brokers, carriers, and operators.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
                    {AI_ANSWER_SEEDS.map((a) => (
                        <Link
                            key={a.slug}
                            href={`/answers/${a.slug}`}
                            className="group rounded-xl border px-4 py-4 flex items-start gap-3 transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                        >
                            <BookOpen className="w-4 h-4 text-amber-400/50 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors mb-1">{a.question}</div>
                                <div className="text-[11px] text-white/35 leading-snug">{a.shortAnswer.slice(0, 90)}…</div>
                            </div>
                        </Link>
                    ))}
                </div>

                <h2 className="text-base font-black text-white mb-4">Answers by Load Type</h2>
                <div className="flex flex-wrap gap-2">
                    {LOAD_TYPES.map((lt) => (
                        <Link key={lt.slug} href={`/industries/${lt.slug}`}
                            className="text-[11px] text-white/35 border border-white/8 rounded-lg px-2.5 py-1.5 hover:text-amber-300 hover:border-amber-500/25 transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]">
                            {lt.name} Escort
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
