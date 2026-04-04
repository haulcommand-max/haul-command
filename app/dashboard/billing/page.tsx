import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: 'Billing & Subscriptions | Haul Command',
  description: 'Manage your Haul Command monetization layers, active subscriptions, and payment methods.',
};

export default async function BillingDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/billing");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const currentTier = profile?.subscription_tier || "free";

  return (
    <div className="min-h-screen bg-hc-bg text-hc-text pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 border-b border-white/5 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Billing & Monetization</h1>
          <p className="text-slate-400 text-sm">
            Manage your active subscriptions, territory sponsorships, and payment methods.
          </p>
        </div>

        <div className="bg-hc-surface border border-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Current Plan</h2>
          <div className="flex items-center justify-between p-4 bg-hc-bg border border-white/5 rounded-lg mb-6">
            <div>
              <p className="text-sm text-slate-400 mb-1">Active Tier</p>
              <p className="text-xl font-bold text-hc-gold uppercase tracking-wider">{currentTier}</p>
            </div>
            {currentTier === 'free' ? (
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-medium">Limited Access</span>
            ) : (
              <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium border border-green-500/20">Active</span>
            )}
          </div>

          {currentTier === 'free' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-white/5 rounded-lg p-5">
                <h3 className="text-lg font-bold text-white mb-2">Escort Pro</h3>
                <p className="text-sm text-slate-400 mb-4 h-10">Maximize visibility in the operator directory and receive instant dispatch alerts.</p>
                <div className="text-2xl font-bold text-white mb-4">$49<span className="text-sm text-slate-500 font-normal">/mo</span></div>
                <form action="/api/hc-pay/checkout" method="POST">
                   <input type="hidden" name="tier" value="escort_pro" />
                   <button type="submit" className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-md text-sm font-medium transition-colors">
                     Upgrade via Stripe
                   </button>
                </form>
              </div>

              <div className="border border-hc-gold/30 rounded-lg p-5 bg-hc-gold/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-hc-gold text-hc-bg text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-bl-lg">Most Popular</div>
                <h3 className="text-lg font-bold text-hc-gold mb-2">Broker Premium</h3>
                <p className="text-sm text-slate-400 mb-4 h-10">Full access to operator intelligence, automated dispatching, and unlimited routing.</p>
                <div className="text-2xl font-bold text-white mb-4">$199<span className="text-sm text-slate-500 font-normal">/mo</span></div>
                <form action="/api/hc-pay/checkout" method="POST">
                   <input type="hidden" name="tier" value="broker_premium" />
                   <button type="submit" className="w-full py-2 bg-hc-gold hover:bg-[#D4A017] text-hc-bg rounded-md text-sm font-bold transition-colors">
                     Upgrade via Stripe
                   </button>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="bg-hc-surface border border-white/5 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">AdGrid Territory Sponsorships</h2>
          <p className="text-sm text-slate-400 mb-6">You currently have no active territory sponsorships. Secure local leads by sponsoring a state or major corridor.</p>
          <a href="/dashboard/advertiser" className="inline-block px-4 py-2 bg-white/5 border border-white/10 text-white rounded-md text-sm hover:bg-white/10 transition">
            Open AdGrid Command
          </a>
        </div>

      </div>
    </div>
  );
}
