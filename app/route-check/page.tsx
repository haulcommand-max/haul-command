import { Metadata } from 'next';
import { RouteCheckTool } from '@/components/tools/RouteCheckTool';

export const metadata: Metadata = {
  title: 'Free Route Check Tool — Oversize Load Regulations | Haul Command',
  description: 'Get instant answers on oversize and overweight load regulations, pilot car requirements, and permits for any US state or country. Free AI-powered route intelligence.',
};

export default function RouteCheckPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <section className="py-16 px-4 text-center">
        <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full mb-6">
          Free Tool
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Route Check
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto">
          Ask any question about oversize load regulations, pilot car requirements,
          or permit requirements. Real-time answers, no login required.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-16">
        <RouteCheckTool />
      </section>

      {/* SEO: example questions */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-lg font-bold mb-4 text-gray-400">Popular questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Do I need a pilot car for a 15ft wide load in Texas?',
            'What are the oversize load hours in California?',
            'How many escorts does a 14ft 6in load need in Oklahoma?',
            'Can I run oversize loads on weekends in Florida?',
            'What permits do I need to move a 200-ton crane in Ohio?',
            'Do autonomous trucks need escort vehicles in Texas?',
            'What is the max load height without a permit in Canada?',
            'Oilfield rig move regulations in New Mexico',
          ].map((q) => (
            <a
              key={q}
              href={`/route-check?q=${encodeURIComponent(q)}`}
              className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:border-amber-500/30 hover:text-white transition-all"
            >
              {q}
            </a>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-6 text-center">
          Powered by Haul Command × Gemini. For verified permits, use{' '}
          <a href="/directory" className="text-amber-400 hover:underline">Find an Operator</a>.
        </p>
      </section>
    </div>
  );
}
