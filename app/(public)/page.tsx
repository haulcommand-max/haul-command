import React from "react";
import { MasterIntent } from "@/components/ui/intent-blocks";
import { 
  IntentRouter, 
  TrustStrip, 
  MarketSurface, 
  IntentMonetizationSurface 
} from "@/components/ui/intent-blocks";

// Haul Command OS: Universal Homepage Command Center
export default function HaulCommandHome() {
  
  // As demanded by the master spec: Intent-first hero
  const primaryIntents = [
    { intent: "Find" as MasterIntent, label: "Find Operators", destinationHref: "/directory", isPrimary: true },
    { intent: "Verify" as MasterIntent, label: "Check Regulations", destinationHref: "/regulations" },
    { intent: "Calculate" as MasterIntent, label: "Calculate Permitting", destinationHref: "/tools/us/tx/permit-calculator" },
    { intent: "Post" as any, label: "Post a Load", destinationHref: "/loads/new", isPrimary: true },
    { intent: "Claim" as MasterIntent, label: "Claim Verified Profile", destinationHref: "/claim" },
    { intent: "Advertise" as MasterIntent, label: "Buy Local AdGrid", destinationHref: "/advertise" }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      
      {/* 1. Hero Promise & Intent Setup */}
      <section className="relative px-8 py-20 lg:py-32 overflow-hidden border-b border-gray-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-900/20 via-black to-black"></div>
        
        <div className="relative max-w-6xl mx-auto space-y-8">
           
           <TrustStrip 
             confidenceLevel="verified_current"
             lastVerifiedAt={new Date().toISOString().split('T')[0]}
             metrics={{ verifiedCount: 15420, activeLoads: 312 }}
           />
           
           <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
             The Default O.S. <br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
               For Heavy Haul
             </span>
           </h1>
           
           <p className="text-xl md:text-2xl text-gray-400 max-w-2xl font-medium">
             120 Countries. Live route rules, real-time escort capacities, and verified operator trust-ranking.
           </p>

           <div className="pt-6 max-w-3xl">
             {/* Dynamic Switchboard Router replaces generic buttons */}
             <IntentRouter availableIntents={primaryIntents} />
           </div>
        </div>
      </section>

      <section className="px-8 py-16">
         <div className="max-w-6xl mx-auto space-y-16">
            
            {/* 2. Global Fleet Availability (The Market Heat Layer) */}
            <MarketSurface 
               subjectContext="Live Network Capacity"
               marketData={{
                  supplyStatus: "tight",
                  topOperators: [
                     { id: "1", name: "Texas Heavy Escort", rating: 4.9 },
                     { id: "2", name: "Alberta Pilot Co.", rating: 4.8 },
                     { id: "3", name: "Florida Overweight Control", rating: 5.0 }
                  ]
               }}
            />

            {/* 3. Monetization Strip explicitly shown */}
            <IntentMonetizationSurface 
               packageType="claim_profile"
               copyText="Operators: Secure your territory before your competitor does. Gain access to the live broker demand feed."
               pricingCents={4900}
               conversionHref="/pricing"
            />

         </div>
      </section>

    </div>
  );
}
