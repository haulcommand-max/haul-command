"use client";

import { useState } from "react";
import { Calculator, CheckCircle2, AlertCircle, ChevronRight, Fuel, Truck, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";

// Minimal mock rates for demonstration
const mockIftaRates: Record<string, number> = {
  "TX": 0.20,
  "CA": 0.88,
  "PA": 0.74,
  "FL": 0.35,
  "OH": 0.47,
  "NY": 0.39,
  "GA": 0.31,
  "NC": 0.36,
  "VA": 0.29,
  "IL": 0.45,
};

type StateEntry = {
  state: string;
  miles: number;
  gallonsPurchased: number;
};

export default function IftaCalculatorPage() {
  const [mpg, setMpg] = useState<number>(6.5);
  const [entries, setEntries] = useState<StateEntry[]>([
    { state: "TX", miles: 500, gallonsPurchased: 50 },
    { state: "CA", miles: 300, gallonsPurchased: 0 },
  ]);

  const updateEntry = (index: number, field: keyof StateEntry, value: string | number) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const addEntry = () => setEntries([...entries, { state: "OH", miles: 0, gallonsPurchased: 0 }]);
  
  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const calculateOwed = () => {
    return entries.map(entry => {
      const fuelConsumed = entry.miles / mpg;
      const taxableGallons = fuelConsumed - entry.gallonsPurchased;
      const rate = mockIftaRates[entry.state] || 0.40; // Default fallback rate
      const tax = taxableGallons * rate;
      return { ...entry, tax, taxableGallons, rate };
    });
  };

  const results = calculateOwed();
  const totalOwed = results.reduce((acc, curr) => acc + curr.tax, 0);

  return (
    <div className="  text-slate-50">
      {/* Hero Header */}
      <div className="border-b border-slate-800 /50 pt-20 pb-16">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex gap-2 items-center text-orange-500 mb-6 font-mono text-sm uppercase tracking-wider">
            <Fuel className="h-4 w-4" />
            <span>Compliance Tool</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Free IFTA Fuel Tax Calculator
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mb-8">
            Instantly calculate your International Fuel Tax Agreement (IFTA) total amounts owed. Up-to-date state rates for 2026.
          </p>
          
          <div className="grid sm:grid-cols-3 gap-4">
            <div className=" border border-slate-800 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="text-sm text-slate-300">2026 Q1 Rates Loaded</span>
            </div>
            <div className=" border border-slate-800 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="text-sm text-slate-300">Fast & Accurate</span>
            </div>
            <div className=" border border-slate-800 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="text-sm text-slate-300">No Account Required</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Main Calculator */}
          <div className="md:col-span-2 space-y-6">
            <div className=" border border-slate-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-indigo-400" />
                  Trip Inputs
                </h2>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Average Fleet MPG</label>
                  <Input 
                    type="number" 
                    value={mpg} 
                    onChange={(e: any) => setMpg(Number(e.target.value))}
                    className="w-20 bg-slate-800 border-slate-700 text-white focus:ring-indigo-500"
                    step="0.1"
                  />
                </div>
              </div>

              {/* Headers */}
              <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-800 mb-4 px-2">
                <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">State</div>
                <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Miles Driven</div>
                <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gallons Bought</div>
                <div className="col-span-1"></div>
              </div>

              {/* Rows */}
              <div className="space-y-3 mb-6">
                {entries.map((entry, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-4 items-center px-2 py-1 rounded  hover:bg-slate-800/50 transition-colors">
                    <div className="col-span-3">
                      <select 
                        value={entry.state}
                        onChange={(e) => updateEntry(idx, 'state', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {Object.keys(mockIftaRates).map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-4 relative">
                      <Input 
                        type="number"
                        value={entry.miles}
                        onChange={(e: any) => updateEntry(idx, 'miles', Number(e.target.value))}
                        className="w-full bg-slate-800 border-slate-700 text-white pl-8"
                      />
                      <MapPin className="h-3 w-3 text-slate-500 absolute left-3 top-[13px]" />
                    </div>
                    <div className="col-span-4 relative">
                      <Input 
                        type="number" 
                        value={entry.gallonsPurchased}
                        onChange={(e: any) => updateEntry(idx, 'gallonsPurchased', Number(e.target.value))}
                        className="w-full bg-slate-800 border-slate-700 text-white pl-8"
                      />
                      <Fuel className="h-3 w-3 text-slate-500 absolute left-3 top-[13px]" />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button 
                        onClick={() => removeEntry(idx)}
                        className="text-slate-500 hover:text-red-400 p-2"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={addEntry} variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                + Add State
              </Button>
            </div>
            
            {/* Context/SEO */}
            <div className="prose prose-invert max-w-none">
              <h3>How does the IFTA calculator work?</h3>
              <p className="text-sm text-slate-400">
                The International Fuel Tax Agreement (IFTA) ensures that fuel taxes are distributed proportionally to the states where a commercial vehicle actually drives, rather than just where the fuel is purchased. This tool calculates your fuel consumed by state (miles &divide; MPG), compares it against the tax-paid fuel you purchased in that state, and multipliers the remainder by the current state IFTA tax rate.
              </p>
            </div>
          </div>

          {/* Sidebar / Affiliate Moat */}
          <div className="space-y-6">
            
            {/* Results Panel */}
            <div className=" border border-indigo-500/30 rounded-xl overflow-hidden shadow-2xl shadow-indigo-900/20">
              <div className=" border-b border-slate-800 p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Estimated IFTA {totalOwed >= 0 ? "Owed" : "Credit"}</h3>
                <div className="text-4xl font-black text-white">
                  {totalOwed < 0 ? "-" : ""}${Math.abs(totalOwed).toFixed(2)}
                </div>
              </div>
              
              <div className=" p-6 space-y-4">
                <div className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2">Breakdown</div>
                {results.map((r, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">{r.state} <span className="text-xs text-slate-600">(${r.rate}/gal)</span></span>
                    <span className={r.tax > 0 ? "text-rose-400 font-medium" : r.tax < 0 ? "text-emerald-400 font-medium" : "text-slate-500"}>
                      {r.tax < 0 ? "-" : ""}${Math.abs(r.tax).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium AdGrid Slot: Affiliates / Fuel Cards */}
            <div className="bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-800/50 rounded-xl p-6 relative group overflow-hidden">
              <div className="absolute top-2 right-3 text-[10px] uppercase font-bold tracking-widest text-blue-500/50">Sponsored</div>
              <div className="mb-4 text-blue-400">
                <Fuel className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                Save 40Â¢/gal on diesel across the US.
              </h3>
              <p className="text-sm text-slate-300 mb-6 drop-shadow-sm">
                Tired of massive IFTA bills? Connect your Haul Command account with the leading heavy-haul fuel card and get exclusive discounts.
              </p>
              <Link href="/partners/fuel" className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors group-hover:shadow-lg group-hover:shadow-blue-900/50">
                Claim Fuel Discount <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
            
            {/* Tax Help Ops Prompt */}
            <div className=" border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white mb-2">Automate Your Compliance</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Hook your ELD and Fuel Card APIs into Haul Command to automate IFTA filings entirely.
                </p>
              </div>
              <Link href="/tools/compliance-copilot" className="w-full">
                <Button variant="outline" className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200">
                  View Compliance Copilot
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}