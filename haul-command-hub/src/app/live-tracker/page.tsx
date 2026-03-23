import Navbar from '@/components/Navbar';
import LiveVehicleMap from '@/components/motive/LiveVehicleMap';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Pilot Tracker — Real-Time Vehicle Positions | Haul Command',
  description:
    'Track escort vehicles in real time. ELD-verified positions from Motive plus phone GPS from pilots on standby. Know who\'s near your run before you post it.',
};

export default function LiveTrackerPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter mb-3">
            Live <span className="text-accent">Pilot Tracker</span>
          </h1>
          <p className="text-[#b0b0b0] text-base sm:text-lg max-w-2xl">
            Real-time positions from ELD-verified vehicles and phone GPS.
            See who's rolling, who's on standby, and who's closest to your run.
          </p>
        </header>

        {/* Live Map */}
        <LiveVehicleMap
          radiusMiles={100}
          refreshInterval={30}
          height="550px"
        />

        {/* Intel Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <h3 className="text-white text-sm font-bold">ELD Verified</h3>
            </div>
            <p className="text-gray-400 text-xs">
              Green dots = real-time positions from Motive-connected ELD devices.
              Verified location, speed, heading, and HOS hours remaining.
            </p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h3 className="text-white text-sm font-bold">Phone GPS</h3>
            </div>
            <p className="text-gray-400 text-xs">
              Blue dots = self-reported positions from pilot phones.
              Updated every 30 seconds when the pilot is running.
            </p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-accent text-sm">📡</span>
              <h3 className="text-white text-sm font-bold">Dual-Source Intel</h3>
            </div>
            <p className="text-gray-400 text-xs">
              Motive data wins when both sources report for the same pilot.
              Phone GPS fills in for non-ELD operators.
              Zero duplicate dots.
            </p>
          </div>
        </div>

        {/* Connect CTA */}
        <div className="mt-8 bg-gradient-to-r from-accent/5 to-blue-500/5 border border-accent/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">Want your dot on the map?</h3>
            <p className="text-gray-400 text-sm">
              Connect your Motive ELD for verified positioning, or enable phone GPS to show up for nearby brokers.
              Verified pilots get priority run matching.
            </p>
          </div>
          <a
            href="/onboarding/motive-connect"
            className="bg-accent hover:bg-accent/90 text-black font-bold text-sm px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
          >
            Connect ELD →
          </a>
        </div>
      </main>
    </>
  );
}
