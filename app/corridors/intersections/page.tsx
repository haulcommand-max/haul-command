import { Map, AlertTriangle, ShieldCheck, ChevronRight, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600; // Cache for 1 hour

export default async function CorridorIntersectionsIndex() {
  const supabase = createClient();
  const { data } = await supabase.from('hc_corridor_intersections').select('*').limit(20).order('risk', { ascending: false });
  const displayIntersections = data || [];

  return (
    <div className="  text-slate-50">
      {/* Hero Header */}
      <div className="border-b border-indigo-900/40 /50 pt-24 pb-20">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <div className="flex gap-2 items-center justify-center text-amber-500 mb-6 font-mono text-sm uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4" />
            <span>Heavy Haul Intelligence</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
            Corridor Intersections & Chokepoints
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Access critical vertical clearances, bridge weight restrictions, and local curfew limitations for over 15,000 major highway interchanges.
          </p>
          
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-amber-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center  border border-slate-700 focus-within:border-indigo-500 rounded-xl overflow-hidden shadow-2xl p-2 gap-2">
              <span className="pl-3 text-slate-400">ðŸ”</span>
              <input 
                placeholder="Search interchange (e.g. I-90 US-97)" 
                className="flex-1 bg-transparent border-none text-lg text-white focus-visible:outline-none placeholder:text-slate-500 px-3"
              />
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 px-8 rounded-lg">
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-16">
        
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Map className="w-5 h-5 text-indigo-400" /> Featured Chokepoints
          </h2>
          <span className="text-sm text-slate-400 font-mono">Top Searched by Brokers</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-16">
          {displayIntersections.map((intersection) => (
             <Link key={intersection.slug} href={`/corridors/intersections/${intersection.slug}`} className=" border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 flex items-center justify-between group transition-colors shadow-lg">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-xl shrink-0 ${intersection.risk === 'Critical' ? 'bg-rose-500/20 text-rose-500' : intersection.risk === 'High' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                      {intersection.state}
                   </div>
                   <div>
                     <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{intersection.name}</h3>
                     <p className="text-sm text-slate-500">{intersection.city}, {intersection.state} "¢ Limit: {intersection.weight_limit || 'N/A'}</p>
                   </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
             </Link>
          ))}
        </div>

        {/* Global Authority CTA block */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950/20 border border-indigo-900/30 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
           <div>
             <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-4">
                <ShieldCheck className="w-3 h-3" /> Fully Updated for 2026
             </div>
             <h3 className="text-2xl font-bold text-white mb-2">Automate Your Route Verification</h3>
             <p className="text-slate-400">
               Integrate our Chokepoint API directly into your dispatch system to flag under-clearance bridges instantly during quoting.
             </p>
           </div>
           <Button className="bg-[#121212] text-white font-bold px-8 h-12 rounded-xl shrink-0 whitespace-nowrap">
              Get API Access
           </Button>
        </div>

      </div>
    </div>
  );
}