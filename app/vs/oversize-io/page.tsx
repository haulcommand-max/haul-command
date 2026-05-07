import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Haul Command vs OverSize.io — Full Comparison 2026',
  description: 'Haul Command vs OverSize.io: global coverage, real-time tools, AI dispatch, and operator intelligence. See why heavy haul professionals switch.',
  alternates: { canonical: 'https://www.haulcommand.com/vs/oversize-io' },
};

export const revalidate = 3600;

const CHECK = <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />;
const CROSS = <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
const PARTIAL = <MinusCircle className="w-4 h-4 text-yellow-500 shrink-0" />;

const ROWS = [
  { feature: 'Global coverage', hc: ['120 countries', CHECK], hh: ['US only', CROSS] },
  { feature: 'Live operator directory', hc: ['7,711+ verified', CHECK], hh: ['Limited', PARTIAL] },
  { feature: 'Real-time availability', hc: ['Live feed', CHECK], hh: ['No', CROSS] },
  { feature: 'Route intelligence', hc: ['51+ corridors', CHECK], hh: ['No', CROSS] },
  { feature: 'Permit cost calculator', hc: ['Free, all states', CHECK], hh: ['No', CROSS] },
  { feature: 'Escort requirements', hc: ['All 50 states + 120 countries', CHECK], hh: ['Partial', PARTIAL] },
  { feature: 'AI dispatch matching', hc: ['VAPI + ElevenLabs', CHECK], hh: ['No', CROSS] },
  { feature: 'Load board', hc: ['Integrated', CHECK], hh: ['Basic', PARTIAL] },
  { feature: 'Operator certification', hc: ['HC Certified, 120 countries', CHECK], hh: ['No', CROSS] },
  { feature: 'Rate intelligence', hc: ['Live market rates', CHECK], hh: ['No', CROSS] },
  { feature: 'Geocoded locations', hc: ['23,530+', CHECK], hh: ['No', CROSS] },
  { feature: 'Standing Orders (escrow)', hc: ['Full escrow', CHECK], hh: ['No', CROSS] },
  { feature: 'Free to list', hc: ['Yes', CHECK], hh: ['Yes', CHECK] },
  { feature: 'Claim profile', hc: ['Free + verified', CHECK], hh: ['Limited', PARTIAL] },
  { feature: 'Mobile app', hc: ['iOS + Android', CHECK], hh: ['No', CROSS] },
];

export default async function VsHeavyHaulersPage() {
  const supabase = createClient();
  const { count: opCount } = await supabase
    .from('hc_global_operators')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      <div className="max-w-4xl mx-auto px-4 py-14">
        <div className="text-xs text-[#F1A91B] font-bold uppercase tracking-widest mb-4">Comparison · 2026</div>
        <h1 className="text-4xl font-black mb-3">Haul Command vs OverSize.io</h1>
        <p className="text-gray-400 mb-10 max-w-xl">
          Both platforms serve the oversize load industry. Only one operates across 120 countries
          with real-time tools, AI dispatch, and {(opCount ?? 7711).toLocaleString()}+ verified operators.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left px-5 py-4 text-gray-400 font-semibold w-1/2">Feature</th>
                <th className="px-5 py-4 text-center">
                  <span className="text-[#F1A91B] font-black">Haul Command</span>
                </th>
                <th className="px-5 py-4 text-center text-gray-500 font-semibold">OverSize.io</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.feature} className={`border-b border-white/[0.05] ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                  <td className="px-5 py-3.5 text-gray-300 font-medium">{row.feature}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      {row.hc[1]}{row.hc[0] && <span className="text-white text-xs">{String(row.hc[0])}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      {row.hh[1]}{row.hh[0] && <span className="text-gray-500 text-xs">{String(row.hh[0])}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 text-center">
          <Link href="/directory" className="inline-flex items-center gap-2 px-8 py-4 bg-[#F1A91B] hover:bg-[#D4951A] text-black font-black rounded-xl transition-colors text-sm">
            Explore {(opCount ?? 7711).toLocaleString()}+ Operators Free →
          </Link>
          <p className="text-xs text-gray-500 mt-3">No credit card. Free forever for operators.</p>
        </div>
      </div>
    </div>
  );
}
