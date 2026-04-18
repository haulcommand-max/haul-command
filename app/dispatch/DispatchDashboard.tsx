'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Users, MapPin, Search, AlertCircle, RefreshCw, Layers, Shield, Zap, Moon, Globe, MessageSquare } from 'lucide-react';
import { createClient as createClientComponentClient } from '@/lib/supabase/client';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const HeavyHaulMap = dynamic(() => import('@/components/map/HeavyHaulMap'), { ssr: false });

interface Operator {
  id: string;
  business_name: string | null;
  display_name: string | null;
  slug: string;
  city: string | null;
  country_code: string;
  trust_score: number | null;
  is_verified: boolean;
  vehicle_type: string | null;
  rate_per_km: number | null;
  currency: string | null;
}

interface DispatchStats {
  total_available: number;
  urgent_capable: number;
  night_capable: number;
  cross_border_capable: number;
  avg_trust_score: number;
  by_role: Record<string, number>;
  by_country: Record<string, number>;
}

interface Props {
  stats: DispatchStats;
}

export default function DispatchDashboard({ stats }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const topCountries = Object.entries(stats.by_country)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const topRoles = Object.entries(stats.by_role)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const [liveOps, setLiveOps] = useState<Operator[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadRealtimeFeed = async () => {
      const { data } = await supabase
        .from('hc_available_now')
        .select('id,business_name,display_name,slug,city,country_code,trust_score,is_verified,vehicle_type,rate_per_km,currency')
        .gte('available_until', new Date().toISOString())
        .order('trust_score', { ascending: false })
        .limit(10);
      setLiveOps((data ?? []) as Operator[]);
    };

    loadRealtimeFeed();

    const ch = supabase
      .channel('broker_dispatch_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hc_available_now' }, () => {
        loadRealtimeFeed();
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [supabase]);

  const hasLiveData = stats.total_available > 0;

  return (
    <div className=" bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 border-b border-white/5 bg-black/60 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Activity className="w-5 h-5 text-red-500 animate-pulse" />
          <h1 className="text-xl font-bold tracking-widest text-gray-200 uppercase">Live Dispatch Control</h1>
          <div className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400">
            {hasLiveData ? 'LIVE' : 'CONNECTING'} · v_dispatch_ready_supply
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-64 relative hidden md:block">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search load ID or operator..."
              className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm outline-none focus:border-white/30 transition-colors"
            />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-6 grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-5rem)]">
        
        {/* Left Column: Supply by Role */}
        <div className="xl:col-span-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h2 className="text-sm font-bold tracking-wider text-gray-400"><Layers className="w-4 h-4 inline mr-2" /> SUPPLY BY ROLE</h2>
            <RefreshCw className={`w-3 h-3 text-gray-600 ${hasLiveData ? '' : 'animate-spin'}`} />
          </div>

          <div className="overflow-y-auto space-y-3 pb-20 scrollbar-hide">
            {topRoles.length > 0 ? (
              topRoles.map(([role, count], idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  key={role}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-xs text-blue-400 font-bold capitalize">{role.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                      {count} Available
                    </span>
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                      style={{ width: `${Math.min((count / stats.total_available) * 100, 100)}%` }}
                    />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center text-gray-600 py-8">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No supply data yet</p>
                <p className="text-xs mt-1">Operators will appear once dispatch_supply is populated</p>
              </div>
            )}

            {/* Country breakdown */}
            {topCountries.length > 0 && (
              <>
                <div className="text-xs text-gray-600 font-bold mt-4 mb-2 uppercase tracking-wider">By Country</div>
                {topCountries.map(([cc, count]) => (
                  <div
                    key={cc}
                    onClick={() => setSelectedCountry(cc === selectedCountry ? null : cc)}
                    className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all text-sm ${
                      cc === selectedCountry
                        ? 'bg-blue-500/20 border border-blue-500/30'
                        : 'bg-white/5 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="font-mono text-xs">{cc}</span>
                    <span className="text-xs text-gray-500">{count} operators</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Center/Right: Map & HUD */}
        <div className="xl:col-span-3 bg-black flex flex-col rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl">
          
          <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen overflow-hidden">
            <HeavyHaulMap 
              mode="dispatch" 
              showPermitRoute={false} 
              showHud={false} 
              initialZoom={3} 
            />
          </div>

          {/* H3 Density Hexagons */}
          <div className="absolute inset-0 w-full h-full opacity-10 select-none pointer-events-none z-0">
            <svg width="100%" height="100%">
              <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                <path d="M25 0 L50 14.4 L50 43.3 L25 57.7 L0 43.3 L0 14.4 Z" fill="none" stroke="rgba(59,130,246,0.5)" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#hexagons)" />
            </svg>
          </div>


          {/* Live Supply HUD — wired to v_dispatch_ready_supply_internal */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
            <div className="bg-black/80 backdrop-blur border border-white/5 p-4 rounded-xl flex gap-6 shadow-2xl pointer-events-auto">
              <div>
                <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Global Supply</div>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {stats.total_available.toLocaleString()}<span className="text-sm text-gray-500 ml-1">OP</span>
                </div>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Urgent Ready
                </div>
                <div className="text-2xl font-bold font-mono text-amber-400">
                  {stats.urgent_capable.toLocaleString()}
                </div>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase flex items-center gap-1">
                  <Moon className="w-3 h-3" /> Night Moves
                </div>
                <div className="text-2xl font-bold font-mono text-purple-400">
                  {stats.night_capable.toLocaleString()}
                </div>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Cross-Border
                </div>
                <div className="text-2xl font-bold font-mono text-blue-400">
                  {stats.cross_border_capable.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur rounded-full px-4 py-2 text-xs font-mono text-gray-400 border border-white/5 flex items-center gap-2 pointer-events-auto cursor-help">
              <Shield className="w-3 h-3" /> Avg Trust: {stats.avg_trust_score || '—'}
            </div>
          </div>

          {/* New Live Feed Layer over Map */}
          <div className="absolute right-6 top-32 bottom-6 w-96 flex flex-col pointer-events-none">
            <div className="flex items-center justify-between bg-black/80 backdrop-blur border border-white/10 p-3 rounded-t-xl pointer-events-auto">
               <h3 className="text-white font-bold text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400 animate-pulse" /> TARGET OPERATORS</h3>
               <span className="text-xs text-gray-400 font-mono">{liveOps.length} HOT</span>
            </div>
            <div className="flex-1 bg-black/60 backdrop-blur border-x border-b border-white/10 rounded-b-xl p-3 overflow-y-auto pointer-events-auto space-y-3 custom-scrollbar">
               <AnimatePresence>
                 {liveOps.map((op, idx) => (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.95, y: 10 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     key={op.id} 
                     className="bg-black/80 border border-white/10 hover:border-emerald-500/50 rounded-lg p-3 group transition-colors"
                   >
                     <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2">
                         <div className="relative">
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="absolute animate-ping h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative rounded-full h-2.5 w-2.5 bg-emerald-500" />
                            </span>
                            <div className="bg-white/5 border border-white/10 rounded w-8 h-8 flex items-center justify-center text-sm">
                               {op.vehicle_type === 'pilot_car' ? 'ðŸš•' : 'ðŸš›'}
                            </div>
                         </div>
                         <div>
                           <Link href={`/directory/${op.slug}`} className="text-white text-sm font-bold truncate block group-hover:text-emerald-400 transition-colors">
                             {op.business_name || op.display_name}
                           </Link>
                           <div className="text-xs text-gray-500 flex items-center gap-1">
                             <MapPin className="w-3 h-3" /> {op.city || 'Available'}, {op.country_code}
                           </div>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="text-emerald-400 font-bold text-sm">
                           {op.trust_score ? Math.round(op.trust_score) : 'New'}
                         </div>
                         <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Trust</div>
                       </div>
                     </div>
                     <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                        <div className="text-xs font-mono text-gray-400">
                          {op.rate_per_km ? `${op.currency||'USD'} ${op.rate_per_km}/km` : 'Rate Neg.'}
                        </div>
                        <Link href={`/chat/${op.slug}`} className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                           <MessageSquare className="w-3 h-3" /> Book Now
                        </Link>
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
               {liveOps.length === 0 && (
                 <div className="text-center text-gray-500 text-sm py-8">
                    No active operator feeds in your filter perimeter.
                 </div>
               )}
            </div>
          </div>

          {/* Data Source Badge */}
          <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur rounded-lg px-3 py-2 text-xs font-mono text-gray-500 border border-white/5 pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${hasLiveData ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>v_dispatch_ready_supply_internal</span>
            </div>
            <div className="text-[10px] text-gray-600 mt-1">
              {Object.keys(stats.by_country).length} countries · {Object.keys(stats.by_role).length} roles
            </div>
          </div>

          {/* Status when no data */}
          {!hasLiveData && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center max-w-md">
                <Activity className="w-10 h-10 text-amber-500 mx-auto mb-4 animate-pulse" />
                <h3 className="font-bold text-lg mb-2">Dispatch Supply Warming Up</h3>
                <p className="text-sm text-gray-400 mb-4">
                  The dispatch_supply table needs operator records. Once operators set availability status to &quot;available&quot;, they&apos;ll populate v_dispatch_ready_supply_internal.
                </p>
                <div className="text-xs text-gray-600 font-mono">
                  Tables ready: dispatch_supply â†’ v_dispatch_ready_supply_internal âœ“
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}