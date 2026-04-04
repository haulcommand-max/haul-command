import React from 'react';
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: 'Permit Agent Dashboard | Haul Command',
  description: 'Manage DOT filings, state permits, and heavy haul approvals.',
};

export default async function PermitAgentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/permit-agent");

  return (
    <div className="min-h-screen bg-hc-bg text-hc-text pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 border-b border-white/5 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Permit Agent Portal</h1>
          <p className="text-slate-400 text-sm">
            Fulfill state routing requirements, file oversize load permits, and acquire inbound carrier leads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Filings', value: '0' },
            { label: 'Pending Approvals', value: '0' },
            { label: 'States Authorized', value: '12' },
            { label: 'Inbound Leads', value: '0' },
          ].map((stat, i) => (
             <div key={i} className="bg-hc-surface border border-white/5 rounded-xl p-5">
               <div className="text-sm font-medium text-slate-400 mb-1">{stat.label}</div>
               <div className="text-2xl font-bold text-white">{stat.value}</div>
             </div>
          ))}
        </div>

        <div className="bg-hc-surface border border-white/5 rounded-xl p-6 text-center py-16">
          <div className="text-3xl mb-4 opacity-20">📜</div>
          <h3 className="text-lg text-white font-medium mb-2">No Active Permit Requests</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">Carriers will request document filing here based on the states/corridors you service.</p>
          <a href="/dashboard/advertiser" className="inline-block bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-md font-medium text-sm transition">
            Launch Sponorship Campaign to Get Leads
          </a>
        </div>

      </div>
    </div>
  );
}
