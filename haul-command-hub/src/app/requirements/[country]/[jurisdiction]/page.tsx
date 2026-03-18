import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { getCountryConfig } from '@/lib/hc-loaders/geography';
import { getRequirementsByJurisdiction } from '@/lib/hc-loaders/requirements';

export const revalidate = 86400;
type Props = { params: Promise<{ country: string; jurisdiction: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, jurisdiction } = await params;
  const cc = getCountryConfig(country);
  const label = jurisdiction.toUpperCase();
  return {
    title: `${label} ${cc?.terms.oversize_load ?? 'Oversize Load'} Requirements — HAUL COMMAND`,
    description: `Escort, pilot car, and oversize load requirements for ${label}, ${cc?.name ?? country}. Permit thresholds, equipment mandates, and official sources.`,
  };
}

export default async function RequirementsJurisdictionPage({ params }: Props) {
  const { country, jurisdiction } = await params;
  const cc = getCountryConfig(country);
  if (!cc) return notFound();

  const data = await getRequirementsByJurisdiction(jurisdiction);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[
        { label: 'Requirements', href: '/requirements' },
        { label: cc.name, href: `/requirements/${cc.slug}` },
        { label: jurisdiction.toUpperCase(), href: `/requirements/${cc.slug}/${jurisdiction}`, isCurrent: true },
      ]} />

      <HCLocalIntroCopy
        h1={`${jurisdiction.toUpperCase()} ${cc.terms.oversize_load} Requirements`}
        intro={`Complete ${cc.terms.pilot_car.toLowerCase()} and ${cc.terms.escort_vehicle.toLowerCase()} regulations for ${jurisdiction.toUpperCase()}, ${cc.name}. Includes dimensional thresholds, equipment mandates, and permit information.`}
        badge={`${cc.flag} ${jurisdiction.toUpperCase()}`}
      />

      {data.length > 0 ? (
        <section className="mb-8 space-y-4">
          {data.map((row: any, i: number) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
              <pre className="text-xs text-gray-400 whitespace-pre-wrap overflow-x-auto">{JSON.stringify(row, null, 2)}</pre>
            </div>
          ))}
        </section>
      ) : (
        <>
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center mb-8">
            <p className="text-gray-500 text-sm">No detailed requirements data for {jurisdiction.toUpperCase()} yet.</p>
            <p className="text-gray-600 text-xs mt-2">We're building this database. Help us improve accuracy.</p>
          </div>
          <HCAlertSignupModule context={`${jurisdiction.toUpperCase()} requirements`} />
        </>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase mb-3">Related</h2>
        <div className="flex flex-wrap gap-2">
          <Link href={`/requirements/${cc.slug}`} className="text-xs text-gray-500 hover:text-accent">All {cc.name} Jurisdictions →</Link>
          <Link href={`/directory/${cc.slug}`} className="text-xs text-gray-500 hover:text-accent">Directory →</Link>
          <Link href={`/rates/${cc.slug}`} className="text-xs text-gray-500 hover:text-accent">Rates →</Link>
        </div>
      </section>
    </main>
  );
}
