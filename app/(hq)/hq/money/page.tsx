import { DollarSign, ExternalLink, Network, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { createServerComponentClient } from '@/lib/supabase/server-auth';
import { cookies } from 'next/headers';

export default async function HQMoneyDashboard() {
  const supabase = createServerComponentClient({ cookies });

  // Dynamically extract 'Money' engines from the command matrix
  const { data: moneyAgents } = await supabase
    .from('hc_command_agents')
    .select('*')
    .eq('domain', 'monetization')
    .eq('status', 'active');

  const APIs = moneyAgents?.map(agent => ({
    name: agent.name,
    status: 'Live',
    tier: agent.slug === 'enterprise-intel-gateway' ? 'TMS Webhook' : 'Broker Endpoint',
    revenue: agent.slug === 'enterprise-intel-gateway' ? '$15,000/mo (3 active)' : 'Yield Optimized'
  })) || [];

  const sponsors = [
    { target: "Houston Corridor (I-10)", status: "Sold Out", price: "$4,500/mo", buyer: "Gulf Coast Transport" },
    { target: "Texas Regulations PDF", status: "Active Lead", price: "$1,200/mo", buyer: "Pending (Action Req)" },
    { target: "Pilot Car Safety Course", status: "Available", price: "$800/mo", buyer: "-" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-500" />
            <h1 className="text-3xl font-bold text-slate-100 uppercase tracking-wide">Monetization Engine</h1>
          </div>
          <p className="text-slate-400">Rule 25 (AdGrid) & Rule 27 (Data Products) Control Layer.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Money Logic */}
        <div className="rounded-xl border border-slate-800 /50 backdrop-blur-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-800 /50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Network className="h-5 w-5 text-blue-500" />
              B2B Data Products
            </h3>
            <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded">MRR: $15,000</span>
          </div>
          <div className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500  uppercase border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">Service</th>
                  <th className="px-6 py-3 font-semibold">Tier</th>
                  <th className="px-6 py-3 font-semibold">Current Yield</th>
                </tr>
              </thead>
              <tbody>
                {APIs.map(api => (
                  <tr key={api.name} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {api.name}
                      <br/>
                      <span className={`text-[10px] font-mono ${api.status === 'Live' ? 'text-green-500' : 'text-amber-500'}`}>
                        [{api.status}]
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{api.tier}</td>
                    <td className="px-6 py-4 font-mono text-emerald-400">{api.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AdGrid Scarcity Logic */}
        <div className="rounded-xl border border-slate-800 /50 backdrop-blur-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-800 /50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              AdGrid Sponsor Inventory
            </h3>
          </div>
          <div className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500  uppercase border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">Asset Surface</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Price</th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map(ad => (
                  <tr key={ad.target} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {ad.target}
                      <br/>
                      <span className="text-[10px] text-slate-500 font-mono">Current Buyer: {ad.buyer}</span>
                    </td>
                    <td className="px-6 py-4">
                      {ad.status === 'Sold Out' ? (
                        <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                          <CheckCircle2 className="h-4 w-4" /> Sold
                        </span>
                      ) : ad.status === 'Active Lead' ? (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                          <AlertTriangle className="h-4 w-4" /> Pending
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs font-bold">Open</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-emerald-400">{ad.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}