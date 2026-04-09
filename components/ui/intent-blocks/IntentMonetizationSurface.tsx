import React from "react";
import Link from "next/link";
import { MasterIntent } from "./IntentRouter";

export interface IntentMonetizationSurfaceProps {
  packageType: "claim_profile" | "sponsor_slot" | "premium_export" | "monitor_market";
  pricingCents: number;
  copyText: string;
  conversionHref: string;
}

export function IntentMonetizationSurface({ packageType, pricingCents, copyText, conversionHref }: IntentMonetizationSurfaceProps) {
  
  const formattedPrice = `$${(pricingCents / 100).toFixed(2)}`;
  const titleMap = {
     "claim_profile": "Claim Verified Profile",
     "sponsor_slot": "Sponsor This Territory",
     "premium_export": "Export Route Intelligence",
     "monitor_market": "Save & Monitor Corridor"
  };

  return (
    <div className="bg-gradient-to-r from-yellow-900/30 to-black border border-yellow-500/30 rounded-xl p-8 flex flex-col md:flex-row justify-between items-center shadow-[0_0_30px_rgba(234,179,8,0.05)]">
       <div className="mb-6 md:mb-0">
          <span className="text-xs font-bold text-yellow-500 tracking-widest uppercase mb-2 block border border-yellow-500/50 inline-block px-2 py-1 rounded">Commercial Upgrade</span>
          <h2 className="text-2xl font-black text-white">{titleMap[packageType]}</h2>
          <p className="text-gray-300 mt-2 max-w-lg">{copyText}</p>
       </div>
       
       <div className="flex flex-col items-end">
          <div className="text-3xl font-black text-white mb-3">{formattedPrice} <span className="text-sm text-gray-500 font-medium">/mo</span></div>
          <Link href={conversionHref} className="bg-yellow-500 text-black px-8 py-3 rounded font-black uppercase text-sm hover:bg-yellow-400 transition shadow-lg">
             Activate Power-Up
          </Link>
       </div>
    </div>
  );
}
