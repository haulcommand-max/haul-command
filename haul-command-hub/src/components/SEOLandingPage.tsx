import React from 'react';

/**
 * Programmatic SEO Landing Page Template
 * Designed to capture long-tail search traffic for [Service] in [City], [State].
 * Enhanced for AEO (Answer Engine Optimization) and Premium UX.
 */

interface SEOPageProps {
    service: string; // e.g., "High Pole Pilot Car"
    city: string;
    state: string;
    localIntelligence: string; // Dynamic AI-generated content
    availabilityCount: number;
    slug: string;
}

const SEOLandingPage: React.FC<SEOPageProps> = ({
    service,
    city,
    state,
    localIntelligence,
    availabilityCount,
    slug
}) => {
    // AEO Schema Markup (JSON-LD)
    const schemaMarkup = {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": `${service} in ${city}, ${state}`,
        "description": `Verified ${service} services in ${city}, ${state}. Specialized freight coordination and oversize load escorting via Haul Command.`,
        "url": `https://haulcommand.com/services/${state}/${city.replace(/\s+/g, '-')}`,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": city,
            "addressRegion": state,
            "addressCountry": "US"
        },
        "areaServed": city,
        "serviceType": service,
        "provider": {
            "@type": "Organization",
            "name": "Haul Command",
            "url": "https://haulcommand.com"
        }
    };

    return (
        <div className="min-h-screen bg-[#050A10] text-slate-200 font-sans selection:bg-blue-500/30 selection:text-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
            />

            {/* Premium Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto border-b border-white/5 backdrop-blur-md bg-black/20">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-xl font-black tracking-tighter text-white">HAUL COMMAND</span>
                        <span className="text-[10px] font-mono text-blue-500/80 uppercase tracking-widest mt-[-2px]">Control Tower Hub</span>
                    </div>
                    <div className="h-6 w-[1px] bg-white/10 hidden md:block" />
                    <div className="hidden md:flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Network Status: Operational</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="text-sm font-semibold text-slate-400 hover:text-white transition">Sign In</button>
                    <button className="bg-white text-black hover:bg-slate-200 px-6 py-2 rounded-lg font-bold text-sm transition-all transform hover:scale-[1.02]">
                        Deploy Dispatch
                    </button>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-40">
                <div className="grid lg:grid-cols-[1fr_400px] gap-16 items-start">
                    {/* Hero Content */}
                    <div className="space-y-10">
                        <header>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/20 mb-6">
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Localized Command Center</span>
                            </div>
                            <h1 className="text-6xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
                                {service} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                                    in {city}, {state}
                                </span>
                            </h1>
                            <p className="text-2xl text-slate-400 mt-8 leading-relaxed max-w-2xl font-light">
                                Verified ground-truth intelligence for <span className="text-white font-medium italic">Superload</span> and <span className="text-white font-medium">Oversize</span> moves arriving in the {city} corridor.
                            </p>
                        </header>

                        {/* Local Intel Card */}
                        <section className="bg-white/[0.03] border border-white/5 rounded-3xl p-10 backdrop-blur-xl">
                            <div className="flex items-start gap-6">
                                <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20">
                                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold text-white tracking-tight">Regional Protocol & Intelligence</h3>
                                    <p className="text-lg text-slate-400 leading-relaxed italic">
                                        "{localIntelligence}"
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Specs Grid */}
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { label: "Tillerman Support", value: "Tight Urban Radii" },
                                { label: "High Pole Check", value: "Clearance Sync" },
                                { label: "Permit Ops", value: "24/7 Coordination" }
                            ].map((spec, i) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:bg-white/[0.04] transition-colors">
                                    <p className="text-[10px] font-bold text-blue-500/80 uppercase tracking-widest mb-1">{spec.label}</p>
                                    <p className="text-white font-semibold">{spec.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar / Trust Box */}
                    <aside className="lg:sticky lg:top-8 space-y-8">
                        {/* Availability Card */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 shadow-2xl shadow-blue-500/20 transform -rotate-1">
                            <div className="flex justify-between items-start mb-10">
                                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <span className="bg-green-400 text-black text-[10px] font-bold px-2 py-1 rounded">LIVE SYNC</span>
                            </div>
                            <h2 className="text-5xl font-black text-white">{availabilityCount}</h2>
                            <p className="text-white/80 font-medium mt-1 uppercase tracking-wider text-xs">Verified Asset Nodes Available</p>
                            <hr className="my-6 border-white/10" />
                            <p className="text-white/70 text-sm leading-relaxed">
                                Our tactical network is currently deployed in <span className="text-white font-bold">{city}</span>. Deploy now for immediate route protection.
                            </p>
                        </div>

                        {/* Industry Authority Pin */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center">
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-6">Industry Authority Pin</p>
                            <div className="relative group cursor-help">
                                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                <div className="relative w-32 h-32 rounded-full border-2 border-white/10 flex items-center justify-center p-4 bg-slate-900 shadow-inner overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent" />
                                    <span className="text-blue-500 font-black text-2xl tracking-tighter">HC</span>
                                    <div className="absolute bottom-4 text-[8px] font-mono text-white/40">v2.1</div>
                                </div>
                            </div>
                            <p className="mt-6 text-xs font-mono text-blue-400 font-bold tracking-widest">
                                #HC-{state}-{city.slice(0, 3).toUpperCase()}-V
                            </p>
                            <p className="text-[10px] text-slate-500 mt-2 italic">Secured by Evidence Vault Protocol</p>
                        </div>

                        {/* Testimonial */}
                        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 italic text-slate-400 text-xs text-center leading-relaxed">
                            {`"Haul Command has become the central operational node for our industrial fleet. The ground-truth data in ${city} is unmatched."`}
                            <div className="not-italic mt-3 text-blue-500 font-bold uppercase tracking-tighter">— Tactical Fleet Director</div>
                        </div>
                    </aside>
                </div>
            </main>

            <footer className="relative z-10 border-t border-white/5 bg-black/40 backdrop-blur-3xl py-12 px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col items-center md:items-start">
                        <p className="text-[10px] font-mono text-slate-500">© 2026 HAUL COMMAND OPERATING SYSTEM</p>
                        <p className="text-[10px] font-mono text-blue-900/50 mt-1 uppercase tracking-widest">Protocol Moat: Anti-Gravity V2.4</p>
                    </div>
                    <div className="flex gap-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <a href="#" className="hover:text-blue-500 transition">State Directory</a>
                        <a href="#" className="hover:text-blue-500 transition">Dispatch API</a>
                        <a href="#" className="hover:text-blue-500 transition">Legal Vault</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default SEOLandingPage;
