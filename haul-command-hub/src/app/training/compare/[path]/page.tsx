import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, X } from 'lucide-react';

export const revalidate = 86400;

interface Props { params: Promise<{ path: string }> }

export async function generateStaticParams() {
  return [{ path: 'all' }, { path: 'individual' }, { path: 'team' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path } = await params;
  return {
    title: `Compare Training Plans${path !== 'all' ? ` — ${path}` : ''} | Haul Command`,
    description: 'Compare Haul Command training plans: Road Ready, Certified, Elite, and AV-Ready. See what each tier includes, badge effects, rank weights, and pricing.',
    alternates: { canonical: `https://haulcommand.com/training/compare/${path}` },
  };
}

const COMPARISON_ROWS = [
  { feature: 'Profile badge',        roadReady: true,  certified: true,  elite: true,  avReady: true  },
  { feature: 'Broker-visible badge', roadReady: false, certified: true,  elite: true,  avReady: true  },
  { feature: 'Broker filter eligibility', roadReady: false, certified: true, elite: true, avReady: true },
  { feature: 'Expanded broker trust card', roadReady: false, certified: false, elite: true, avReady: false },
  { feature: 'Directory rank boost', roadReady: '+10%', certified: '+25%', elite: '+45%', avReady: '+35%' },
  { feature: 'Trust weight',         roadReady: '+10%', certified: '+30%', elite: '+50%', avReady: '+35%' },
  { feature: 'Annual renewal req.',  roadReady: false, certified: false, elite: true,  avReady: false  },
  { feature: 'AV escort content',    roadReady: false, certified: false, elite: false, avReady: true   },
  { feature: 'Certificate of completion', roadReady: true, certified: true, elite: true, avReady: true },
  { feature: 'Price',                roadReady: '$49',  certified: '$149', elite: '$29/mo', avReady: '$199' },
];

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-yellow-400 font-bold text-sm">{value}</span>;
  }
  return value
    ? <Check size={16} className="text-green-400 mx-auto" />
    : <X size={16} className="text-gray-600 mx-auto" />;
}

export default async function TrainingComparePage({ params }: Props) {
  const { path } = await params;
  const showTeam = path === 'team';

  return (
    <main className="pb-20">
      <div className="max-w-5xl mx-auto px-4 pt-10">
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link href="/training" className="hover:text-white">Training</Link>
          <span>/</span>
          <span className="text-gray-300">Compare Plans</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Compare Training Plans</h1>
          <p className="text-gray-400">See what each tier includes, badge effects, and rank contributions at a glance.</p>
        </div>

        {/* Compare nav */}
        <div className="flex gap-2 mb-6">
          {[['all', 'All Tiers'], ['individual', 'Individual'], ['team', 'Team & Enterprise']].map(([p, label]) => (
            <Link
              key={p}
              href={`/training/compare/${p}`}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                path === p ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' : 'border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider p-3 border-b border-white/10 w-48">Feature</th>
                {!showTeam && (
                  <>
                    <th className="text-center p-3 border-b border-white/10 text-sm font-bold text-white min-w-[120px]">Road Ready<br /><span className="text-yellow-400 font-black">$49</span></th>
                    <th className="text-center p-3 border-b border-yellow-500/40 bg-yellow-500/5 text-sm font-bold text-white min-w-[120px]">Certified<br /><span className="text-yellow-400 font-black">$149</span></th>
                    <th className="text-center p-3 border-b border-white/10 text-sm font-bold text-white min-w-[120px]">Elite<br /><span className="text-yellow-400 font-black">$29/mo</span></th>
                    <th className="text-center p-3 border-b border-white/10 text-sm font-bold text-white min-w-[120px]">AV-Ready<br /><span className="text-yellow-400 font-black">$199</span></th>
                  </>
                )}
                {showTeam && (
                  <>
                    <th className="text-center p-3 border-b border-white/10 text-sm font-bold text-white min-w-[160px]">Team Plan<br /><span className="text-yellow-400 font-black">$/seat</span></th>
                    <th className="text-center p-3 border-b border-white/10 text-sm font-bold text-white min-w-[160px]">Enterprise<br /><span className="text-yellow-400 font-black">Contract</span></th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-3 text-sm text-gray-400">{row.feature}</td>
                  {!showTeam && (
                    <>
                      <td className="p-3 text-center"><Cell value={row.roadReady} /></td>
                      <td className="p-3 text-center bg-yellow-500/[0.03]"><Cell value={row.certified} /></td>
                      <td className="p-3 text-center"><Cell value={row.elite} /></td>
                      <td className="p-3 text-center"><Cell value={row.avReady} /></td>
                    </>
                  )}
                  {showTeam && (
                    <>
                      <td className="p-3 text-center"><Check size={16} className="text-green-400 mx-auto" /></td>
                      <td className="p-3 text-center"><Check size={16} className="text-green-400 mx-auto" /></td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/training/levels/certified" className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-sm transition-colors">
            Get Certified — $149
          </Link>
          <Link href="/training/levels/elite" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-sm border border-white/10 transition-colors">
            Go Elite — $29/mo
          </Link>
          <Link href="/training/enterprise" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-lg text-sm border border-white/5 transition-colors">
            Team Plans
          </Link>
        </div>

        <p className="mt-4 text-[10px] text-gray-600 leading-relaxed max-w-2xl">
          Haul Command badges are on-platform credentials. Not legal licenses. Rank effects apply within the Haul Command platform and are one signal among several.
        </p>
      </div>
    </main>
  );
}
