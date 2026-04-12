"use client";

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Target, Lock, ShieldCheck, Zap, ArrowRight, Loader2 } from 'lucide-react';

export default function CheckoutContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get('id') || 'unspecified_territory';
  // Capitalize and format ID (e.g. us-tx -> US-TX)
  const territoryId = rawId.toUpperCase();
  
  const [loading, setLoading] = useState(false);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);

  const price = 299; // $299/mo standard Tier A territory cost

  const handleStripeActivation = async () => {
    setLoading(true);
    try {
      // In production, this calls the Stripe API route to generate a checkout session
      const res = await fetch("/api/adgrid/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          territory_id: territoryId,
          amount: price * 100, // cents
          type: 'territory_sponsor' 
        })
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe
      } else {
        // Fallback or demo mode if Stripe keys are not fully initialized
        setTimeout(() => {
          setLoading(false);
          alert("Stripe sandbox routing... (Ensure NEXT_PUBLIC_STRIPE_KEY is set)");
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-industrial-noise bg-grid-white/5 pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
            Secure Your Territory
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            You are about to lock the exclusive AdGrid Sponsor slot for <strong className="text-hc-gold-400">{territoryId}</strong>. 
            This grants you 100% Share-of-Voice for all broker routing searches in this market.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Main Checkout Panel */}
          <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5">
               <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                 <Lock className="h-5 w-5 text-emerald-400" />
                 Order Summary
               </h2>
               
               <div className="space-y-4">
                 <div className="flex justify-between items-center p-4 border border-slate-800 rounded-lg bg-slate-950/50">
                    <div>
                      <h3 className="font-bold text-slate-200">AdGrid: Territory Mastery</h3>
                      <p className="text-sm text-slate-500">Region: {territoryId}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">${price}</p>
                      <p className="text-xs text-slate-500">/ month</p>
                    </div>
                 </div>

                 <div className="flex justify-between items-center p-4 border border-emerald-500/20 rounded-lg bg-emerald-500/5">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                      <div>
                        <h3 className="font-bold text-emerald-400 text-sm">Competitor Lockout Active</h3>
                        <p className="text-xs text-emerald-500/70">No other agencies can buy this space while active.</p>
                      </div>
                    </div>
                 </div>
               </div>
            </div>

            <div className="p-8 bg-slate-950/30">
               <div className="flex justify-between items-end mb-6">
                 <div>
                   <p className="text-sm text-slate-400 font-medium pb-1">Billed Today</p>
                   <p className="text-4xl font-black text-white uppercase tabular-nums">${price}.00 <span className="text-sm text-slate-500 font-normal">USD</span></p>
                 </div>
               </div>

               <button 
                 onClick={handleStripeActivation}
                 disabled={loading}
                 className="w-full py-4 rounded-xl font-bold text-lg text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(52,211,153,0.3)]"
               >
                 {loading ? (
                   <><Loader2 className="h-5 w-5 animate-spin" /> Verifying Node...</>
                 ) : (
                   <>Proceed to Secure Checkout <ArrowRight className="h-5 w-5" /></>
                 )}
               </button>
               <p className="text-center text-xs text-slate-600 mt-4 flex items-center justify-center gap-1">
                 <Lock className="h-3 w-3" /> Encrypted \u0026 Billed via Stripe
               </p>
            </div>
          </div>

          {/* ROI Context Panel */}
          <div className="lg:col-span-2 space-y-6">
             <div className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-md p-6">
                <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4 text-hc-gold-400" />
                  What happens next?
                </h3>
                <ul className="space-y-4 text-sm text-slate-400">
                  <li className="flex items-start gap-3">
                     <span className="flex-shrink-0 h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white">1</span>
                     <p>Your payment is processed securely via Stripe. Your AdGrid wallet is instantly credited.</p>
                  </li>
                  <li className="flex items-start gap-3">
                     <span className="flex-shrink-0 h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white">2</span>
                     <p>You upload your brand logo, tracking URL, and contact phone number.</p>
                  </li>
                  <li className="flex items-start gap-3">
                     <span className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">3</span>
                     <p><strong className="text-slate-200">Instant Visibility.</strong> Your agency appears on every {territoryId} permit guide, route calculation, and broker dashboard query.</p>
                  </li>
                </ul>
             </div>

             <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap className="h-24 w-24 text-blue-500" />
                </div>
                <h3 className="font-bold text-blue-400 mb-2">High-Intent Traffic</h3>
                <p className="text-sm text-slate-300">
                  Brokers searching {territoryId} routing tools are actively pricing loads. You are placing your agency at the exact point of dispatch.
                </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
