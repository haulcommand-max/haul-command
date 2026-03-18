import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCMarketMaturityBanner } from '@/components/hc/MarketMaturityBanner';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { getInfraTypeBySlug, INFRASTRUCTURE_TYPES, getInfrastructureByCountry } from '@/lib/hc-loaders/infrastructure';
import { getCountryConfig, getMarketMaturity } from '@/lib/hc-loaders/geography';

export const revalidate = 86400;
type Props = { params: Promise<{ type: string; country: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, country } = await params;
  const infra = getInfraTypeBySlug(type);
  const cc = getCountryConfig(country);
  if (!infra || !cc) return { title: 'Not Found' };
  return {
    title: `${infra.label} in ${cc.name} — HAUL COMMAND`,
    description: `Find ${infra.label.toLowerCase()} for heavy haul operations in ${cc.name}.`,
  };
}

export default async function InfraCountryPage({ params }: Props) {
  const { type, country } = await params;
  const infra = getInfraTypeBySlug(type);
  const cc = getCountryConfig(country);
  if (!infra || !cc) return notFound();

  const maturity = await getMarketMaturity(cc.code);
  const items = await getInfrastructureByCountry(type, cc.code);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[
        { label: 'Infrastructure' },
        { label: infra.label },
        { label: cc.name, isCurrent: true },
      ]} />
      <HCMarketMaturityBanner state={maturity} countryName={cc.name} />
      <HCLocalIntroCopy h1={`${infra.icon} ${infra.label} in ${cc.name}`} intro={items.length > 0 ? `${items.length} locations listed.` : `We're building the ${infra.label.toLowerCase()} directory for ${cc.name}.`} badge={`${cc.flag} ${cc.name}`} />

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {items.map((item: any) => (
            <div key={item.surface_id} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <h3 className="text-sm font-bold text-white">{item.name}</h3>
              {item.city && <p className="text-[10px] text-gray-500 mt-1">{item.city}</p>}
            </div>
          ))}
        </div>
      ) : <HCAlertSignupModule context={`${infra.label} in ${cc.name}`} />}

      <section className="mt-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase mb-3">Other Infrastructure</h2>
        <div className="flex flex-wrap gap-2">
          {INFRASTRUCTURE_TYPES.filter(t => t.slug !== type).map(t => (
            <Link key={t.slug} href={`/infrastructure/${t.slug}/${country}`} className="text-xs text-gray-500 hover:text-accent">{t.icon} {t.label} →</Link>
          ))}
        </div>
      </section>
    </main>
  );
}
