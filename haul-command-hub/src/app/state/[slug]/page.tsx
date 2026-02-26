import { notFound } from 'next/navigation';
import { getStateBySlug, getPoliceInfo, getEquipmentSpecs, getSuperloadInfo } from '@/lib/regulatory-engine';
import Navbar from '@/components/Navbar';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function StateProfilePage({ params }: PageProps) {
    const { slug } = await params;
    const state = getStateBySlug(slug);

    if (!state) {
        notFound();
    }

    const police = getPoliceInfo(state.state);
    const equipment = getEquipmentSpecs(state.state);
    const superload = getSuperloadInfo(state.state);

    return (
        <>
            <Navbar />
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <header className="mb-12 border-l-4 border-accent pl-6">
                    <p className="text-accent font-bold uppercase tracking-widest text-sm mb-2">Regulatory Control Tower</p>
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
                        {state.state} <span className="text-accent">Permit Requirements</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-3xl">
                        Official oversize/overweight regulations, escort triggers, and movement curfews for {state.state}. Verified as of {state.last_verified_date}.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Main Triggers */}
                    <section className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold mb-6 flex items-center">
                            <span className="mr-3">🚩</span> Core Escort Triggers
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                <p className="text-gray-500 text-xs uppercase font-bold mb-1">Width Trigger (1 Escort)</p>
                                <p className="text-3xl font-black">{state.escort_trigger_width_1}'</p>
                            </div>
                            <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                <p className="text-gray-500 text-xs uppercase font-bold mb-1">Width Trigger (2+ Escorts)</p>
                                <p className="text-3xl font-black">{state.escort_trigger_width_2}'</p>
                            </div>
                            <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                <p className="text-gray-500 text-xs uppercase font-bold mb-1">Height (Escort Required)</p>
                                <p className="text-3xl font-black">{state.height_trigger_escort}'</p>
                            </div>
                            <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                <p className="text-gray-500 text-xs uppercase font-bold mb-1">Max Length</p>
                                <p className="text-3xl font-black">{state.length_trigger}'</p>
                            </div>
                        </div>
                    </section>

                    {/* Quick Stats / Risk */}
                    <section className="bg-accent/10 border border-accent/20 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold mb-6 text-accent">Risk Intelligence</h2>
                        <div className="space-y-6">
                            <div>
                                <p className="text-gray-400 text-xs uppercase font-bold mb-2">Base Risk Score</p>
                                <div className="flex items-center">
                                    <span className="text-5xl font-black text-accent mr-3">{state.risk_score_base}</span>
                                    <span className="text-sm text-gray-300">/ 5 Factor</span>
                                </div>
                            </div>
                            <div className="border-t border-accent/20 pt-6">
                                <p className="text-gray-400 text-xs uppercase font-bold mb-2">Police Mandatory</p>
                                <p className="text-xl font-bold">{state.superload_threshold_width}' Width</p>
                            </div>
                            <div className="border-t border-accent/20 pt-6">
                                <p className="text-gray-400 text-xs uppercase font-bold mb-2">P/EVO Reciprocity</p>
                                <p className="text-sm">{state.reciprocity_notes}</p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Detailed Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                        <h3 className="text-accent text-sm uppercase mb-4">Curfews</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{state.major_metro_curfew}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                        <h3 className="text-accent text-sm uppercase mb-4">Lighting Specs</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {equipment ? `Visibility: ${equipment.amber_beacon_visibility}` : 'Refer to DOT manual'}
                        </p>
                        {state.light_spec_link && (
                            <a href={state.light_spec_link} className="text-xs mt-4 inline-block underline underline-offset-4">View Specs</a>
                        )}
                    </div>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                        <h3 className="text-accent text-sm uppercase mb-4">Police Scheduling</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{state.police_scheduling_authority}</p>
                        {police && (
                            <p className="text-xs mt-2 text-gray-500">Lead time: {police.lead_time_days} days</p>
                        )}
                    </div>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex flex-col justify-between">
                        <div>
                            <h3 className="text-accent text-sm uppercase mb-4">Permit Portal</h3>
                            <p className="text-gray-300 text-sm truncate">{state.permit_authority}</p>
                        </div>
                        <a
                            href={state.permit_portal_url}
                            className="mt-6 bg-white/10 text-center py-2 rounded-lg text-xs font-bold hover:bg-white/20 transition-colors"
                            target="_blank"
                        >
                            Enter Portal
                        </a>
                    </div>
                </div>

                {/* JSON-LD for SEO */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "GovernmentService",
                            "serviceType": "Oversize Load Permits",
                            "provider": {
                                "@type": "GovernmentOrganization",
                                "name": state.permit_authority
                            },
                            "areaServed": {
                                "@type": "State",
                                "name": state.state
                            },
                            "name": `${state.state} Oversize Load Regulations`,
                            "description": `Official triggers for escorts, curfews, and police requirements in ${state.state}.`
                        })
                    }}
                />
            </main>

            <footer className="border-t border-white/10 py-12 bg-black">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-500 text-sm">
                        &copy; 2026 Haul Command. Built as a central operational node within the oversized transport economy.
                    </p>
                </div>
            </footer>
        </>
    );
}
