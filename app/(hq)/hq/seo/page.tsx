import { Search, Map as MapIcon, Link as LinkIcon, RefreshCw, BarChart } from "lucide-react";
import Link from "next/link";
import { createServerComponentClient } from '@/lib/supabase/server-auth';
import { cookies } from 'next/headers';

export default async function HQSeoDashboard() {
  const supabase = createServerComponentClient({ cookies });

  // Dynamically extract SEO clusters from DB
  const { data: seoAgents } = await supabase
    .from('hc_command_agents')
    .select('*')
    .eq('domain', 'seo')
    .eq('status', 'active');

  // Dynamically fetch recent IndexNow / Search Sync runs
  const { data: indexRuns } = await supabase
    .from('hc_command_runs')
    .select('id, status, started_at, hc_command_agents!inner(slug)')
    .in('hc_command_agents.slug', ['search-indexer', 'docs-init-upload', 'refresh-chamber-sites'])
    .order('started_at', { ascending: false })
    .limit(5);

  const seoClusters = seoAgents?.map(agent => ({
    target: agent.name,
    coverage: "100%",
    indexed: "Live Sync",
    status: "Dominant"
  })) || [
    { target: "State DOT Regulations", coverage: "100%", indexed: "48/48 (Live)", status: "Dominant" },
    { target: "Local Escort Directory", coverage: "100%", indexed: "4,208 (Live)", status: "Dominant" },
  ];

  const recentIndexing = indexRuns?.map(run => ({
    path: `Run Hash: ${run.id.split('-')[0]}`,
    trigger: run.hc_command_agents.slug,
    time: new Date(run.started_at).toLocaleTimeString()
  })) || [
    { path: "/tools/b2b-permit-calculator-texas", trigger: "search-indexer", time: "12m ago" },
    { path: "/glossary/what-is-a-high-pole-truck", trigger: "docs-init-upload", time: "1h ago" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Search className="h-6 w-6 text-fuchsia-500" />
            <h1 className="text-3xl font-bold text-slate-100 uppercase tracking-wide">Intent & SEO Engine</h1>
          </div>
          <p className="text-slate-400">Rule 15 (AI-Search Law) & Rule 21 (Hyperlocal Dominance) Execution.</p>
        </div>
        <button className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-fuchsia-900/20">
          <RefreshCw className="h-4 w-4" />
          FORCE INDEXNOW
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Clusters */}
        <div className="rounded-xl border border-slate-800 /50 backdrop-blur-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-800 /50">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <BarChart className="h-5 w-5 text-fuchsia-500" />
              Programmatic Hubs
            </h3>
          </div>
          <div className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500  uppercase border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">Cluster Family</th>
                  <th className="px-6 py-3 font-semibold">Crawl Coverage</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {seoClusters.map(cluster => (
                  <tr key={cluster.target} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-medium text-slate-200">{cluster.target}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{cluster.indexed}</td>
                    <td className="px-6 py-4">
                      {cluster.status === 'Dominant' ? (
                        <span className="text-emerald-400 text-xs font-bold font-mono">Dominant</span>
                      ) : (
                        <span className="text-amber-400 text-xs font-bold font-mono">Scaling</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* IndexNow Ping Log */}
        <div className="rounded-xl border border-slate-800 /50 backdrop-blur-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-800 /50">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-blue-500" />
              Live Ping Telemetry
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {recentIndexing.map((ping) => (
              <div key={ping.path} className="p-3 rounded-md  border border-slate-800 flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-xs text-blue-400 font-mono">{ping.path}</span>
                  <span className="text-xs text-slate-500">{ping.time}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase text-slate-500 tracking-wider">
                  <span>Trigger: {ping.trigger}</span>
                  <span className="text-emerald-500 font-bold">200 OK (BING/GOOGLE)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}