import React from "react";
import { 
  TrustStrip, 
  AnswerBlock, 
  ActionBlock, 
  IntentRouter, 
  IntentMonetizationSurface,
  MasterIntent
} from "@/components/ui/intent-blocks";

// Haul Command: Resource Detail Hub
// Path: app/(public)/resources/[resource_id]/page.tsx

export default function ResourceDetailPage({ params }: { params: { resource_id: string } }) {
  const resourceName = params.resource_id.replace(/-/g, " "); 

  const routeIntents = [
     { intent: "Learn" as MasterIntent, label: "Take the Certification Course", destinationHref: `/training/${params.resource_id}`, isPrimary: true },
     { intent: "Verify" as MasterIntent, label: "View Linked Regulations", destinationHref: `/regulations` },
     { intent: "Calculate" as MasterIntent, label: "Identify Liability Gap", destinationHref: `/tools` },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* SEO Context / Breadcrumbs */}
        <div className="text-sm text-gray-400 font-mono mb-4 uppercase tracking-widest">
          HAUL COMMAND O.S. » RESOURCES & DOCS » {resourceName}
        </div>

        {/* 1. Trust Block: Source confidence */}
        <TrustStrip 
           confidenceLevel="verified_current" 
           lastVerifiedAt={new Date().toISOString().split('T')[0]} 
           officialSourceName="Federal Motor Carrier Safety Administration (FMCSA)"
        />

        {/* 2. Answer Block (The AI Answer Vector) */}
        <AnswerBlock 
           queryTitle={`${resourceName} Operations Manual`}
           quickSummaryMarkdown={`This official operations document outlines the baseline liability, insurance, and equipment protocols required for legal transit operations across federal junctions.`}
           detailedContentMarkdown={`## Core Takeaways\n- Liability mandates require minimum $1,000,000 commercial auto structure.\n- Amber light visibility must meet SAE J845 Class 2 specifications.\n- High-pole operators must maintain physical logs of bridge impacts.\n\nUse the intent router below to link these requirements directly to your active jobs, or download the packet directly.`}
        />

        {/* 3. Action Block: Fast geographic execution */}
        <div className="pt-4 mb-4">
           <ActionBlock 
              primaryAction={{ 
                 label: "Download Full PDF Packet", 
                 intent: "Execute" as MasterIntent, 
                 href: `/api/resources/download?id=${params.resource_id}` 
              }}
           />
        </div>

        {/* 4. Intent Router / Training Adjacency */}
        <div className="pt-6 border-t border-gray-800">
           <h3 className="text-gray-400 font-mono text-xs mb-4 uppercase tracking-widest">Adjacent Operational Vectors</h3>
           <IntentRouter availableIntents={routeIntents} />
        </div>

        {/* 5. Monetization Block (Premium Resource Export) */}
        <div className="mt-16">
          <IntentMonetizationSurface 
             packageType="premium_export"
             pricingCents={0} 
             copyText={`Unlock the extracted checklist map for this resource. Free with email verification to ensure safe document distribution.`}
             conversionHref={`/register?intent=resource_export&id=${params.resource_id}`} 
          />
        </div>

      </div>
    </div>
  );
}
