"use client";

import { Crown, Zap, ShieldCheck, Fuel, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RewardsCenterCard({ operatorId, trustScore }: { operatorId: string, trustScore: number }) {
  const [tier, setTier] = useState<any>(null);

  useEffect(() => {
    async function fetchTier() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('operator_reward_tiers')
        .select('*')
        .lte('min_trust_score', trustScore)
        .order('min_trust_score', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setTier(data);
      }
    }
    fetchTier();
  }, [trustScore]);

  if (!tier) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 text-emerald-500/10">
        <Crown size={120} />
      </div>

      <div className="flex items-center space-x-3 mb-6 relative">
        <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg">
          <Crown className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-head text-white tracking-tight">
            {tier.tier_name} Operator
          </h2>
          <p className="text-sm text-gray-400">Trust Score: {trustScore} / 100</p>
        </div>
      </div>

      <div className="space-y-4 relative">
        <h3 className="text-sm uppercase tracking-wider font-semibold text-gray-500 mb-2">Unlocked Perks</h3>
        
        {tier.early_load_access_mins > 0 ? (
          <div className="flex items-start space-x-3 bg-gray-950 p-4 rounded-lg border border-gray-800">
             <Clock className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
             <div>
               <p className="font-semibold text-white">Early Load Access</p>
               <p className="text-sm text-gray-400">You see premium heavy haul loads {tier.early_load_access_mins} minutes before standard operators.</p>
             </div>
          </div>
        ) : (
          <div className="flex items-start space-x-3 bg-gray-950/50 p-4 rounded-lg border border-gray-800/50 grayscale opacity-60">
             <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
             <div>
               <p className="font-semibold text-gray-400">Early Load Access <span className="text-xs bg-gray-900 px-2 py-0.5 rounded text-gray-500 ml-2">LOCKED</span></p>
               <p className="text-sm text-gray-500">Reach Silver tier to unlock early load bidding.</p>
             </div>
          </div>
        )}

        {tier.fuel_discount_enabled ? (
          <div className="flex items-start space-x-3 bg-gray-950 p-4 rounded-lg border border-gray-800">
             <Fuel className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
             <div>
               <p className="font-semibold text-white">Fuel Network Discounts</p>
               <p className="text-sm text-gray-400">Cash price savings at over 1,400 partner locations.</p>
             </div>
          </div>
        ) : (
          <div className="flex items-start space-x-3 bg-gray-950/50 p-4 rounded-lg border border-gray-800/50 grayscale opacity-60">
             <Fuel className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
             <div>
               <p className="font-semibold text-gray-400">Fuel Network Discounts <span className="text-xs bg-gray-900 px-2 py-0.5 rounded text-gray-500 ml-2">LOCKED</span></p>
               <p className="text-sm text-gray-500">Reach Gold tier to unlock fuel discounts.</p>
             </div>
          </div>
        )}

        <div className="flex items-start space-x-3 bg-gray-950 p-4 rounded-lg border border-gray-800">
             <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
             <div>
               <p className="font-semibold text-white">Instant Escrow Processing</p>
               <p className="text-sm text-gray-400">Standard payout in 21 days or Instant via Haul Pay.</p>
             </div>
        </div>

      </div>

      <div className="mt-6 pt-6 border-t border-gray-800 text-center">
        <button className="text-emerald-400 hover:text-emerald-300 font-semibold text-sm tracking-wide transition-colors">
          VIEW FULL REWARDS SCHEDULE →
        </button>
      </div>
    </div>
  );
}
