import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Escort Count Calculator — How Many Pilot Cars? | Haul Command',
  description: 'Calculate exactly how many pilot cars your oversize load legally requires. Based on width, height, length, and state-by-state requirements.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/escort-count-calculator' },
};

const RULES = [
  { condition: 'Up to 12 ft wide', lead: 0, chase: 0, note: 'Most states: no escort required under 12 ft' },
  { condition: '12–14 ft wide', lead: 1, chase: 0, note: 'Lead car required. Some states require rear too.' },
  { condition: '14–16 ft wide', lead: 1, chase: 1, note: 'Lead + chase required in nearly all states' },
  { condition: 'Over 16 ft wide', lead: 1, chase: 1, note: 'Lead + chase + possible police escort required' },
  { condition: 'Height > 16 ft', lead: 1, chase: 0, note: 'Height pole car required (counts as lead)' },
  { condition: 'Length > 100 ft', lead: 1, chase: 1, note: 'Front and rear escorts required in most states' },
];

export default function EscortCountCalculatorPage() {
  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      <div className="border-b border-[#F1A91B]/10" style={{ background: 'linear-gradient(135deg, #0B0F14 0%, #0f1a24 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-2 text-xs text-[#F1A91B] font-bold uppercase tracking-widest mb-4">
            <Link href="/tools" className="hover:text-white transition-colors">Tools</Link>
            <span>›</span><span>Escort Intelligence</span>
          </div>
          <h1 className="text-4xl font-black mb-3">Escort Count Calculator</h1>
          <p className="text-gray-400 text-lg max-w-xl">How many pilot cars does your load legally require? Reference guide for all standard US configurations by width, height, and length.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Escort requirement matrix */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 mb-6">
          <h2 className="font-black text-xl mb-5">Standard Escort Requirements by Dimension</h2>
          <div className="space-y-3">
            {RULES.map(r => (
              <div key={r.condition} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-[#0d1117] rounded-xl border border-white/[0.04] items-center">
                <div className="font-bold text-[#F1A91B] text-sm">{r.condition}</div>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${r.lead > 0 ? 'bg-[#F1A91B] text-black' : 'bg-white/10 text-gray-500'}`}>{r.lead}</span>
                  <span className="text-xs text-gray-500">Lead</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${r.chase > 0 ? 'bg-[#F1A91B] text-black' : 'bg-white/10 text-gray-500'}`}>{r.chase}</span>
                  <span className="text-xs text-gray-500">Chase</span>
                </div>
                <div className="text-xs text-gray-500 leading-relaxed">{r.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Special cases */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5">
            <h3 className="font-black mb-3 text-[#F1A91B]">Height Pole Cars</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Required when load exceeds 14.5 ft in most states. The height pole car travels ahead testing bridge and utility clearances. Counts as the lead escort.</p>
            <Link href="/tools/oversize-load-checker" className="inline-block mt-3 text-xs font-bold text-[#C6923A] hover:underline">Check height requirements →</Link>
          </div>
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5">
            <h3 className="font-black mb-3 text-[#F1A91B]">Police Escorts</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Typically required above 16 ft wide or through metro areas. Some states (TX, LA) require police for extreme loads above 18 ft. Billed per hour, not per day.</p>
            <Link href="/escort-requirements" className="inline-block mt-3 text-xs font-bold text-[#C6923A] hover:underline">State requirements →</Link>
          </div>
        </div>

        {/* Cost estimator CTA */}
        <div className="bg-gradient-to-r from-[#0B0F14] to-[#0f1a24] border border-[#F1A91B]/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-black text-lg">Know Your Escort Count?</div>
            <p className="text-sm text-gray-400 mt-1">Calculate the full trip cost including escorts, permits, and fuel.</p>
          </div>
          <Link href="/tools/total-trip-cost-calculator" className="shrink-0 px-5 py-2.5 bg-[#F1A91B] hover:bg-[#D4951A] text-black font-bold rounded-xl text-sm transition-colors">
            Total Trip Cost →
          </Link>
        </div>

        {/* Interlinking */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { href: '/tools/oversize-load-checker', label: 'Oversize Checker', icon: '📏' },
            { href: '/tools/permit-cost-calculator', label: 'Permit Costs', icon: '📋' },
            { href: '/directory', label: 'Find Escorts', icon: '🔍' },
            { href: '/training', label: 'Get Certified', icon: '🎓' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="flex items-center gap-2 p-3 bg-[#111827] hover:bg-[#F1A91B]/5 border border-white/[0.06] hover:border-[#F1A91B]/20 rounded-xl text-xs font-semibold text-gray-400 hover:text-[#F1A91B] transition-all">
              <span>{l.icon}</span>{l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
