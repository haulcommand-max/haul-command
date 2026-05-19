import React from 'react';
import { generatePageMetadata } from '@/lib/seo/metadataFactory';
import { BreadcrumbRail } from '@/components/ui/BreadcrumbRail';
import { MarketClusterGrid } from '@/components/seo/MarketClusterGrid';
import { AuthoritySourceMap } from '@/components/seo/AuthoritySourceMap';
import { IntentMatrix } from '@/components/seo/IntentMatrix';
import { CompetitorAbsorptionCard } from '@/components/seo/CompetitorAbsorptionCard';
import { ClaimFirstCTA } from '@/components/seo/ClaimFirstCTA';
import { PageSeoContractJsonLd } from '@/components/seo/PageSeoContractJsonLd';
import {
    getPageSeoContract,
    metadataFromDbPageSeoContract,
} from '@/lib/seo/page-seo-contract-db';

interface PageProps {
    params: Promise<{ country?: string; countryCode?: string }> | { country?: string; countryCode?: string };
}

async function resolveCountryParam(params: PageProps['params']) {
    const resolvedParams = await Promise.resolve(params);
    const country = resolvedParams?.country ?? resolvedParams?.countryCode ?? 'us';
    return String(country || 'us').toLowerCase();
}

const COUNTRY_REGIONS: Record<string, string[]> = {
    us: ['Texas', 'Florida', 'California', 'Oklahoma', 'Louisiana'],
    ca: ['Ontario', 'Alberta', 'British Columbia', 'Saskatchewan', 'Quebec'],
    au: ['Queensland', 'Western Australia', 'New South Wales', 'Victoria', 'South Australia'],
    gb: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    de: ['North Rhine-Westphalia', 'Bavaria', 'Lower Saxony', 'Baden-Wurttemberg', 'Hesse'],
};

export async function generateMetadata({ params }: PageProps) {
    const country = await resolveCountryParam(params);
    const formattedCountry = country.toUpperCase();
    const countryKey = country.toLowerCase();
    const canonicalPath = `/directory/${countryKey}`;
    const contract = await getPageSeoContract(canonicalPath);
    if (contract) return metadataFromDbPageSeoContract(contract, canonicalPath);

    const hasPublishedRegionSet = Boolean(COUNTRY_REGIONS[countryKey]?.length);

    return generatePageMetadata({
        title: `${formattedCountry} Pilot Car Directory & Escort Network`,
        description: `Access source-backed heavy haul pilot car records, region-level regulation paths, and corridor support actions in ${formattedCountry}. Sparse markets stay clearly labeled until evidence improves.`,
        canonicalPath,
        countryCode: countryKey,
        noIndex: !hasPublishedRegionSet,
    });
}

/**
 * HC-W3-01 — 120-Country Expansion Engine (Country Level Hub)
 * Serves as the master route that trickles crawling power down to states -> cities -> corridors.
 */
export default async function CountryDirectoryPage({ params }: PageProps) {
    const country = await resolveCountryParam(params);
    const countryKey = country.toLowerCase();
    const isUSA = countryKey === 'us';
    const formattedName = isUSA ? 'United States' : country.toUpperCase();
    const subRegions = COUNTRY_REGIONS[countryKey] ?? [];
    const canonicalPath = `/directory/${countryKey}`;

    return (
        <main className="min-h-screen bg-[#050608] pb-24">
            <PageSeoContractJsonLd path={canonicalPath} />
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
                                Source-backed country hub
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
                            {formattedName} Heavy Haul Network
                        </h1>
                        <p className="text-xl text-[#8FA3B8] leading-relaxed max-w-2xl">
                            The country-level directory layer for specialized freight routing, source-backed escort discovery, and permit-constraint paths across {formattedName}. Markets stay conservative when local supply data is sparse.
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
                        {subRegions.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {subRegions.map(region => (
                                <a
                                    key={region}
                                    href={`/directory/${countryKey}/${region.toLowerCase().replace(/\s+/g, '-')}`}
                                    className="px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] hover:border-white/[0.1] rounded-lg text-sm text-[#8FA3B8] hover:text-white transition-all text-center truncate"
                                >
                                    {region}
                                </a>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-[#f7ddb3]">
                                Region pages for {formattedName} are not published yet. Use the claim and post-load actions to create demand while the local source set is being verified.
                            </div>
                        )}
                    </div>

                    <MarketClusterGrid
                        marketName={formattedName}
                        parentStateName="Federal Jurisdiction"
                        nearbyMarkets={[
                            { name: 'Border Crossings', url: `/tools/borders/${countryKey}` },
                            { name: 'Major Ports', url: `/tools/ports/${countryKey}` }
                        ]}
                        hotCorridors={[
                            { name: 'Published corridor pages', url: `/directory/${countryKey}?surface=corridors` },
                            { name: 'Route support requests', url: `/loads/post?country=${countryKey}` }
                        ]}
                        stateRegulationsUrl={`/regulations/${countryKey}`}
                        localTools={[
                            { name: 'National Compliance Hub', url: `/tools/compliance/${countryKey}` }
                        ]}
                    />

                    {/* HC-W3-08: Competitor Absorption */}
                    <CompetitorAbsorptionCard
                        targetAudience="brokers"
                        competitorType="Static Directory"
                        valueProp="Stop relying on stale PDFs. Build a source-backed support packet with claim state, route context, and dispatch actions before a broker commits the move."
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
                        lastVerified="Source-dependent"
                        confidenceSignals={['Directory source records', 'Permit authority references', 'Claim-state evidence']}
                    />

                    <IntentMatrix
                        category={`${formattedName} Intelligence`}
                        intents={[
                            { label: 'Oversize Enterprise API', url: '/enterprise/data', searchVolumeEstimate: 'high' },
                            { label: 'Local Pack Conquer', url: '/tools/growth', searchVolumeEstimate: 'medium' },
                            { label: 'Mobile workflow setup', url: '/app', searchVolumeEstimate: 'long-tail' }
                        ]}
                    />
                </div>
            </div>
        </main>
    );
}
