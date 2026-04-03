import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { SnippetInjector } from '@/components/seo/SnippetInjector';
import { RegulatoryMoat } from '@/components/seo/RegulatoryMoat';
import { PostLoadCTA, OperatorsNeededCTA, ClaimListingCTA } from '@/components/seo/ConversionCTAs';
import { getCityHubUrl } from '@/lib/seo/geo-mesh';
import { getCountryBySlug, getRegionByCode, getCitiesByCountryRegion } from '@/lib/server/geo';
import { MapPin, ChevronRight, Truck, ShieldCheck, Search, ArrowLeft, Users, Zap, Compass, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { InteractiveComplianceCalculator } from '@/components/tools/InteractiveComplianceCalculator';
import SaveButton from '@/components/capture/SaveButton';

export default async function StatePage({ params }: { params: Promise<{ country: string; state: string }> }) {
    const { country, state } = await params;

    const countryData = await getCountryBySlug(country);
    if (!countryData) return notFound();

    const region = await getRegionByCode(countryData.iso2, state);
    const regionName = region?.name ?? state.toUpperCase();

    const cities = await getCitiesByCountryRegion(countryData.iso2, state);

    // AI-Optimized Schema for "People Also Ask" Rich Snippets
    const faqSchemaData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": `What are the legal pilot car requirements in ${regionName}?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `Legal requirements in ${regionName} are strictly enforced. Loads exceeding 12 feet wide generally require at least one front pilot car. Loads exceeding 14 feet wide require both front and rear escorts. High pole lead cars are mandatory for loads taller than 14 feet 6 inches.`
                }
            },
            {
                "@type": "Question",
                "name": `How many escorts do I need for my oversize load in ${regionName}?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `The exact number of needed escorts in ${regionName} depends on dimension thresholds. Typically, 1 to 4 pilot cars are required. Extreme dimensions over 16 feet wide or 100 feet long may require immediate local law enforcement (police) escorts in addition to civilian pilots.`
                }
            }
        ]
    };

    const breadcrumbSchemaData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": countryData.name, "item": `https://haulcommand.com/${country}` },
            { "@type": "ListItem", "position": 2, "name": regionName, "item": `https://haulcommand.com/${country}/${state}` }
        ]
    };

    return (
        <div className="min-h-screen bg-hc-bg text-hc-text font-display">
            {/* Grid Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(198,146,58,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(198,146,58,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <SchemaGenerator type="FAQPage" data={faqSchemaData} />
            <SchemaGenerator type="BreadcrumbList" data={breadcrumbSchemaData} />
            <SchemaGenerator type="Organization" data={{}} />

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

                {/* ── Breadcrumb ── */}
                <nav className="flex items-center gap-2 text-xs font-bold text-hc-muted uppercase tracking-[0.15em] mb-[-2rem]">
                    <Link aria-label="Navigation Link" href={`/${country}`} className="flex items-center gap-1 hover:text-hc-gold-500 transition-colors">
                        <ArrowLeft className="w-3 h-3" />
                        {countryData.name}
                    </Link>
                    <span className="text-hc-subtle">/</span>
                    <span className="text-hc-gold-500">{regionName}</span>
                </nav>

                {/* ── Hero Header ── */}
                <div className="space-y-6">
                    <div className="space-y-4 max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-hc-gold-500/10 border border-hc-gold-500/20 rounded-full text-[10px] font-bold text-hc-gold-500 uppercase tracking-[0.2em]">
                            <MapPin className="w-3 h-3" />
                            {regionName}, {countryData.name} Pilot Cars
                        </div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-[-0.03em] leading-none">
                                Certified Escort & Pilot Cars in {regionName}
                            </h1>
                            <SaveButton entityType="state" entityId={state.toUpperCase()} entityLabel={regionName} variant="pill" />
                        </div>
                        <p className="text-lg text-hc-muted leading-relaxed">
                            Stop guessing compliance rules. Calculate exact oversize requirements, verify active DOT pilot cars, 
                            and book top-rated lead, chase, and high pole operations directly in {regionName}. 
                        </p>
                    </div>

                    {/* ── Search Bar & KPIs ── */}
                    <div className="flex flex-col md:flex-row gap-6 md:items-center">
                        <div className="w-full max-w-xl flex items-center gap-3 bg-hc-surface border border-hc-border rounded-2xl p-3 focus-within:border-hc-gold-500/40 transition-colors">
                            <Search className="w-5 h-5 text-hc-subtle flex-shrink-0" />
                            <input
                                type="text"
                                placeholder={`Search compliant operators in ${regionName}...`}
                                className="flex-1 bg-transparent text-white text-sm placeholder:text-hc-subtle outline-none"
                            />
                            <Link aria-label="Navigation Link"
                                href={`/directory?country=${countryData.iso2}&region=${state.toUpperCase()}`}
                                className="px-6 py-3 bg-hc-gold-500 hover:bg-hc-gold-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all hover:shadow-gold-sm flex-shrink-0"
                            >
                                Find Escorts
                            </Link>
                        </div>
                        <div className="flex gap-4 px-2">
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-white">{cities.length * 3}+</span>
                                <span className="text-[10px] font-bold text-hc-muted uppercase tracking-widest">Active Operators</span>
                            </div>
                            <div className="w-px h-8 bg-hc-border mx-2 mt-1" />
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-hc-success">&lt;9 min</span>
                                <span className="text-[10px] font-bold text-hc-muted uppercase tracking-widest">Avg Response Time</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Interactive Compliance Calculator ── */}
                <section>
                    <InteractiveComplianceCalculator regionName={regionName} countryCode={countryData.iso2} />
                </section>

                {/* ── Comprehensive Pilot Car Roles (SEO & Educational) ── */}
                <section className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-white uppercase tracking-[-0.02em]">
                            Why You Need Pilot Cars in {regionName}
                        </h2>
                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <ShieldCheck className="w-6 h-6 text-hc-gold-500 flex-shrink-0" />
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Flawless Regulatory Compliance</h3>
                                    <p className="text-sm text-hc-muted leading-relaxed mt-1">
                                        Failing to adhere to local {regionName} dimension thresholds isn't just dangerous—it results in crushed licenses and massive fines. Pilot cars ensure your load adheres to specific permitted routes, curfews, and overhead bridge capacities.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <Compass className="w-6 h-6 text-hc-gold-500 flex-shrink-0" />
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Pre-Trip Route Surveys</h3>
                                    <p className="text-sm text-hc-muted leading-relaxed mt-1">
                                        Advanced operators conduct physical route surveys before your truck fires its engine. They map out the safest corridors, identifying low clearances, tight roundabouts, and ongoing state road construction.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <AlertOctagon className="w-6 h-6 text-hc-gold-500 flex-shrink-0" />
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Traffic Control & Civilian Safety</h3>
                                    <p className="text-sm text-hc-muted leading-relaxed mt-1">
                                        Civilians are unpredictable. Pilots utilize dual-band radios, flashing amber strobes, and high-visibility flags to block intersections, manage blind corners, and warn oncoming traffic of your dimensional footprint.
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-hc-surface border border-hc-border rounded-2xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-hc-gold-500/5 blur-[80px] pointer-events-none rounded-full" />
                        <h2 className="text-2xl font-black text-white uppercase tracking-[-0.02em] mb-6">
                            Verified Operator Standard
                        </h2>
                        <p className="text-sm text-hc-muted mb-6">
                            Every pilot listed via Haul Command undergoes algorithmic KYC verification. 
                            We out-class manual brokerage matching by displaying the mathematical truth.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-black border border-hc-border rounded-xl">
                                <span className="text-xs font-bold text-white uppercase tracking-widest">Liability Insurance</span>
                                <CheckCircle2 className="w-4 h-4 text-hc-success" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-black border border-hc-border rounded-xl">
                                <span className="text-xs font-bold text-white uppercase tracking-widest">Amber Light Cert.</span>
                                <CheckCircle2 className="w-4 h-4 text-hc-success" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-black border border-hc-border rounded-xl">
                                <span className="text-xs font-bold text-white uppercase tracking-widest">High Pole Equip. Confirmed</span>
                                <CheckCircle2 className="w-4 h-4 text-hc-success" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-black border border-hc-border rounded-xl">
                                <span className="text-xs font-bold text-white uppercase tracking-widest">Public Trust Score</span>
                                <div className="flex items-center gap-1.5 text-hc-gold-500 text-xs font-bold"><Zap className="w-3 h-3"/> Active</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── SEO FAQ Section (Question-Based Headings) ── */}
                <section className="space-y-6 max-w-4xl">
                    <h2 className="text-2xl font-black text-white uppercase tracking-[-0.02em]">
                        Frequently Asked Questions
                    </h2>
                    <div className="grid gap-4">
                        <div className="p-5 bg-hc-surface border border-hc-border rounded-2xl">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wide">What are the legal pilot car requirements in {regionName}?</h3>
                            <p className="text-sm text-hc-muted leading-relaxed mt-2">
                                Legal requirements in {regionName} are strictly enforced based on dimensions and route classification. Generally, any load exceeding 12 feet wide mandates at least one front pilot car on two-lane highways. Loads exceeding 14 feet wide typically require front and rear escorts. Finally, loads surpassing 14'6" in height strictly require a lead high pole vehicle to identify overhead obstructions.
                            </p>
                        </div>
                        <div className="p-5 bg-hc-surface border border-hc-border rounded-2xl">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wide">What equipment must an escort vehicle carry?</h3>
                            <p className="text-sm text-hc-muted leading-relaxed mt-2">
                                Certified escorts must carry specific safety gear. This includes 360-degree visibility amber flashing / rotating strobe lights, minimum 18-inch square red or orange warning flags, and an 'OVERSIZE LOAD' banner mounted visibly across the front/rear bumpers. Two-way VHF/CB radio communication with the heavy haul driver is legally required at all times.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── City Grid ── */}
                {cities.length > 0 ? (
                    <section className="space-y-6 pt-8 border-t border-hc-border">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-black text-white uppercase tracking-[-0.02em]">Local Coverage Networks</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {cities.map((cityName) => {
                                const slug = cityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                                return (
                                    <Link aria-label="Navigation Link"
                                        key={slug}
                                        href={getCityHubUrl(country, state, slug)}
                                        className="group flex items-center gap-3 p-3 bg-hc-surface border border-hc-border hover:border-hc-gold-500/40 rounded-xl transition-all"
                                    >
                                        <div className="w-6 h-6 rounded-md bg-hc-elevated flex items-center justify-center group-hover:bg-hc-gold-500/10 transition-colors">
                                            <MapPin className="w-3 h-3 text-hc-gold-500" />
                                        </div>
                                        <span className="text-xs font-bold text-white group-hover:text-hc-gold-400 transition-colors truncate">
                                            {cityName}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                ) : null}
                {/* ── Snippet Injector — featured snippet capture ── */}
                <SnippetInjector
                    blocks={['definition', 'faq', 'cost_range', 'regulation_summary', 'steps']}
                    term="pilot car"
                    geo={regionName}
                    country={countryData.iso2}
                />
                {/* ── Regulatory Moat — state-specific compliance intelligence ── */}
                <RegulatoryMoat
                    stateName={regionName}
                    escortWidth={`12' wide (two-lane) / 14' wide (multi-lane)`}
                    escortHeight={`14'6" requires height pole`}
                    poleTrigger={`14'6" overall height`}
                    nightRules="Most states restrict OS/OW movements 30 min after sunset to 30 min before sunrise"
                    holidayRules={`No travel on major holidays (New Year's, Memorial Day, July 4th, Labor Day, Thanksgiving, Christmas)`}
                    confidence={82}
                />

                {/* ── Conversion CTAs ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-hc-border">
                    <PostLoadCTA corridorName={regionName} variant="card" />
                    <OperatorsNeededCTA surfaceName={regionName} />
                    <ClaimListingCTA entityId="new" variant="card" />
                </div>
            </div>
        </div>
    );
}
