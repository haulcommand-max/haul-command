import type { Metadata } from 'next';
import Link from 'next/link';
import { trainingReciprocityMeta } from '@/lib/training/seo';

export const revalidate = 3600;

interface Props { params: Promise<{ geo: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { geo } = await params;
  return trainingReciprocityMeta(geo) as Metadata;
}

export default async function TrainingReciprocityPage({ params }: Props) {
  const { geo } = await params;
  const geoLabel = geo.toUpperCase();

  return (
    <main className="pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-10">
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link href="/training" className="hover:text-white">Training</Link>
          <span>/</span>
          <span className="text-gray-300">Reciprocity — {geoLabel}</span>
        </nav>

        <div className="max-w-3xl mb-10">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-2">Training Reciprocity</div>
          <h1 className="text-3xl font-black text-white mb-3">
            Training Reciprocity &amp; Cross-Jurisdiction Fit for {geoLabel}
          </h1>
          <p className="text-gray-400 leading-relaxed">
            How Haul Command training transfers across jurisdictions when operating in or from {geoLabel}.
            This page covers what is known, what is unclear, and what you should verify directly.
          </p>
        </div>

        {/* Truth-first: known / unknown / what to do */}
        <div className="space-y-4 mb-10">
          <div className="border border-green-500/20 rounded-xl p-5 bg-green-500/5">
            <div className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">What Is Known</div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Haul Command training provides broadly applicable heavy haul escort knowledge.</li>
              <li>Core content is designed to be relevant across U.S., Canadian, Australian, and UK markets.</li>
              <li>Platform badges signal on-platform training completion to brokers globally who use Haul Command.</li>
            </ul>
          </div>

          <div className="border border-yellow-500/20 rounded-xl p-5 bg-yellow-500/5">
            <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">What Is Unclear or Partial</div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Jurisdictional recognition of Haul Command training as a formal legal credential varies and is not guaranteed.</li>
              <li>Cross-border transferability of training completion records is not automatically verified.</li>
              <li>Some state or provincial markets may have specific training requirements not covered by Haul Command training alone.</li>
            </ul>
          </div>

          <div className="border border-blue-500/20 rounded-xl p-5 bg-blue-500/5">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">What To Do Next</div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Check the official transport authority for {geoLabel} for legal escort certification requirements.</li>
              <li>Review the <Link href="/escort-requirements" className="underline text-blue-300 hover:text-white">Escort Requirements</Link> pages for up-to-date jurisdiction rules.</li>
              <li>Contact Haul Command Enterprise for jurisdiction-specific training overlay support.</li>
            </ul>
          </div>
        </div>

        {/* Freshness */}
        <div className="border border-white/5 rounded-xl p-4 mb-10 bg-white/[0.01]">
          <div className="text-xs text-gray-600">
            Reciprocity data for {geoLabel}: <strong className="text-gray-500">Seeded — needs review.</strong>{' '}
            This information reflects our best current understanding. Verify with official sources before making compliance decisions.
          </div>
        </div>

        {/* Related */}
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/training', label: 'All Training' },
            { href: `/training/countries/${geo.toLowerCase()}`, label: `${geoLabel} Training` },
            { href: '/escort-requirements', label: 'Escort Requirements' },
            { href: '/training/enterprise', label: 'Enterprise Plans' },
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
