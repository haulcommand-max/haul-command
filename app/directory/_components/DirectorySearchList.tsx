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
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between"
              >
                <div className={shouldBlur ? "blur-md select-none opacity-50" : ""}>
                  <h3 className="text-white font-bold">{shouldBlur ? "John Doe Pilot Cars LLC" : op.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{op.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="block text-xs text-slate-500">Defense Index</span>
                    <span className="font-mono text-emerald-400">{op.score}</span>
                  </div>
                  <div className="bg-slate-800 px-4 py-2 rounded border border-slate-700 text-sm font-mono text-white">
                    {shouldBlur ? "(XXX) XXX-XXXX" : op.phone}
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
              <Button asChild className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold">
                <Link href="/auth/login">Login to Unlock Directory</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
