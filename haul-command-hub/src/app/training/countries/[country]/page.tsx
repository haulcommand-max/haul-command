import type { Metadata } from 'next';
import Link from 'next/link';
import { trainingCountryMeta } from '@/lib/training/seo';
import { getTrainingGeoFit } from '@/lib/training/rpc';
import TrainingEnterpriseStrip from '@/components/training/TrainingEnterpriseStrip';
import TrainingPurchaseCTA from '@/components/training/TrainingPurchaseCTA';

export const revalidate = 3600;

interface Props { params: Promise<{ country: string }> }

const COUNTRY_NAMES: Record<string, string> = {
  us: 'United States', ca: 'Canada', au: 'Australia', gb: 'United Kingdom',
  de: 'Germany', fr: 'France', ae: 'UAE', za: 'South Africa',
  nz: 'New Zealand', nl: 'Netherlands', br: 'Brazil', mx: 'Mexico',
};

const COUNTRY_CONTEXT: Record<string, string> = {
  us: 'U.S. heavy haul operations require state-specific permits and escort rules that vary significantly by state. Haul Command training covers core federal and state-level knowledge.',
  ca: 'Canadian heavy haul operations are governed by provincial and territorial rules. Haul Command training includes Canadian escort standards and cross-border considerations.',
  au: 'Australian oversize transport (OSOM/OSOM+) is governed by state and territory authorities. Haul Command training addresses Australian-relevant content alongside global standards.',
  gb: 'UK abnormal loads require escort and movement orders. Haul Command training covers UK-relevant compliance knowledge alongside global content.',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const name = COUNTRY_NAMES[country.toLowerCase()] ?? country.toUpperCase();
  return trainingCountryMeta(country, name) as Metadata;
}

export default async function TrainingCountryPage({ params }: Props) {
  const { country } = await params;
  const code = country.toLowerCase();
  const countryName = COUNTRY_NAMES[code] ?? code.toUpperCase();
  const geoFit = await getTrainingGeoFit(code);
  const context = COUNTRY_CONTEXT[code];

  return (
    <main className="pb-20">
      <div className="max-w-5xl mx-auto px-4 pt-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link href="/training" className="hover:text-white">Training</Link>
          <span>/</span>
          <span className="text-gray-300">{countryName}</span>
        </nav>

        <div className="max-w-3xl mb-10">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-2">
            Country Training Fit
          </div>
          <h1 className="text-3xl font-black text-white mb-3">
            Heavy Haul Training in {countryName}
          </h1>
          <p className="text-gray-400 leading-relaxed">
            {context ?? `Haul Command training applies globally. For ${countryName}, training covers core heavy haul escort knowledge with notes on local fit where available.`}
          </p>
        </div>

        {/* Geo fit results */}
        {geoFit.length > 0 ? (
          <div className="space-y-3 mb-10">
            <h2 className="text-lg font-bold text-white">Training Fit for {countryName}</h2>
            {geoFit.map((fit) => (
              <div key={fit.id} className={`border rounded-xl p-4 ${
                fit.fit_type === 'full' ? 'border-green-500/30 bg-green-500/5' :
                fit.fit_type === 'partial' ? 'border-yellow-500/30 bg-yellow-500/5' :
                'border-white/10 bg-white/[0.02]'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    fit.fit_type === 'full' ? 'text-green-400' :
                    fit.fit_type === 'partial' ? 'text-yellow-400' : 'text-gray-400'
                  }`}>
                    {fit.fit_type} fit
                  </span>
                  <span className="text-xs text-gray-500">
                    · {fit.confidence_state.replace(/_/g, ' ')}
                  </span>
                </div>
                {fit.note && <p className="text-sm text-gray-300">{fit.note}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-white/10 rounded-xl p-5 bg-white/[0.02] mb-10">
            <div className="text-sm text-gray-400">
              Country-specific training fit data for {countryName} is being compiled.
              Core Haul Command training is globally applicable for heavy haul escort knowledge.
            </div>
          </div>
        )}

        {/* Truth-first disclaimer */}
        <div className="border border-white/5 rounded-xl p-4 mb-10 bg-white/[0.01]">
          <div className="text-xs text-gray-600 leading-relaxed">
            <strong className="text-gray-500">Important:</strong> Haul Command badges are on-platform credentials.
            They do not constitute legal certification or jurisdictional recognition in {countryName} unless explicitly stated.
            Always verify local legal requirements with the relevant {countryName} authority.
            For regulations in {countryName}, see{' '}
            <Link href="/escort-requirements" className="underline hover:text-gray-400">Escort Requirements</Link>.
          </div>
        </div>

        {/* CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          <div className="border border-yellow-500/30 rounded-xl p-5 bg-yellow-500/5">
            <div className="font-bold text-white mb-1">Get Certified</div>
            <div className="text-sm text-gray-400 mb-4">Core certification — globally applicable, broker-visible badge.</div>
            <TrainingPurchaseCTA levelSlug="certified" levelName="Certified" priceUsd={149} priceLabel="$149" />
          </div>
          <div className="border border-white/10 rounded-xl p-5 bg-white/[0.02]">
            <div className="font-bold text-white mb-1">Start Free</div>
            <div className="text-sm text-gray-400 mb-4">Road Ready — foundational training for any market.</div>
            <TrainingPurchaseCTA levelSlug="road-ready" levelName="Road Ready" priceUsd={49} priceLabel="$49" variant="secondary" />
          </div>
        </div>

        <TrainingEnterpriseStrip variant="compact" />

        {/* Related links */}
        <div className="mt-8">
          <div className="flex flex-wrap gap-2">
            {[
              { href: `/directory/${code}`, label: `${countryName} Directory` },
              { href: '/escort-requirements', label: 'Escort Requirements' },
              { href: `/training/reciprocity/${code}`, label: 'Reciprocity Notes' },
              { href: '/training', label: 'All Training' },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
