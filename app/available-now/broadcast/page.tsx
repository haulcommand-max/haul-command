import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AvailabilityQuickSet from "@/components/capture/AvailabilityQuickSet";
import { Radio, AlertCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BroadcastPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/onboarding?redirect=/available-now/broadcast");
  }

  // Find their primary claimed operator
  const { data: claims } = await supabase
    .from("hc_claims")
    .select("surface_id")
    .eq("user_id", user.id)
    .eq("surface_type", "operator")
    .eq("status", "approved")
    .limit(1);

  const operatorId = claims?.[0]?.surface_id;

  if (!operatorId) {
    return (
      <div className="min-h-screen bg-hc-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-black/40 border border-amber-500/30 rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-black text-white">Unverified Operator</h1>
          <p className="text-slate-400 text-sm">
            You must claim your operator profile and be verified to broadcast capacity on the global feed.
          </p>
          <a href="/directory" className="inline-block mt-4 w-full px-6 py-4 bg-[#C6923A] text-black font-bold uppercase tracking-wider rounded-xl">
            Find Your Profile
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hc-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
            <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-white px-2">Broadcast Capacity</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Alert dispatchers and brokers to your availability.
          </p>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
          <AvailabilityQuickSet operatorId={operatorId} />
          
          <div className="mt-6 pt-6 border-t border-white/5 text-center px-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Updating your status will pin your business to the top of the <a href="/available-now" className="text-[#C6923A] hover:underline">/available-now</a> live feed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
