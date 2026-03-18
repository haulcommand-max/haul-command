import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { getServiceBySlug, SERVICE_REGISTRY } from '@/lib/hc-loaders/service';
import { COUNTRIES } from '@/lib/seo-countries';

export const revalidate = 86400;

export async function generateStaticParams() {
  return SERVICE_REGISTRY.map(s => ({ service: s.slug }));
}

type Props = { params: Promise<{ service: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service } = await params;
  const svc = getServiceBySlug(service);
  if (!svc) return { title: 'Not Found' };
  return { title: `${svc.label} — Find Providers | HAUL COMMAND`, description: `Find ${svc.label.toLowerCase()} providers across 57 countries.` };
}

export default async function ServiceOverviewPage({ params }: Props) {
  const { service } = await params;
  const svc = getServiceBySlug(service);
  if (!svc) return notFound();

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[{ label: 'Services', href: '/services' }, { label: svc.label, isCurrent: true }]} />
      <HCLocalIntroCopy h1={svc.label} intro={`Find ${svc.label.toLowerCase()} providers worldwide. Browse by country to see available operators, rates, and requirements.`} />
      <section className="mb-12">
        <h2 className="text-lg font-bold text-white mb-4">Select a Country</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {COUNTRIES.map(c => (
            <Link key={c.code} href={`/services/${service}/${c.slug}`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 hover:border-accent/30 transition-all text-center">
              <span className="text-2xl">{c.flag}</span>
              <p className="text-xs text-gray-300 mt-1">{c.terms[svc.termKey]}</p>
              <p className="text-[10px] text-gray-600">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
