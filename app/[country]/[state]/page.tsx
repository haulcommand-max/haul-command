
import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { getCityHubUrl } from '@/lib/seo/geo-mesh';
import { getCountryBySlug, getRegionByCode, getCitiesByCountryRegion } from '@/lib/server/geo';
import { MapPin, ChevronRight, Truck, ShieldCheck, Search, ArrowLeft, Users } from 'lucide-react';

export default async function StatePage({ params }: { params: Promise<{ country: string; state: string }> }) {
    const { country, state } = await params;

    const countryData = await getCountryBySlug(country);
    if (!countryData) return notFound();

    const region = await getRegionByCode(countryData.iso2, state);
    const regionName = region?.name ?? state.toUpperCase();

    const cities = await getCitiesByCountryRegion(countryData.iso2, state);

    return (
        <div className="min-h-screen bg-hc-bg text-hc-text font-display">
            {/* Grid Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(198,146,58,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(198,146,58,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <SchemaGenerator type="Organization" data={{}} />

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

                {/* ── Breadcrumb ── */}
                <nav className="flex items-center gap-2 text-xs font-bold text-hc-muted uppercase tracking-[0.15em]">
                    <Link href={`/${country}`} className="flex items-center gap-1 hover:text-hc-gold-500 transition-colors">
                        <ArrowLeft className="w-3 h-3" />
                        {countryData.name}
                    </Link>
                    <span className="text-hc-subtle">/</span>
                    <span className="text-hc-gold-500">{regionName}</span>
                </nav>

                {/* ── Hero Header ── */}
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-hc-gold-500/10 border border-hc-gold-500/20 rounded-full text-[10px] font-bold text-hc-gold-500 uppercase tracking-[0.2em]">
                        <MapPin className="w-3 h-3" />
                        {regionName}, {countryData.name}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-[-0.03em] leading-none">
                        Certified Pilot Cars in {regionName}
                    </h1>
                    <p className="text-base text-hc-muted max-w-2xl">
                        Find local oversize load support in {regionName}, {countryData.name}. From high pole routing to rear chase cars,
                        access our network of verified professionals.
                    </p>
                </div>

                {/* ── Quick Stats ── */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-hc-surface border border-hc-border rounded-xl">
                        <Users className="w-4 h-4 text-hc-gold-500" />
                        <span className="text-sm font-bold text-white">{cities.length}</span>
                        <span className="text-xs text-hc-muted">Cities Covered</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-hc-surface border border-hc-border rounded-xl">
                        <ShieldCheck className="w-4 h-4 text-hc-success" />
                        <span className="text-xs text-hc-muted">Verified Providers</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-hc-surface border border-hc-border rounded-xl">
                        <Truck className="w-4 h-4 text-hc-gold-500" />
                        <span className="text-xs text-hc-muted">High Pole • Escort • Route Survey</span>
                    </div>
                </div>

                {/* ── Search Bar ── */}
                <div className="max-w-xl">
                    <div className="flex items-center gap-3 bg-hc-surface border border-hc-border rounded-2xl p-3 focus-within:border-hc-gold-500/40 transition-colors">
                        <Search className="w-5 h-5 text-hc-subtle flex-shrink-0" />
                        <input
                            type="text"
                            placeholder={`Search providers in ${regionName}...`}
                            className="flex-1 bg-transparent text-white text-sm placeholder:text-hc-subtle outline-none"
                        />
                        <Link
                            href={`/directory?country=${countryData.iso2}&region=${state.toUpperCase()}`}
                            className="px-5 py-2.5 bg-hc-gold-500 hover:bg-hc-gold-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all hover:shadow-gold-sm flex-shrink-0"
                        >
                            Search
                        </Link>
                    </div>
                </div>

                {/* ── City Grid ── */}
                {cities.length > 0 ? (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-hc-border" />
                            <h2 className="text-xs font-black text-hc-muted uppercase tracking-[0.25em]">Major Cities</h2>
                            <div className="h-px flex-1 bg-hc-border" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {cities.map((cityName) => {
                                const slug = cityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                                return (
                                    <Link
                                        key={slug}
                                        href={getCityHubUrl(country, state, slug)}
                                        className="group flex items-center justify-between p-4 bg-hc-surface border border-hc-border rounded-2xl hover:border-hc-gold-500/40 hover:shadow-gold-sm transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-hc-elevated flex items-center justify-center group-hover:bg-hc-gold-500/10 transition-colors">
                                                <MapPin className="w-4 h-4 text-hc-gold-500" />
                                            </div>
                                            <span className="text-sm font-bold text-white group-hover:text-hc-gold-400 transition-colors">
                                                {cityName}
                                            </span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-hc-subtle group-hover:text-hc-gold-500 transition-colors" />
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                ) : (
                    <section className="p-8 bg-hc-surface border border-hc-gold-500/20 rounded-2xl text-center space-y-4">
                        <MapPin className="w-12 h-12 text-hc-gold-500/30 mx-auto" />
                        <h2 className="text-xl font-bold text-white">Coverage Building</h2>
                        <p className="text-sm text-hc-muted max-w-md mx-auto">
                            No listed providers in {regionName} yet.
                            Browse the full directory or search nearby regions.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Link
                                href={`/directory?country=${countryData.iso2}&region=${state.toUpperCase()}`}
                                className="px-6 py-3 bg-hc-gold-500 text-black font-bold text-sm rounded-xl hover:bg-hc-gold-400 transition-colors"
                            >
                                Search Directory →
                            </Link>
                            <Link
                                href={`/${country}`}
                                className="px-6 py-3 bg-hc-surface text-white font-bold text-sm rounded-xl border border-hc-border hover:border-hc-gold-500/30 transition-colors"
                            >
                                View All Regions
                            </Link>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
