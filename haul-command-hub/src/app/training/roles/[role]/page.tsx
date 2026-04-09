import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { trainingRoleMeta } from '@/lib/training/seo';
import TrainingPurchaseCTA from '@/components/training/TrainingPurchaseCTA';
import TrainingEnterpriseStrip from '@/components/training/TrainingEnterpriseStrip';

export const revalidate = 3600;

interface Props { params: Promise<{ role: string }> }

const ROLE_DATA: Record<string, {
  label: string;
  description: string;
  recommendedLevel: string;
  recommendedSlug: string;
  recommendedPrice: number;
  recommendedLabel: string;
  useCases: string[];
}> = {
  'escort-operator': {
    label: 'Escort Operator',
    description: 'Pilot car and escort vehicle operators working the field. Training covers safety, compliance, route survey, and professional conduct.',
    recommendedLevel: 'certified',
    recommendedSlug: 'certified',
    recommendedPrice: 149,
    recommendedLabel: '$149',
    useCases: ['Improve directory rank', 'Earn broker-visible badge', 'Win more loads', 'Professional credentialing'],
  },
  'broker': {
    label: 'Broker / Dispatcher',
    description: 'Brokers and dispatchers who need to verify operator qualifications and build confident, compliant dispatch operations.',
    recommendedLevel: 'team',
    recommendedSlug: 'certified',
    recommendedPrice: 149,
    recommendedLabel: '$149/seat',
    useCases: ['Verify operator training status', 'Filter for certified operators', 'Team compliance dashboard', 'Enterprise reporting'],
  },
  'carrier': {
    label: 'Carrier',
    description: 'Carriers moving oversize loads who need trained escort teams and verifiable compliance records.',
    recommendedLevel: 'team',
    recommendedSlug: 'certified',
    recommendedPrice: 149,
    recommendedLabel: '$149/seat',
    useCases: ['Fleet-wide compliance visibility', 'Team roster tracking', 'Compliance audit exports', 'Badge verification API'],
  },
  'route-surveyor': {
    label: 'Route Surveyor',
    description: 'Professionals conducting pre-move route surveys for oversize and heavy haul transport.',
    recommendedLevel: 'elite',
    recommendedSlug: 'elite',
    recommendedPrice: 29,
    recommendedLabel: '$29/mo',
    useCases: ['Advanced route survey modules', 'Elite badge', 'Maximum rank weight', 'Professional authority signal'],
  },
};

export async function generateStaticParams() {
  return Object.keys(ROLE_DATA).map(role => ({ role }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { role } = await params;
  const data = ROLE_DATA[role];
  if (!data) return { title: 'Training by Role | Haul Command' };
  return trainingRoleMeta(role, data.label) as Metadata;
}

export default async function TrainingRolePage({ params }: Props) {
  const { role } = await params;
  const data = ROLE_DATA[role];
  if (!data) notFound();

  const isTeam = data.recommendedLevel === 'team';

  return (
    <main className="pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link href="/training" className="hover:text-white">Training</Link>
          <span>/</span>
          <span className="text-gray-300">{data.label}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-2">Training for</div>
              <h1 className="text-3xl font-black text-white mb-3">{data.label}</h1>
              <p className="text-gray-400 leading-relaxed text-lg">{data.description}</p>
            </div>

            {/* Use cases */}
            <div>
              <h2 className="text-base font-bold text-white mb-3">Why Train as a {data.label}</h2>
              <div className="space-y-2">
                {data.useCases.map((u) => (
                  <div key={u} className="flex items-center gap-2 p-3 border border-white/5 rounded-lg bg-white/[0.02] text-sm text-gray-300">
                    <span className="text-yellow-400">→</span> {u}
                  </div>
                ))}
              </div>
            </div>

            {/* Other roles */}
            <div>
              <h2 className="text-sm font-bold text-white mb-2">Training by Other Roles</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ROLE_DATA).filter(([k]) => k !== role).map(([k, v]) => (
                  <Link key={k} href={`/training/roles/${k}`} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors">
                    {v.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="sticky top-4 space-y-4">
              {isTeam ? (
                <TrainingEnterpriseStrip variant="compact" />
              ) : (
                <div className="border border-yellow-500/30 rounded-xl p-5 bg-yellow-500/5">
                  <div className="text-xs text-gray-400 mb-1">Recommended for {data.label}</div>
                  <div className="font-bold text-white text-lg mb-1 capitalize">{data.recommendedLevel} Certification</div>
                  <div className="text-2xl font-black text-yellow-400 mb-3">{data.recommendedLabel}</div>
                  <TrainingPurchaseCTA
                    levelSlug={data.recommendedSlug}
                    levelName={data.recommendedLevel}
                    priceUsd={data.recommendedPrice}
                    priceLabel={data.recommendedLabel}
                  />
                </div>
              )}

              <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">All Training</div>
                {(['road-ready', 'certified', 'elite', 'av-ready'] as const).map((s) => (
                  <Link key={s} href={`/training/levels/${s}`} className="flex items-center justify-between py-2 text-sm text-gray-400 hover:text-white transition-colors border-b border-white/5 last:border-0">
                    <span className="capitalize">{s.replace(/-/g, ' ')}</span>
                    <span className="text-yellow-400 text-xs">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
