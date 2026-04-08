import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Radio, AlertCircle, MapPin, Clock, Search } from "lucide-react";
import { TrustScoreBadge } from "@/components/trust/TrustScoreBadge";

export const dynamic = 'force-dynamic';

export default async function AvailableNowPage() {
  const supabase = createClient();

  // Fetch broadcasts joined with places
  const { data: broadcasts, error } = await supabase
    .from("availability_broadcasts")
    .select(`
      operator_id,
      availability_status,
      message,
      updated_at,
      hc_places:operator_id ( name, locality, admin1_code )
    `)
    .in("availability_status", ["available_now", "available_today", "available_this_week"])
    .order("updated_at", { ascending: false })
    .limit(50);

  const activeCount = broadcasts?.length ?? 0;

  return (
    <div className="min-h-screen bg-hc-bg text-hc-text selection:bg-[#C6923A] selection:text-black">
      {/* HEADER */}
      <div className="border-b border-white/[0.05] bg-black/40 pt-24 pb-8 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Live Availability Feed</h1>
              </div>
              <p className="text-slate-400 text-sm">
                Real-time capacity broadcast from operators.
              </p>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                {activeCount} Active Now
              </span>
              <Link href="/available-now/broadcast" className="text-xs font-bold bg-[#C6923A] hover:bg-yellow-500 text-black px-4 py-2 rounded-xl transition-all">
                Broadcast My Capacity →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FEED */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 mb-8 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Failed to load feed: {error.message}</p>
          </div>
        )}

        {(!broadcasts || broadcasts.length === 0) && !error ? (
          <div className="bg-black/40 border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Active Broadcasts</h3>
            <p className="text-slate-400 max-w-sm mb-6">
              Operators are currently offline or deployed. Check back soon for returning capacity.
            </p>
            <Link href="/directory" className="px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl font-bold transition-all">
              Search Directory Instead
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {broadcasts.map((b: any) => {
              const place = b.hc_places;
              const name = place?.name ?? "Independent Operator";
              const loc = place ? `${place.locality}, ${place.admin1_code}` : "Private Location";
              
              const isNow = b.availability_status === "available_now";
              const isToday = b.availability_status === "available_today";

              return (
                <div key={b.operator_id} className="group relative bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all">
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <Link href={`/directory/profile/${b.operator_id}`} className="text-lg font-black hover:text-[#C6923A] transition-colors line-clamp-1">
                          {name}
                        </Link>
                        {/* Placeholder Trust Score */}
                        <TrustScoreBadge score={85} variant="compact" />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {loc}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(b.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold uppercase tracking-wider
                        ${isNow ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : 
                          isToday ? "bg-lime-500/10 text-lime-400 border-lime-500/30" : 
                          "bg-amber-500/10 text-amber-400 border-amber-500/30"}
                      `}>
                        <Radio className={`w-3 h-3 ${isNow || isToday ? 'animate-pulse' : ''}`} />
                        {isNow ? "Available Now" : isToday ? "Available Today" : "Available This Week"}
                      </div>
                      
                      <Link href={`/directory/profile/${b.operator_id}`} className="md:opacity-0 group-hover:opacity-100 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all ml-auto md:ml-0">
                        View Profile
                      </Link>
                    </div>
                  </div>
                  
                  {b.message && (
                    <div className="mt-4 pt-4 border-t border-white/5 text-sm text-slate-300 italic flex gap-2">
                       <span className="text-[#C6923A] opacity-50 block mt-0.5">↳</span> "{b.message}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
