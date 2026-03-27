import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCMarketMaturityBanner } from '@/components/hc/MarketMaturityBanner';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { getCountryConfig, getMarketMaturity } from '@/lib/hc-loaders/geography';
import { getRatesBenchmark, computeRateRange } from '@/lib/hc-loaders/rates';
import { COUNTRIES } from '@/lib/seo-countries';

// Force dynamic — these pages query Supabase for rate benchmarks which
// times out during static builds when the DB is under load.
// Vercel's CDN handles caching automatically.
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ country: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const cc = getCountryConfig(country);
  if (!cc) return { title: 'Not Found' };
  return {
    title: `${cc.terms.escort_vehicle} Rates in ${cc.name} — HAUL COMMAND`,
    description: `Escort and pilot car rate benchmarks for ${cc.name}. See average rates, trends, and methodology.`,
  };
}

export default async function RatesCountryPage({ params }: Props) {
  const { country } = await params;
  const cc = getCountryConfig(country);
  if (!cc) return notFound();
  const maturity = await getMarketMaturity(cc.code);
  const rates = await getRatesBenchmark({ countryCode: cc.code });
  const range = computeRateRange(rates);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[{ label: 'Rates', href: '/rates' }, { label: cc.name, isCurrent: true }]} />
      <HCMarketMaturityBanner state={maturity} countryName={cc.name} />
      <HCLocalIntroCopy
        h1={`${cc.terms.escort_vehicle} Rates — ${cc.name}`}
        intro={range ? `Current benchmark: $${range.min}–$${range.max}/hr (avg $${range.avg}/hr). Based on ${rates.length} data points.` : `Rate data for ${cc.name} is being collected. Sign up to be notified.`}
        badge={`${cc.flag} ${cc.name}`}
      />
      {!range && <HCAlertSignupModule context={`${cc.name} rate data`} />}
      <section className="mt-8 flex flex-wrap gap-2">
        <Link href={`/requirements/${cc.slug}`} className="text-xs text-gray-500 hover:text-accent">Requirements →</Link>
        <Link href={`/directory/${cc.slug}`} className="text-xs text-gray-500 hover:text-accent">Directory →</Link>
        <Link href="/rates" className="text-xs text-gray-500 hover:text-accent">All Rates →</Link>
      </section>
    </main>
  );
}
