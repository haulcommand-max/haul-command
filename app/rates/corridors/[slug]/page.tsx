import { Metadata } from 'next';
import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug).replace(/-/g, ' ');
  const title = `Pilot Car & Escort Rates: ${decoded.toUpperCase()} | Haul Command`;
  
  return {
    title,
    description: `Current 2026 pilot car rates, day rates, and escort vehicle costs for the ${decoded.toUpperCase()} heavy haul corridor. Regional data updated weekly.`,
    alternates: { canonical: `https://www.haulcommand.com/rates/corridors/${slug}` },
  };
}

export default async function CorridorRatePage({ params }: Props) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug).replace(/-/g, ' ');
  const titleCase = decoded.replace(/\b\w/g, l => l.toUpperCase());

  const supabase = getSupabaseAdmin();

  // ── Real rate data from rate_index table ──
  const { data: rateData } = await supabase
    .from('rate_index')
    .select('median_day_rate, median_per_mile, sample_size, last_computed_at, trend_30d')
    .eq('corridor_slug', slug)
    .single();

  // ── Provider count on this corridor ──
  const corridorStates = slug.split('-to-').map(s => s.replace(/-/g, ' '));
  const originState = corridorStates[0] ?? '';
  const { count: providerCount } = await supabase
    .from('hc_global_operators')
    .select('id', { count: 'exact', head: true })
    .ilike('admin1_code', `%${originState}%`);

  const hasData = rateData && rateData.median_day_rate > 0;
  const dayRate = hasData ? Math.round(rateData.median_day_rate) : null;
  const perMile = hasData ? rateData.median_per_mile.toFixed(2) : null;
  const sampleSize = rateData?.sample_size ?? 0;
  const trend = rateData?.trend_30d ?? 0;
  const trendLabel = trend > 2 ? '↑ Rising' : trend < -2 ? '↓ Falling' : '→ Stable';
  const trendColor = trend > 2 ? 'text-red-400' : trend < -2 ? 'text-green-400' : 'text-gray-400';
  const operators = providerCount ?? 0;

  // FAQ items for schema
  const faqItems = [
    { q: `How much does a pilot car cost on the ${titleCase} corridor?`, a: hasData ? `The current median day rate is $${dayRate} USD, or $${perMile}/mile, based on ${sampleSize} recent dispatches.` : `Rate data for this corridor is being collected. Contact operators directly for current quotes.` },
    { q: `How many escort operators are available on this route?`, a: `There are currently ${operators} registered operators in the ${originState} region. Availability varies by season and load type.` },
    { q: `What permits are required for oversize loads on this corridor?`, a: `Permit requirements vary by state. Most states on this corridor require oversize/overweight permits, and some impose curfew restrictions. Check our compliance section for details.` },
  ];

  return (
    <div className="min-h-screen bg-[#07090d] text-white">
      {/* JSON-LD: WebPage + FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": `Pilot Car Rates: ${titleCase}`,
              "description": `Current 2026 escort vehicle pricing on the ${titleCase} corridor.`,
              "url": `https://www.haulcommand.com/rates/corridors/${slug}`
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqItems.map(f => ({
                "@type": "Question",
                "name": f.q,
                "acceptedAnswer": { "@type": "Answer", "text": f.a }
              }))
            }
          ])
        }}
      />

      <nav className="border-b border-white/5 py-4 bg-[#0a0f16]">
        <div className="max-w-5xl mx-auto px-4 flex gap-2 text-xs font-semibold text-gray-500 uppercase tracking-widest">
          <Link href="/rates" className="hover:text-amber-400">All Rates</Link>
          <span>›</span>
          <span className="text-amber-500">{titleCase}</span>
        </div>
      </nav>

      <section className="py-20 px-4 border-b border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <div className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full mb-4 border border-amber-500/20 uppercase tracking-wider">
              Corridor Rate Intelligence
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight">
              {titleCase} <span className="text-gray-500 font-light">Rates</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
              {hasData
                ? `Based on ${sampleSize} recent dispatches. Rates ${trendLabel.toLowerCase()} over the last 30 days.`
                : 'Rate data for this corridor is being collected from active dispatches. Check back soon or request a direct quote.'}
            </p>
            {operators > 0 && (
              <p className="text-gray-500 text-sm mt-3">
                {operators} registered operator{operators > 1 ? 's' : ''} in the {originState} region
              </p>
            )}
          </div>

          <div className="w-full md:w-[400px] shrink-0 bg-[#0d131f] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10" />
            
            {hasData ? (
              <>
                <div className="mb-6">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Median Day Rate</span>
                  <div className="text-4xl font-black text-amber-400 mt-1">${dayRate} <span className="text-lg text-gray-500 font-medium tracking-normal">USD</span></div>
                  <span className={`text-xs font-semibold ${trendColor} mt-1 inline-block`}>{trendLabel} (30d)</span>
                </div>

                <div className="mb-8">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Median Per-Mile</span>
                  <div className="text-2xl font-black text-white mt-1">${perMile} <span className="text-sm text-gray-500 font-medium tracking-normal">/ mile</span></div>
                </div>

                <div className="text-xs text-gray-600 mb-4">
                  Based on {sampleSize} dispatches · Updated {rateData.last_computed_at ? new Date(rateData.last_computed_at).toLocaleDateString() : 'recently'}
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="text-gray-500 text-sm mb-4">Rate data not yet available for this corridor</div>
                <div className="text-xs text-gray-600">Data populates automatically as dispatches are recorded</div>
              </div>
            )}

            <Link href={`/directory?intent=corridor&route=${slug}`} className="block w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-white text-center font-bold text-sm tracking-wide rounded-xl transition-colors">
              Find Operators on this Route
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-b border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">What factors into this cost?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <h3 className="text-amber-400 font-bold mb-2">State Permits & Restrictions</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Crossing state lines often incurs varied permitting delays and curfews that extend the minimum job time.</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <h3 className="text-amber-400 font-bold mb-2">Hotel & Per Diem</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Most overnight corridors require minimum $100-$150 nightly hotel caps plus mileage backhaul fees.</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <h3 className="text-amber-400 font-bold mb-2">High-Pole Needs</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Requires certified height-pole vehicles which command a 15-20% rate premium locally.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section — matches JSON-LD */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqItems.map((faq, i) => (
              <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

