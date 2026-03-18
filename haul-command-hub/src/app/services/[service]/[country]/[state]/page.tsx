import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { getServiceBySlug } from '@/lib/hc-loaders/service';
import { getCountryConfig } from '@/lib/hc-loaders/geography';

export const revalidate = 86400;
type Props = { params: Promise<{ service: string; country: string; state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service, country, state } = await params;
  const svc = getServiceBySlug(service);
  const cc = getCountryConfig(country);
  const stateName = state.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  if (!svc || !cc) return { title: 'Not Found' };
  return {
    title: `${cc.terms[svc.termKey]} in ${stateName}, ${cc.name} — HAUL COMMAND`,
    description: `Find ${cc.terms[svc.termKey].toLowerCase()} providers in ${stateName}, ${cc.name}.`,
  };
}

export default async function ServiceStateMetroPage({ params }: Props) {
  const { service, country, state } = await params;
  const svc = getServiceBySlug(service);
  const cc = getCountryConfig(country);
  if (!svc || !cc) return notFound();
  const stateName = state.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[
        { label: 'Services', href: '/services' },
        { label: svc.label, href: `/services/${service}` },
        { label: cc.name, href: `/services/${service}/${country}` },
        { label: stateName, isCurrent: true },
      ]} />
      <HCLocalIntroCopy h1={`${cc.terms[svc.termKey]} in ${stateName}`} intro={`Find ${cc.terms[svc.termKey].toLowerCase()} in ${stateName}, ${cc.name}.`} badge={`${cc.flag} ${stateName}`} />
      <HCAlertSignupModule context={`${cc.terms[svc.termKey]} in ${stateName}`} />
    </main>
  );
}
