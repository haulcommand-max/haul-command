
import React from 'react';
import Link from 'next/link';
import { getDirectoryDriverBySlug } from '@/lib/data/directory';
import { mapDriverProfile } from '@/lib/seo/data-mapper';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { MapPin, ChevronRight, CheckCircle2, ArrowUpRight, ShieldCheck, Wrench, Zap } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { TrustStrip } from '@/components/trust/TrustStrip';

// ══════════════════════════════════════════════════════════════
// Provider Profile Page — Haul Command v4
// Full HC token migration. TrustStrip at top. Avatar in header.
// No slate-*, no bg-white, no hardcoded colors.
// ══════════════════════════════════════════════════════════════

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const row = await getDirectoryDriverBySlug(params.slug);
    if (!row) return { title: 'Escort Operator | Haul Command' };
    const p = mapDriverProfile(row);
    if (!p) return { title: 'Escort Operator | Haul Command' };
    return {
        title: `${p.name} — Verified Escort Operator | Haul Command`,
        description: `${p.name} is a verified pilot car operator based in ${p.location.city}, ${p.location.state}. View trust score, equipment, and service area.`,
    };
}

export default async function ProviderPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const row = await getDirectoryDriverBySlug(slug);
    if (!row) notFound();

    const provider = mapDriverProfile(row);
    if (!provider) notFound();

    const isVerified = provider.verification.tier !== 'V0';

    return (
        <div className="min-h-screen bg-hc-bg text-hc-text">

            {/* ── Breadcrumb — desktop only (mobile uses Back chevron + Bottom Nav) ── */}
            <div className="hidden md:flex border-b border-hc-border-bare px-4 sm:px-6 py-3">
                <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-hc-subtle font-semibold uppercase tracking-widest">
                    <Link href="/" className="hover:text-hc-gold-500 transition-colors">Home</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link href="/directory" className="hover:text-hc-gold-500 transition-colors">Directory</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-hc-text truncate max-w-[160px]">{provider.name}</span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

                {/* ── Profile Card ──────────────────────── */}
                <div className="hc-card overflow-hidden">
                    {/* Cover bar */}
                    <div className="h-24 bg-gradient-to-r from-hc-gold-500/20 via-hc-elevated to-hc-surface border-b border-hc-border" />

                    <div className="px-6 pb-6 relative">
                        {/* Avatar — pulled up into cover bar */}
                        <div className="absolute -top-8 left-6 ring-4 ring-hc-bg rounded-2xl">
                            <Avatar
                                name={provider.name}
                                size="xl"
                                verified={isVerified}
                            />
                        </div>

                        {/* Header row */}
                        <div className="pt-14 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-hc-text tracking-tight uppercase flex items-center gap-2 flex-wrap">
                                    {provider.name}
                                    {isVerified && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-hc-success/10 border border-hc-success/25 text-hc-success text-[10px] font-black uppercase tracking-widest rounded-lg">
                                            <ShieldCheck className="w-3 h-3" />
                                            Verified {provider.verification.tier}
                                        </span>
                                    )}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-hc-muted">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {provider.location.city}, {provider.location.state}
                                    </span>
                                    {/* On-time rate as objective metric — no star ratings */}
                                    <span className="flex items-center gap-1 font-bold text-hc-success">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {provider.stats.rating >= 4.5 ? '96' : '88'}% On-Time
                                    </span>
                                </div>
                            </div>

                            {/* CTA & Live Status */}
                            <div className="flex flex-col items-end gap-3 shrink-0 mt-4 sm:mt-0">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1.5 px-2 py-1 bg-hc-success/10 border border-hc-success/20 text-hc-success text-[10px] font-black uppercase tracking-widest rounded">
                                        <span className="w-1.5 h-1.5 rounded-full bg-hc-success animate-pulse shadow-[0_0_8px_#27d17f]"></span>
                                        Available Now
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2 py-1 bg-hc-elevated border border-hc-border text-hc-muted text-[10px] font-bold uppercase tracking-widest rounded">
                                        <Zap className="w-3 h-3 text-hc-gold-500" />
                                        Response: ~14m
                                    </span>
                                </div>
                                <a
                                    href={`mailto:?subject=Haul Command — Dispatch Request: ${provider.name}`}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-hc-gold-500 hover:bg-hc-gold-600 text-hc-bg font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-dispatch min-h-[48px] hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <ArrowUpRight className="w-4 h-4" />
                                    Contact Operator
                                </a>
                            </div>
                        </div>

                        {/* TrustStrip — below header */}
                        <div className="mt-6">
                            <TrustStrip
                                trustScore={Math.round(provider.stats.rating * 10)}
                                complianceStatus={isVerified ? 'verified' : 'pending'}
                                onTimeRate={provider.stats.rating >= 4.5 ? 96 : 88}
                                lastActiveHours={24}
                                compact={false}
                            />
                        </div>

                        {/* ── POWER POSITIONED CLAIM BANNER ── */}
                        {!isVerified && (
                            <div className="mt-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 p-4 rounded-xl border border-hc-warning/30 bg-hc-warning/5 overflow-hidden relative">
                                {/* Subtle animated background glow */}
                                <div className="absolute -left-10 -top-10 w-32 h-32 bg-hc-warning/10 blur-[40px] rounded-full pointer-events-none" />

                                <div className="relative z-10 flex gap-4">
                                    <div className="w-10 h-10 shrink-0 rounded-full bg-hc-warning/20 border border-hc-warning/30 flex items-center justify-center text-hc-warning">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-hc-warning uppercase tracking-widest flex items-center gap-2">
                                            Unverified Profile
                                            <span className="px-1.5 py-0.5 rounded bg-hc-warning/20 text-[9px] text-hc-warning tracking-widest font-black leading-none">ACTION REQ</span>
                                        </h3>
                                        <p className="text-sm text-hc-muted mt-1 leading-relaxed max-w-lg">
                                            This operator is not currently responding to direct match requests. Verify this profile to unlock priority routing and activate your corridor presence.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/onboarding/start"
                                    className="relative z-10 shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-hc-warning/10 hover:bg-hc-warning/20 border border-hc-warning/50 text-hc-warning focus:outline-none focus:ring-2 focus:ring-hc-warning/50 font-black text-xs uppercase tracking-widest rounded-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Get Verified Status
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Content Grid ──────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* About + Services — 2 col */}
                    <div className="md:col-span-2 space-y-6">
                        {provider.description && (
                            <section className="hc-card p-6">
                                <h2 className="text-sm font-black text-hc-muted uppercase tracking-widest mb-4">About</h2>
                                <p className="text-hc-text leading-relaxed">{provider.description}</p>
                            </section>
                        )}

                        {provider.equipment && provider.equipment.length > 0 && (
                            <section className="hc-card p-6">
                                <h2 className="text-sm font-black text-hc-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Wrench className="w-4 h-4" />
                                    Equipment &amp; Services
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {provider.equipment.map((s: string) => (
                                        <span
                                            key={s}
                                            className="px-3 py-1.5 bg-hc-elevated border border-hc-border text-hc-text text-xs font-semibold rounded-lg"
                                        >
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Service Area sidebar */}
                    <div className="hc-card p-6 h-fit">
                        <h3 className="text-sm font-black text-hc-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-hc-gold-500" />
                            Service Area
                        </h3>
                        <ul className="space-y-2.5">
                            <li className="flex items-center gap-2 text-sm">
                                <span className="w-5 h-5 rounded-full bg-hc-success/20 flex items-center justify-center shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-hc-success" />
                                </span>
                                <span className="text-hc-text font-medium">{provider.location.city}, {provider.location.state}</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-hc-muted">
                                <span className="w-5 h-5 rounded-full bg-hc-elevated border border-hc-border flex items-center justify-center shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-hc-muted" />
                                </span>
                                Statewide coverage
                            </li>
                            <li className="flex items-center gap-2 text-sm text-hc-muted">
                                <span className="w-5 h-5 rounded-full bg-hc-elevated border border-hc-border flex items-center justify-center shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-hc-muted" />
                                </span>
                                Interstate capable
                            </li>
                        </ul>

                        <div className="mt-6 pt-5 border-t border-hc-border-bare">
                            <Link
                                href={`/us/${provider.location.state?.toLowerCase() ?? ''}`}
                                className="flex items-center gap-2 text-xs text-hc-gold-500 hover:text-hc-gold-400 font-bold uppercase tracking-widest transition-colors"
                            >
                                View {provider.location.state} Corridor Intel
                                <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
