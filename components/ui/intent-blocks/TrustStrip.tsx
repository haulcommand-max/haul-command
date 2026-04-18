import React from "react";

export type TrustConfidence = "verified_current" | "verified_review_due" | "partially_verified" | "historical";

export interface TrustStripProps {
  confidenceLevel: TrustConfidence;
  lastVerifiedAt: string;
  officialSourceUrl?: string;
  officialSourceName?: string;
  metrics?: {
    verifiedCount?: number;
    activeLoads?: number;
  };
}

export function TrustStrip({ confidenceLevel, lastVerifiedAt, officialSourceName, metrics }: TrustStripProps) {
  const isHighConfidence = confidenceLevel === "verified_current";

  return (
    <div className={`p-4 border-l-4 flex flex-col md:flex-row justify-between items-center bg-gray-900/50 rounded-r shadow-md text-sm ${isHighConfidence ? "border-l-green-500" : "border-l-yellow-500"}`}>
      <div className="flex items-center space-x-4">
         <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest ${isHighConfidence ? "bg-green-900/50 text-green-400" : "bg-yellow-900/50 text-yellow-500"}`}>
            {confidenceLevel.replace("_", " ")}
         </span>
         <span className="text-gray-400">Last Verified: <span className="text-white font-mono">{lastVerifiedAt}</span></span>
         {officialSourceName && <span className="text-gray-400">Source: <span className="text-white">{officialSourceName}</span></span>}
      </div>

      {metrics && (
        <div className="flex space-x-4 mt-4 md:mt-0 font-mono text-xs">
           {metrics.verifiedCount && <div><span className="text-yellow-500">{metrics.verifiedCount}</span> Verified Profiles</div>}
           {metrics.activeLoads && <div><span className="text-green-500">{metrics.activeLoads}</span> Active Routes</div>}
        </div>
      )}
    </div>
  );
}
