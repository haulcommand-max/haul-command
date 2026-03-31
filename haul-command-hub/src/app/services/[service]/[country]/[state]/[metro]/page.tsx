import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { getServiceBySlug } from '@/lib/hc-loaders/service';
import { getCountryConfig } from '@/lib/hc-loaders/geography';

export const revalidate = 86400;
type Props = { params: Promise<{ service: string; country: string; state: string; metro: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service, country, state, metro } = await params;
  const svc = getServiceBySlug(service);
  const cc = getCountryConfig(country);
  const metroName = metro.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  if (!svc || !cc) return { title: 'Not Found' };
  return {
    title: `${cc.terms[svc.termKey]} in ${metroName} — HAUL COMMAND`,
    description: `Find ${cc.terms[svc.termKey].toLowerCase()} providers near ${metroName}.`,
  };
}

export default async function ServiceMetroPage({ params }: Props) {
  const { service, country, state, metro } = await params;
  const svc = getServiceBySlug(service);
  const cc = getCountryConfig(country);
  if (!svc || !cc) return notFound();
  const metroName = metro.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const regionName = state.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[
        { label: 'Services', href: '/services' },
        { label: svc.label, href: `/services/${service}` },
        { label: cc.name, href: `/services/${service}/${country}` },
        { label: regionName, href: `/services/${service}/${country}/${state}` },
        { label: metroName, isCurrent: true },
      ]} />
      <HCLocalIntroCopy h1={`${cc.terms[svc.termKey]} in ${metroName}`} intro={`Find ${cc.terms[svc.termKey].toLowerCase()} near ${metroName}, ${regionName}, ${cc.name}.`} badge={`${cc.flag} ${metroName}`} />
      <HCAlertSignupModule context={`${cc.terms[svc.termKey]} near ${metroName}`} />
    </main>
  );
}
