import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Careers at Haul Command | Join the Heavy Haul Operating System',
  description: 'Build the global operating system for heavy haul. Remote-first roles across engineering, product, data, and growth. Join Haul Command.',
  alternates: { canonical: 'https://www.haulcommand.com/careers' },
};

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-xs text-[#F1A91B] font-bold uppercase tracking-widest mb-4">Careers</div>
        <h1 className="text-4xl font-black mb-4">Build the Operating System for Heavy Haul</h1>
        <p className="text-gray-400 text-lg max-w-xl mb-10">
          Haul Command is a small, fast-moving team building the global intelligence layer for the oversize load industry across 120 countries.
        </p>

        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-8 mb-10">
          <h2 className="text-xl font-black mb-2">We&apos;re early. We&apos;re focused.</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Right now we&apos;re a founder-led team. If you&apos;re interested in the intersection of logistics, AI, and data infrastructure for a market that has never had proper tooling — this is the right place.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            We build: operator directory + load matching, AI dispatch, real-time route intelligence, compliance tooling, and a global certification platform for pilot car professionals.
          </p>
        </div>

        <div className="mb-10">
          <h2 className="text-lg font-black mb-4 text-[#F1A91B]">Open Positions</h2>
          <div className="space-y-3">
            {[
              { title: 'Full-Stack Engineer (Next.js / Supabase)', type: 'Remote', status: 'Actively hiring' },
              { title: 'AI/ML Engineer (LLM Routing, Vector Search)', type: 'Remote', status: 'Actively hiring' },
              { title: 'Growth / SEO Operator', type: 'Remote', status: 'Interest list' },
              { title: 'Heavy Haul Industry Advisor', type: 'Remote / Contract', status: 'Interest list' },
            ].map(role => (
              <div key={role.title} className="bg-[#111827] border border-white/[0.08] rounded-xl p-5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">{role.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{role.type}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${role.status === 'Actively hiring' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                    {role.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <a href="mailto:dev@haulcommand.com?subject=Careers at Haul Command"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F1A91B] hover:bg-[#D4951A] text-black font-bold rounded-xl transition-colors text-sm">
            Send Your Introduction →
          </a>
          <p className="text-xs text-gray-500 mt-4">
            Not seeing your role?{' '}
            <a href="mailto:dev@haulcommand.com?subject=Careers - Open Application" className="text-[#C6923A] hover:underline">Send an open application.</a>
          </p>
        </div>
      </div>
    </div>
  );
}
