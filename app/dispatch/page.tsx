import { Metadata } from 'next';
import { fetchDispatchStats } from '@/lib/engines/dispatch-matching';
import DispatchDashboard from './DispatchDashboard';
import { PaywallGateBanner } from '@/components/monetization/PaywallBanner';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Live Dispatch Control â€” Haul Command',
  description:
    'Real-time dispatch control center. Match available operators to active loads with intelligent geo-filtering, trust scoring, and capability matching.',
  robots: { index: false, follow: false },
};

export default async function LiveDispatchPage() {
  // Fetch live supply stats from v_dispatch_ready_supply_internal
  const stats = await fetchDispatchStats();

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <PaywallGateBanner
          surfaceName="Dispatch Control"
          tier="Business"
          description="Unlock unlimited dispatch operations, supply chain analytics, and priority operator matching across 120 countries."
        />
      </div>
      <DispatchDashboard stats={stats} />
    </>
  );
}