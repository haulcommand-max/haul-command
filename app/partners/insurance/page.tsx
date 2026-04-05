"use client";

import { Shield, ChevronRight, CheckCircle2, Award, ArrowRight, Activity, Percent } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";

import { useState } from "react";

export default function HeavyHaulInsurancePage() {
  const [usdot, setUsdot] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Hero */}
      <div className="relative border-b border-indigo-900/50 bg-gradient-to-b from-indigo-950/40 to-slate-950 pt-24 pb-20">
        <div className="absolute inset-0 bg-[url('https://maps.wikimedia.org/osm-intl/9/127/198.png')] bg-cover bg-center opacity-5 mix-blend-screen grayscale pointer-events-none" />
        
        <div className="container max-w-5xl mx-auto px-4 relative z-10 text-center">
          <div className="flex gap-2 items-center justify-center text-indigo-400 mb-6 font-mono text-sm uppercase tracking-wider">
            <Shield className="h-4 w-4" />
            <span>Marketplace Partner</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
            Heavy Haul Insurance <br className="hidden md:block"/> Formulated for Clean Operators
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Stop paying flat-rate premiums that subsidize sloppy carriers. Haul Command connects your live Trust Score with our underwriting partners to instantly lower your BIPD and cargo liability premiums.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
             <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-14 px-8 rounded-xl text-lg w-full sm:w-auto">
               Get a Premium Benchmark
             </Button>
             <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 h-14 px-8 rounded-xl text-lg w-full sm:w-auto">
               Connect Existing Policy
             </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-16">
        {/* Value Props */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
             <div className="bg-emerald-500/10 w-12 h-12 flex items-center justify-center rounded-xl mb-6">
                <Percent className="text-emerald-400 h-6 w-6" />
             </div>
             <h3 className="text-xl font-bold text-white mb-3">Trust Score Discounts</h3>
             <p className="text-slate-400">Our underwriting partners factor in your FMCSA SAFER safety metrics, your Haul Command Trust Score, and ELD history to provide a massive discount on commercial liability insurance.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
             <div className="bg-indigo-500/10 w-12 h-12 flex items-center justify-center rounded-xl mb-6">
                <Activity className="text-indigo-400 h-6 w-6" />
             </div>
             <h3 className="text-xl font-bold text-white mb-3">Instant Automated COIs</h3>
             <p className="text-slate-400">Generate and attach Certificates of Insurance directly inside the Haul Command dispatch dashboard. No more emailing agents on weekends to lock in the load.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
             <div className="bg-amber-500/10 w-12 h-12 flex items-center justify-center rounded-xl mb-6">
                <Shield className="text-amber-400 h-6 w-6" />
             </div>
             <h3 className="text-xl font-bold text-white mb-3">Load-Specific Coverage</h3>
             <p className="text-slate-400">Need temporary cargo value expansion for a specific million-dollar turbine move? Use our partner flow to digitally attach rider policies without permanent premium hikes.</p>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-900/50 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-12">
           <div className="max-w-xl">
              <h2 className="text-3xl font-bold text-white mb-4">Start by linking your USDOT</h2>
              <p className="text-lg text-slate-300 mb-6">If you have a Trust Score over 80 and zero out-of-service violations in the past 12 months, you are guaranteed a better rate than standard market tables. Find out exactly how much.</p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  await fetch('/api/partners/lead', {
                    method: 'POST',
                    body: JSON.stringify({ partner_type: 'insurance', usdot, email })
                  });
                  setSubmitted(true);
                } catch(e) {}
                setLoading(false);
              }} className="flex flex-col gap-3 mt-4">
                 {submitted ? <div className="text-emerald-400 font-bold bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-center">Received. Our underwriters will reach out shortly.</div> : (
                   <>
                     <div className="flex flex-col sm:flex-row gap-2">
                       <Input value={usdot} onChange={(e: any) => setUsdot(e.target.value)} required className="bg-slate-950 border-slate-800 text-white h-12 rounded-xl text-lg flex-1" placeholder="Enter USDOT Number" />
                       <Input type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required className="bg-slate-950 border-slate-800 text-white h-12 rounded-xl text-lg flex-1" placeholder="Email Address" />
                     </div>
                     <Button disabled={loading} type="submit" className="bg-white text-indigo-950 hover:bg-slate-200 h-12 px-6 rounded-xl font-bold w-full sm:w-auto self-start">
                        {loading ? 'Checking...' : <>Check Eligibility <ArrowRight className="h-4 w-4 ml-2" /></>}
                     </Button>
                   </>
                 )}
              </form>
           </div>
           
           {/* Mockup Example */}
           <div className="w-full md:w-80 bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-2xl relative">
              <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Saving $3,450/mo</div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                 <div>
                   <h4 className="text-slate-300 font-bold">BIPD Liability</h4>
                   <p className="text-xs text-slate-500">1,000,000 Combined</p>
                 </div>
                 <div className="text-emerald-400 font-bold">$1,250/mo</div>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                 <div>
                   <h4 className="text-slate-300 font-bold">Cargo</h4>
                   <p className="text-xs text-slate-500">250,000 Limit</p>
                 </div>
                 <div className="text-emerald-400 font-bold">$480/mo</div>
              </div>
              <div className="pt-2 text-center text-xs text-slate-500">
                 *Example quote based on Tier 1 operator with no claims in 36mo.
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
