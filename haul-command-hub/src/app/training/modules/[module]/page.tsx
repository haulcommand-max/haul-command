import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, ArrowLeft, BookOpen } from 'lucide-react';
import { getTrainingModuleBySlug, getAllTrainingModuleSlugs } from '@/lib/training/rpc';
import { trainingModuleMeta } from '@/lib/training/seo';
import TrainingPurchaseCTA from '@/components/training/TrainingPurchaseCTA';

export const revalidate = 3600;

interface Props { params: Promise<{ module: string }> }

export async function generateStaticParams() {
  try {
    const slugs = await getAllTrainingModuleSlugs();
    return slugs.map(s => ({ module: s }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { module: slug } = await params;
  const mod = await getTrainingModuleBySlug(slug);
  if (!mod) return { title: 'Training Module | Haul Command' };
  return trainingModuleMeta(mod) as Metadata;
}

export default async function TrainingModulePage({ params }: Props) {
  const { module: slug } = await params;
  const mod = await getTrainingModuleBySlug(slug);
  if (!mod) notFound();

  return (
    <main className="pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link href="/training" className="hover:text-white">Training</Link>
          <span>/</span>
          <Link href="/training/modules" className="hover:text-white">Modules</Link>
          <span>/</span>
          <span className="text-gray-300">{mod.title}</span>
        </nav>

        <Link href="/training" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={12} /> Back to Training
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <BookOpen size={12} />
                  Training Module
                </div>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  {mod.hours}h
                </div>
              </div>
              <h1 className="text-3xl font-black text-white mb-3">{mod.title}</h1>
              {mod.summary && (
                <p className="text-gray-400 text-lg leading-relaxed">{mod.summary}</p>
              )}
            </div>

            {/* Related resources */}
            <div>
              <h2 className="text-base font-bold text-white mb-3">Related Resources</h2>
              <div className="flex flex-wrap gap-2">
                {[
                  { href: '/escort-requirements', label: 'Escort Requirements' },
                  { href: '/tools/permit-checker/us', label: 'Permit Checker' },
                  { href: '/tools/escort-rules/us', label: 'Escort Rules' },
                  { href: '/glossary', label: 'Glossary' },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="sticky top-4">
              <div className="border border-yellow-500/30 rounded-xl p-5 bg-yellow-500/5 mb-4">
                <div className="text-xs text-gray-400 mb-1">This module is part of</div>
                <div className="font-bold text-white mb-3">Certified Training Path</div>
                <TrainingPurchaseCTA
                  levelSlug="certified"
                  levelName="Certified"
                  priceUsd={149}
                  priceLabel="$149"
                />
              </div>

              <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Module Details</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration</span>
                    <span className="text-gray-300">{mod.hours} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Format</span>
                    <span className="text-gray-300">Self-paced</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
