import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  COUNTRIES,
  getCountryBySlug,
  SEO_SERVICES,
  CountryConfig,
} from '@/lib/seo-countries';
import FAQSchema from '@/components/FAQSchema';
import BreadcrumbSchema, { ServiceSchema } from '@/components/BreadcrumbSchema';
import Navbar from '@/components/Navbar';
import { generateCityServiceHreflang } from '@/lib/seo/hreflang';

function slugifyCity(city: string): string {
  return encodeURIComponent(city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
}

function findCity(country: CountryConfig, citySlug: string): string | null {
  return country.cities.find(c => slugifyCity(c) === citySlug) ?? null;
}

function findService(slug: string) {
  return SEO_SERVICES.find(s => s.slug === slug) ?? null;
}

// ─── Static Params: 57 countries × cities × 6 services ≈ 3,420 pages ───
export function generateStaticParams() {
  return COUNTRIES.flatMap((country) =>
    country.cities.flatMap((city) =>
      SEO_SERVICES.map((service) => ({
        country: country.slug,
        'city-slug': slugifyCity(city),
        service: service.slug,
      }))
    )
  );
}

// ─── Metadata ───
export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; 'city-slug': string; service: string }>;
}): Promise<Metadata> {
  const { country: countrySlug, 'city-slug': citySlug, service: serviceSlug } = await params;
  const country = getCountryBySlug(countrySlug);
  if (!country) return { title: 'Not Found' };
  const city = findCity(country, citySlug);
  const service = findService(serviceSlug);
  if (!city || !service) return { title: 'Not Found' };

  const localTerm = country.terms[service.termKey] || service.label;
  const title = `${localTerm} in ${city}, ${country.name} | Haul Command`;
  const description = `Need a ${localTerm.toLowerCase()} in ${city}? Find verified operators, get instant quotes, and check ${country.terms.oversize_load.toLowerCase()} regulations. Compare pricing from local ${country.terms.escort_vehicle.toLowerCase()} professionals. Updated March 2026.`;
  const url = `https://haulcommand.com/${countrySlug}/city/${citySlug}/${serviceSlug}`;

  return {
    title,
    description,
    openGraph: { title, description, url },
    alternates: { 
      canonical: url,
      languages: generateCityServiceHreflang(citySlug, serviceSlug)
    },
  };
}

// ─── Page ───
export default async function CityServicePage({
  params,
}: {
  params: Promise<{ country: string; 'city-slug': string; service: string }>;
}) {
  const { country: countrySlug, 'city-slug': citySlug, service: serviceSlug } = await params;
  const country = getCountryBySlug(countrySlug);
  if (!country) notFound();
  const city = findCity(country, citySlug);
  const service = findService(serviceSlug);
  if (!city || !service) notFound();

  const localTerm = country.terms[service.termKey] || service.label;
  const baseUrl = 'https://haulcommand.com';

  // Related services (exclude current)
  const relatedServices = SEO_SERVICES.filter(s => s.slug !== serviceSlug);

  // Nearby cities
  const nearbyCities = country.cities.filter(c => c !== city).slice(0, 6);

  // Equipment relevant to this market
  const equipment = country.equipment_focus.slice(0, 5);

  // FAQs — goal-completion focused (talk to the USER, not about HC)
  const faqs = [
    {
      question: `How much does a ${localTerm.toLowerCase()} cost in ${city}?`,
      answer: `${localTerm} rates in ${city} typically range from ${country.currency} ${country.units === 'imperial' ? '1.50–3.50 per mile' : '1.20–2.80 per km'} depending on load width, route complexity, and time-of-day restrictions. Superloads and multi-escort configurations cost more. Get an exact quote from local operators on Haul Command.`,
    },
    {
      question: `When do I need a ${localTerm.toLowerCase()} for my load in ${city}?`,
      answer: `In ${country.name}, ${localTerm.toLowerCase()} services are typically required when your load exceeds ${country.units === 'imperial' ? '8\'6" width, 13\'6" height, or 75\' length' : '2.55m width, 4.0m height, or 18.75m length'}. ${city} may have additional metro restrictions during peak traffic hours. Check our requirements tool for exact thresholds.`,
    },
    {
      question: `How quickly can I get a ${localTerm.toLowerCase()} in ${city}?`,
      answer: `Most verified ${localTerm.toLowerCase()} operators on Haul Command in the ${city} area can mobilize within 2–4 hours for standard escorts. Emergency and same-day service is available from operators who carry the "Rapid Response" badge.`,
    },
    {
      question: `What equipment types commonly need ${localTerm.toLowerCase()} in ${city}?`,
      answer: `The most common loads requiring ${localTerm.toLowerCase()} services in the ${city} corridor include ${equipment.slice(0, 3).join(', ')}, and ${equipment[3] || 'construction equipment'}. Each load type has specific escort configuration requirements.`,
    },
  ];

  return (
    <>
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema
        items={[
          { name: 'Haul Command', url: baseUrl },
          { name: country.name, url: `${baseUrl}/${countrySlug}` },
          { name: city, url: `${baseUrl}/${countrySlug}/city/${citySlug}` },
          { name: localTerm, url: `${baseUrl}/${countrySlug}/city/${citySlug}/${serviceSlug}` },
        ]}
      />
      <ServiceSchema
        serviceName={`${localTerm} in ${city}, ${country.name}`}
        description={`Professional ${localTerm.toLowerCase()} services for ${country.terms.oversize_load.toLowerCase()} transport in ${city}, ${country.name}. Verified operators, competitive rates, instant availability.`}
        areaServed={`${city}, ${country.name}`}
        url={`${baseUrl}/${countrySlug}/city/${citySlug}/${serviceSlug}`}
      />

      <Navbar />

      <main className="min-h-screen bg-[#0a0e17]">
        {/* Hero — Goal Completion Focused */}
        <section className="relative pt-24 pb-16 bg-gradient-to-b from-accent/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">Haul Command</Link>
              <span className="text-slate-600">/</span>
              <Link href={`/${countrySlug}`} className="hover:text-white transition-colors">{country.flag} {country.name}</Link>
              <span className="text-slate-600">/</span>
              <Link href={`/${countrySlug}/city/${citySlug}`} className="hover:text-white transition-colors">{city}</Link>
              <span className="text-slate-600">/</span>
              <span className="text-white">{localTerm}</span>
            </nav>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
              {localTerm}
              <br />
              <span className="text-accent">in {city}, {country.name}</span>
            </h1>

            {/* Goal-completion copy — talks to the USER, not about HC */}
            <p className="text-lg text-slate-300 max-w-2xl mb-8 leading-relaxed">
              Moving an {country.terms.oversize_load.toLowerCase()} through {city}?
              Don&apos;t risk a citation or route delay. Get a verified {localTerm.toLowerCase()} operator
              on the road in under 2 hours. Compare rates from local professionals who know
              every bridge clearance, weigh station, and curfew window in the corridor.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/directory/${countrySlug}`}
                className="inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-yellow-500 text-black font-black rounded-xl transition-all shadow-lg shadow-accent/20 text-sm"
              >
                Find {localTerm} Operators in {city} →
              </Link>
              <Link
                href="/rates/calculator"
                className="inline-flex items-center justify-center px-6 py-4 border border-white/10 hover:border-accent/30 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Get Instant Rate Estimate
              </Link>
            </div>
          </div>
        </section>

        {/* What You Need to Know — Entity Authority Section */}
        <section className="py-16 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              {localTerm} Requirements in {city}
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 space-y-4">
              <p>
                {city} sits within one of {country.name}&apos;s most active {country.terms.oversize_load.toLowerCase()} corridors.
                Whether you&apos;re hauling {equipment.slice(0, 2).join(', ')}, or any oversized cargo through
                the metro area, you&apos;ll need to understand the local escort requirements before your wheels turn.
              </p>
              <p>
                In {country.name}, {localTerm.toLowerCase()} services are mandatory for loads exceeding standard
                dimension thresholds — typically {country.units === 'imperial' ? '8\'6" width for your first escort, with additional escorts required at 12\' or 14\' width depending on jurisdiction' : '2.55m width, with police escort requirements kicking in at 3.5m+ in most jurisdictions'}.
                {city}-specific regulations may impose time-of-day curfews, mandatory route surveys for first-time
                carriers, and bridge-by-bridge clearance verification.
              </p>
              <p>
                <Link href={`/requirements/${countrySlug}`} className="text-accent hover:underline font-semibold">
                  Check exact escort thresholds for {country.name} →
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Related Services — Entity Linking */}
        <section className="py-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white mb-8">
              Other {country.terms.oversize_load} Services in {city}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedServices.map((svc) => {
                const svcTerm = country.terms[svc.termKey] || svc.label;
                return (
                  <Link
                    key={svc.slug}
                    href={`/${countrySlug}/city/${citySlug}/${svc.slug}`}
                    className="group p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-accent/[0.03] hover:border-accent/20 transition-all"
                  >
                    <h3 className="text-white font-semibold group-hover:text-accent transition-colors mb-2">
                      {svcTerm}
                    </h3>
                    <p className="text-sm text-slate-400">
                      Professional {svcTerm.toLowerCase()} operators available now in {city}. Compare rates and availability.
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Equipment Commonly Hauled */}
        {equipment.length > 0 && (
          <section className="py-16 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="text-2xl font-bold text-white mb-8">
                Common Equipment Requiring {localTerm} in {city}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {equipment.map((equip) => (
                  <div key={equip} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center">
                    <span className="text-white text-sm font-medium capitalize">{equip}</span>
                    <div className="text-[10px] text-slate-500 mt-1">Transport escort</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="py-16 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white mb-8">
              FAQ — {localTerm} in {city}
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

        {/* Nearby Cities — Internal Linking Mesh */}
        {nearbyCities.length > 0 && (
          <section className="py-16 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="text-2xl font-bold text-white mb-8">
                {localTerm} in Nearby Cities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {nearbyCities.map((c) => (
                  <Link
                    key={c}
                    href={`/${countrySlug}/city/${slugifyCity(c)}/${serviceSlug}`}
                    className="group p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-accent/[0.03] hover:border-accent/20 transition-all"
                  >
                    <span className="text-sm text-slate-200 group-hover:text-white font-medium">{c}</span>
                    <span className="block text-xs text-slate-500 mt-1">{localTerm} →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA — Goal Completion */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20 rounded-2xl p-8 sm:p-10 text-center">
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
              Stop Searching. Start Moving.
            </h2>
            <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
              Your {country.terms.oversize_load.toLowerCase()} needs a {localTerm.toLowerCase()} in {city}.
              Get matched with a verified operator who knows the corridor, the curfews, and the clearances.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/claim" className="bg-accent text-black px-8 py-4 rounded-xl font-black text-sm hover:bg-yellow-500 transition-all shadow-[0_0_24px_rgba(245,159,10,0.3)]">
                List Your Company — Free
              </Link>
              <Link href={`/directory/${countrySlug}`} className="border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-white/5 transition-colors">
                Browse {city} Operators
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
