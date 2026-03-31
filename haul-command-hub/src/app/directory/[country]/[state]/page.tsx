import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { RegionSponsorWaitlist } from '@/components/hc/RegionSponsorWaitlist';
import ComplianceCalculatorWrapper from '@/components/hc/ComplianceCalculatorWrapper';
import { getCountryConfig } from '@/lib/hc-loaders/geography';
import { supabaseServer } from '@/lib/supabase-server';
import { categoryLabel, categoryIcon, getCategorySynonyms } from '@/lib/directory-helpers';


// State slug → admin1_code mapping
const STATE_SLUG_TO_CODE: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new-hampshire': 'NH', 'new-jersey': 'NJ',
  'new-mexico': 'NM', 'new-york': 'NY', 'north-carolina': 'NC', 'north-dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode-island': 'RI',
  'south-carolina': 'SC', 'south-dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west-virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY',
  alberta: 'AB', 'british-columbia': 'BC', ontario: 'ON', saskatchewan: 'SK', yukon: 'YT',
  manitoba: 'MB', quebec: 'QC', 'nova-scotia': 'NS', 'new-brunswick': 'NB',
};

export const revalidate = 900;

type Props = {
  params: Promise<{ country: string; state: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Heuristic: category keys tend to have underscores (e.g. "escort_services", "truck_stops")
// State/province slugs use hyphens (e.g. "florida", "new-south-wales")
function looksLikeCategory(segment: string) {
  return segment.includes('_') || ['escort_services', 'truck_stops', 'weigh_stations', 'rest_areas',
    'ports', 'industrial', 'repair', 'staging'].some(cat => segment.startsWith(cat));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, state } = await params;
  const cc = getCountryConfig(country);
  if (!cc) return { title: 'Not Found' };

  if (looksLikeCategory(state)) {
    const cat = decodeURIComponent(state);
    return {
      title: `${categoryLabel(cat)} in ${cc.name} — HAUL COMMAND`,
      description: `Browse ${categoryLabel(cat).toLowerCase()} in ${cc.name}. Verified listings.`,
    };
  }

  const regionName = state.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    title:`${regionName}, ${cc.name} — Heavy Haul Directory`,
    description: `Browse pilot car operators, escort services, and heavy haul infrastructure in ${regionName}, ${cc.name}.`,
  };
}

export default async function DirectoryStateOrCategoryPage({ params, searchParams }: Props) {
  const { country, state } = await params;
  const sp = await searchParams;
  const cc = getCountryConfig(country);
  if (!cc) return notFound();
  const sb = supabaseServer();

  const isCategory = looksLikeCategory(state);

  if (isCategory) {
    // ─── CATEGORY VIEW ───
    const cat = decodeURIComponent(state);
    const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
    const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
    const PAGE_SIZE = 30;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = sb
      .from("hc_public_operators")
      .select("id, slug, name, entity_type, locality:city, admin1_code:state_code, updated_at", { count: "exact" })
      .in("entity_type", getCategorySynonyms(cat));

    if (cc.code !== 'ALL') query = query.eq("country_code", cc.code);

    const { data: rows, count } = await query
      .order("name", { ascending: true })
      .range(from, to);

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
      <>
        <Navbar />
        <main className="flex-grow max-w-7xl mx-auto px-4 py-12">
          <HCBreadcrumbs crumbs={[
            { label: 'Directory', href: '/directory' },
            { label: cc.name, href: `/directory/${country}` },
            { label: categoryLabel(cat), isCurrent: true },
          ]} />
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{categoryIcon(cat)}</span>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{categoryLabel(cat)}</h1>
          </div>
          <p className="text-gray-400 text-lg mb-8">
            {total > 0 ? `${total} listing${total !== 1 ? 's' : ''} in ${cc.name}` : `No listings yet in ${cc.name}`}
          </p>

          {total === 0 ? (
            <HCAlertSignupModule context={`${categoryLabel(cat)} in ${cc.name}`} />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(rows ?? []).map((p: any) => (
                  <Link key={p.id} href={`/place/${p.slug}`} className="block bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-accent/20 transition-all group">
                    <h3 className="text-white font-semibold group-hover:text-accent transition-colors truncate">{p.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{[p.locality, p.admin1_code].filter(Boolean).join(', ')}</p>
                  </Link>
                ))}
              </div>
              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-4 mt-10">
                  {page > 1 && <Link href={`/directory/${country}/${encodeURIComponent(cat)}?page=${page - 1}`} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-accent transition-all">← Previous</Link>}
                  <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                  {page < totalPages && <Link href={`/directory/${country}/${encodeURIComponent(cat)}?page=${page + 1}`} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-accent transition-all">Next →</Link>}
                </nav>
              )}
            </>
          )}
        </main>
      </>
    );
  }

  // ─── STATE/PROVINCE VIEW ───
  const regionName = state.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const { data: listings, count } = await sb
    .from('hc_public_operators')
    .select('id, slug, name, entity_type, locality:city, admin1_code:state_code, updated_at', { count: 'exact' })
    .eq('country_code', cc.code)
    .ilike('region_code', state.replace(/-/g, ' '))
    .order('updated_at', { ascending: false })
    .limit(50);

  const total = count ?? 0;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
      <HCBreadcrumbs crumbs={[
        { label: 'Directory', href: '/directory' },
        { label: cc.name, href: `/directory/${country}` },
        { label: regionName, isCurrent: true },
      ]} />
      <HCLocalIntroCopy
        h1={`${regionName}, ${cc.name}`}
        intro={total > 0 ? `${total} verified listing${total !== 1 ? 's' : ''} in ${regionName}.` : `Coverage for ${regionName} is being built.`}
        badge={`${cc.flag} ${regionName}`}
      />

      {total > 0 ? (
        <div className="space-y-3 mb-8">
          {(listings ?? []).map((p: any) => (
            <Link key={p.id} href={`/place/${p.slug}`} className="block bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-accent/20 transition-all group">
              <h3 className="text-white font-semibold group-hover:text-accent transition-colors">{p.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{[p.locality, p.admin1_code].filter(Boolean).join(', ')}</p>
            </Link>
          ))}
        </div>
      ) : (
        <HCAlertSignupModule context={`${regionName} directory`} />
      )}

      {/* Compliance Calculator — powered by live regulation data */}
      {STATE_SLUG_TO_CODE[state.toLowerCase()] && (
        <div className="mt-8 mb-8">
          <ComplianceCalculatorWrapper
            stateCode={STATE_SLUG_TO_CODE[state.toLowerCase()]}
            stateName={regionName}
            countryCode={cc.code}
          />
        </div>
      )}

      {/* Certification Link */}
      {STATE_SLUG_TO_CODE[state.toLowerCase()] && (
        <Link
          href={`/directory/${country}/${state}/certification`}
          className="block mt-4 mb-8 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-accent/20 transition-all group text-center"
        >
          <span className="text-2xl">📋</span>
          <h3 className="text-white font-bold mt-2 group-hover:text-accent transition-colors">
            {regionName} Pilot Car Certification Requirements
          </h3>
          <p className="text-gray-500 text-xs mt-1">Training hours, insurance, reciprocity, and application links →</p>
        </Link>
      )}

      <div className="mt-4 mb-8">
        <RegionSponsorWaitlist country={cc.name} regionName={regionName} />
      </div>

      <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link href={`/requirements/${country}`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all text-center">
          <span className="text-lg">📋</span><p className="text-xs text-gray-300 mt-1">Requirements</p>
        </Link>
        <Link href={`/rates/${country}`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all text-center">
          <span className="text-lg">💰</span><p className="text-xs text-gray-300 mt-1">Rates</p>
        </Link>
        <Link href={`/services/pilot-car-services/${country}`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all text-center">
          <span className="text-lg">🚛</span><p className="text-xs text-gray-300 mt-1">Services</p>
        </Link>
        <Link href={`/directory/${country}`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all text-center">
          <span className="text-lg">🗺️</span><p className="text-xs text-gray-300 mt-1">All {cc.name}</p>
        </Link>
        <Link href="/claim" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all text-center">
          <span className="text-lg">✅</span><p className="text-xs text-gray-300 mt-1">Claim Profile</p>
        </Link>
        <Link href="/corridors" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-accent/30 transition-all text-center">
          <span className="text-lg">🛤️</span><p className="text-xs text-gray-300 mt-1">Corridors</p>
        </Link>
      </section>
    </main>
  );
}
