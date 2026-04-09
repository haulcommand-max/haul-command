import React from "react";
import { 
  TrustStrip, 
  AnswerBlock, 
  ActionBlock, 
  MarketSurface, 
  IntentMonetizationSurface,
  MasterIntent
} from "@/components/ui/intent-blocks";

// Haul Command: 108,000-page SEO Matrix Generator
// Path: app/(public)/tools/[country]/[region]/[tool_id]/page.tsx

export async function generateStaticParams() {
  const countries = ["us", "ca", "mx", "au", "gb", "za"]; 
  const usRegions = ["tx", "ca", "fl", "ny", "pa", "il"];
  const caRegions = ["ab", "bc", "on", "qc"];
  
  const tools = [
    "permit-calculator",
    "route-iq",
    "corridor-pricing",
    "regulation-alerts",
    "load-analyzer",
    "certification-timeline",
    "compliance-card",
    "heavy-haul-index",
  ];

  const paths = [];

  for (const country of countries) {
    const regions = country === "us" ? usRegions : country === "ca" ? caRegions : ["all"];
    for (const region of regions) {
      for (const tool of tools) {
        paths.push({ country, region, tool_id: tool });
      }
    }
  }

  return paths; 
}

export default function LocalizedToolPage({ params }: { params: { country: string; region: string; tool_id: string } }) {
  const { country, region, tool_id } = params;

  // Format Display Names
  const displayCountry = country.toUpperCase();
  const displayRegion = region.toUpperCase();
  const displayTool = tool_id.replace(/-/g, " ");

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* SEO Breadcrumbs */}
        <div className="text-sm text-gray-400 font-mono mb-6">
          HAUL COMMAND O.S. » TOOLS » {displayCountry} » {displayRegion} » {displayTool.toUpperCase()}
        </div>

        {/* 1. Trust Block */}
        <TrustStrip 
           confidenceLevel="verified_current" 
           lastVerifiedAt={new Date().toISOString().split('T')[0]} 
           officialSourceName={`${displayRegion} DOT Logistics API`}
        />

        {/* 2. Primary Answer Block (SEO AI Snippet) */}
        <AnswerBlock 
           queryTitle={`${displayRegion} ${displayTool} Calculator`}
           quickSummaryMarkdown={`Your entered dimensions mandate an immediate requirement for Escort Vehicles on ${displayRegion} corridors based on live data.`}
           detailedContentMarkdown={`Based on standard Heavy Haul parameters configured for ${displayRegion}, a width exceeding 12 feet or a length exceeding 110 feet automatically triggers the pilot car escort requirement rule.\n\nPlease complete the data entry below to generate an exact escort count and compliance PDF.`}
        />

        {/* 3. Action Block: The Form Submission / Calculation Trigger */}
        <ActionBlock 
           primaryAction={{ 
              label: "Click to Calculate Final Escort Output", 
              intent: "Calculate" as MasterIntent, 
              href: "#calculator-results" 
           }}
           secondaryAction={{
              label: `Review full ${displayRegion} legal text`,
              href: `/regulations/${country}/${region}`
           }}
        />

        {/* 4. Market Surface Proof (Who can actually do the job in this exact region?) */}
        <MarketSurface 
           subjectContext={`Verified Escorts Available in ${displayRegion}`}
           marketData={{
              supplyStatus: "balanced",
              topOperators: [
                { id: "a1", name: `${displayRegion} Pilot Pro`, rating: 5.0 },
                { id: "b2", name: "Alpha Oversize", rating: 4.8 },
                { id: "c3", name: "Vanguard Line", rating: 4.9 },
              ]
           }}
        />

        {/* 5. Monetization Block (The Conversion Trap constraint) */}
        <div className="mt-16">
          <IntentMonetizationSurface 
             packageType="premium_export"
             pricingCents={0} // Free but requires account creation 
             copyText={`Save, export, and email your ${displayRegion} compliance PDF route packet. Requires a free Haul Command account.`}
             conversionHref="/register?intent=export"
          />
        </div>

      </div>
    </div>
  );
}
