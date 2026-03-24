import { Metadata } from 'next';
import { RouteCheckTool } from '@/components/tools/RouteCheckTool';
import { RouteIntelHero } from '@/components/hc-route/RouteIntelHero';
import { GlobalTiersSection } from '@/components/hc-route/GlobalTiersSection';

export const metadata: Metadata = {
  title: 'Global Route Intelligence | Haul Command',
  description: 'Authoritative routing intelligence layer for oversize and overweight transport across 57 countries. Real-time, permit-aware routing guidance.',
};

export default function RouteIntelligenceDashboard() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-500/30 font-sans">
      {/* Premium Hero Section */}
      <RouteIntelHero />

      {/* Main Interactive Tool Section */}
      <section className="relative -mt-10 max-w-4xl mx-auto px-4 pb-20 z-20">
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black">
          <RouteCheckTool />
        </div>
      </section>

      {/* 57 Countries by Tier Framework */}
      <GlobalTiersSection />

      {/* Footer info */}
      <section className="max-w-4xl mx-auto px-4 pb-24 text-center">
        <p className="text-sm text-gray-500">
          Route intelligence powered by Haul Command × Gemini. Data is grounded against live logistics regulatory databases.
        </p>
      </section>
    </div>
  );
}
