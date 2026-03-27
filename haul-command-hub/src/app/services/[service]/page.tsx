import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { HCUrgentFillModule } from '@/components/hc/UrgentFillModule';
import { HeroBillboard } from '@/components/hc/HeroBillboard';
import { InlineBillboard } from '@/components/hc/InlineBillboard';
import { StickyMobileChipRail } from '@/components/hc/StickyMobileChipRail';
import { getServiceBySlug, SERVICE_REGISTRY } from '@/lib/hc-loaders/service';
import { getCreativesForSlot } from '@/lib/ad-engine';
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
  return {
    title: `${svc.label} — Find Providers Worldwide | HAUL COMMAND`,
    description: `Find ${svc.label.toLowerCase()} providers across 120 countries. Browse operators, rates, and escort requirements for ${svc.label.toLowerCase()}.`,
  };
}

export default async function ServiceOverviewPage({ params }: Props) {
  const { service } = await params;
  const svc = getServiceBySlug(service);
  if (!svc) return notFound();

  // Load ad creatives for service page
  const [heroAds, inlineAds, chipAds] = await Promise.all([
    getCreativesForSlot({ slotFamily: 'hero_billboard', pageType: 'service_page', serviceSlug: service, maxCreatives: 6 }),
    getCreativesForSlot({ slotFamily: 'inline_billboard', pageType: 'service_page', serviceSlug: service, maxCreatives: 8 }),
    getCreativesForSlot({ slotFamily: 'sticky_mobile_chip_rail', pageType: 'service_page', serviceSlug: service, maxCreatives: 10 }),
  ]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 min-h-screen pb-32 lg:pb-8">
      <HCBreadcrumbs crumbs={[{ label: 'Services', href: '/services' }, { label: svc.label, isCurrent: true }]} />

      {/* Hero Billboard */}
      <HeroBillboard creatives={heroAds} slotFamily="hero_billboard" pageType="service_page" />

      <HCLocalIntroCopy h1={svc.label} intro={`Find ${svc.label.toLowerCase()} providers worldwide. Browse by country to see pilots on standby, rates, and requirements.`} />

      {/* Post Load / Urgent Fill CTA */}
      <div className="mb-8 flex flex-col sm:flex-row gap-3">
        <Link href="/loads" className="flex-1 bg-gradient-to-r from-red-600/10 to-red-500/5 border border-red-500/15 rounded-xl p-4 hover:border-red-500/30 transition-all text-center">
          <span className="text-lg">🚨</span>
          <h3 className="text-sm font-bold text-white mt-1">Need {svc.label} Now?</h3>
          <p className="text-[10px] text-gray-500 mt-1">Post a load for immediate response</p>
        </Link>
        <Link href="/claim" className="flex-1 bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/15 rounded-xl p-4 hover:border-accent/30 transition-all text-center">
          <span className="text-lg">🏷️</span>
          <h3 className="text-sm font-bold text-white mt-1">Provide {svc.label}?</h3>
          <p className="text-[10px] text-gray-500 mt-1">List your business for free</p>
        </Link>
      </div>

      {/* Country Grid */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Select a Country</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {COUNTRIES.map(c => (
            <Link key={c.code} href={`/services/${service}/${c.slug}`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 hover:border-accent/30 transition-all text-center group">
              <span className="text-2xl">{c.flag}</span>
              <p className="text-xs text-gray-300 mt-1 group-hover:text-accent transition-colors">{c.terms[svc.termKey]}</p>
              <p className="text-[10px] text-gray-600">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Inline Billboard */}
      <InlineBillboard creatives={inlineAds} />

      {/* Alert Signup */}
      <HCAlertSignupModule
        context={svc.label}
        title={`Get ${svc.label} Alerts`}
        alertType="service"
        contextKey={`service:${service}`}
        serviceSlug={service}
        showPremiumTier
      />

      {/* Related Links */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Related</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/corridors" className="text-xs text-gray-400 hover:text-accent px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg transition-colors">Browse Corridors</Link>
          <Link href="/rates" className="text-xs text-gray-400 hover:text-accent px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg transition-colors">Rate Intelligence</Link>
          <Link href="/requirements" className="text-xs text-gray-400 hover:text-accent px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg transition-colors">Escort Requirements</Link>
          <Link href="/loads" className="text-xs text-gray-400 hover:text-accent px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg transition-colors">Post a Load</Link>
          <Link href="/directory" className="text-xs text-gray-400 hover:text-accent px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg transition-colors">Full Directory</Link>
        </div>
      </section>

      {/* Sticky Mobile Chip Rail */}
      <StickyMobileChipRail creatives={chipAds} />
    </main>
  );
}
