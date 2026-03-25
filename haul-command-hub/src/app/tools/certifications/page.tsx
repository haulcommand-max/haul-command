import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CertificationsClient from './CertificationsClient';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'PEVO & Flagger Certification Finder — WITPAC, WA, UT, CO | Haul Command',
  description:
    'Find approved Pilot Escort Vehicle Operator (PEVO), Flagger, and WITPAC certifications. Compare providers like Evergreen Safety Council (ESC) and state DOTs.',
  openGraph: {
    title: 'PEVO & Flagger Certification Finder | Haul Command',
    description: 'Find approved Pilot Escort Vehicle Operator (PEVO), Flagger, and Specialized (WITPAC) certifications across the US.',
  },
};

export default function CertificationsPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col font-sans selection:bg-accent selection:text-black">
      <Navbar />
      <main className="flex-grow">
        {/* Header Hero */}
        <section className="pt-24 pb-12 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-6xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4">
              <span className="text-accent text-xs font-bold">FREE · VERIFIED PROVIDERS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter mb-3">
              Operator <span className="text-accent">Certification</span> Finder
            </h1>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto">
              Mandatory PEVO, Flagger, and Specialized training programs including WITPAC and Evergreen Safety Council (ESC) courses.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 justify-center">
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                PEVO (Pilot Car)
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                WITPAC & Specialized
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Flagger Training
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Client */}
        <section className="px-4 pb-20">
          <div className="max-w-6xl mx-auto">
            <CertificationsClient />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
