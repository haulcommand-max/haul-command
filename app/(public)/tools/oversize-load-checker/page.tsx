import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Oversize Load Checker — Is My Load Oversize? | Haul Command',
  description: 'Check instantly if your load is legally oversize in any US state or 120 countries. Enter width, height, length and get permit and escort requirements.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/oversize-load-checker' },
};

// US state legal limits
const US_LIMITS = { width_ft: 8.5, height_ft: 13.5, length_ft: 65, weight_lbs: 80000 };

const SCHEMA = {
  '@context': 'https://schema.org', '@type': 'WebApplication',
  name: 'Haul Command Oversize Load Checker',
  description: 'Check if your load exceeds legal oversize thresholds by state',
  url: 'https://www.haulcommand.com/tools/oversize-load-checker',
  applicationCategory: 'BusinessApplication',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function OversizeLoadCheckerPage() {
  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />

      {/* Command Surface Hero */}
      <div className="border-b border-[#F1A91B]/10" style={{ background: 'linear-gradient(135deg, #0B0F14 0%, #0f1a24 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-2 text-xs text-[#F1A91B] font-bold uppercase tracking-widest mb-4">
            <Link href="/tools" className="hover:text-white transition-colors">Tools</Link>
            <span>›</span>
            <span>Load Classification</span>
          </div>
          <h1 className="text-4xl font-black mb-3">Oversize Load Checker</h1>
          <p className="text-gray-400 text-lg max-w-xl">Enter your load dimensions to instantly know if you need oversize permits, pilot cars, or special routing — in any US state or 120 countries.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Interactive calculator shell — client component needed for full interactivity */}
        {/* Server-side version shows the decision logic + thresholds */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Threshold reference */}
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="font-black text-white mb-4">US Standard Legal Limits</h2>
            <div className="space-y-3">
              {[
                { label: 'Width', value: '8.5 ft (102 in)', icon: '↔️', trigger: '> 8.5 ft → oversize permit required in all 50 states' },
                { label: 'Height', value: '13.5 ft', icon: '↕️', trigger: '> 13.5 ft → route survey required in most states' },
                { label: 'Length', value: '65 ft', icon: '↔️', trigger: '> 65 ft → rear escort required in most states' },
                { label: 'Gross Weight', value: '80,000 lbs', icon: '⚖️', trigger: '> 80,000 lbs → overweight permit required' },
              ].map(t => (
                <div key={t.label} className="p-3 bg-[#0d1117] rounded-xl border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.icon} {t.label}</span>
                    <span className="text-sm font-black text-[#F1A91B]">{t.value}</span>
                  </div>
                  <p className="text-xs text-gray-500">{t.trigger}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Result calculator — quick reference */}
          <div className="bg-[#111827] border border-[#F1A91B]/20 rounded-2xl p-6">
            <h2 className="font-black text-white mb-4">Quick Classification</h2>
            <p className="text-sm text-gray-400 mb-5">Based on your dimensions, your load falls into one of these categories:</p>
            <div className="space-y-3">
              {[
                { label: 'Standard Legal', range: 'Within all limits', color: '#22c55e', needs: 'No permit required' },
                { label: 'Oversize Class I', range: 'Up to 12 ft wide', color: '#F1A91B', needs: 'Permit + 1 pilot car' },
                { label: 'Oversize Class II', range: 'Up to 14 ft wide', color: '#f97316', needs: 'Permit + 2 pilot cars' },
                { label: 'Superload', range: '> 16 ft wide / 200k lbs', color: '#ef4444', needs: 'Special routing + engineering review' },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-3 p-3 bg-[#0d1117] rounded-xl border border-white/[0.04]">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{c.label}</div>
                    <div className="text-xs text-gray-500">{c.range}</div>
                  </div>
                  <div className="text-xs font-semibold text-gray-400">{c.needs}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-5 border-t border-white/[0.06]">
              <Link href="/tools/escort-count-calculator" className="block text-center py-2.5 bg-[#F1A91B] hover:bg-[#D4951A] text-black font-bold rounded-xl text-sm transition-colors">
                Calculate Escort Count →
              </Link>
            </div>
          </div>
        </div>

        {/* State-by-state context */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 mb-8">
          <h2 className="font-black text-xl mb-4">Why Width Triggers Change by State</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">The 8.5 ft standard is federal, but states add their own escort trigger thresholds. Texas requires a pilot car at 12 ft wide; California requires one at 10 ft; Arizona requires one at 14 ft. Some states require police escorts above 16 ft regardless of permit.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { state: 'TX', pilot_at: '12 ft wide' }, { state: 'CA', pilot_at: '10 ft wide' },
              { state: 'FL', pilot_at: '12 ft wide' }, { state: 'LA', pilot_at: '12 ft wide' },
              { state: 'OH', pilot_at: '12 ft wide' }, { state: 'AZ', pilot_at: '14 ft wide' },
            ].map(s => (
              <div key={s.state} className="p-3 bg-[#0d1117] rounded-xl text-center">
                <div className="text-lg font-black text-[#F1A91B]">{s.state}</div>
                <div className="text-xs text-gray-500 mt-0.5">Pilot car @ {s.pilot_at}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Interlinking */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <h3 className="font-black text-lg mb-2">Next Steps</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { href: '/tools/escort-requirement-checker', label: 'Escort Requirements', icon: '⚖️' },
              { href: '/tools/permit-cost-calculator', label: 'Permit Costs', icon: '📋' },
              { href: '/tools/escort-count-calculator', label: 'Escort Count', icon: '🚗' },
              { href: '/tools/total-trip-cost-calculator', label: 'Total Trip Cost', icon: '💰' },
              { href: '/directory', label: 'Find Escorts', icon: '🔍' },
              { href: '/glossary', label: 'Glossary', icon: '📖' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="flex items-center gap-2 p-3 bg-[#0d1117] hover:bg-[#F1A91B]/5 border border-white/[0.04] hover:border-[#F1A91B]/20 rounded-xl text-xs font-semibold text-gray-400 hover:text-[#F1A91B] transition-all">
                <span>{l.icon}</span>{l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
