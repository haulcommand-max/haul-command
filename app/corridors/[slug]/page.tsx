import React from 'react';
import { notFound } from 'next/navigation';
import { generatePageMetadata } from '@/lib/seo/metadataFactory';
import { BreadcrumbRail } from '@/components/ui/BreadcrumbRail';
import { ClaimFirstCTA } from '@/components/seo/ClaimFirstCTA';
import { MarketClusterGrid } from '@/components/seo/MarketClusterGrid';
import { IntentMatrix } from '@/components/seo/IntentMatrix';
import { LiveAvailabilityPulse } from '@/components/seo/LiveAvailabilityPulse';
import { HighIntentAdGrid } from '@/components/seo/HighIntentAdGrid';
import { QuickAnswerBlock } from '@/components/seo/QuickAnswerBlock';
import { AdGridSlot } from '@/components/home/AdGridSlot';

// Next.js 15 Async Params
interface PageProps {
    params: Promise<{ slug: string }>;
}

// Map of canonical metadata for the SEO engine
export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params;
    
    // Fallback or fetched data
    const formattedTitle = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return generatePageMetadata({
        title: `${formattedTitle} Oversize Route Intelligence`,
        description: `Live market signals, pilot car availability, and compliance rules for the ${formattedTitle} heavy haul corridor.`,
        canonicalPath: `/corridors/${slug}`,
    });
}

export default async function CorridorPage({ params }: PageProps) {
    const { slug } = await params;
    
    // In a real app, this would be fetched from Supabase h3_corridor_intelligence
    const formattedTitle = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Mocking structural SEO data based on execution spec
    const mockSponsors = [
        { tier: 'elite' as const, companyName: `Alpha Lead Cars ${formattedTitle}`, primaryService: "High Pole / Survey", trustScore: 98, profileUrl: "#", isNative: true },
        { tier: 'standard' as const, companyName: `Texas Chase Ops`, primaryService: "Chase / Traffic Control", trustScore: 85, profileUrl: "#", isNative: true }
    ];

    const mockPulses = [
        { id: '1', type: 'repositioning' as const, operatorName: 'John D.', locationLabel: 'I-10 Weigh Station', timestamp: '5 mins ago', actionUrl: '#' },
        { id: '2', type: 'available_now' as const, operatorName: 'Sarah K.', locationLabel: 'Northbound Access', timestamp: '12 mins ago', actionUrl: '#' }
    ];

    return (
        <main className="min-h-screen bg-[#050608] pb-24">
            {/* Header Area */}
            <div className="border-b border-white/[0.05] bg-[#0a0d14]">
                <div className="hc-container pt-8 pb-12">
                    <BreadcrumbRail crumbs={[
                        { label: 'Corridors', href: '/corridors' },
                        { label: formattedTitle }
                    ]} />
                    
                    <h1 className="text-4xl md:text-5xl font-black text-white mt-4 mb-4 tracking-tight">
                        {formattedTitle} <span className="text-[#8fa3b8]">Corridor Intelligence</span>
                    </h1>
                    <p className="text-[#8fa3b8] text-lg max-w-3xl">
                        Monitor live pilot car supply, historical rate benchmarks, and active compliance restrictions for oversize routing through the {formattedTitle} corridor.
                    </p>
                </div>
            </div>

            <div className="hc-container grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
                
                {/* Main Content Column */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    
                    <QuickAnswerBlock 
                        directAnswer={`The ${formattedTitle} corridor currently has a balanced supply index.`}
                        expandedExplanation={`Based on recent telematics and verified marketplace claims, there are currently 12 operators active or repositioning on this route. Standard dual-escort formations recommend booking 24 hours in advance.`}
                        freshnessDate={new Date().toLocaleDateString()}
                        confidenceScore={92}
                        sourcePathLabel="Public Load Board"
                        sourcePathHref="/loads"
                        nextStepCtaLabel="View Local Rates"
                        nextStepCtaHref="/rates"
                    />

                    <HighIntentAdGrid 
                        intentContext={`Certified Providers: ${formattedTitle}`}
                        sponsors={mockSponsors}
                    />

                    <MarketClusterGrid 
                        marketName={formattedTitle}
                        parentStateName="Texas"
                        nearbyMarkets={[
                            { name: 'Houston', url: '/directory/us/tx/houston' },
                            { name: 'Dallas', url: '/directory/us/tx/dallas' }
                        ]}
                        hotCorridors={[
                            { name: 'I-35 North', url: '/corridors/i-35-north', rateTrend: '+$0.15/mi' },
                            { name: 'I-10 East', url: '/corridors/i-10-east', rateTrend: 'Stable' }
                        ]}
                        stateRegulationsUrl="/regulations/tx"
                        localTools={[
                            { name: 'Escort Requirements Calculator', url: '/tools/escort-calculator' },
                            { name: 'Rate Benchmarker', url: '/tools/rates' }
                        ]}
                    />

                    <IntentMatrix 
                        category="Route Planning"
                        intents={[
                            { label: 'Oversize Loads Available Here', url: '/loads', searchVolumeEstimate: 'high' },
                            { label: 'Route Survey Reports', url: '/corridors/surveys', searchVolumeEstimate: 'medium' },
                            { label: 'Weigh Station Bypasses', url: '/tools/weigh-stations', searchVolumeEstimate: 'long-tail' }
                        ]}
                    />

                </div>

                {/* Sidebar / Gravity UI */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <ClaimFirstCTA 
                        mode="book_corridor" 
                        marketLabel={formattedTitle}
                    />

                    <LiveAvailabilityPulse 
                        marketName={formattedTitle}
                        recentSignals={mockPulses}
                    />

                    <AdGridSlot zone="corridor_sponsor" />
                </div>

            </div>
        </main>
    );
}
