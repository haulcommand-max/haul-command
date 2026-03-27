import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { getCountryConfig } from '@/lib/hc-loaders/geography';

export const revalidate = 86400;
type Props = { params: Promise<{ country: string; state: string; metro: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, state, metro } = await params;
  const cc = getCountryConfig(country);
  if (!cc) return { title: 'Not Found' };
  const stateName = state.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const metroName = metro.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    title:`${metroName},${stateName} — Heavy Haul Directory |`,
    description: `Find pilot car operators and escort services in the ${metroName} metro area, ${stateName}, ${cc.name}.`,
  };
}

export default async function DirectoryMetroPage({ params }: Props) {
  const { country, state, metro } = await params;
  const cc = getCountryConfig(country);
  if (!cc) return notFound();
  const stateName = state.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const metroName = metro.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[
        { label: 'Directory', href: '/directory' },
        { label: cc.name, href: `/directory/${country}` },
        { label: stateName, href: `/directory/${country}/${state}` },
        { label: metroName, isCurrent: true },
      ]} />
      <HCLocalIntroCopy
        h1={`${metroName} Metro Area`}
        intro={`Find pilot car and escort services in the ${metroName} area, ${stateName}, ${cc.name}. Data is being collected.`}
        badge={`${cc.flag} ${metroName}`}
      />
      <HCAlertSignupModule context={`${metroName} directory`} />

      <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link href={`/directory/${country}/${state}`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all text-center">
          <span className="text-lg">⬆️</span>
          <p className="text-xs text-gray-300 mt-1">All {stateName}</p>
        </Link>
        <Link href={`/requirements/${country}`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all text-center">
          <span className="text-lg">📋</span>
          <p className="text-xs text-gray-300 mt-1">Requirements</p>
        </Link>
        <Link href={`/rates/${country}`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all text-center">
          <span className="text-lg">💰</span>
          <p className="text-xs text-gray-300 mt-1">Rates</p>
        </Link>
        <Link href={`/services/pilot-car-services/${country}`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all text-center">
          <span className="text-lg">🚛</span>
          <p className="text-xs text-gray-300 mt-1">Services</p>
        </Link>
        <Link href="/claim" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all text-center">
          <span className="text-lg">✅</span>
          <p className="text-xs text-gray-300 mt-1">Claim Profile</p>
        </Link>
        <Link href="/corridors" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all text-center">
          <span className="text-lg">🛤️</span>
          <p className="text-xs text-gray-300 mt-1">Corridors</p>
        </Link>
      </section>
    </main>
  );
}
