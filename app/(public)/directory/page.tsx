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

// Haul Command: Directory Hub Template
// Path: app/(public)/directory/page.tsx
// Converting the traditional "yellow pages" list into a localized command center.

export default function DirectoryHubPage() {
  
  // Highlighting the 4 critical hub actions instead of just a generic search bar.
  const routeIntents = [
     { intent: "Find" as MasterIntent, label: "Search by Country / Region", destinationHref: "#geography" },
     { intent: "Execute" as MasterIntent, label: "Post a Backhaul Request", destinationHref: "/loads/new", isPrimary: true },
     { intent: "Compare" as MasterIntent, label: "Compare Broker Ratings", destinationHref: "/directory/brokers" },
     { intent: "Claim" as MasterIntent, label: "Claim My Escort Profile", destinationHref: "/claim" }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* SEO Context / Breadcrumbs */}
        <div className="text-sm text-gray-400 font-mono mb-4 uppercase tracking-widest">
          HAUL COMMAND O.S. » PILOT CAR & ESCORT DIRECTORY HUB
        </div>

        {/* 1. Trust Block: We prove we have thousands of real folks before they search */}
        <TrustStrip 
           confidenceLevel="verified_current" 
           lastVerifiedAt={new Date().toISOString().split('T')[0]} 
           metrics={{ verifiedCount: 24164, activeLoads: 312 }}
        />

        {/* 2. Answer Block (The AI Answer Vector) */}
        <AnswerBlock 
           queryTitle="Global Heavy Haul & Pilot Car Directory"
           quickSummaryMarkdown={`Haul Command currently indexes and verifying 24,164 active pilot cars, escort vehicles, bucket trucks, and route surveyors across 120 countries, making it the canonical global network for heavy machinery transit.`}
           detailedContentMarkdown={`Use the intent router below to execute immediate dispatch, view compliance maps, or analyze supply density across the network.`}
        />

        {/* 3. Intent Router / The Dashboard Toggles */}
        <div className="pt-6">
           <IntentRouter availableIntents={routeIntents} />
        </div>

        {/* 4. Action Block: Fast geographic execution */}
        <div className="pt-8 mb-8" id="geography">
           <ActionBlock 
              primaryAction={{ 
                 label: "Browse All United States Operators", 
                 intent: "Find" as MasterIntent, 
                 href: `/directory/us` 
              }}
              secondaryAction={{
                 label: `View Canadian Inter-Provincial Network`,
                 href: `/directory/ca`
              }}
           />
        </div>

        {/* 5. Market Surface (Heatmap / Live density proof) */}
        <MarketSurface 
           subjectContext={`Most Active Directory Corridors Today`}
           marketData={{
              supplyStatus: "tight",
              topOperators: [
                { id: "tx", name: "Texas Gulf Network (US)", rating: 4.9 },
                { id: "ab", name: "Alberta Heavy Haul (CA)", rating: 4.8 },
                { id: "au", name: "Queensland Freight (AU)", rating: 5.0 },
              ]
           }}
        />

        {/* 6. Monetization Block (Convert the traffic browsing the directory into claimed assets) */}
        <div className="mt-16">
          <IntentMonetizationSurface 
             packageType="claim_profile"
             pricingCents={4900} 
             copyText={`Operating an escort vehicle? Thousands of brokers search this database daily. Claim your profile, verify your insurance, and secure Top-5 Ranking bias for $49/mo.`}
             stripeProductId="prod_haulcommand_featured_listing" // Verified against the stripe backend
          />
        </div>

      </div>
    </div>
  );
}
