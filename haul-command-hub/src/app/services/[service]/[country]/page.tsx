import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCMarketMaturityBanner } from '@/components/hc/MarketMaturityBanner';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { getServiceBySlug } from '@/lib/hc-loaders/service';
import { getCountryConfig, getCountryPlaces, getMarketMaturity } from '@/lib/hc-loaders/geography';

export const revalidate = 86400;
type Props = { params: Promise<{ service: string; country: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service, country } = await params;
  const svc = getServiceBySlug(service);
  const cc = getCountryConfig(country);
  if (!svc || !cc) return { title: 'Not Found' };
  const local = cc.terms[svc.termKey];
  return {
    title: `${local} in ${cc.name} — HAUL COMMAND`,
    description: `Find ${local.toLowerCase()} providers in ${cc.name}. Directory, requirements, and rates for ${cc.terms.heavy_haul.toLowerCase()} operations.`,
  };
}

export default async function ServiceCountryPage({ params }: Props) {
  const { service, country } = await params;
  const svc = getServiceBySlug(service);
  const cc = getCountryConfig(country);
  if (!svc || !cc) return notFound();

  const maturity = await getMarketMaturity(cc.code);
  const places = await getCountryPlaces(cc.code, 30);
  const local = cc.terms[svc.termKey];

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[
        { label: 'Services', href: '/services' },
        { label: svc.label, href: `/services/${service}` },
        { label: cc.name, isCurrent: true },
      ]} />
      <HCMarketMaturityBanner state={maturity} countryName={cc.name} />
      <HCLocalIntroCopy h1={`${local} in ${cc.name}`} intro={`Find ${local.toLowerCase()} providers across ${cc.name}. ${places.length} providers currently listed.`} badge={`${cc.flag} ${cc.name}`} />

      {cc.regions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-400 uppercase mb-3">Browse by Region</h2>
          <div className="flex flex-wrap gap-2">
            {cc.regions.slice(0, 20).map(r => (
              <Link key={r} href={`/services/${service}/${country}/${r.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 text-gray-400 hover:text-accent hover:border-accent/20 transition-all">
                {r}
              </Link>
            ))}
          </div>
        </section>
      )}

      {places.length > 0 ? (
        <section className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {places.map((p: any) => (
              <Link key={p.id} href={`/place/${p.slug}`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all">
                <h3 className="text-sm font-bold text-white">{p.name}</h3>
                <p className="text-[10px] text-gray-500 mt-1">{[p.locality, p.admin1_code].filter(Boolean).join(', ')}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <HCAlertSignupModule context={`${local} in ${cc.name}`} />
      )}

      <section className="mt-8 flex flex-wrap gap-2">
        <Link href={`/requirements/${cc.slug}`} className="text-xs text-gray-500 hover:text-accent">Requirements →</Link>
        <Link href={`/rates/${cc.slug}`} className="text-xs text-gray-500 hover:text-accent">Rates →</Link>
        <Link href={`/directory/${cc.slug}`} className="text-xs text-gray-500 hover:text-accent">Directory →</Link>
      </section>
    </main>
  );
}
