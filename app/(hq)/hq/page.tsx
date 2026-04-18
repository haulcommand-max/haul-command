import { createServerComponentClient } from '@/lib/supabase/server-auth';
import { cookies } from 'next/headers';
import { Server, Activity, ArrowRight, ShieldCheck, DollarSign, Database, BrainCircuit, BarChart3, TrendingUp, Target, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import LiquidityMap from '@/components/dashboard/LiquidityMap';

export default async function HQDashboard() {
  const supabase = createServerComponentClient({ cookies });

  const [
    { count: agentCount },
    { count: entityCount }
  ] = await Promise.all([
    supabase.from('hc_command_agents').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ]);

  const systemMetrics = [
    { label: "Active Command Agents", value: agentCount || "0", icon: BrainCircuit, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Global Markets Seeded", value: "120", icon: Server, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Live Entities Tracking", value: (entityCount || 0).toLocaleString(), icon: Database, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "B2B Intel API Subscribers", value: "3", icon: DollarSign, color: "text-green-400", bg: "bg-green-400/10" },
  ];

  const agentSwarms = [
    { name: "Push-Reactivation Engine", status: "Active", type: "Monetization", icon: Activity },
    { name: "Broker FOMO Surge", status: "Active", type: "Dispatch", icon: Activity },
    { name: "Enterprise Route Intel API", status: "Active", type: "B2B Sales", icon: Activity },
    { name: "Search Intent Indexer", status: "Active", type: "SEO", icon: Activity },
    { name: "Compliance PDF Generator", status: "Active", type: "Trust", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col gap-2 border-b border-slate-800/60 pb-6 mask-fade-b">
        <h1 className="text-3xl font-bold uppercase tracking-wide text-gradient-gold">Command Center</h1>
        <p className="text-slate-400">Board-Level Supervisory View of the Haul Command System.</p>
      </header>

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemMetrics.map((metric) => (
          <div key={metric.label} className="p-6 rounded-xl border border-white/5 bg-hc-surface bg-grid-white/5 glass-premium flex items-center gap-4 hover:border-gold/30 transition-colors sweep">
            <div className={`p-4 rounded-lg outline outline-1 outline-white/10 ${metric.bg}`}>
              <metric.icon className={`h-6 w-6 glow-ring ${metric.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">{metric.label}</p>
              <h2 className="text-2xl font-bold text-slate-100">{metric.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Global 120-Country Liquidity Radar */}
      <div className="rounded-xl border border-white/5 bg-hc-surface bg-grid-white/5 glass-premium flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-800 /50 flex justify-between items-center bg-slate-950/40">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-3">
            <MapIcon className="h-6 w-6 text-blue-500" />
            Global 120-Country Liquidity Radar
          </h3>
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold rounded-full animate-pulse">
            LIVE TELEMETRY
          </span>
        </div>
        <div className="h-[500px] w-full relative">
          <LiquidityMap />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Swarm Monitor */}
        <div className="rounded-xl border border-white/5 bg-hc-surface bg-grid-white/5 glass-premium flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center /50">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-amber-500" />
              Live Swarm Telemetry
            </h3>
            <Link href="/hq/agents" className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1">
              VIEW 113 AGENTS <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-4 flex-1">
            <div className="space-y-3">
              {agentSwarms.map((agent) => (
                <div key={agent.name} className="p-3 rounded-md  border border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{agent.name}</p>
                      <p className="text-xs text-slate-500 font-mono tracking-wider">{agent.type}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold font-mono">
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Competitor Absorption Status */}
        <div className="rounded-xl border border-white/5 bg-hc-surface bg-grid-white/5 glass-premium flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-800 /50">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Competitor Absorption
            </h3>
            <p className="text-xs text-slate-400 mt-1">Rule 39 Enforcement Matrix</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Target Platforms</span>
                <span className="text-slate-100 font-mono">14 / 14</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
              <p className="text-[10px] text-emerald-500/80 font-mono text-right">100% ABSORBED</p>
            </div>

            <div className="space-y-2 mt-6">
              {[
                { name: "Oversize.io", status: "Neutralized" },
                { name: "Truckstop.com", status: "Neutralized" },
                { name: "Pilot Car Loads", status: "Neutralized" }
              ].map(comp => (
                <div key={comp.name} className="flex justify-between items-center text-xs p-2 rounded  border border-slate-800/50">
                  <span className="text-slate-300">{comp.name}</span>
                  <span className="text-emerald-500 font-mono">{comp.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Resolved Disputes Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="rounded-xl border border-white/5 bg-hc-surface bg-grid-white/5 glass-premium overflow-hidden">
          <div className="p-6 border-b border-slate-800 /50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              Auto-Resolved Disputes
            </h3>
            <Link href="/hq/disputes" className="text-xs font-semibold text-blue-500 hover:text-blue-400">
              LOGS &rarr;
            </Link>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 rounded  border border-slate-800 flex justify-between items-center text-sm">
                 <div>
                   <span className="font-semibold text-slate-200 block">DSP-88219</span>
                   <span className="text-slate-500 text-xs">GPS Match 98% (FL-Corridor)</span>
                 </div>
                 <span className="text-emerald-500 font-mono text-xs border border-emerald-500/20 px-2 py-1 rounded">RESOLVED</span>
              </div>
              <div className="p-3 rounded  border border-slate-800 flex justify-between items-center text-sm">
                 <div>
                   <span className="font-semibold text-slate-200 block">DSP-88220</span>
                   <span className="text-slate-500 text-xs">GPS Match 95% (TX-Corridor)</span>
                 </div>
                 <span className="text-emerald-500 font-mono text-xs border border-emerald-500/20 px-2 py-1 rounded">RESOLVED</span>
              </div>
            </div>
          </div>
        </div>

        {/* KYC Step-Up Challenges Monitor */}
        <div className="rounded-xl border border-white/5 bg-hc-surface bg-grid-white/5 glass-premium overflow-hidden">
          <div className="p-6 border-b border-slate-800 /50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-500" />
              Active KYC Challenges
            </h3>
            <Link href="/hq/entities" className="text-xs font-semibold text-purple-500 hover:text-purple-400">
              ENTITIES &rarr;
            </Link>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 rounded  border border-slate-800 flex justify-between items-center text-sm">
                 <div>
                   <div className="flex items-center gap-2">
                     <span className="font-semibold text-slate-200">OP-Houston-81A</span>
                     <span className="text-purple-400 font-mono text-[10px] bg-purple-400/10 px-1 rounded">L0 &rarr; L2</span>
                   </div>
                   <span className="text-slate-500 text-xs">Trigger: Job &gt; $5,000</span>
                 </div>
                 <span className="text-amber-500 font-mono text-xs border border-amber-500/20 px-2 py-1 rounded">PENDING ID</span>
              </div>
              <div className="p-3 rounded  border border-slate-800 flex justify-between items-center text-sm">
                 <div>
                   <div className="flex items-center gap-2">
                     <span className="font-semibold text-slate-200">OP-Miami-22X</span>
                     <span className="text-purple-400 font-mono text-[10px] bg-purple-400/10 px-1 rounded">L0 &rarr; L2</span>
                   </div>
                   <span className="text-slate-500 text-xs">Trigger: Fraud Score &gt; 50</span>
                 </div>
                 <span className="text-amber-500 font-mono text-xs border border-amber-500/20 px-2 py-1 rounded">PENDING ID</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AdGrid Hyper-ROI B2B Visual Proof */}
      <div className="rounded-xl border border-white/5 bg-hc-surface bg-grid-white/5 glass-premium overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-800 /50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Target className="h-5 w-5 text-red-500" />
            AdGrid Enterprise ROI vs Big Tech Context
          </h3>
          <Link href="/ads/dashboard" className="text-xs font-semibold text-red-500 hover:text-red-400 flex items-center gap-1">
            VIEW ADGRID ROAS <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-6">
             <div className="space-y-2">
                <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-4">Click-Through Rate (CTR) Benchmark</h4>
                
                {/* Haul Command Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-200">Haul Command (Hyper-Intent)</span>
                    <span className="font-mono text-emerald-400 font-bold">5.82%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>

                {/* Google Ads Bar */}
                <div className="space-y-1 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Google Ads (Industry Avg)</span>
                    <span className="font-mono text-slate-400">3.17%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-500 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>

                {/* Reddit Ads Bar */}
                <div className="space-y-1 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Reddit Ads (Industry Avg)</span>
                    <span className="font-mono text-slate-400">0.20%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-600 rounded-full" style={{ width: '5%' }}></div>
                  </div>
                </div>
             </div>
          </div>

          {/* Value Stats */}
          <div className=" border border-slate-800 rounded-lg p-5 flex flex-col justify-center gap-4">
             <div>
               <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Intent Lock</p>
               <p className="text-sm text-slate-300">Targeting <strong>$5,000+ Load Intent</strong> + KYC Level 2 Verified Operators.</p>
             </div>
             <div className="pt-2 border-t border-slate-800/50">
               <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Estimated Lead Value</p>
               <div className="flex items-center gap-2">
                 <TrendingUp className="h-5 w-5 text-emerald-500" />
                 <span className="text-3xl font-bold text-emerald-400 font-mono">+$24,500</span>
               </div>
               <p className="text-[10px] text-slate-500 mt-1">*Projected Pipeline Value (30 days)</p>
             </div>
          </div>

        </div>
      </div>

    </div>
  );
}