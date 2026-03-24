import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import ToolDisclaimer from '@/components/hc/ToolDisclaimer';
import MultiStateRouteClient from './MultiStateRouteClient';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Multi-State Route Planner & Permit Cost Calculator | Haul Command',
  description: 'Enter your origin and destination to automatically calculate multi-state route requirements, total permit costs, and escort needs for oversize loads.',
};

export default function MultiStateRoutePlanner() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/tools" className="hover:text-accent">Tools</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Multi-State Route Planner</span>
        </nav>

        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4">
            <span className="text-accent text-xs font-bold">⚡ HIGHEST STICKINESS TOOL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter mb-3">
            Multi-State <span className="text-accent">Route Planner</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            Input origin and destination to auto-detect transit states, calculate aggregate permit costs, and determine total escort requirements for your oversize route.
          </p>
        </header>

        <MultiStateRouteClient />

        <div className="mt-8">
          <ToolDisclaimer
            dataSource="Route logic + per-state aggregation based on HC baseline data."
            jurisdiction="US (Lower 48)"
          />
        </div>
      </main>
    </>
  );
}
