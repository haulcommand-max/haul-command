import Link from 'next/link';
import type { Metadata } from 'next';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { getAllJurisdictions } from '@/lib/hc-loaders/requirements';
import { COUNTRIES } from '@/lib/seo-countries';

export const revalidate = 86400;
export const metadata: Metadata = {
  title: 'Escort & Oversize Load Requirements by Country — HAUL COMMAND',
  description: 'Find escort vehicle, pilot car, and oversize load requirements for all jurisdictions across 120 countries. Updated regulations, permit info, and compliance guides.',
};

export default async function RequirementsIndexPage() {
  const jurisdictions = await getAllJurisdictions();
  const countriesWithReqs = COUNTRIES.filter(c =>
    jurisdictions.some((j: any) => j.country_code === c.code)
  );
  const countriesWithout = COUNTRIES.filter(c =>
    !jurisdictions.some((j: any) => j.country_code === c.code)
  );

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[{ label: 'Requirements', href: '/requirements', isCurrent: true }]} />
      <HCLocalIntroCopy
        h1="Oversize Load & Escort Requirements"
        intro="Find pilot car and escort vehicle requirements for every jurisdiction. Regulations, permit thresholds, equipment mandates, and official source links — all in one place."
        badge="120 countries"
      />

      {countriesWithReqs.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-bold text-white mb-4">Countries with Requirements Data</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {countriesWithReqs.map(c => (
              <Link key={c.code} href={`/requirements/${c.slug}`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 hover:border-accent/30 transition-all text-center">
                <span className="text-2xl">{c.flag}</span>
                <p className="text-xs text-gray-300 mt-1 font-medium">{c.name}</p>
                <p className="text-[10px] text-gray-600">
                  {jurisdictions.filter((j: any) => j.country_code === c.code).length} jurisdictions
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {countriesWithout.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-bold text-white mb-4">Coming Soon</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {countriesWithout.map(c => (
              <Link key={c.code} href={`/requirements/${c.slug}`} className="bg-white/[0.02] border border-white/5 rounded-lg p-2 text-center opacity-60 hover:opacity-100 transition-opacity">
                <span className="text-lg">{c.flag}</span>
                <p className="text-[10px] text-gray-500 mt-0.5">{c.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <HCAlertSignupModule context="requirements updates" title="Get Regulation Alerts" />

      <section className="mt-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase mb-3">Also See</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/escort-requirements" className="text-xs text-gray-500 hover:text-accent transition-colors">US Requirements (Legacy)→</Link>
          <Link href="/corridors" className="text-xs text-gray-500 hover:text-accent transition-colors">Corridors →</Link>
          <Link href="/rates" className="text-xs text-gray-500 hover:text-accent transition-colors">Rates →</Link>
          <Link href="/directory" className="text-xs text-gray-500 hover:text-accent transition-colors">Directory →</Link>
        </div>
      </section>
    </main>
  );
}
