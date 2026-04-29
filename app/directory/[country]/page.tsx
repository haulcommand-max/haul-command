import React from 'react';
import { generatePageMetadata } from '@/lib/seo/metadataFactory';
import { BreadcrumbRail } from '@/components/ui/BreadcrumbRail';
import { MarketClusterGrid } from '@/components/seo/MarketClusterGrid';
import { AuthoritySourceMap } from '@/components/seo/AuthoritySourceMap';
import { IntentMatrix } from '@/components/seo/IntentMatrix';
import { CompetitorAbsorptionCard } from '@/components/seo/CompetitorAbsorptionCard';
import { ClaimFirstCTA } from '@/components/seo/ClaimFirstCTA';

interface PageProps {
    params: Promise<{ country?: string; countryCode?: string }> | { country?: string; countryCode?: string };
}

async function resolveCountryParam(params: PageProps['params']) {
    const resolvedParams = await Promise.resolve(params);
    const country = resolvedParams?.country ?? resolvedParams?.countryCode ?? 'us';
    return String(country || 'us').toLowerCase();
}

export async function generateMetadata({ params }: PageProps) {
    const country = await resolveCountryParam(params);
    const formattedCountry = country.toUpperCase();
    
    return generatePageMetadata({
        title: `${formattedCountry} Pilot Car Directory & Escort Network`,
        description: `Access certified heavy haul pilot cars, state-level regulations, and live corridor intelligence in ${formattedCountry}. The global command OS for oversize routing.`,
        canonicalPath: `/directory/${country.toLowerCase()}`,
        countryCode: country.toLowerCase()
    });
}

/**
 * HC-W3-01 — 120-Country Expansion Engine (Country Level Hub)
 * Serves as the master route that trickles crawling power down to states -> cities -> corridors.
 */
export default async function CountryDirectoryPage({ params }: PageProps) {
    const country = await resolveCountryParam(params);
    const isUSA = country.toLowerCase() === 'us';
    const formattedName = isUSA ? 'United States' : country.toUpperCase();

    // Mock regional data array that would normally pull from h3_corridor_intelligence / seo_taxonomies
    const subRegions = isUSA 
        ? ['Texas', 'Florida', 'California', 'Oklahoma', 'Louisiana']
        : ['Alpha Region', 'Beta Region', 'Gamma Region'];

    return (
        <main className="min-h-screen bg-[#050608] pb-24">
            {/* Master Hero Area */}
            <div className="relative overflow-hidden bg-[#0A0D14] border-b border-white/[0.05]">
                {/* Global World Map Blur visual */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C6923A]/10 rounded-full blur-[100px] opacity-30 pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
                
                <div className="hc-container pt-8 pb-16 relative z-10">
                    <BreadcrumbRail crumbs={[
                        { label: 'Global Directory', href: '/directory' },
                        { label: formattedName }
                    ]} />

                    <div className="max-w-4xl mt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-[#00FF66]/10 text-[#00FF66] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                Country Matrix Live
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
                            {formattedName} Heavy Haul Network
                        </h1>
                        <p className="text-xl text-[#8FA3B8] leading-relaxed max-w-2xl">
                            The centralized intelligence layer for specialized freight routing, certified escort vehicle discovery, and official permit constraints across {formattedName}.
                        </p>
                    </div>
                </div>
            </div>

            <div className="hc-container mt-12 grid grid-cols-1 xl:grid-cols-12 gap-10">
                
                {/* Main Content Column */}
                <div className="xl:col-span-8 flex flex-col gap-10">
                    
                    {/* Region Expansion Hub (HC-W3-01 Downflow) */}
                    <div className="bg-[#0A0D14] border border-white/[0.04] rounded-2xl p-8">
                        <h3 className="text-lg font-bold text-white mb-6">Select Operating State / Province</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {subRegions.map(region => (
                                <a 
                                    key={region} 
                                    href={`/directory/${country.toLowerCase()}/${region.toLowerCase().replace(' ', '-')}`}
                                    className="px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] hover:border-white/[0.1] rounded-lg text-sm text-[#8FA3B8] hover:text-white transition-all text-center truncate"
                                >
                                    {region}
                                </a>
                            ))}
                        </div>
                    </div>

                    <MarketClusterGrid 
                        marketName={formattedName}
                        parentStateName="Federal Jurisdiction"
                        nearbyMarkets={[
                            { name: 'Border Crossings', url: `/tools/borders/${country.toLowerCase()}` },
                            { name: 'Major Ports', url: `/tools/ports/${country.toLowerCase()}` }
                        ]}
                        hotCorridors={[
                            { name: 'Trans-National Route A', url: '/corridors/national-a' },
                            { name: 'Trans-National Route B', url: '/corridors/national-b' }
                        ]}
                        stateRegulationsUrl={`/regulations/${country.toLowerCase()}`}
                        localTools={[
                            { name: 'National Compliance Hub', url: `/tools/compliance/${country.toLowerCase()}` }
                        ]}
                    />

                    {/* HC-W3-08: Competitor Absorption */}
                    <CompetitorAbsorptionCard 
                        targetAudience="brokers"
                        competitorType="Static Directory"
                        valueProp="Stop waiting on callbacks from outdated PDFs. Access a live, escrow-backed booking layer equipped with GPS verification."
                    />

                </div>

                {/* Right Rail */}
                <div className="xl:col-span-4 flex flex-col gap-8">
                    <ClaimFirstCTA 
                        mode="claim" 
                        marketLabel={formattedName} 
                        headline="Command this network."
                    />

                    {/* HC-W3-02: Authority Source Map */}
                    <AuthoritySourceMap 
                        region={formattedName}
                        lastVerified="Today"
                        confidenceSignals={['FMCSA Registry Sync', 'Local DOT Webhook', 'Network Consensus']}
                    />

                    <IntentMatrix 
                        category={`${formattedName} Intelligence`}
                        intents={[
                            { label: 'Oversize Enterprise API', url: '/enterprise/data', searchVolumeEstimate: 'high' },
                            { label: 'Local Pack Conquer', url: '/tools/growth', searchVolumeEstimate: 'medium' },
                            { label: 'Mobile App Sync', url: '/app', searchVolumeEstimate: 'long-tail' }
                        ]}
                    />
                </div>
            </div>
        </main>
    );
}
