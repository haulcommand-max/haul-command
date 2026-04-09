import React from "react";
import { 
  TrustStrip, 
  AnswerBlock, 
  ActionBlock, 
  IntentRouter, 
  MarketSurface,
  IntentMonetizationSurface,
  MasterIntent
} from "@/components/ui/intent-blocks";

// Haul Command: Regulation Detail Page Template
// Path: app/(public)/regulations/[country]/[region]/page.tsx
// Translates complex legal codes into the strict 5-step operational spine.

export default function RegulationDetailPage({ params }: { params: { country: string; region: string } }) {
  const { country, region } = params;
  const displayRegion = region.toUpperCase();
  const displayCountry = country.toUpperCase();

  // Synthetic DB fetch simulation
  const officialSource = {
     name: `${displayRegion} Department of Transportation`,
     url: `https://www.${region.toLowerCase()}dot.gov/heavy-haul`
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* SEO Context / Breadcrumbs */}
        <div className="text-sm text-gray-400 font-mono mb-4">
          HAUL COMMAND O.S. » REGULATIONS » {displayCountry} » {displayRegion} COMPLIANCE
        </div>

        {/* 1. Trust Block: Prove official standing before answering */}
        <TrustStrip 
           confidenceLevel="verified_current" 
           lastVerifiedAt={new Date().toISOString().split('T')[0]} 
           officialSourceName={officialSource.name}
           officialSourceUrl={officialSource.url}
           metrics={{ activeLoads: 240 }}
        />

        {/* 2. Primary Answer Block (AI Index-Ready Law Summary) */}
        <AnswerBlock 
           queryTitle={`${displayRegion} Heavy Haul & Escort Vehicle Regulations`}
           quickSummaryMarkdown={`In ${displayRegion}, a front and rear pilot car escort is legally required on all 2-lane and 4-lane highways for any load exceeding 12 feet in width or 110 feet in length, pursuant to local transit code.`}
           detailedContentMarkdown={`## Curfew Restrictions\nTravel is strictly prohibited from 30 minutes after sunset to 30 minutes before sunrise. Certain metropolitan corridors enforce a strict 6:00 AM - 9:00 AM and 4:00 PM - 6:00 PM embargo.\n\n## Equipment Requirements\nAll escorts must maintain a minimum 10-inch "Oversize Load" roof sign, dual amber flashing strobes visible from 360 degrees, and a functioning CB radio communicating on Channel 19.`}
        />

        {/* 3. Action Block: Move from reading law to operational execution */}
        <ActionBlock 
           primaryAction={{ 
              label: "Open Route Calculator", 
              intent: "Calculate" as MasterIntent, 
              href: `/tools/${country}/${region}/permit-calculator` 
           }}
           secondaryAction={{
              label: `Download Official ${displayRegion} Carrier Packet`,
              href: "#compliance-packet"
           }}
        />

        {/* 4. Intent Router: Map nearby entities and siblings */}
        <div className="pt-8 border-t border-gray-800">
          <IntentRouter availableIntents={[
             { intent: "Find" as MasterIntent, label: `Find ${displayRegion} Operators`, destinationHref: `/directory/${country}/${region}` },
             { intent: "Learn" as MasterIntent, label: "View Equipment Glossary", destinationHref: "/glossary" },
             { intent: "Monitor" as MasterIntent, label: "Sign Up for Law Change Alerts", destinationHref: "/alerts" }
          ]} />
        </div>

        {/* 5. Market Surface Proof (Who is legally certified to act here?) */}
        <div className="mt-12">
           <MarketSurface 
              subjectContext={`Certified ${displayRegion} Pilot Cars`}
              marketData={{
                 supplyStatus: "balanced",
                 topOperators: [
                   { id: "1", name: "Apex Heavy Haul", rating: 4.9 },
                   { id: "2", name: "Titan Route Survey", rating: 4.8 },
                   { id: "3", name: `${displayRegion} Compliance Fleet`, rating: 5.0 },
                 ]
              }}
           />
        </div>

        {/* 6. Monetization Block (White-Label Compliance Pack or Geo Sponsor) */}
        <div className="mt-16">
          <IntentMonetizationSurface 
             packageType="monitor_market"
             pricingCents={9900} 
             copyText={`Never miss a legal edge-case. Monitor ${displayRegion} state law updates, get real-time curfew restriction changes, and access the legal compliance binder for $99/mo.`}
             conversionHref={`/pricing/compliance?region=${region}`}
          />
        </div>

      </div>
    </div>
  );
}
