import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { MapPin, Phone, Globe, Shield, ChevronRight, AlertCircle } from 'lucide-react';

interface Props { params: Promise<{ slug: string }>; }

const CATEGORY_LABELS: Record<string, string> = {
  truck_stop: 'Truck Stop', pilot_car: 'Pilot Car Operator', tire_shop: 'Truck Tire Shop',
  rest_area: 'Rest Area', truck_parking: 'Truck Parking', cat_scale: 'CAT Scale Location',
  motel_truck_parking: 'Truck-Friendly Motel', truck_dealer: 'Truck Dealer',
  heavy_equipment_dealer: 'Heavy Equipment Dealer', hotel: 'Truck-Friendly Hotel',
  tow_rotator: 'Rotator / Heavy Tow', restaurant_truck_parking: 'Restaurant with Truck Parking',
  oil_gas_facility: 'Oil & Gas Facility', port: 'Port / Marine Terminal',
  terminal: 'Intermodal Terminal', weigh_station: 'Weigh Station',
  fuel_station: 'Fuel Station', repair_shop: 'Truck Repair Shop',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();
  const { data } = await supabase.from('hc_places').select('name,locality,admin1_code,surface_category_key').eq('slug', slug).single();
  if (!data) return { title: 'Service Location | Haul Command' };
  const cat = CATEGORY_LABELS[data.surface_category_key] || 'Heavy Haul Service';
  const loc = [data.locality, data.admin1_code].filter(Boolean).join(', ');
  return {
    title: `${data.name} — ${cat} in ${loc} | Haul Command`,
    description: `${data.name} is a ${cat.toLowerCase()} serving heavy haul operators in ${loc}. View contact info, claim this listing, and connect with the Haul Command network.`,
    alternates: { canonical: `https://www.haulcommand.com/trucker-services/${slug}` },
    openGraph: { title: `${data.name} | Haul Command`, url: `https://www.haulcommand.com/trucker-services/${slug}` },
  };
}

export default async function TruckerServicePage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();
  const { data: place } = await supabase
    .from('hc_places')
    .select('id, slug, name, locality, admin1_code, country_code, lat, lng, phone, website, claim_status, demand_score, surface_category_key, address_line1, created_at')
    .eq('slug', slug)
    .single();

  if (!place) notFound();

  const catLabel = CATEGORY_LABELS[place.surface_category_key] || 'Heavy Haul Service';
  const location = [place.locality, place.admin1_code].filter(Boolean).join(', ');
  const isClaimed = place.claim_status === 'claimed' || place.claim_status === 'verified';
  const countrySlug = (place.country_code || 'us').toLowerCase();
  const stateSlug = (place.admin1_code || '').toLowerCase();

  const { data: nearby } = await supabase
    .from('hc_places')
    .select('slug, name, locality, admin1_code')
    .eq('surface_category_key', place.surface_category_key)
    .eq('admin1_code', place.admin1_code)
    .neq('slug', slug)
    .limit(6);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: place.name,
    description: `${catLabel} serving the heavy haul industry in ${location}.`,
    url: `https://www.haulcommand.com/trucker-services/${slug}`,
    telephone: place.phone || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: place.address_line1 || undefined,
      addressLocality: place.locality || undefined,
      addressRegion: place.admin1_code || undefined,
      addressCountry: place.country_code || 'US',
    },
    ...(place.lat && place.lng ? { geo: { '@type': 'GeoCoordinates', latitude: place.lat, longitude: place.lng } } : {}),
    ...(place.website ? { sameAs: [place.website] } : {}),
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="max-w-5xl mx-auto px-4 pt-6 pb-2 flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/" className="hover:text-[#C6923A]">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/trucker-services" className="hover:text-[#C6923A]">Trucker Services</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/directory/${countrySlug}/${stateSlug}`} className="hover:text-[#C6923A]">{place.admin1_code}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700 truncate max-w-[180px]">{place.name}</span>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <span className="inline-block px-2.5 py-1 bg-[#F1A91B]/10 text-[#C6923A] text-xs font-bold uppercase tracking-widest rounded-md mb-3">{catLabel}</span>
              <h1 className="text-3xl font-black text-gray-900 mb-2">{place.name}</h1>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <MapPin className="w-4 h-4 text-[#C6923A]" />
                <span>{location}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h2 className="font-bold text-gray-900 mb-4">Contact & Details</h2>
              <div className="space-y-3">
                {place.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-[#C6923A] shrink-0" />
                    <a href={`tel:${place.phone}`} className="text-sm font-medium text-gray-800 hover:text-[#C6923A]">{place.phone}</a>
                  </div>
                )}
                {place.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-[#C6923A] shrink-0" />
                    <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-sm text-[#C6923A] hover:underline truncate">{place.website.replace(/^https?:\/\//, '')}</a>
                  </div>
                )}
                {!place.phone && !place.website && (
                  <p className="text-sm text-gray-500 italic">Contact details not verified. Claim this listing to add your information.</p>
                )}
              </div>
            </div>

            {!isClaimed && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Is this your business?</p>
                  <p className="text-sm text-gray-600 mb-3">Claim this free listing to update your contact info, add certifications, and get discovered by brokers searching for {catLabel.toLowerCase()}s in {location}.</p>
                  <Link
                    href={`/claim?place=${place.id}&slug=${slug}&surface=trucker_services`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#F1A91B] hover:bg-[#D4951A] text-white font-bold text-sm rounded-lg transition-colors"
                  >
                    Claim This Listing Free →
                  </Link>
                </div>
              </div>
            )}

            {isClaimed && (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-800">Verified & Claimed Listing</span>
              </div>
            )}

            {(nearby?.length ?? 0) > 0 && (
              <div>
                <h2 className="font-black text-gray-900 mb-4">Other {catLabel}s in {place.admin1_code}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(nearby ?? []).map((n: any) => (
                    <Link key={n.slug} href={`/trucker-services/${n.slug}`} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-[#F1A91B]/5 border border-gray-200 hover:border-[#F1A91B]/30 rounded-xl transition-all group">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-[#C6923A]">{n.name}</p>
                        <p className="text-xs text-gray-500">{n.locality}, {n.admin1_code}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#F1A91B]" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="bg-[#0B0F14] text-white rounded-2xl p-5">
              <h3 className="font-black text-[#F1A91B] mb-1 text-sm uppercase tracking-widest">Haul Command Network</h3>
              <p className="text-sm text-gray-300 mb-4">Find verified pilot cars and escorts near {location}.</p>
              <Link href={`/directory/${countrySlug}/${stateSlug}`} className="block w-full text-center px-4 py-2.5 bg-[#F1A91B] hover:bg-[#D4951A] text-black font-bold text-sm rounded-lg transition-colors mb-2">
                Find Escorts in {place.admin1_code} →
              </Link>
              <Link href="/loads/post" className="block w-full text-center px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm rounded-lg transition-colors">
                Post a Load
              </Link>
            </div>

            <div className="border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Resources</h3>
              <div className="space-y-2">
                {[
                  { href: '/escort-requirements', label: 'Escort Requirements' },
                  { href: '/tools/permit-cost-calculator', label: 'Permit Calculator' },
                  { href: '/rates', label: 'Rate Index' },
                  { href: '/training', label: 'Get Certified' },
                  { href: '/loads', label: 'Load Board' },
                ].map(({ href, label }) => (
                  <Link key={href} href={href} className="flex items-center justify-between text-sm text-gray-600 hover:text-[#C6923A] transition-colors py-1">
                    <span>{label}</span><ChevronRight className="w-4 h-4" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
