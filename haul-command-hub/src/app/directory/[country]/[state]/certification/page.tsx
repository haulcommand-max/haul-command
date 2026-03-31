import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { RegionSponsorWaitlist } from '@/components/hc/RegionSponsorWaitlist';
import { getCountryConfig } from '@/lib/hc-loaders/geography';
import { supabaseServer } from '@/lib/supabase-server';

export const revalidate = 3600; // 1 hour ISR

type Props = {
  params: Promise<{ country: string; state: string }>;
};

// ── State code mapping ──
const STATE_NAME_TO_CODE: Record<string, string> = {
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
  // Canadian provinces
  alberta: 'AB', 'british-columbia': 'BC', ontario: 'ON', saskatchewan: 'SK', yukon: 'YT',
  manitoba: 'MB', quebec: 'QC', 'nova-scotia': 'NS', 'new-brunswick': 'NB',
};

function toRegionName(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, state } = await params;
  const cc = getCountryConfig(country);
  if (!cc) return { title: 'Not Found' };
  const regionName = toRegionName(state);

  return {
    title: `${regionName} Pilot Car Certification Requirements — HAUL COMMAND`,
    description: `Complete guide to pilot car and escort vehicle certification requirements in ${regionName}, ${cc.name}. Training hours, insurance minimums, reciprocity, renewal periods, and application links.`,
  };
}

export default async function CertificationPage({ params }: Props) {
  const { country, state } = await params;
  const cc = getCountryConfig(country);
  if (!cc) return notFound();

  const stateCode = STATE_NAME_TO_CODE[state.toLowerCase()] || state.toUpperCase();
  const regionName = toRegionName(state);
  const sb = supabaseServer();

  // Fetch certification data
  const { data: cert } = await sb
    .from('hc_certification_requirements')
    .select('*')
    .eq('country_code', cc.code)
    .eq('admin1_code', stateCode)
    .single();

  // Fetch regulation data for the side panel
  const { data: reg } = await sb
    .from('hc_jurisdiction_regulations')
    .select('max_width_ft, max_height_ft, max_length_ft, max_weight_lbs, source_url')
    .eq('country_code', cc.code)
    .eq('admin1_code', stateCode)
    .single();

  const hasCert = !!cert;
  const reciprocityStates = cert?.reciprocity_states || [];

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
        <HCBreadcrumbs crumbs={[
          { label: 'Directory', href: '/directory' },
          { label: cc.name, href: `/directory/${country}` },
          { label: regionName, href: `/directory/${country}/${state}` },
          { label: 'Certification', isCurrent: true },
        ]} />

        {/* Hero */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-accent/10 border border-accent/20 text-accent text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              📋 Certification Guide
            </span>
            {hasCert && (
              <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                VERIFIED DATA
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-3">
            {regionName} <span className="text-accent">Pilot Car Certification</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl">
            {hasCert
              ? `Everything you need to know about pilot car and escort vehicle certification in ${regionName}. Training requirements, insurance minimums, reciprocity agreements, and official application links.`
              : `Certification data for ${regionName} is being compiled. Below you will find the regulatory limits and general guidance for this jurisdiction.`
            }
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {hasCert ? (
              <>
                {/* Requirements Overview */}
                <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.06]">
                    <h2 className="text-white font-black text-lg">Requirements Overview</h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="bg-white/[0.03] rounded-xl p-4 text-center">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Certification Required</p>
                        <p className={`text-2xl font-black mt-2 ${cert.requires_certification ? 'text-red-400' : 'text-green-400'}`}>
                          {cert.requires_certification ? 'YES' : 'NO'}
                        </p>
                      </div>
                      {cert.min_age && (
                        <div className="bg-white/[0.03] rounded-xl p-4 text-center">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Minimum Age</p>
                          <p className="text-2xl font-black text-white mt-2">{cert.min_age}</p>
                        </div>
                      )}
                      {cert.training_hours && (
                        <div className="bg-white/[0.03] rounded-xl p-4 text-center">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Training Hours</p>
                          <p className="text-2xl font-black text-accent mt-2">{cert.training_hours}</p>
                        </div>
                      )}
                      {cert.insurance_min_usd && (
                        <div className="bg-white/[0.03] rounded-xl p-4 text-center">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Insurance Min</p>
                          <p className="text-2xl font-black text-white mt-2">
                            ${Number(cert.insurance_min_usd).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {cert.renewal_period_years && (
                        <div className="bg-white/[0.03] rounded-xl p-4 text-center">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Renewal Period</p>
                          <p className="text-2xl font-black text-white mt-2">{cert.renewal_period_years} yr</p>
                        </div>
                      )}
                      {cert.certification_cost_usd && (
                        <div className="bg-white/[0.03] rounded-xl p-4 text-center">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Cert Cost</p>
                          <p className="text-2xl font-black text-white mt-2">
                            ${Number(cert.certification_cost_usd).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Reciprocity */}
                {reciprocityStates.length > 0 && (
                  <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/[0.06]">
                      <h2 className="text-white font-black text-lg">🤝 Reciprocity Agreements</h2>
                      <p className="text-gray-500 text-xs mt-1">
                        {regionName} recognizes pilot car certifications from these states
                      </p>
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap gap-2">
                        {reciprocityStates.map((s: string) => (
                          <span key={s} className="bg-accent/10 border border-accent/20 text-accent px-3 py-1.5 rounded-lg text-xs font-bold">
                            {s}
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-500 text-xs mt-4">
                        This means if you hold a valid certification from any of these states, 
                        {regionName} may accept it without requiring additional testing.
                        Always verify current reciprocity status with the state DOT.
                      </p>
                    </div>
                  </section>
                )}

                {/* Official Links */}
                {(cert.training_urls?.length > 0 || cert.application_urls?.length > 0) && (
                  <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/[0.06]">
                      <h2 className="text-white font-black text-lg">🔗 Official Resources</h2>
                    </div>
                    <div className="p-6 space-y-3">
                      {cert.training_urls?.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-accent/30 transition-all group">
                          <span className="text-lg">📚</span>
                          <div className="flex-grow">
                            <p className="text-white text-sm font-semibold group-hover:text-accent transition-colors">Training Program</p>
                            <p className="text-gray-500 text-xs truncate">{url}</p>
                          </div>
                          <span className="text-gray-600 group-hover:text-accent transition-colors text-sm">↗</span>
                        </a>
                      ))}
                      {cert.application_urls?.map((url: string, i: number) => (
                        <a key={`app-${i}`} href={url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-accent/30 transition-all group">
                          <span className="text-lg">📝</span>
                          <div className="flex-grow">
                            <p className="text-white text-sm font-semibold group-hover:text-accent transition-colors">Application Form</p>
                            <p className="text-gray-500 text-xs truncate">{url}</p>
                          </div>
                          <span className="text-gray-600 group-hover:text-accent transition-colors text-sm">↗</span>
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                {/* Special Notes */}
                {cert.special_notes && (
                  <section className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                    <h3 className="text-amber-400 font-black text-sm mb-2">📝 Special Notes</h3>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{cert.special_notes}</p>
                  </section>
                )}
              </>
            ) : (
              /* No Certification Data */
              <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">📋</div>
                <h2 className="text-white font-bold text-xl mb-2">Certification Data Coming Soon</h2>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  We are actively compiling certification requirements for {regionName}. 
                  Sign up below to be notified when this data becomes available.
                </p>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Regulation Quick Reference */}
            {reg && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <h3 className="text-white font-black text-sm">📏 {regionName} Legal Limits</h3>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { icon: '↔️', label: 'Width', value: reg.max_width_ft, unit: "'" },
                    { icon: '↕️', label: 'Height', value: reg.max_height_ft, unit: "'" },
                    { icon: '↔️', label: 'Length', value: reg.max_length_ft, unit: "'" },
                    { icon: '⚖️', label: 'Weight', value: reg.max_weight_lbs, unit: ' lbs' },
                  ].map(d => (
                    <div key={d.label} className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">{d.icon} {d.label}</span>
                      <span className="text-white font-bold text-sm">
                        {d.value ? `${d.value.toLocaleString()}${d.unit}` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h3 className="text-white font-black text-sm">🔗 Related Pages</h3>
              </div>
              <div className="p-5 space-y-2">
                <Link href={`/directory/${country}/${state}`}
                  className="block text-sm text-gray-300 hover:text-accent transition-colors py-1">
                  📂 {regionName} Directory
                </Link>
                <Link href="/tools/escort-calculator"
                  className="block text-sm text-gray-300 hover:text-accent transition-colors py-1">
                  🧮 Escort Calculator
                </Link>
                <Link href={`/requirements/${country}`}
                  className="block text-sm text-gray-300 hover:text-accent transition-colors py-1">
                  📋 {cc.name} Requirements
                </Link>
                <Link href="/tools/compliance-card"
                  className="block text-sm text-gray-300 hover:text-accent transition-colors py-1">
                  🪪 Compliance Card
                </Link>
              </div>
            </div>

            {/* Sponsor Waitlist */}
            <RegionSponsorWaitlist country={cc.name} regionName={regionName} />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-10 bg-white/[0.01] border border-white/[0.04] rounded-xl p-4 text-center">
          <p className="text-gray-600 text-[10px]">
            Data sourced from publicly available resources including WideLoadShipping.com.
            Requirements may change. Always verify with the {regionName} DOT or relevant state authority before operating.
            Last verified: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
          </p>
        </div>
      </main>
    </>
  );
}
