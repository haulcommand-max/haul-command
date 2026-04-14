"use client";

import { Fuel, RefreshCcw, Banknote, DollarSign, Wallet2, ChevronRight, Calculator, Truck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";

import { useState } from "react";

export default function HeavyHaulFuelPartnerPage() {
  const [usdot, setUsdot] = useState("");
  const [gallons, setGallons] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="  text-slate-50">
      {/* Hero */}
      <div className="relative border-b border-blue-900/50 bg-gradient-to-b from-blue-950/30 to-slate-950 pt-24 pb-20">
        <div className="container max-w-5xl mx-auto px-4 relative z-10 text-center">
          <div className="flex gap-2 items-center justify-center text-blue-400 mb-6 font-mono text-sm uppercase tracking-wider">
            <Fuel className="h-4 w-4" />
            <span>Marketplace Vendor Network</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
            The Heavy Haul <br className="hidden md:block"/> Fuel Discount Network
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Escorting heavy haul loads burns fuel, fast. Haul Command connects verified operators with corporate fleet-level discounts. Stop paying retail pump prices.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
             <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-14 px-8 rounded-xl text-lg w-full sm:w-auto shadow-xl shadow-blue-900/20">
               Apply for Fleet Card
             </Button>
             <Link href="/tools/ifta-calculator" className="inline-flex items-center justify-center text-blue-400 hover:bg-blue-950/50 h-14 px-8 rounded-xl text-lg w-full sm:w-auto transition-colors font-medium">
               <Calculator className="h-5 w-5 mr-2" /> Simulate IFTA Savings
             </Link>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 mb-20 items-center">
           <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg text-blue-400 text-sm font-bold mb-6">
                 <DollarSign className="h-4 w-4" /> Zero Hidden Fees
              </div>
              <h2 className="text-3xl font-bold text-white mb-6">Volume Pricing Built for the Pilot Car Network</h2>
              <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                 Whether you operate a single F-250 or run a dozen chase trucks, the Haul Command Fuel Network aggregates everyone's purchasing power. We use our network density to negotiate massive off-pump discounts normally reserved for 1,000-truck mega-carriers.
              </p>
              <ul className="space-y-4">
                 <li className="flex items-start gap-3">
                   <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                   <span className="text-slate-300">Save an average of <strong className="text-white">40¢ per gallon on diesel</strong> across 14,000 national stops.</span>
                 </li>
                 <li className="flex items-start gap-3">
                   <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                   <span className="text-slate-300">Automated IFTA tracking. Forget collecting crumpled receipts from your dash.</span>
                 </li>
                 <li className="flex items-start gap-3">
                   <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                   <span className="text-slate-300">Universal network acceptance (Pilot, Flying J, Love's, TA, Petro).</span>
                 </li>
              </ul>
           </div>
           
           <div className=" border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
              <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/30">
                 Active Approvals
              </div>
              <Wallet2 className="h-10 w-10 text-blue-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-2">Check Network Eligibility</h3>
              <p className="text-slate-400 text-sm mb-8">Enter your MC or USDOT number to see if your operating authority instantly qualifies for Tier 1 fleet pricing.</p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  await fetch('/api/partners/lead', {
                    method: 'POST',
                    body: JSON.stringify({ partner_type: 'fuel', usdot, email, estimated_gallons: gallons })
                  });
                  setSubmitted(true);
                } catch(e) {}
                setLoading(false);
              }} className="space-y-4">
                 {submitted ? <div className="text-emerald-400 font-bold bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-center mb-6">Qualification request received. We will be in touch!</div> : (
                   <>
                     <Input value={usdot} onChange={(e: any) => setUsdot(e.target.value)} required className=" border-slate-700 h-14" placeholder="USDOT Number" />
                     <Input value={email} onChange={(e: any) => setEmail(e.target.value)} required type="email" className=" border-slate-700 h-14" placeholder="Email Address" />
                     <Input value={gallons} onChange={(e: any) => setGallons(e.target.value)} required className=" border-slate-700 h-14" placeholder="Estimated Gallons / Month" type="number" />
                     <Button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-14 text-lg mt-2">
                        {loading ? 'Processing...' : <>Check Qualification <ChevronRight className="h-5 w-5 ml-2" /></>}
                     </Button>
                   </>
                 )}
              </form>
              <p className="text-xs text-slate-500 text-center mt-6">Soft credit check only. Does not affect your credit score.</p>
           </div>
        </div>

      </div>
    </div>
  );
}

// Just an internal CheckIcon mapping since I didn't import CheckCircle2 above properly
function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}