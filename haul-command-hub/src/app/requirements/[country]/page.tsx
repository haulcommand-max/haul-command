import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCMarketMaturityBanner } from '@/components/hc/MarketMaturityBanner';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { getCountryConfig } from '@/lib/hc-loaders/geography';
import { getRequirementsByCountry } from '@/lib/hc-loaders/requirements';
import { COUNTRIES } from '@/lib/seo-countries';

export const revalidate = 86400;

export async function generateStaticParams() {
  return COUNTRIES.map(c => ({ country: c.slug }));
}

type Props = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const cc = getCountryConfig(country);
  if (!cc) return { title: 'Not Found' };
  return {
    title: `${cc.terms.oversize_load} Requirements in ${cc.name} — HAUL COMMAND`,
    description: `Complete ${cc.terms.pilot_car} and ${cc.terms.escort_vehicle} requirements for ${cc.name}. Permit thresholds, equipment mandates, and official sources.`,
  };
}

export default async function RequirementsCountryPage({ params }: Props) {
  const { country } = await params;
  const cc = getCountryConfig(country);
  if (!cc) return notFound();
  const jurisdictions = await getRequirementsByCountry(cc.code);
  const hasData = jurisdictions.length > 0;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[
        { label: 'Requirements', href: '/requirements' },
        { label: cc.name, href: `/requirements/${cc.slug}`, isCurrent: true },
      ]} />

      <HCMarketMaturityBanner
        state={hasData ? 'live' : 'planned'}
        countryName={cc.name}
        message={hasData
          ? `${jurisdictions.length} jurisdictions with requirement data`
          : `We're building the ${cc.name} requirements database. Add your knowledge to help the community.`
        }
      />

      <HCLocalIntroCopy
        h1={`${cc.terms.oversize_load} Requirements in ${cc.name}`}
        intro={`Find ${cc.terms.pilot_car.toLowerCase()} and ${cc.terms.escort_vehicle.toLowerCase()} requirements across ${cc.name}. Includes permit thresholds, equipment mandates, and links to official regulatory sources.`}
        badge={`${cc.flag} ${cc.name}`}
      />

      {hasData && (
        <section className="mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {jurisdictions.map((j: any, i: number) => (
              <Link key={i} href={`/requirements/${cc.slug}/${(j.jurisdiction_code ?? j.state_code ?? '').toLowerCase()}`}
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all">
                <h3 className="text-sm font-bold text-white">{j.jurisdiction_name ?? j.state_name ?? j.jurisdiction_code}</h3>
                <p className="text-[10px] text-gray-500 mt-1">View requirements →</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!hasData && <HCAlertSignupModule context={`${cc.name} requirements`} />}

      <section className="mt-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase mb-3">Related</h2>
        <div className="flex flex-wrap gap-2">
          <Link href={`/directory/${cc.slug}`} className="text-xs text-gray-500 hover:text-accent">Directory in {cc.name} →</Link>
          <Link href={`/rates/${cc.slug}`} className="text-xs text-gray-500 hover:text-accent">Rates in {cc.name} →</Link>
          <Link href="/requirements" className="text-xs text-gray-500 hover:text-accent">All Countries →</Link>
        </div>
      </section>
    </main>
  );
}
