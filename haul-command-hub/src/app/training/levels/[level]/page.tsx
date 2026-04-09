import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, TrendingUp, Shield, ArrowLeft } from 'lucide-react';
import { getTrainingLevelBySlug, getAllTrainingLevelSlugs, getTrainingPagePayload } from '@/lib/training/rpc';
import { trainingLevelMeta, trainingCourseJsonLd } from '@/lib/training/seo';
import { formatTrainingPrice } from '@/lib/training/mappers';
import { BADGE_META } from '@/lib/training/types';
import { BADGE_REQUIREMENTS, BADGE_DISCLAIMER } from '@/lib/training/badges';
import TrainingPurchaseCTA from '@/components/training/TrainingPurchaseCTA';
import TrainingRankBenefits from '@/components/training/TrainingRankBenefits';
import TrainingEnterpriseStrip from '@/components/training/TrainingEnterpriseStrip';

export const revalidate = 3600;

interface Props { params: Promise<{ level: string }> }

export async function generateStaticParams() {
  try {
    const slugs = await getAllTrainingLevelSlugs();
    return slugs.map(s => ({ level: s }));
  } catch {
    return [
      { level: 'road-ready' }, { level: 'certified' },
      { level: 'elite' }, { level: 'av-ready' },
    ];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { level: slug } = await params;
  const level = await getTrainingLevelBySlug(slug);
  if (!level) return { title: 'Training Level | Haul Command' };
  return trainingLevelMeta(level) as Metadata;
}

export default async function TrainingLevelPage({ params }: Props) {
  const { level: slug } = await params;
  const level = await getTrainingLevelBySlug(slug);

  // Graceful static fallback when DB not yet seeded
  const STATIC_LEVELS: Record<string, {
    level_slug: string; level_name: string; description: string;
    badge_slug: 'road_ready' | 'certified' | 'elite' | 'av_ready';
    rank_weight: number; trust_weight: number;
    pricing_json: { one_time?: number; subscription?: number; period?: string; currency: string };
  }> = {
    'road-ready': {
      level_slug: 'road-ready', level_name: 'Road Ready',
      description: 'Foundational training for all heavy haul escort operators. Master compliance, safety, and operations basics.',
      badge_slug: 'road_ready', rank_weight: 0.10, trust_weight: 0.10,
      pricing_json: { one_time: 49, currency: 'usd' },
    },
    'certified': {
      level_slug: 'certified', level_name: 'Certified',
      description: 'Core certification path. Unlock broker-visible badge, higher directory ranking, and filter eligibility.',
      badge_slug: 'certified', rank_weight: 0.25, trust_weight: 0.30,
      pricing_json: { one_time: 149, currency: 'usd' },
    },
    'elite': {
      level_slug: 'elite', level_name: 'Elite',
      description: 'Advanced mastery. Premium badge, expanded broker trust card, maximum rank weighting, and annual verification.',
      badge_slug: 'elite', rank_weight: 0.45, trust_weight: 0.50,
      pricing_json: { subscription: 29, period: 'month', currency: 'usd' },
    },
    'av-ready': {
      level_slug: 'av-ready', level_name: 'AV-Ready',
      description: 'Autonomous vehicle escort specialist. Category-specific search weighting and enterprise visibility.',
      badge_slug: 'av_ready', rank_weight: 0.35, trust_weight: 0.35,
      pricing_json: { one_time: 199, currency: 'usd' },
    },
  };

  const data = level ?? STATIC_LEVELS[slug];
  if (!data) notFound();

  const meta = BADGE_META[data.badge_slug];
  const requirements = BADGE_REQUIREMENTS[data.badge_slug] ?? [];
  const priceLabel = formatTrainingPrice(data.pricing_json);
  const priceUsd = data.pricing_json.one_time ?? data.pricing_json.subscription ?? 49;

  const catalog = await getTrainingPagePayload(slug.replace('-', '-'));

  const jsonLd = catalog
    ? trainingCourseJsonLd(catalog.training, data)
    : null;

  return (
    <main className="pb-20">
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      <div className="max-w-7xl mx-auto px-4 pt-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/training" className="hover:text-white transition-colors">Training</Link>
          <span>/</span>
          <span className="text-gray-300">{data.level_name}</span>
        </nav>

        <Link href="/training" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={12} /> Back to Training
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border text-yellow-400 border-yellow-400/30 bg-yellow-400/10">
                  {meta?.label ?? data.badge_slug} Badge
                </span>
                <span className="text-xs text-gray-500">Level {meta?.level ?? '—'}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-3">{data.level_name} Certification</h1>
              <p className="text-gray-400 text-lg leading-relaxed">{data.description}</p>
            </div>

            {/* Badge meaning */}
            <div className="border border-white/10 rounded-xl p-5 bg-white/[0.02]">
              <h2 className="font-bold text-white mb-2 text-sm uppercase tracking-wider">What This Badge Means</h2>
              <p className="text-sm text-gray-400 leading-relaxed">{meta?.description}</p>
              <p className="text-[11px] text-gray-600 mt-3 leading-relaxed">{BADGE_DISCLAIMER}</p>
            </div>

            {/* Requirements */}
            {requirements.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4">What&apos;s Required</h2>
                <div className="space-y-2">
                  {requirements.map((r) => (
                    <div key={r} className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                      <Check size={15} className="text-green-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-300">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modules from catalog */}
            {catalog?.modules && catalog.modules.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4">
                  Modules ({catalog.modules.length})
                </h2>
                <div className="space-y-2">
                  {catalog.modules.map((m, i) => (
                    <Link
                      key={m.slug}
                      href={`/training/modules/${m.slug}`}
                      className="flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-all group"
                    >
                      <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-gray-400 shrink-0 mt-0.5 group-hover:bg-yellow-500/20 group-hover:text-yellow-400 transition-colors">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm group-hover:text-yellow-400 transition-colors">{m.title}</div>
                        {m.summary && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{m.summary}</div>}
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{m.hours}h</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Rank + trust effects */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Rank &amp; Trust Effects</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <TrendingUp size={14} /> Rank Boost
                  </div>
                  <div className="text-3xl font-black text-green-400">+{(data.rank_weight * 100).toFixed(0)}%</div>
                  <div className="text-xs text-gray-500 mt-1">of rank weight</div>
                </div>
                <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <Shield size={14} /> Trust Weight
                  </div>
                  <div className="text-3xl font-black text-blue-400">+{(data.trust_weight * 100).toFixed(0)}%</div>
                  <div className="text-xs text-gray-500 mt-1">trust contribution</div>
                </div>
              </div>
              <TrainingRankBenefits currentBadge={data.badge_slug} />
            </div>

            {/* Related links */}
            <div>
              <h2 className="text-base font-bold text-white mb-3">Related</h2>
              <div className="flex flex-wrap gap-2">
                {[
                  { href: '/escort-requirements', label: 'Escort Requirements' },
                  { href: '/tools/permit-checker/us', label: 'Permit Checker' },
                  { href: '/glossary', label: 'Glossary' },
                  { href: '/directory', label: 'Directory' },
                  { href: '/claim', label: 'Claim Profile' },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar — purchase */}
          <div className="space-y-6">
            <div className="sticky top-4 space-y-5">
              {/* Price card */}
              <div className="border border-yellow-500/30 rounded-xl p-6 bg-yellow-500/5">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Enroll Today</div>
                <div className="text-3xl font-black text-white mb-1">{priceLabel}</div>
                {data.pricing_json.annual_refresh && (
                  <div className="text-xs text-gray-500 mb-4">
                    ${data.pricing_json.annual_refresh}/yr refresh
                  </div>
                )}
                <TrainingPurchaseCTA
                  levelSlug={data.level_slug}
                  levelName={data.level_name}
                  priceUsd={priceUsd}
                  priceLabel={priceLabel}
                />
              </div>

              {/* What you get */}
              <div className="border border-white/10 rounded-xl p-5 bg-white/[0.02]">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">What You Get</div>
                <div className="space-y-2">
                  {[
                    `${meta?.label} badge on your profile`,
                    'Improved directory search rank',
                    'Broker trust visibility',
                    data.badge_slug === 'certified' || data.badge_slug === 'elite' ? 'Broker filter eligibility' : null,
                    data.badge_slug === 'elite' ? 'Expanded broker trust card' : null,
                    'Certificate of completion',
                  ].filter(Boolean).map((item) => (
                    <div key={item as string} className="flex items-center gap-2 text-xs text-gray-300">
                      <Check size={12} className="text-green-400 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* All levels */}
              <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">All Levels</div>
                {(['road-ready', 'certified', 'elite', 'av-ready'] as const).map((s) => {
                  const isActive = s === slug;
                  return (
                    <Link
                      key={s}
                      href={`/training/levels/${s}`}
                      className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm mb-1 transition-colors ${
                        isActive ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="capitalize">{s.replace(/-/g, ' ')}</span>
                      {isActive && <span className="text-[10px]">Current</span>}
                    </Link>
                  );
                })}
              </div>

              <TrainingEnterpriseStrip variant="compact" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
