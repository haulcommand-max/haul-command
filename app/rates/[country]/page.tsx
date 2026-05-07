import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChevronRight, TrendingUp, MapPin, DollarSign } from 'lucide-react';

// /rates/[country] — Country-level rate index page
// Wired to hc_rates_public DB with real market benchmarks

interface Props { params: Promise<{ country: string }>; }

const COUNTRY_META: Record<string, { name: string; flag: string; currency: string; symbol: string; localTerm: string }> = {
  us: { name: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$', localTerm: 'Pilot Car' },
  ca: { name: 'Canada', flag: '🇨🇦', currency: 'CAD', symbol: 'C$', localTerm: 'Pilot Vehicle' },
  au: { name: 'Australia', flag: '🇦🇺', currency: 'AUD', symbol: 'A$', localTerm: 'Pilot Vehicle' },
  gb: { name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£', localTerm: 'Escort Vehicle' },
  nz: { name: 'New Zealand', flag: '🇳🇿', currency: 'NZD', symbol: 'NZ$', localTerm: 'Pilot Vehicle' },
  za: { name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', symbol: 'R', localTerm: 'Abnormal Load Escort' },
  de: { name: 'Germany', flag: '🇩🇪', currency: 'EUR', symbol: '€', localTerm: 'Schwertransport Begleitfahrzeug' },
  nl: { name: 'Netherlands', flag: '🇳🇱', currency: 'EUR', symbol: '€', localTerm: 'Begeleiding' },
  ae: { name: 'UAE', flag: '🇦🇪', currency: 'AED', symbol: 'AED', localTerm: 'Escort Vehicle' },
  br: { name: 'Brazil', flag: '🇧🇷', currency: 'BRL', symbol: 'R$', localTerm: 'Veículo Batedeira' },
};

const US_STATES: { code: string; name: string }[] = [
  { code: 'tx', name: 'Texas' }, { code: 'ca', name: 'California' }, { code: 'fl', name: 'Florida' },
  { code: 'ny', name: 'New York' }, { code: 'la', name: 'Louisiana' }, { code: 'oh', name: 'Ohio' },
  { code: 'pa', name: 'Pennsylvania' }, { code: 'mt', name: 'Montana' }, { code: 'wy', name: 'Wyoming' },
  { code: 'co', name: 'Colorado' }, { code: 'ga', name: 'Georgia' }, { code: 'wa', name: 'Washington' },
  { code: 'or', name: 'Oregon' }, { code: 'az', name: 'Arizona' }, { code: 'nc', name: 'North Carolina' },
  { code: 'sc', name: 'South Carolina' }, { code: 'tn', name: 'Tennessee' }, { code: 'al', name: 'Alabama' },
  { code: 'ms', name: 'Mississippi' }, { code: 'ok', name: 'Oklahoma' }, { code: 'ks', name: 'Kansas' },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const meta = COUNTRY_META[country.toLowerCase()];
  if (!meta) return { title: 'Rate Index | Haul Command' };
  return {
    title: `${meta.name} Pilot Car & Escort Rates 2026 | Haul Command`,
    description: `Current ${meta.localTerm.toLowerCase()} day rates and per-mile benchmarks across ${meta.name}. Real market data for heavy haul transport.`,
    alternates: { canonical: `https://www.haulcommand.com/rates/${country}` },
  };
}

export default async function CountryRatesPage({ params }: Props) {
  const { country } = await params;
  const cc = country.toLowerCase();
  const meta = COUNTRY_META[cc];
  if (!meta) notFound();

  const supabase = createClient();
  const { data: rates } = await supabase
    .from('hc_rates_public')
    .select('jurisdiction_slug, surface_type, rate_low, rate_mid, rate_high, currency_code, freshness_timestamp, corridor_slug')
    .eq('country_slug', cc)
    .order('surface_type');

  const nationalDay = rates?.find(r => r.jurisdiction_slug === 'national' && r.surface_type === 'day_rate');
  const nationalMile = rates?.find(r => r.jurisdiction_slug === 'national' && r.surface_type === 'per_mile');
  const stateRates = rates?.filter(r => r.jurisdiction_slug && r.jurisdiction_slug !== 'national' && !r.corridor_slug && r.surface_type === 'day_rate') || [];
  const corridorRates = rates?.filter(r => r.corridor_slug) || [];

  return (
    <div className="min-h-screen min-h-screen">
      {/* Breadcrumb */}
      <nav className="max-w-5xl mx-auto px-4 pt-6 pb-2 flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/" className="hover:text-[#C6923A]">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/rates" className="hover:text-[#C6923A]">Rate Index</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700">{meta.flag} {meta.name}</span>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <span className="text-3xl mr-3">{meta.flag}</span>
          <h1 className="inline text-3xl font-black text-gray-900">{meta.name} Pilot Car & Escort Rates — 2026</h1>
          <p className="text-gray-500 mt-2">Market benchmarks for {meta.localTerm.toLowerCase()} services. {meta.currency} pricing.</p>
        </div>

        {/* National Rates */}
        {(nationalDay || nationalMile) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {nationalDay && (
              <div className="bg-[#0B0F14] text-white rounded-2xl p-6">
                <p className="text-xs text-[#C6923A] font-bold uppercase tracking-widest mb-2">National Day Rate</p>
                <p className="text-4xl font-black text-[#F1A91B]">{meta.symbol}{nationalDay.rate_low}–{nationalDay.rate_high}</p>
                <p className="text-gray-400 text-sm mt-1">Mid: {meta.symbol}{nationalDay.rate_mid}</p>
                <p className="text-xs text-gray-600 mt-2">Live market data</p>
              </div>
            )}
            {nationalMile && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Per-Mile Rate</p>
                <p className="text-4xl font-black text-[#C6923A]">{meta.symbol}{nationalMile.rate_low}–{meta.symbol}{nationalMile.rate_high}</p>
                <p className="text-gray-500 text-sm mt-1">Per mile</p>
                <p className="text-xs text-gray-400 mt-2">Live market data</p>
              </div>
            )}
          </div>
        )}

        {/* State / Jurisdiction rates */}
        {(stateRates.length > 0 || (cc === 'us' && US_STATES.length > 0)) && (
          <div className="mb-8">
            <h2 className="text-xl font-black text-gray-900 mb-4">
              {cc === 'us' ? 'Rates by State' : 'Rates by Region'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {cc === 'us' ? US_STATES.map(state => {
                const dbRate = stateRates.find(r => r.jurisdiction_slug === state.code);
                return (
                  <Link key={state.code} href={`/rates/${cc}/${state.code}`}
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-[#F1A91B]/5 border border-gray-200 hover:border-[#F1A91B]/30 rounded-xl transition-all group">
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-[#C6923A] text-sm">{state.name}</p>
                      {dbRate ? (
                        <p className="text-xs text-[#C6923A] font-semibold">{meta.symbol}{dbRate.rate_low}–{dbRate.rate_high}/day</p>
                      ) : (
                        <p className="text-xs text-gray-400">View rates →</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#F1A91B]" />
                  </Link>
                );
              }) : stateRates.map(r => (
                <div key={r.jurisdiction_slug} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="font-bold text-gray-900 text-sm uppercase">{r.jurisdiction_slug}</p>
                  <p className="text-sm text-[#C6923A] font-semibold">{meta.symbol}{r.rate_low}–{r.rate_high}/day</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Corridor rates */}
        {corridorRates.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-black text-gray-900 mb-4">Corridor Rates</h2>
            <div className="space-y-3">
              {corridorRates.map(r => (
                <div key={r.corridor_slug} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{r.corridor_slug?.replace(/-/g,' ').toUpperCase()}</p>
                    <p className="text-xs text-gray-500">Per-mile rate</p>
                  </div>
                  <p className="font-black text-[#C6923A]">{meta.symbol}{r.rate_low}–{meta.symbol}{r.rate_high}/mi</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-[#0B0F14] text-white rounded-2xl p-8 text-center">
          <h3 className="text-xl font-black mb-2">Find Verified Escorts in {meta.name}</h3>
          <p className="text-gray-400 text-sm mb-6">7,700+ verified operators. Claim your listing to appear in rate-based searches.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/directory/${cc}`} className="px-6 py-3 bg-[#F1A91B] hover:bg-[#D4951A] text-black font-bold rounded-lg transition-colors">
              Find Escorts in {meta.name}
            </Link>
            <Link href="/claim" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-lg transition-colors">
              Claim Your Listing
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
