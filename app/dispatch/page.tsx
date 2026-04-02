import { Metadata } from 'next';
import { fetchDispatchStats } from '@/lib/engines/dispatch-matching';
import DispatchDashboard from './DispatchDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Live Dispatch Control — Haul Command',
  description:
    'Real-time dispatch control center. Match available operators to active loads with intelligent geo-filtering, trust scoring, and capability matching.',
  robots: { index: false, follow: false },
};

export default async function LiveDispatchPage() {
  // Fetch live supply stats from v_dispatch_ready_supply_internal
  const stats = await fetchDispatchStats();

  return <DispatchDashboard stats={stats} />;
}
