import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COUNTRIES, getCountryBySlug, SEO_SERVICES, CountryConfig } from '@/lib/seo-countries';
import FAQSchema from '@/components/FAQSchema';
import BreadcrumbSchema, { ServiceSchema } from '@/components/BreadcrumbSchema';
import Navbar from '@/components/Navbar';

// All unique equipment types across 120 countries
const ALL_EQUIPMENT: { slug: string; label: string }[] = [
  { slug: 'wind-turbine', label: 'Wind Turbine' },
  { slug: 'transformer', label: 'Transformer' },
  { slug: 'bridge-beam', label: 'Bridge Beam' },
  { slug: 'crane', label: 'Crane' },
  { slug: 'heavy-equipment', label: 'Heavy Equipment' },
  { slug: 'modular-building', label: 'Modular Building' },
  { slug: 'mining-equipment', label: 'Mining Equipment' },
  { slug: 'construction-equipment', label: 'Construction Equipment' },
  { slug: 'mobile-home', label: 'Mobile Home' },
  { slug: 'prefab-house', label: 'Prefab House' },
  { slug: 'pipeline', label: 'Pipeline' },
  { slug: 'oil-gas-equipment', label: 'Oil & Gas Equipment' },
  { slug: 'offshore-equipment', label: 'Offshore Equipment' },
  { slug: 'industrial-machinery', label: 'Industrial Machinery' },
  { slug: 'dairy-equipment', label: 'Dairy Equipment' },
  { slug: 'forestry-equipment', label: 'Forestry Equipment' },
];

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function findEquipType(slug: string) {
  return ALL_EQUIPMENT.find(e => e.slug === slug) ?? null;
}

// BUILD SIZE GUARD: Only generate pages for Tier A countries at build time.
// All 120 countries still work via ISR (on-demand rendering on first visit).
const TIER_A_SLUGS = new Set(['us', 'ca', 'au', 'gb', 'nz', 'za', 'de', 'nl', 'ae', 'br']);
export function generateStaticParams() {
  return COUNTRIES
    .filter((country) => TIER_A_SLUGS.has(country.slug))
    .flatMap((country) =>
      country.equipment_focus.map((equip) => ({
        type: slugify(equip),
        country: country.slug,
      }))
    );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; country: string }>;
}): Promise<Metadata> {
  const { type: typeSlug, country: countrySlug } = await params;
  const country = getCountryBySlug(countrySlug);
  const equip = findEquipType(typeSlug);
  if (!country || !equip) return { title: 'Not Found' };

  const title = `${equip.label} Transport Escort in ${country.name} | Haul Command`;
  const description = `Need a ${country.terms.pilot_car.toLowerCase()} for ${equip.label.toLowerCase()} transport in ${country.name}? Find verified ${country.terms.escort_vehicle.toLowerCase()} operators with ${equip.label.toLowerCase()} hauling experience. Compare rates and availability.`;
  const url = `https://haulcommand.com/equipment/${typeSlug}/${countrySlug}`;

  return {
    title,
    description,
    openGraph: { title, description, url },
    alternates: { canonical: url },
  };
}

export default async function EquipmentCountryPage({
  params,
}: {
  params: Promise<{ type: string; country: string }>;
}) {
  const { type: typeSlug, country: countrySlug } = await params;
  const country = getCountryBySlug(countrySlug);
  const equip = findEquipType(typeSlug);
  if (!country || !equip) notFound();

  const baseUrl = 'https://haulcommand.com';

  // Related equipment in this country
  const relatedEquip = country.equipment_focus
    .filter(e => slugify(e) !== typeSlug)
    .slice(0, 5)
    .map(e => ({ slug: slugify(e), label: e }));

  // Top cities for this country
  const topCities = country.cities.slice(0, 8);

  const faqs = [
    {
      question: `What escort requirements for ${equip.label.toLowerCase()} transport in ${country.name}?`,
      answer: `${equip.label} loads in ${country.name} typically exceed standard ${country.units === 'imperial' ? 'width (8\'6")' : 'width (2.55m)'} thresholds, requiring at minimum one ${country.terms.pilot_car.toLowerCase()}. Superload-class ${equip.label.toLowerCase()} components (blades, nacelles, transformer cores) may require 2-4 escorts plus police accompaniment. Check our requirements tool for exact thresholds.`,
    },
    {
      question: `How much does ${equip.label.toLowerCase()} escort cost in ${country.name}?`,
      answer: `${equip.label} escort rates in ${country.name} range from ${country.currency} ${country.units === 'imperial' ? '1.75–4.00 per mile' : '1.50–3.50 per km'} depending on load configuration, number of escorts required, and route complexity. Multi-day moves include layover charges. Get exact quotes from verified operators on Haul Command.`,
    },
    {
      question: `Which cities in ${country.name} handle the most ${equip.label.toLowerCase()} transport?`,
      answer: `The highest-volume corridors for ${equip.label.toLowerCase()} transport in ${country.name} include ${topCities.slice(0, 4).join(', ')}, and ${topCities[4] || topCities[topCities.length - 1]}. These corridors have experienced operators familiar with the specific clearance and routing challenges of ${equip.label.toLowerCase()} loads.`,
    },
  ];

  return (
    <>
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema
        items={[
          { name: 'Haul Command', url: baseUrl },
          { name: 'Equipment', url: `${baseUrl}/equipment` },
          { name: equip.label, url: `${baseUrl}/equipment/${typeSlug}` },
          { name: country.name, url: `${baseUrl}/equipment/${typeSlug}/${countrySlug}` },
        ]}
      />
      <ServiceSchema
        serviceName={`${equip.label} Transport Escort in ${country.name}`}
        description={`Professional ${country.terms.escort_vehicle.toLowerCase()} and ${country.terms.pilot_car.toLowerCase()} services for ${equip.label.toLowerCase()} transport in ${country.name}.`}
        areaServed={country.name}
        url={`${baseUrl}/equipment/${typeSlug}/${countrySlug}`}
      />

      <Navbar />

      <main className="min-h-screen bg-[#0a0e17]">
        <section className="relative pt-24 pb-16 bg-gradient-to-b from-accent/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">Haul Command</Link>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">Equipment</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">{equip.label}</span>
              <span className="text-slate-600">/</span>
              <span className="text-white">{country.flag} {country.name}</span>
            </nav>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
              {equip.label} Transport
              <br />
              <span className="text-accent">Escorts in {country.name}</span>
            </h1>

            <p className="text-lg text-slate-300 max-w-2xl mb-8 leading-relaxed">
              Hauling a {equip.label.toLowerCase()} through {country.name}? These loads demand operators
              who understand the specific clearance profiles, weight distributions, and routing
              challenges unique to {equip.label.toLowerCase()} components. Find {country.terms.pilot_car.toLowerCase()} operators
              with verified {equip.label.toLowerCase()} experience.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/directory/${countrySlug}`}
                className="inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-yellow-500 text-black font-black rounded-xl transition-all shadow-lg shadow-accent/20 text-sm"
              >
                Find {equip.label} Escort Operators →
              </Link>
              <Link
                href={`/requirements/${countrySlug}`}
                className="inline-flex items-center justify-center px-6 py-4 border border-white/10 hover:border-accent/30 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Check {country.name} Requirements
              </Link>
            </div>
          </div>
        </section>

        {/* Services for this equipment type */}
        <section className="py-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white mb-8">
              {equip.label} Escort Services in {country.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SEO_SERVICES.map((svc) => {
                const localTerm = country.terms[svc.termKey] || svc.label;
                return (
                  <Link
                    key={svc.slug}
                    href={`/${countrySlug}/${svc.slug}`}
                    className="group p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-accent/[0.03] hover:border-accent/20 transition-all"
                  >
                    <h3 className="text-white font-semibold group-hover:text-accent transition-colors mb-2">
                      {localTerm}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {localTerm} for {equip.label.toLowerCase()} loads in {country.name}.
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Top Cities */}
        <section className="py-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white mb-8">
              Top {equip.label} Transport Corridors in {country.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {topCities.map((city) => {
                const citySlug = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                return (
                  <Link
                    key={city}
                    href={`/${countrySlug}/city/${encodeURIComponent(citySlug)}/pilot-car-service`}
                    className="group p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-accent/[0.03] hover:border-accent/20 transition-all"
                  >
                    <span className="text-sm text-white group-hover:text-accent font-medium">{city}</span>
                    <span className="block text-xs text-slate-500 mt-1">{equip.label} escort →</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Related Equipment */}
        {relatedEquip.length > 0 && (
          <section className="py-16 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="text-2xl font-bold text-white mb-8">
                Other Equipment Escorts in {country.name}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {relatedEquip.map((eq) => (
                  <Link
                    key={eq.slug}
                    href={`/equipment/${eq.slug}/${countrySlug}`}
                    className="group p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-accent/[0.03] hover:border-accent/20 transition-all text-center"
                  >
                    <span className="text-sm text-white group-hover:text-accent font-medium capitalize">{eq.label}</span>
                    <span className="block text-xs text-slate-500 mt-1">Transport escort →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="py-16 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white mb-8">
              FAQ — {equip.label} Transport in {country.name}
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="group rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
                  <summary className="cursor-pointer px-6 py-4 text-white font-medium hover:bg-white/[0.03] transition-colors flex items-center justify-between">
                    {faq.question}
                    <span className="text-slate-500 group-open:rotate-180 transition-transform ml-4">▾</span>
                  </summary>
                  <div className="px-6 pb-4 text-slate-300 leading-relaxed border-t border-white/5 pt-4">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20 rounded-2xl p-8 sm:p-10 text-center">
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
              Don&apos;t Move a {equip.label} Without a Plan
            </h2>
            <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
              {equip.label} loads in {country.name} require experienced {country.terms.pilot_car.toLowerCase()} operators
              who know the equipment, the routes, and the regulations.
            </p>
            <Link href="/claim" className="bg-accent text-black px-8 py-4 rounded-xl font-black text-sm hover:bg-yellow-500 transition-all shadow-[0_0_24px_rgba(245,159,10,0.3)]">
              List Your {equip.label} Escort Company — Free
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
