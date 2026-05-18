import React from 'react';
import { BreadcrumbRail } from '@/components/ui/BreadcrumbRail';
import { MarketClusterGrid } from '@/components/seo/MarketClusterGrid';
import { AuthoritySourceMap } from '@/components/seo/AuthoritySourceMap';
import { IntentMatrix } from '@/components/seo/IntentMatrix';
import { CompetitorAbsorptionCard } from '@/components/seo/CompetitorAbsorptionCard';
import { ClaimFirstCTA } from '@/components/seo/ClaimFirstCTA';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { contractToCollectionJsonLd, contractToMetadata } from '@/lib/seo/page-seo-contract';
import { buildDirectoryCountryPageContract, buildDirectoryCountrySeoContract, buildDirectoryCountryStaticParams } from '@/lib/directory/presentation';
import { DirectoryBackgroundShell } from '@/components/directory/DirectoryBackgroundShell';

interface PageProps {
    params: Promise<{ country?: string; countryCode?: string }> | { country?: string; countryCode?: string };
}

export function generateStaticParams() {
    return buildDirectoryCountryStaticParams();
}

async function resolveCountryParam(params: PageProps['params']) {
    const resolvedParams = await Promise.resolve(params);
    const country = resolvedParams?.country ?? resolvedParams?.countryCode ?? 'us';
    return String(country || 'us').toLowerCase();
}

export async function generateMetadata({ params }: PageProps) {
    const country = await resolveCountryParam(params);
    return contractToMetadata(buildDirectoryCountrySeoContract(country));
}

/**
 * HC-W3-01 — 120-Country Expansion Engine (Country Level Hub)
 * Serves as the master route that trickles crawling power down to states -> cities -> corridors.
 */
export default async function CountryDirectoryPage({ params }: PageProps) {
    const country = await resolveCountryParam(params);
    const pageContract = buildDirectoryCountryPageContract(country);
    const formattedName = pageContract.displayName;
    const subRegions = pageContract.subRegions;
    const countryUpper = pageContract.countryCode.toUpperCase();
    const countryParam = pageContract.countryCode.toLowerCase();
    const regionLinks = subRegions.slice(0, 12).map((region) => ({
        name: region,
        url: `/directory/${countryParam}/${region.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    }));
    const seoContract = buildDirectoryCountrySeoContract(country);
    const jsonLd = contractToCollectionJsonLd(seoContract, regionLinks);

    return (
        <DirectoryBackgroundShell className="pb-24">
            <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            {/* Master Hero Area */}
            <div className="relative overflow-hidden bg-black/35 border-b border-white/[0.05] backdrop-blur-sm">
                {/* Global World Map Blur visual */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C6923A]/10 rounded-full blur-[100px] opacity-30 pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
                
                <div className="hc-container pt-8 pb-16 relative z-10">
                    <BreadcrumbRail crumbs={[
                        { label: 'Global Directory', href: '/directory' },
                        { label: formattedName }
                    ]} />

                    <div className="max-w-4xl mt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-[#C6923A]/10 text-[#C6923A] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                Country Directory Framework
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
                            {formattedName} Heavy Haul Network
                        </h1>
                        <p className="text-xl text-[#8FA3B8] leading-relaxed max-w-2xl">
                            Find heavy haul support records, route planning tools, source-backed regulation paths, and claimable provider profiles for {formattedName}.
                        </p>
                        <p className="mt-4 max-w-2xl rounded-xl border border-[#C6923A]/25 bg-[#C6923A]/10 p-4 text-sm font-semibold leading-6 text-[#f7e7c4]">
                            {pageContract.sourceBasis} Thin markets stay in source review while still passing users to real search, regulations, claims, and support-packet actions.
                        </p>
                    </div>
                </div>
            </div>

            <div className="hc-container mt-12 grid grid-cols-1 xl:grid-cols-12 gap-10">
                
                {/* Main Content Column */}
                <div className="xl:col-span-8 flex flex-col gap-10">
                    
                    {/* Region Expansion Hub (HC-W3-01 Downflow) */}
                    <div className="bg-black/45 border border-white/[0.06] rounded-2xl p-8 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6">Select Operating State / Province</h3>
                        {subRegions.length > 0 ? (
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
                        ) : (
                            <p className="text-sm leading-6 text-[#8FA3B8]">
                                Source-backed state and province links are pending for this country. Use the global directory search while the regional index is reviewed.
                            </p>
                        )}
                    </div>

                    <MarketClusterGrid 
                        marketName={formattedName}
                        parentStateName={countryUpper}
                        nearbyMarkets={regionLinks}
                        hotCorridors={[]}
                        stateRegulationsUrl={`/regulations/${countryParam}`}
                        localTools={[
                            { name: `${formattedName} directory search`, url: `/directory?country=${countryUpper}` },
                            { name: 'Route support packet', url: `/loads/post?country=${countryUpper}&intent=country-support` },
                            { name: 'Heavy haul tools', url: `/tools?country=${countryUpper}` },
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
                        countryCode={countryUpper}
                        source="directory-country"
                        intent="country-market-claim"
                    />
                    <ClaimFirstCTA
                        mode="request_support"
                        marketLabel={formattedName}
                        headline={`Need vetted support in ${formattedName}?`}
                        countryCode={countryUpper}
                        source="directory-country"
                        intent="country-support-packet"
                    />

                    {/* HC-W3-02: Authority Source Map */}
                    <AuthoritySourceMap 
                        region={formattedName}
                        lastVerified="Source review pending"
                        confidenceSignals={['Official source mapping', 'Claimable support records', 'Correction path']}
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
            <div className="hc-container mt-12">
                <NoDeadEndBlock
                    heading={`Next Steps for ${formattedName} Heavy Haul`}
                    moves={[
                        { href: '/directory', icon: '01', title: 'Search the Directory', desc: 'Find support records by role, city, and proof state', primary: true, color: '#D4A844' },
                        { href: '/claim', icon: '02', title: 'Claim or Fix a Profile', desc: 'Improve claim status, service areas, and trust signals', primary: true, color: '#22C55E' },
                        { href: `/regulations/${country.toLowerCase()}`, icon: '03', title: 'Country Regulations', desc: 'Review source-backed permit and escort context' },
                        { href: '/tools', icon: '04', title: 'Heavy Haul Tools', desc: 'Estimate escorts, permits, rates, and route support' },
                        { href: '/loads', icon: '05', title: 'Load Board', desc: 'Find active support demand and load opportunities' },
                        { href: '/leaderboards', icon: '06', title: 'Leaderboards', desc: 'Compare trust, availability, and market status' },
                    ]}
                />
            </div>
        </DirectoryBackgroundShell>
    );
}
