import React from "react";
import Link from "next/link";

export type MasterIntent = "Learn" | "Verify" | "Calculate" | "Find" | "Compare" | "Execute" | "Claim" | "Advertise" | "Monitor";

export interface IntentRouterProps {
  availableIntents: Array<{
    intent: MasterIntent;
    label: string;
    destinationHref: string;
    isPrimary?: boolean;
  }>;
}

export function IntentRouter({ availableIntents }: IntentRouterProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-2xl">
      <h3 className="text-gray-400 font-mono text-xs mb-4 uppercase tracking-widest">Identify Your Objective</h3>
      <div className="flex flex-wrap gap-3">
        {availableIntents.map((item, idx) => (
          <Link 
            key={idx} 
            href={item.destinationHref}
            className={`px-6 py-3 rounded text-sm font-bold uppercase transition flex-grow text-center ${
               item.isPrimary 
               ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]" 
               : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
