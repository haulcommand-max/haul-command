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
  description: 'Escort vehicle, pilot car, and oversize load requirements for 120 countries. Updated regulations, permit thresholds, escort triggers, curfews, and official source links.',
};

export default async function RequirementsIndexPage() {
  let jurisdictions: any[] = [];
  try {
    jurisdictions = await getAllJurisdictions();
  } catch {
    jurisdictions = [];
  }

  const countriesWithReqs = COUNTRIES.filter(c =>
    jurisdictions.some((j: any) => j.country_code === c.code)
  );
  const countriesWithout = COUNTRIES.filter(c =>
    !jurisdictions.some((j: any) => j.country_code === c.code)
  );

  // Market status taxonomy
  const tierA = ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'NL', 'AE', 'BR'];
  const tierB = ['IE', 'SE', 'NO', 'DK', 'FI', 'BE', 'AT', 'CH', 'ES', 'FR', 'IT', 'PT', 'SA', 'QA', 'MX', 'IN', 'ID', 'TH'];

  const getStatus = (code: string) => {
    if (countriesWithReqs.some(c => c.code === code)) return 'live';
    if (tierA.includes(code)) return 'requirements-ready';
    if (tierB.includes(code)) return 'directory-seeded';
    return 'mapped';
  };

  const statusLabels: Record<string, { label: string; color: string; badge: string }> = {
    'live': { label: 'Requirements data available', color: 'text-green-400 border-green-500/30 bg-green-500/10', badge: 'Live' },
    'requirements-ready': { label: 'Requirements being verified', color: 'text-accent border-accent/30 bg-accent/10', badge: 'Verifying' },
    'directory-seeded': { label: 'Directory seeded, requirements pending', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10', badge: 'Seeded' },
    'mapped': { label: 'Market mapped, data pending', color: 'text-gray-400 border-white/10 bg-white/[0.03]', badge: 'Mapped' },
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[{ label: 'Requirements', href: '/requirements', isCurrent: true }]} />
      <HCLocalIntroCopy
        h1="Oversize Load & Escort Requirements"
        intro="Escort vehicle and pilot car requirements for every jurisdiction. Regulations, permit thresholds, escort triggers, curfews, equipment mandates, and official source links — all in one place."
        badge="120 countries"
      />

      {/* Market Status Legend */}
      <div className="flex flex-wrap gap-3 mb-8">
        {Object.entries(statusLabels).map(([key, s]) => (
          <div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${s.color}`}>
            <span className="w-2 h-2 rounded-full bg-current" />
            {s.badge}
          </div>
        ))}
      </div>

      {countriesWithReqs.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            Live Requirements Data
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {countriesWithReqs.map(c => (
              <Link key={c.code} href={`/requirements/${c.slug}`} className="bg-green-500/[0.06] border border-green-500/20 rounded-xl p-3 hover:border-green-500/40 transition-all text-center group">
                <span className="text-2xl">{c.flag}</span>
                <p className="text-xs text-gray-300 mt-1 font-medium group-hover:text-green-400 transition-colors">{c.name}</p>
                <p className="text-[10px] text-green-400/60 font-bold">
                  {jurisdictions.filter((j: any) => j.country_code === c.code).length} jurisdictions
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {countriesWithout.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-bold text-white mb-2">All Markets</h2>
          <p className="text-gray-500 text-sm mb-4">Countries sorted by market tier. Requirements are being verified and added continuously.</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {countriesWithout
              .sort((a, b) => {
                const aT = tierA.includes(a.code) ? 0 : tierB.includes(a.code) ? 1 : 2;
                const bT = tierA.includes(b.code) ? 0 : tierB.includes(b.code) ? 1 : 2;
                return aT - bT || a.name.localeCompare(b.name);
              })
              .map(c => {
                const status = getStatus(c.code);
                const s = statusLabels[status];
                return (
                  <div key={c.code} className={`rounded-lg p-2 text-center border ${s.color} transition-opacity`}>
                    <span className="text-lg">{c.flag}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{c.name}</p>
                    <p className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 ${status === 'requirements-ready' ? 'text-accent/60' : status === 'directory-seeded' ? 'text-blue-400/60' : 'text-gray-600'}`}>
                      {s.badge}
                    </p>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      <HCAlertSignupModule context="requirements updates" title="Get Regulation Alerts" />

      <section className="mt-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase mb-3">Also See</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/escort-requirements" className="text-xs text-gray-400 hover:text-accent transition-colors bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/10">US Escort Requirements →</Link>
          <Link href="/corridors" className="text-xs text-gray-400 hover:text-accent transition-colors bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/10">Corridors →</Link>
          <Link href="/directory" className="text-xs text-gray-400 hover:text-accent transition-colors bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/10">Directory →</Link>
          <Link href="/tools/permit-checker/us" className="text-xs text-gray-400 hover:text-accent transition-colors bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/10">Permit Checker →</Link>
        </div>
      </section>
    </main>
  );
}
