import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChevronRight } from 'lucide-react';

// /rates/[country]/[state] — State-level rate page
// e.g. /rates/us/tx, /rates/us/ca, /rates/ca/ab

interface Props { params: Promise<{ country: string; state: string }>; }

const STATE_NAMES: Record<string, string> = {
  tx:'Texas',ca:'California',fl:'Florida',ny:'New York',la:'Louisiana',oh:'Ohio',
  pa:'Pennsylvania',mt:'Montana',wy:'Wyoming',co:'Colorado',ga:'Georgia',wa:'Washington',
  or:'Oregon',az:'Arizona',nc:'North Carolina',sc:'South Carolina',tn:'Tennessee',
  al:'Alabama',ms:'Mississippi',ok:'Oklahoma',ks:'Kansas',ne:'Nebraska',ia:'Iowa',
  mo:'Missouri',il:'Illinois',in:'Indiana',mi:'Michigan',wi:'Wisconsin',mn:'Minnesota',
  nd:'North Dakota',sd:'South Dakota',nv:'Nevada',ut:'Utah',id:'Idaho',nm:'New Mexico',
  ak:'Alaska',hi:'Hawaii',me:'Maine',nh:'New Hampshire',vt:'Vermont',ma:'Massachusetts',
  ri:'Rhode Island',ct:'Connecticut',nj:'New Jersey',de:'Delaware',md:'Maryland',
  va:'Virginia',wv:'West Virginia',ky:'Kentucky',ar:'Arkansas',
  ab:'Alberta',bc:'British Columbia',on:'Ontario',qc:'Quebec',mb:'Manitoba',sk:'Saskatchewan',
};

const COUNTRY_META: Record<string, { name: string; currency: string; symbol: string }> = {
  us: { name: 'United States', currency: 'USD', symbol: '$' },
  ca: { name: 'Canada', currency: 'CAD', symbol: 'C$' },
  au: { name: 'Australia', currency: 'AUD', symbol: 'A$' },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, state } = await params;
  const stateName = STATE_NAMES[state.toLowerCase()] || state.toUpperCase();
  const countryMeta = COUNTRY_META[country.toLowerCase()];
  return {
    title: `${stateName} Pilot Car Rates 2026 — ${countryMeta?.currency || ''} Market Data | Haul Command`,
    description: `Current pilot car and escort vehicle day rates and per-mile benchmarks for ${stateName}. Real market intelligence for heavy haul transport.`,
    alternates: { canonical: `https://www.haulcommand.com/rates/${country}/${state}` },
  };
}

export default async function StateRatesPage({ params }: Props) {
  const { country, state } = await params;
  const cc = country.toLowerCase();
  const sc = state.toLowerCase();
  const stateName = STATE_NAMES[sc] || sc.toUpperCase();
  const countryMeta = COUNTRY_META[cc];

  const supabase = createClient();
  
  // Get state rate from hc_rates_public
  const { data: rates } = await supabase
    .from('hc_rates_public')
    .select('jurisdiction_slug, surface_type, rate_low, rate_mid, rate_high, currency_code, freshness_timestamp')
    .eq('country_slug', cc)
    .eq('jurisdiction_slug', sc);

  // Get national rate as fallback
  const { data: national } = await supabase
    .from('hc_rates_public')
    .select('rate_low, rate_mid, rate_high')
    .eq('country_slug', cc)
    .eq('jurisdiction_slug', 'national')
    .eq('surface_type', 'day_rate')
    .single();

  const dayRate = rates?.find(r => r.surface_type === 'day_rate');
  const mileRate = rates?.find(r => r.surface_type === 'per_mile');
  const sym = countryMeta?.symbol || '$';
  const curr = countryMeta?.currency || 'USD';

  // Get operators in this state
  const { data: operators } = await supabase
    .from('hc_global_operators')
    .select('id, name, slug, city, admin1_code, confidence_score, is_verified, is_claimed')
    .eq('admin1_code', sc.toUpperCase())
    .eq('country_code', cc.toUpperCase())
    .order('confidence_score', { ascending: false })
    .limit(8);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="max-w-5xl mx-auto px-4 pt-6 pb-2 flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/" className="hover:text-[#C6923A]">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/rates" className="hover:text-[#C6923A]">Rate Index</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/rates/${cc}`} className="hover:text-[#C6923A]">{countryMeta?.name || cc.toUpperCase()}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700">{stateName}</span>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">{stateName} Pilot Car Rates — 2026</h1>
        <p className="text-gray-500 mb-8">Market rate benchmarks for escort vehicle services in {stateName}. {curr} pricing.</p>

        {/* Rate Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-[#0B0F14] text-white rounded-2xl p-6">
            <p className="text-xs text-[#C6923A] font-bold uppercase tracking-widest mb-2">Day Rate — {stateName}</p>
            {dayRate ? (
              <>
                <p className="text-4xl font-black text-[#F1A91B]">{sym}{dayRate.rate_low}–{dayRate.rate_high}</p>
                <p className="text-gray-400 text-sm mt-1">Market mid: {sym}{dayRate.rate_mid}</p>
                <p className="text-xs text-emerald-400 mt-2 font-semibold">Live market data</p>
              </>
            ) : national ? (
              <>
                <p className="text-4xl font-black text-[#F1A91B]">{sym}{national.rate_low}–{national.rate_high}</p>
                <p className="text-gray-400 text-sm mt-1">National benchmark (state data pending)</p>
              </>
            ) : (
              <p className="text-gray-400">Market data loading</p>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Per-Mile Rate</p>
            {mileRate ? (
              <>
                <p className="text-4xl font-black text-[#C6923A]">{sym}{mileRate.rate_low}–{sym}{mileRate.rate_high}</p>
                <p className="text-gray-500 text-sm mt-1">Per mile driven</p>
              </>
            ) : (
              <>
                <p className="text-4xl font-black text-[#C6923A]">{sym}1.00–{sym}3.00</p>
                <p className="text-gray-400 text-sm mt-1">Typical range (varies by route)</p>
              </>
            )}
          </div>
        </div>

        {/* Rate factors */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <h2 className="font-black text-gray-900 mb-3">Factors Affecting {stateName} Rates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
            {[
              'State certification requirements (affects operator supply)',
              'Route technicality — mountain vs flat terrain',
              'High pole setup requirements',
              'Time of day / night move premium',
              'Day of week — Friday loads carry 30-45% premium',
              'Load dimensions and required escort count',
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#F1A91B] font-bold mt-0.5">✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Operators in state */}
        {(operators?.length ?? 0) > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-900">Verified Operators in {stateName}</h2>
              <Link href={`/directory/${cc}/${sc}`} className="text-sm font-semibold text-[#C6923A] hover:underline">See all →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {operators!.map((op: any) => (
                <Link key={op.id} href={`/directory/profile/${op.slug || op.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-[#F1A91B]/5 border border-gray-200 hover:border-[#F1A91B]/30 rounded-xl transition-all group">
                  <div>
                    <p className="font-bold text-sm text-gray-800 group-hover:text-[#C6923A]">{op.name}</p>
                    <p className="text-xs text-gray-500">{op.city ? `${op.city}, ` : ''}{op.admin1_code}</p>
                  </div>
                  {!op.is_claimed && (
                    <span className="text-[10px] text-amber-500 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded shrink-0">Unclaimed</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="bg-[#0B0F14] text-white rounded-2xl p-8 text-center">
          <h3 className="text-xl font-black mb-2">Find Escort Operators in {stateName}</h3>
          <p className="text-gray-400 text-sm mb-6">Claim your listing to appear in {stateName} rate and directory searches.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/directory/${cc}/${sc}`} className="px-6 py-3 bg-[#F1A91B] hover:bg-[#D4951A] text-black font-bold rounded-lg transition-colors">
              Find Escorts in {stateName}
            </Link>
            <Link href={`/rates/${cc}`} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-lg transition-colors">
              ← {countryMeta?.name || 'Country'} Rates
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
