import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { getCountryConfig } from '@/lib/hc-loaders/geography';

export const revalidate = 86400;
type Props = { params: Promise<{ country: string; state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, state } = await params;
  const cc = getCountryConfig(country);
  const regionName = state.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  if (!cc) return { title: 'Not Found' };
  return {
    title: `Escort Rates in ${regionName}, ${cc.name} — HAUL COMMAND`,
    description: `Rate benchmarks for escort and pilot car services in ${regionName}, ${cc.name}.`,
  };
}

export default async function RatesStatePage({ params }: Props) {
  const { country, state } = await params;
  const cc = getCountryConfig(country);
  if (!cc) return notFound();
  const regionName = state.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[
        { label: 'Rates', href: '/rates' },
        { label: cc.name, href: `/rates/${country}` },
        { label: regionName, isCurrent: true },
      ]} />
      <HCLocalIntroCopy h1={`Escort Rates in ${regionName}`} intro={`Rate intelligence for ${regionName}, ${cc.name}. Data is being collected.`} badge={`${cc.flag} ${regionName}`} />
      <HCAlertSignupModule context={`${regionName} rate data`} />
    </main>
  );
}
