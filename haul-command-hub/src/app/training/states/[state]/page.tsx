import type { Metadata } from 'next';
import Link from 'next/link';
import { trainingStateMeta } from '@/lib/training/seo';
import { getTrainingGeoFit } from '@/lib/training/rpc';
import TrainingPurchaseCTA from '@/components/training/TrainingPurchaseCTA';

export const revalidate = 3600;

interface Props { params: Promise<{ state: string }> }

const STATE_NAMES: Record<string, string> = {
  tx: 'Texas', ca: 'California', fl: 'Florida', oh: 'Ohio', il: 'Illinois',
  pa: 'Pennsylvania', ny: 'New York', ga: 'Georgia', nc: 'North Carolina',
  mi: 'Michigan', wa: 'Washington', az: 'Arizona', co: 'Colorado', mn: 'Minnesota',
  la: 'Louisiana', al: 'Alabama', ok: 'Oklahoma', ar: 'Arkansas', ky: 'Kentucky',
  tn: 'Tennessee', mo: 'Missouri', ia: 'Iowa', nd: 'North Dakota', sd: 'South Dakota',
  ne: 'Nebraska', ks: 'Kansas', wv: 'West Virginia', va: 'Virginia', sc: 'South Carolina',
  ms: 'Mississippi', in: 'Indiana', wi: 'Wisconsin', mt: 'Montana', id: 'Idaho',
  wy: 'Wyoming', ut: 'Utah', nv: 'Nevada', nm: 'New Mexico', or: 'Oregon',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const code = state.toLowerCase();
  const name = STATE_NAMES[code] ?? code.toUpperCase();
  return trainingStateMeta(code, name) as Metadata;
}

export default async function TrainingStatePage({ params }: Props) {
  const { state } = await params;
  const code = state.toLowerCase();
  const stateName = STATE_NAMES[code] ?? code.toUpperCase();
  const geoFit = await getTrainingGeoFit('us', code);

  return (
    <main className="pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link href="/training" className="hover:text-white">Training</Link>
          <span>/</span>
          <Link href="/training/countries/us" className="hover:text-white">United States</Link>
          <span>/</span>
          <span className="text-gray-300">{stateName}</span>
        </nav>

        <div className="max-w-3xl mb-8">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-2">State Training</div>
          <h1 className="text-3xl font-black text-white mb-3">
            Pilot Car Training in {stateName}
          </h1>
          <p className="text-gray-400 leading-relaxed">
            Haul Command training for escort operators working in {stateName}. Covers core U.S. heavy haul knowledge applicable to {stateName} operations.
            Always verify current {stateName} state requirements with official sources.
          </p>
        </div>

        {/* State regulations link */}
        <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02] mb-8 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">{stateName} Escort Requirements</div>
            <div className="text-xs text-gray-500">Official state rules, permit thresholds, and curfews</div>
          </div>
          <Link
            href={`/escort-requirements?state=${code}`}
            className="shrink-0 text-xs px-3 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors"
          >
            View Rules →
          </Link>
        </div>

        {/* Geo fit */}
        {geoFit.length > 0 && (
          <div className="space-y-3 mb-8">
            <h2 className="text-base font-bold text-white">Training Fit for {stateName}</h2>
            {geoFit.map((fit) => (
              <div key={fit.id} className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                <div className="text-xs text-yellow-400 font-bold uppercase mb-1">{fit.fit_type} fit</div>
                {fit.note && <p className="text-sm text-gray-400">{fit.note}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Truth-first note */}
        <div className="border border-white/5 rounded-xl p-4 mb-8 bg-white/[0.01]">
          <p className="text-xs text-gray-600 leading-relaxed">
            Haul Command training is an on-platform credential and does not constitute legal licensing in {stateName}.
            {stateName} does not currently have mandatory standardized escort operator certification requirements through Haul Command.
            Check with the {stateName} DOT for any applicable state licensing rules.
          </p>
        </div>

        {/* CTA */}
        <div className="border border-yellow-500/30 rounded-xl p-6 bg-yellow-500/5 mb-8">
          <div className="font-bold text-white mb-1">Train for {stateName} Operations</div>
          <div className="text-sm text-gray-400 mb-4">
            Core certification covers U.S. requirements including {stateName}-relevant content.
          </div>
          <TrainingPurchaseCTA levelSlug="certified" levelName="Certified" priceUsd={149} priceLabel="$149" />
        </div>

        {/* Related */}
        <div className="flex flex-wrap gap-2">
          {[
            { href: `/directory/us`, label: 'U.S. Directory' },
            { href: `/training/countries/us`, label: 'U.S. Training Overview' },
            { href: `/tools/permit-checker/us`, label: 'Permit Checker' },
            { href: '/training', label: 'All Training' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
