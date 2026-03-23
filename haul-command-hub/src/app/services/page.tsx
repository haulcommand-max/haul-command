import Link from 'next/link';
import type { Metadata } from 'next';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { SERVICE_REGISTRY } from '@/lib/hc-loaders/service';
import { COUNTRIES } from '@/lib/seo-countries';

export const metadata: Metadata = {
  title: 'Heavy Haul & Escort Services — HAUL COMMAND',
  description: 'Find pilot car services, escort vehicle services, oversize load escorts, route surveys, and more across 57 countries.',
};

export default function ServicesIndexPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[{ label: 'Services', href: '/services', isCurrent: true }]} />
      <HCLocalIntroCopy
        h1="Heavy Haul & Escort Services"
        intro="Browse all service categories across the global heavy-haul network. Find operators by service type, country, state, or metro area."
        badge="8 Service Categories"
      />

      <section className="mb-12">
        <h2 className="text-lg font-bold text-white mb-4">Service Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICE_REGISTRY.map(s => (
            <Link key={s.slug} href={`/services/${s.slug}`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:border-accent/30 transition-all">
              <h3 className="text-sm font-bold text-white">{s.label}</h3>
              <p className="text-[10px] text-gray-500 mt-1">Browse by country →</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-lg font-bold text-white mb-4">Browse by Country</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {COUNTRIES.filter(c => c.tier === 'A' || c.tier === 'B').map(c => (
            <Link key={c.code} href={`/services/pilot-car-services/${c.slug}`} className="bg-white/[0.02] border border-white/5 rounded-lg p-2 text-center hover:border-accent/20 transition-all">
              <span className="text-lg">{c.flag}</span>
              <p className="text-[10px] text-gray-500 mt-0.5">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
