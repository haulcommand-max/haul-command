import { supabaseServer } from "@/lib/supabase/server";
import React from "react";
import Link from "next/link";
import { Flag, ChevronRight, ShieldCheck, Map, ArrowRight } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// /directory/[country] — Haul Command v4
// Brand-hardened. HC token classes only. No hardcoded hex.
// ══════════════════════════════════════════════════════════════

export default async function CountryDirectory({ params }: { params: Promise<{ country: string }> }) {
    const supabase = supabaseServer();
    const { country } = await params;

    const { data: regions } = await supabase
        .from("seo_region_stats")
        .select("*")
        .eq("country", country.toUpperCase())
        .order("total_providers", { ascending: false });

    const countryName = country.toUpperCase();
    const countryLabel = countryName === "US" ? "United States" : "Canada";
    const regionList = regions ?? [];

    return (
        <div className="min-h-screen bg-hc-bg text-hc-text">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* ── Breadcrumb ── */}
                <nav className="flex items-center gap-2 text-xs text-hc-muted mb-10 uppercase tracking-widest font-bold">
                    <Link
                        href="/directory"
                        className="hover:text-hc-gold-500 transition-colors duration-200"
                    >
                        Directory
                    </Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-hc-text">{countryLabel}</span>
                </nav>

                {/* ── Header ── */}
                <header className="mb-14">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-hc-surface border border-hc-border rounded-2xl">
                            <Flag className="w-7 h-7 text-hc-gold-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-hc-muted mb-1">
                                Escort Network
                            </p>
                            <h1 className="text-4xl md:text-5xl font-black text-hc-text tracking-tight">
                                {countryLabel}{" "}
                                <span className="text-hc-gold-500">Directory</span>
                            </h1>
                        </div>
                    </div>
                    <p className="text-hc-muted text-base mt-3 max-w-xl">
                        Select a state or region to find verified pilot car professionals.
                    </p>
                </header>

                {/* ── Region Grid ── */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Map className="w-5 h-5 text-hc-gold-500" />
                        <h2 className="text-lg font-bold text-hc-text tracking-tight uppercase">
                            Regional Coverage
                        </h2>
                    </div>

                    {regionList.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {regionList.map((region: any) => (
                                <Link
                                    key={region.region_code}
                                    href={`/directory/${country}/${region.region_code.toLowerCase()}`}
                                    className="group hc-card p-5 flex flex-col items-center justify-center text-center min-h-[88px] hover:border-hc-border-high transition-all duration-200 hover:shadow-card-hover"
                                >
                                    <div className="text-2xl font-black text-hc-text group-hover:text-hc-gold-500 transition-colors uppercase mb-1 tracking-wide">
                                        {region.region_code}
                                    </div>
                                    <div className="text-[11px] font-semibold text-hc-muted uppercase tracking-widest">
                                        {region.total_providers ?? 0} Verified
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        /* ── Empty state ── */
                        <div className="hc-card border-dashed p-14 text-center">
                            <div className="w-12 h-12 bg-hc-elevated rounded-full flex items-center justify-center mx-auto mb-4">
                                <Map className="w-6 h-6 text-hc-muted" />
                            </div>
                            <p className="text-hc-muted font-medium mb-2">Expanding network into this region soon.</p>
                            <p className="text-hc-subtle text-sm">
                                Escort operators can{" "}
                                <Link href="/start" className="text-hc-gold-500 hover:underline">
                                    apply to join
                                </Link>
                                .
                            </p>
                        </div>
                    )}
                </section>

                {/* ── Stats Banner ── */}
                <section className="mt-20">
                    <div className="hc-card p-8 md:p-12 relative overflow-hidden">
                        {/* Gold glow */}
                        <div className="absolute inset-0 bg-radial-gold-glow pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-hc-success mb-4">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">Network Trust</span>
                            </div>
                            <h2 className="text-3xl font-black text-hc-text tracking-tight mb-4 uppercase">
                                The Haul Command<br />Standard
                            </h2>
                            <p className="text-hc-muted leading-relaxed mb-8 max-w-lg text-base">
                                Connecting brokers with verified escort operators across North America.
                                Every profile mapped against real-world compliance benchmarks.
                            </p>

                            <div className="flex items-center gap-8 mb-8">
                                <div>
                                    <div className="text-3xl font-black text-hc-text">98%</div>
                                    <div className="text-xs font-bold text-hc-muted uppercase tracking-widest mt-0.5">On-Time Verify</div>
                                </div>
                                <div className="w-px h-12 bg-hc-border" />
                                <div>
                                    <div className="text-3xl font-black text-hc-text">100%</div>
                                    <div className="text-xs font-bold text-hc-muted uppercase tracking-widest mt-0.5">Insured Fleet</div>
                                </div>
                                <div className="w-px h-12 bg-hc-border" />
                                <div>
                                    <div className="text-3xl font-black text-hc-gold-500">&lt;15min</div>
                                    <div className="text-xs font-bold text-hc-muted uppercase tracking-widest mt-0.5">First Response</div>
                                </div>
                            </div>

                            <Link
                                href="/broker"
                                className="inline-flex items-center gap-2 bg-hc-gold-500 hover:bg-hc-gold-400 text-hc-bg font-bold px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-dispatch min-h-[48px] text-sm uppercase tracking-wide"
                            >
                                Find an Escort Now
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
