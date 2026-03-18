import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { getInfraTypeBySlug } from '@/lib/hc-loaders/infrastructure';
import { getCountryConfig } from '@/lib/hc-loaders/geography';

export const revalidate = 86400;
type Props = { params: Promise<{ type: string; country: string; state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, country, state } = await params;
  const infra = getInfraTypeBySlug(type);
  const cc = getCountryConfig(country);
  const stateName = state.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  if (!infra || !cc) return { title: 'Not Found' };
  return {
    title: `${infra.label} in ${stateName}, ${cc.name} — HAUL COMMAND`,
    description: `Find ${infra.label.toLowerCase()} in ${stateName}, ${cc.name}.`,
  };
}

export default async function InfraStatePage({ params }: Props) {
  const { type, country, state } = await params;
  const infra = getInfraTypeBySlug(type);
  const cc = getCountryConfig(country);
  if (!infra || !cc) return notFound();
  const stateName = state.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[
        { label: 'Infrastructure' },
        { label: infra.label },
        { label: cc.name, href: `/infrastructure/${type}/${country}` },
        { label: stateName, isCurrent: true },
      ]} />
      <HCLocalIntroCopy h1={`${infra.icon} ${infra.label} in ${stateName}`} intro={`Find ${infra.label.toLowerCase()} for heavy haul operations in ${stateName}, ${cc.name}.`} badge={`${cc.flag} ${stateName}`} />
      <HCAlertSignupModule context={`${infra.label} in ${stateName}`} />
    </main>
  );
}
