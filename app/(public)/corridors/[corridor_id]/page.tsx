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

// Haul Command: Corridor Detail Hub
// Path: app/(public)/corridors/[corridor_id]/page.tsx

export default function CorridorDetailPage({ params }: { params: { corridor_id: string } }) {
  const corridorId = params.corridor_id.toUpperCase().replace("-", " "); // e.g., i-10-houston -> I 10 HOUSTON

  const routeIntents = [
     { intent: "Find" as MasterIntent, label: "View Active Jobs on Corridor", destinationHref: `/loads?corridor=${params.corridor_id}`, isPrimary: true },
     { intent: "Verify" as MasterIntent, label: "Check State Curfew Restrictions", destinationHref: `/regulations` },
     { intent: "Execute" as MasterIntent, label: "Post a Backhaul Load", destinationHref: `/loads/new` },
     { intent: "Monitor" as MasterIntent, label: "Save & Monitor This Route", destinationHref: "#monitor" }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* SEO Context / Breadcrumbs */}
        <div className="text-sm text-gray-400 font-mono mb-4 uppercase tracking-widest">
          HAUL COMMAND O.S. » LOGISTICS CORRIDORS » {corridorId}
        </div>

        {/* 1. Trust Block */}
        <TrustStrip 
           confidenceLevel="verified_current" 
           lastVerifiedAt={new Date().toISOString().split('T')[0]} 
           metrics={{ verifiedCount: 342, activeLoads: 87 }}
        />

        {/* 2. Answer Block */}
        <AnswerBlock 
           queryTitle={`${corridorId} Heavy Haul Transit Corridor`}
           quickSummaryMarkdown={`The ${corridorId} corridor is currently showing high escort density with tight supply. Average live rates are tracking at $1.85/mile for front escorts and $2.10/mile for high pole operations.`}
           detailedContentMarkdown={`This corridor typically requires heightened compliance checks due to multi-jurisdictional borders and localized metropolitan curfew restrictions. See the intent logic below to verify requirements before establishing your route.`}
        />

        {/* 3. Intent Router */}
        <div className="pt-6">
           <IntentRouter availableIntents={routeIntents} />
        </div>

        {/* 4. Action Block: Fast geographic execution */}
        <div className="pt-8 mb-8" id="execute">
           <ActionBlock 
              primaryAction={{ 
                 label: `Dispatch Verified Escorts on ${corridorId}`, 
                 intent: "Execute" as MasterIntent, 
                 href: `/directory?corridor=${params.corridor_id}` 
              }}
              secondaryAction={{
                 label: `Download Corridor Pricing Report`,
                 href: `/reports/pricing/${params.corridor_id}`
              }}
           />
        </div>

        {/* 5. Market Surface (Heatmap / Live density proof) */}
        <MarketSurface 
           subjectContext={`Top-Rated Operators Active on ${corridorId}`}
           marketData={{
              supplyStatus: "tight",
              topOperators: [
                { id: "1", name: "Corridor Alpha Pilot", rating: 4.9 },
                { id: "2", name: "Transit Pro Logistics", rating: 4.8 },
                { id: "3", name: "Vector Escort Fleet", rating: 5.0 },
              ]
           }}
        />

        {/* 6. Monetization Block (Convert the traffic browsing the directory into claimed assets) */}
        <div className="mt-16" id="monitor">
          <IntentMonetizationSurface 
             packageType="sponsor_slot"
             pricingCents={29900} 
             copyText={`Own the ${corridorId} Corridor. Feature your brokerage, fleet, or permit service at the top of this route to intercept massive daily high-intent traffic.`}
             stripeProductId="prod_haulcommand_corridor_sponsor" 
          />
        </div>

      </div>
    </div>
  );
}
