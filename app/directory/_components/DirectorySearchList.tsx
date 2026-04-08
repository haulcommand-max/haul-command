"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MapPin, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface OperatorResult {
  id: string;
  name: string;
  phone: string;
  location: string;
  score: number;
}

export function DirectorySearchList({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<OperatorResult[]>([]);
  const [isCensored, setIsCensored] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOperators = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      // Hit the geo-locked/rate-limited Edge API
      const res = await fetch(`/api/directory/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      setResults(data.operators || []);
      // If the user is unauthenticated, the response will flag censored
      setIsCensored(data.censored === true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators(query);
  }, [query]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by city, state, or company name..."
          className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Role / Position Filters */}
      <div className="flex overflow-x-auto pb-2 gap-2 hc-scrollbar-hide">
        {[
          "All Roles",
          "Pilot Car (PEVO)",
          "Tillerman",
          "Height Pole",
          "Route Surveyor",
          "Bucket Truck",
          "Broker / Dispatch",
          "Police Escort",
          "Mechanic",
          "Heavy Wrecker"
        ].map((role, idx) => (
          <button
            key={role}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              idx === 0 
                ? "bg-amber-500 text-black border-amber-500" 
                : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-500 hover:text-white"
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center text-slate-400">Loading Directory Infrastructure...</div>}

      {/* Results List */}
      <div className="relative">
        <div className={`space-y-4 ${isCensored ? "" : ""}`}>
          {results.map((op, idx) => {
            // If censored, blur everything except the first two results
            const shouldBlur = isCensored && idx >= 2;

            return (
              <div
                key={op.id}
                className="bg-[#0B1015] border border-white/5 hover:border-white/10 rounded-xl p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className={shouldBlur ? "blur-md select-none opacity-50" : ""}>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold">{op.name}</h3>
                      {op.score >= 50 && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {op.score >= 80 ? 'Verified' : 'Claimed'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span>{op.location || 'Location Not Set'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0 mt-3 sm:mt-0 w-full sm:w-auto">
                    {/* Trust Score surface */}
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trust Score</span>
                        <span className={`font-mono font-bold ${op.score >= 80 ? 'text-emerald-400' : op.score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {op.score}%
                        </span>
                      </div>
                      <div className={`w-10 h-10 rounded block sm:hidden flex items-center justify-center font-bold ${op.score >= 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                        {op.score}
                      </div>
                    </div>

                    {/* CTAs */}
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Link href={`/directory/profile/${op.id}`} className="flex-1 sm:flex-none text-center px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-lg transition-all">
                        View Profile
                      </Link>
                      <Link href={`/loads/post?operator=${op.id}`} className="flex-1 sm:flex-none text-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 text-xs font-bold rounded-lg transition-all">
                        Request Direct
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Censorship Honeypot Overlay */}
        {isCensored && results.length > 2 && (
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#020617] to-transparent flex flex-col items-center justify-end pb-8">
            <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-xl text-center max-w-md shadow-2xl backdrop-blur-md">
              <LockKeyhole className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <h4 className="text-white font-bold text-lg">Identity Verification Required</h4>
              <p className="text-slate-400 text-sm mt-2 mb-4 leading-relaxed">
                To prevent data scraping and protect our operator network, you must login to view all 1.5M+ unmasked profiles, phone numbers, and live availability schedules.
              </p>
              <Link href="/auth/login" className="inline-flex w-full items-center justify-center rounded-md px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold mt-4">
                Login to Unlock Directory
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
