import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { getStateUrl } from '@/lib/seo/geo-mesh';
import { getCountryBySlug, getRegionsByCountry } from '@/lib/server/geo';
import { MapPin, ChevronRight, Globe, Truck, ShieldCheck, Search } from 'lucide-react';
import { TakeoverSponsorBanner } from '@/components/ads/TakeoverSponsorBanner';
import { DataTeaserStrip } from '@/components/data/DataTeaserStrip';
import { UrgentMarketSponsor } from '@/components/ads/UrgentMarketSponsor';
import SocialProofBanner from '@/components/social/SocialProofBanner';
import { getLocalTerm, getLocalOversizeLoadTerm } from '@/lib/seo/escort-terminology';

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
    const { country } = await params;

    // ── Resolve country from DB (no hardcoded US/CA check) ──
    const countryData = await getCountryBySlug(country);
    if (!countryData) return notFound();

    // ── Get regions from DB ──
    const regions = await getRegionsByCountry(countryData.iso2);

    // ── Local terminology (kills EN monoculture) ──
    const localTerm = getLocalTerm(countryData.iso2);
    const localLoad = getLocalOversizeLoadTerm(countryData.iso2);
    const capLoad = localLoad.charAt(0).toUpperCase() + localLoad.slice(1);

    return (
        <div className="min-h-screen bg-hc-bg text-hc-text font-display">
            {/* Grid Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(198,146,58,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(198,146,58,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <SchemaGenerator type="Organization" data={{}} />

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">

                {/* ── Hero ── */}
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-hc-gold-500/10 border border-hc-gold-500/20 rounded-full text-xs font-bold text-hc-gold-500 uppercase tracking-[0.2em]">
                        <Globe className="w-3.5 h-3.5" />
                        {countryData.name}
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-[-0.03em] leading-none">
                        {capLoad} Escorts
                    </h1>
                    <p className="text-lg text-hc-muted max-w-2xl mx-auto">
                        Browse verified {localTerm} providers, route surveyors, and high pole operators across {countryData.name}.
                        HAUL COMMAND connects you with the most reliable network worldwide.
                    </p>
                </div>

                {/* ── Quick Stats Bar ── */}
                <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
                    <div className="flex flex-col items-center p-4 bg-hc-surface border border-hc-border rounded-2xl">
                        <MapPin className="w-5 h-5 text-hc-gold-500 mb-2" />
                        <span className="text-2xl font-black text-white">{regions.length}</span>
                        <span className="text-[10px] text-hc-muted uppercase tracking-[0.15em] font-bold">Regions</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-hc-surface border border-hc-border rounded-2xl">
                        <Truck className="w-5 h-5 text-hc-gold-500 mb-2" />
                        <span className="text-2xl font-black text-white">{regions.length > 0 ? '✓' : '—'}</span>
                        <span className="text-[10px] text-hc-muted uppercase tracking-[0.15em] font-bold">Active</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-hc-surface border border-hc-border rounded-2xl">
                        <ShieldCheck className="w-5 h-5 text-hc-success mb-2" />
                        <span className="text-2xl font-black text-white">Verified</span>
                        <span className="text-[10px] text-hc-muted uppercase tracking-[0.15em] font-bold">Network</span>
                    </div>
                </div>

                {/* ── Search Bar ── */}
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-3 bg-hc-surface border border-hc-border rounded-2xl p-3 focus-within:border-hc-gold-500/40 transition-colors">
                        <Search className="w-5 h-5 text-hc-subtle flex-shrink-0" />
                        <input
                            type="text"
                            placeholder={`Search providers in ${countryData.name}...`}
                            className="flex-1 bg-transparent text-white text-sm placeholder:text-hc-subtle outline-none"
                        />
                        <Link aria-label="Navigation Link"
                            href={`/directory?country=${countryData.iso2}`}
                            className="px-5 py-2.5 bg-hc-gold-500 hover:bg-hc-gold-400 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all hover:shadow-gold-sm flex-shrink-0"
                        >
                            Search
                        </Link>
                    </div>
                </div>

                {/* ── Region Grid ── */}
                {regions.length > 0 ? (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-hc-border" />
                            <h2 className="text-xs font-black text-hc-muted uppercase tracking-[0.25em]">Select a Region</h2>
                            <div className="h-px flex-1 bg-hc-border" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {regions.map((region) => (
                                <Link aria-label="Navigation Link"
                                    key={region.code}
                                    href={getStateUrl(country, region.code.toLowerCase())}
                                    className="group flex items-center justify-between p-4 bg-hc-surface border border-hc-border rounded-2xl hover:border-hc-gold-500/40 hover:shadow-gold-sm transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-hc-elevated flex items-center justify-center group-hover:bg-hc-gold-500/10 transition-colors">
                                            <MapPin className="w-4 h-4 text-hc-gold-500" />
                                        </div>
                                        <span className="text-sm font-bold text-white group-hover:text-hc-gold-400 transition-colors">
                                            {region.name}
                                        </span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-hc-subtle group-hover:text-hc-gold-500 transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </section>
                ) : (
                    <section className="p-8 bg-hc-surface border border-hc-gold-500/20 rounded-2xl text-center space-y-4">
                        <Globe className="w-12 h-12 text-hc-gold-500/30 mx-auto" />
                        <h2 className="text-xl font-bold text-white">Coverage Building in {countryData.name}</h2>
                        <p className="text-sm text-hc-muted max-w-md mx-auto">
                            We&apos;re expanding our verified {localTerm} network in {countryData.name}.
                            Join the waitlist to get notified when we launch — early operators rank highest.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <Link aria-label="Join waitlist"
                                href={`/${country}/coming-soon`}
                                className="inline-block px-6 py-3 bg-hc-gold-500 text-white font-bold text-sm rounded-xl hover:bg-hc-gold-400 transition-colors"
                            >
                                🔔 Join the Waitlist →
                            </Link>
                            <Link aria-label="Browse global directory"
                                href="/directory"
                                className="inline-block px-6 py-3 bg-hc-surface border border-hc-border text-hc-muted font-bold text-sm rounded-xl hover:border-hc-gold-500/40 transition-colors"
                            >
                                Browse Global Directory
                            </Link>
                        </div>
                    </section>
                )}

                {/* ── Country Takeover Sponsor ── */}
                <TakeoverSponsorBanner
                    level="country"
                    territory={countryData.name}
                    pricePerMonth={999}
                />

                {/* ── Urgent Market Sponsor — country-level mode-aware CTA ── */}
                <UrgentMarketSponsor
                    marketKey={countryData.iso2.toLowerCase()}
                    geo={countryData.name}
                />

                {/* ── Data Teaser Strip ── */}
                <DataTeaserStrip geo={countryData.name} />

                {/* ── Social Proof ── */}
                <SocialProofBanner />
            </div>
        </div>
    );
}
