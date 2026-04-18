"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MasterIntent } from "./IntentRouter";

export interface IntentMonetizationSurfaceProps {
  packageType: "claim_profile" | "sponsor_slot" | "premium_export" | "monitor_market";
  pricingCents: number;
  copyText: string;
  conversionHref?: string;
  stripeProductId?: string; // Tying this directly to the real Stripe catalog
}

export function IntentMonetizationSurface({ packageType, pricingCents, copyText, conversionHref, stripeProductId }: IntentMonetizationSurfaceProps) {
  
  const [loading, setLoading] = useState(false);
  const formattedPrice = pricingCents === 0 ? "FREE" : `$${(pricingCents / 100).toFixed(2)}`;
  
  const titleMap = {
     "claim_profile": "Claim Verified Profile",
     "sponsor_slot": "Sponsor This Territory",
     "premium_export": "Export Route Intelligence",
     "monitor_market": "Save & Monitor Corridor"
  };

  const handleStripeCheckout = async () => {
    if (!stripeProductId) return;
    setLoading(true);
    
    try {
      const res = await fetch("/api/stripe/data-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: stripeProductId, email: "" })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Trigger standard Stripe redirect
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-yellow-900/30 to-black border border-yellow-500/30 rounded-xl p-8 flex flex-col md:flex-row justify-between items-center shadow-[0_0_30px_rgba(234,179,8,0.05)]">
       <div className="mb-6 md:mb-0">
          <span className="text-xs font-bold text-yellow-500 tracking-widest uppercase mb-2 block border border-yellow-500/50 inline-block px-2 py-1 rounded">Commercial Upgrade</span>
          <h2 className="text-2xl font-black text-white">{titleMap[packageType]}</h2>
          <p className="text-gray-300 mt-2 max-w-lg">{copyText}</p>
       </div>
       
       <div className="flex flex-col items-end">
          <div className="text-3xl font-black text-white mb-3">{formattedPrice} {pricingCents > 0 && <span className="text-sm text-gray-500 font-medium">/mo</span>}</div>
          
          {stripeProductId ? (
             <button disabled={loading} onClick={handleStripeCheckout} className="bg-yellow-500 disabled:opacity-50 text-black px-8 py-3 rounded font-black uppercase text-sm hover:bg-yellow-400 transition shadow-lg w-full text-center">
                {loading ? "Redirecting to Stripe..." : "Activate Power-Up"}
             </button>
          ) : (
             <Link href={conversionHref || "#"} className="bg-yellow-500 text-black px-8 py-3 rounded font-black uppercase text-sm hover:bg-yellow-400 transition shadow-lg text-center block w-full text-center">
                Activate Power-Up
             </Link>
          )}

       </div>
    </div>
  );
}
