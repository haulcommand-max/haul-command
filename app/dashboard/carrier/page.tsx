import React from 'react';
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: 'Carrier Dashboard | Haul Command',
  description: 'Manage your trucking fleet, heavy loads, and pilot car dispatches.',
};

export default async function CarrierDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/carrier");

  return (
    <div className=" bg-hc-bg text-hc-text pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 border-b border-white/5 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Carrier Command Center</h1>
            <p className="text-slate-400 text-sm">
              Manage active heavy-haul operations, dispatch operators, and track en-route oversize loads.
            </p>
          </div>
          <button className="bg-hc-gold hover:bg-[#D4A017] text-hc-bg px-4 py-2 rounded-md font-bold text-sm">
            Post New Load
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-hc-surface border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center h-64 text-center">
              <div className="text-4xl opacity-20 mb-3">ðŸšš</div>
              <h3 className="text-lg font-medium text-white mb-1">No Active Loads</h3>
              <p className="text-sm text-slate-400">Post an oversize load to immediately notify available operators along the route.</p>
            </div>
          </div>
          <div className="space-y-6">
             <div className="bg-hc-surface border border-white/5 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Route Intelligence</h3>
                <p className="text-sm text-slate-400 mb-4">Calculate clearances, bridge weight restrictions, and toll constraints before you dispatch.</p>
                <div className="bg-black border border-white/10 rounded-lg p-4 text-center text-sm font-mono text-hc-gold">Valhalla Engine Ready</div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}