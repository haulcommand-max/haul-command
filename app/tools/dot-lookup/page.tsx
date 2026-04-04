"use client";

import { useState } from "react";
import { Search, ShieldCheck, Map, Truck, Building2, ChevronRight, FileCheck2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DotLookupLandingPage() {
  const [usdot, setUsdot] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (usdot.trim().length > 2) {
      router.push(`/tools/dot-lookup/${usdot.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Hero Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 pt-24 pb-20">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <div className="flex gap-2 items-center justify-center text-indigo-400 mb-6 font-mono text-sm uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            <span>FMCSA Safety & Authority Verification</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
            Free USDOT Lookup & Carrier Intel
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Verify safety ratings, insurance status, operating authority, and fleet size for any commercial carrier before you book or dispatch.
          </p>
          
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-slate-900 border border-slate-700 focus-within:border-indigo-500 rounded-xl overflow-hidden shadow-2xl p-2 gap-2">
              <Search className="h-6 w-6 text-slate-400 ml-3" />
              <Input 
                value={usdot}
                onChange={(e) => setUsdot(e.target.value)}
                placeholder="Enter USDOT Number or Company Name (e.g. 1234567)" 
                className="flex-1 bg-transparent border-none text-lg text-white focus-visible:ring-0 placeholder:text-slate-500"
              />
              <Button type="submit" size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 px-8 rounded-lg">
                Look Up Carrier
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-16">
        
        {/* Value Props & SEO Authority */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <div className="bg-emerald-500/10 p-3 rounded-lg inline-block mb-4">
              <FileCheck2 className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Check Operating Authority</h3>
            <p className="text-slate-400 text-sm">
              Instantly verify if a carrier's MC/FF operating authority is active, inactive, or pending revocation. Protect your brokerage from unregistered operators.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <div className="bg-orange-500/10 p-3 rounded-lg inline-block mb-4">
              <ShieldCheck className="h-6 w-6 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Verify Safety Ratings</h3>
            <p className="text-slate-400 text-sm">
              See the latest FMCSA safety ratings (Satisfactory, Conditional, or Unsatisfactory) and recent inspection violation history.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <div className="bg-blue-500/10 p-3 rounded-lg inline-block mb-4">
              <Building2 className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Validate Insurance</h3>
            <p className="text-slate-400 text-sm">
              Confirm liability and cargo insurance coverage requirements. Don't risk a heavy haul with an underinsured carrier.
            </p>
          </div>
        </div>

        {/* AdGrid Sponsorship Placements */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950/20 border border-indigo-900/30 rounded-2xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 border border-indigo-800/50 rounded px-2 py-0.5">Partner</span>
              <span className="text-sm text-slate-400">Compliance Solutions</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">Need to lower your commercial truck insurance?</h2>
            <p className="text-slate-300 text-lg">
              Haul Command partners with top heavy-haul insurance underwriters to offer exclusive rates for operators with clean DOT scores. Get a free quote to see how much you could save over your current policy.
            </p>
          </div>
          <div className="relative z-10 w-full md:w-auto flex-shrink-0">
             <Link href="/partners/insurance" className="flex items-center justify-center bg-white text-indigo-950 hover:bg-slate-200 font-bold py-4 px-8 rounded-xl transition-all shadow-xl shadow-indigo-900/20 w-full md:w-auto whitespace-nowrap">
               Get Insurance Quote <ChevronRight className="h-5 w-5 ml-2" />
             </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
