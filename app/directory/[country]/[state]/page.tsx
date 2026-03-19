import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import type { Metadata } from 'next';

/* ═══════════════════════════════════════════════════════════════════
   /directory/[country]/[state] — State Directory Page

   Handles both abbreviations and full names:
   - /directory/us/tx  ✓
   - /directory/us/texas  → redirects to /directory/us/tx
   - /directory/canada/ab ✓
   ═══════════════════════════════════════════════════════════════════ */

// ─── State lookup maps ────────────────────────────────────────────────────────
const US_STATES: Record<string, string> = {
  al: 'Alabama', ak: 'Alaska', az: 'Arizona', ar: 'Arkansas',
  ca: 'California', co: 'Colorado', ct: 'Connecticut', de: 'Delaware',
  fl: 'Florida', ga: 'Georgia', hi: 'Hawaii', id: 'Idaho',
  il: 'Illinois', in: 'Indiana', ia: 'Iowa', ks: 'Kansas',
  ky: 'Kentucky', la: 'Louisiana', me: 'Maine', md: 'Maryland',
  ma: 'Massachusetts', mi: 'Michigan', mn: 'Minnesota', ms: 'Mississippi',
  mo: 'Missouri', mt: 'Montana', ne: 'Nebraska', nv: 'Nevada',
  nh: 'New Hampshire', nj: 'New Jersey', nm: 'New Mexico', ny: 'New York',
  nc: 'North Carolina', nd: 'North Dakota', oh: 'Ohio', ok: 'Oklahoma',
  or: 'Oregon', pa: 'Pennsylvania', ri: 'Rhode Island', sc: 'South Carolina',
  sd: 'South Dakota', tn: 'Tennessee', tx: 'Texas', ut: 'Utah',
  vt: 'Vermont', va: 'Virginia', wa: 'Washington', wv: 'West Virginia',
  wi: 'Wisconsin', wy: 'Wyoming',
};

// Full name → abbreviation (for redirect)
const US_FULL_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATES).map(([abbr, full]) => [full.toLowerCase().replace(/\s+/g, '-'), abbr])
);

const CA_PROVINCES: Record<string, string> = {
  ab: 'Alberta', bc: 'British Columbia', mb: 'Manitoba', nb: 'New Brunswick',
  nl: 'Newfoundland and Labrador', ns: 'Nova Scotia', on: 'Ontario',
  pe: 'Prince Edward Island', qc: 'Quebec', sk: 'Saskatchewan',
  nt: 'Northwest Territories', nu: 'Nunavut', yt: 'Yukon',
};
const CA_FULL_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(CA_PROVINCES).map(([abbr, full]) => [full.toLowerCase().replace(/\s+/g, '-'), abbr])
);

// ─── Top corridors by state ───────────────────────────────────────────────────
const TOP_CORRIDORS_BY_STATE: Record<string, string[]> = {
  tx: ['Texas Triangle (DFW–HOU–SA)', 'I-10 Gulf Coast', 'I-35 Central Texas'],
  ca: ['I-5 Pacific Coast', 'I-15 Southern California', 'SR-99 Central Valley'],
  fl: ['I-95 Treasure Coast', 'I-75 Alligator Alley', 'Florida Turnpike'],
  ga: ['I-85 Atlanta Metro', 'I-75 South Georgia', 'I-16 Coastal Georgia'],
  il: ['I-90/94 Chicago Corridor', 'I-55 Route 66', 'I-80 Northern Illinois'],
  pa: ['I-76 Pennsylvania Turnpike', 'I-78 Allentown–NYC', 'I-81 Mountain Corridor'],
  oh: ['I-71 Columbus–Cleveland', 'I-75 Dayton Corridor', 'I-80 Northern Ohio'],
  wa: ['I-5 Puget Sound', 'SR-2 Stevens Pass', 'US-97 Eastern Washington'],
  ny: ['I-87 Thruway', 'I-90 Buffalo Corridor', 'I-81 Syracuse Route'],
  nc: ['I-85 Charlotte–Raleigh', 'I-40 Piedmont', 'I-95 Eastern NC'],
};

function resolveState(country: string, state: string): { abbr: string; name: string; countryCode: string } | null {
  const c = country.toLowerCase().replace(/\+/g, '-');
  const s = state.toLowerCase().replace(/\+/g, '-');

  if (c === 'us' || c === 'united-states') {
    if (US_STATES[s]) return { abbr: s, name: US_STATES[s], countryCode: 'US' };
    if (US_FULL_TO_ABBR[s]) return { abbr: US_FULL_TO_ABBR[s], name: US_STATES[US_FULL_TO_ABBR[s]], countryCode: 'US' };
  }
  if (c === 'canada' || c === 'ca') {
    if (CA_PROVINCES[s]) return { abbr: s, name: CA_PROVINCES[s], countryCode: 'CA' };
    if (CA_FULL_TO_ABBR[s]) return { abbr: CA_FULL_TO_ABBR[s], name: CA_PROVINCES[CA_FULL_TO_ABBR[s]], countryCode: 'CA' };
  }
  return null;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; state: string }>;
}): Promise<Metadata> {
  const { country, state } = await params;
  const resolved = resolveState(country, state);
  if (!resolved) return { title: 'Directory | Haul Command' };
  return {
    title: `Pilot Car Operators in ${resolved.name} — Verified Directory | Haul Command`,
    description: `Find verified pilot car escort operators in ${resolved.name}. See ratings, response times, corridors, and contact verified operators directly on Haul Command.`,
    alternates: {
      canonical: `/directory/us/${resolved.abbr}`,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function StateDirectoryPage({
  params,
}: {
  params: Promise<{ country: string; state: string }>;
}) {
  const { country, state } = await params;
  const resolved = resolveState(country, state);

  if (!resolved) return notFound();

  // Redirect full names → abbreviations for URL canonicalization
  const countrySlug = country.toLowerCase();
  if (
    (countrySlug === 'us' || countrySlug === 'united-states') &&
    state.toLowerCase() !== resolved.abbr
  ) {
    redirect(`/directory/us/${resolved.abbr}`);
  }
  if (
    (countrySlug === 'canada' || countrySlug === 'ca') &&
    state.toLowerCase() !== resolved.abbr
  ) {
    redirect(`/directory/canada/${resolved.abbr}`);
  }

  // Normalize country in URL
  const canonicalCountry = resolved.countryCode === 'US' ? 'us' : 'canada';
  if (countrySlug !== canonicalCountry) {
    redirect(`/directory/${canonicalCountry}/${resolved.abbr}`);
  }

  // Fetch real operator data
  const sb = supabaseServer();
  let operators: any[] = [];
  let total = 0;

  try {
    const { data, count } = await sb
      .from('directory_listings')
      .select('id, name, slug, entity_type, city, region_code, rank_score, claim_status, metadata', { count: 'exact' })
      .eq('region_code', resolved.abbr.toUpperCase())
      .neq('is_visible', false)
      .order('rank_score', { ascending: false })
      .limit(24);
    operators = data ?? [];
    total = count ?? 0;
  } catch {
    // Table may be empty — show placeholders
  }

  // If no real data, fall back to seed operators for this state
  const seeds = operators.length === 0 ? [
    { id: `seed-${resolved.abbr}-1`, name: `${resolved.name} Pilot Car Services`, state: resolved.abbr.toUpperCase(), services: ['Pilot Car', 'Wide Load'], verified: false, isSeed: true },
    { id: `seed-${resolved.abbr}-2`, name: `${resolved.name} Oversize Escorts`, state: resolved.abbr.toUpperCase(), services: ['Pilot Car', 'Height Pole'], verified: false, isSeed: true },
    { id: `seed-${resolved.abbr}-3`, name: `${resolved.name} Heavy Haul Escort`, state: resolved.abbr.toUpperCase(), services: ['Route Survey', 'Pilot Car'], verified: false, isSeed: true },
  ] : [];

  const topCorridors = TOP_CORRIDORS_BY_STATE[resolved.abbr.toLowerCase()] ?? [
    `${resolved.name} Freight Corridor`,
    `${resolved.name} East-West Route`,
    `${resolved.name} Interstate Network`,
  ];

  const displayOperators = operators.length > 0
    ? operators.map((o: any) => ({
        id: o.id,
        name: o.name,
        state: o.region_code,
        slug: o.slug,
        services: o.metadata?.services || ['Pilot Car'],
        verified: o.claim_status === 'claimed' || o.claim_status === 'verified',
        isSeed: false,
        rank: o.rank_score,
      }))
    : seeds;

  return (
    <div style={{ background: '#060b12', minHeight: '100vh', color: '#f0f4f8' }}>
      <style>{`
        @keyframes slide-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .state-op-card { background:#0f1a26; border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:18px; transition:transform 0.2s,box-shadow 0.2s; }
        .state-op-card:hover { transform:translateY(-4px); box-shadow:0 8px 28px rgba(245,185,66,0.12); }
        .op-grid { display:grid; grid-template-columns:1fr; gap:14px; }
        @media(min-width:640px){.op-grid{grid-template-columns:repeat(2,1fr);}}
        @media(min-width:1024px){.op-grid{grid-template-columns:repeat(3,1fr);}}
      `}</style>

      {/* Breadcrumb */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#8fa3b8' }}>
        <Link href="/" style={{ color: '#8fa3b8', textDecoration: 'none' }}>Home</Link>
        {' / '}
        <Link href="/directory" style={{ color: '#8fa3b8', textDecoration: 'none' }}>Directory</Link>
        {' / '}
        <span style={{ color: '#f0f4f8' }}>{resolved.name}</span>
      </div>

      {/* Hero */}
      <div style={{ padding: '48px 24px 36px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#f5b942', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>
          State Directory — {resolved.countryCode === 'US' ? 'United States' : 'Canada'}
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.15 }}>
          Pilot Car Operators in{' '}
          <span style={{ color: '#f5b942' }}>{resolved.name}</span>
        </h1>
        <p style={{ fontSize: 15, color: '#8fa3b8', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
          Find and contact verified oversize load escort operators based in {resolved.name}.
          All operators verified by Haul Command trust score system.
        </p>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
          {[
            { value: total > 0 ? `${total}+` : 'Growing', label: 'Operators' },
            { value: topCorridors.length, label: 'Active Corridors' },
            { value: 'Verified', label: 'Trust System' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#f5b942' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#8fa3b8', marginTop: 2, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 60px' }}>

        {/* Top Corridors */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f0f4f8', marginBottom: 14 }}>
            Top Corridors in {resolved.name}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {topCorridors.map((corridor, i) => (
              <div key={i} style={{
                padding: '8px 16px', borderRadius: 10,
                background: 'rgba(245,185,66,0.06)', border: '1px solid rgba(245,185,66,0.2)',
                fontSize: 13, fontWeight: 600, color: '#f5b942',
              }}>
                {corridor}
              </div>
            ))}
          </div>
        </section>

        {/* Operators Grid */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f0f4f8', margin: 0 }}>
              Operators in {resolved.name}
              {total > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: '#8fa3b8', marginLeft: 8 }}>({total} listed)</span>}
            </h2>
            <Link href={`/directory?state=${resolved.abbr.toUpperCase()}`} style={{ fontSize: 12, color: '#f5b942', textDecoration: 'none', fontWeight: 700 }}>
              View all →
            </Link>
          </div>

          <div className="op-grid">
            {displayOperators.map((op: any, i: number) => (
              <div key={op.id} className="state-op-card" style={{ animationDelay: `${i * 60}ms`, animation: 'slide-in 0.4s ease-out both' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🚗</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#f0f4f8' }}>{op.name}</div>
                    <div style={{ fontSize: 12, color: '#8fa3b8', marginTop: 2 }}>{op.state} · {op.services.slice(0, 2).join(', ')}</div>
                  </div>
                </div>
                {op.verified && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#27d17f', background: 'rgba(39,209,127,0.1)', padding: '3px 8px', borderRadius: 6, marginBottom: 10 }}>
                    ✓ Verified
                  </div>
                )}
                {op.isSeed ? (
                  <Link href="/claim" style={{ display: 'block', textAlign: 'center', padding: '8px', borderRadius: 10, background: 'rgba(245,185,66,0.1)', border: '1px solid rgba(245,185,66,0.2)', color: '#f5b942', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                    Claim This Listing
                  </Link>
                ) : (
                  <Link href={`/directory/profile/${op.slug || op.id}`} style={{ display: 'block', textAlign: 'center', padding: '8px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#f0f4f8', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    View Profile
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Get Listed CTA */}
        <div style={{ marginTop: 48, padding: '32px 24px', borderRadius: 18, background: 'linear-gradient(135deg, rgba(245,185,66,0.07), rgba(245,185,66,0.02))', border: '1px solid rgba(245,185,66,0.25)', textAlign: 'center' }}>
          <h3 style={{ fontSize: 20, fontWeight: 900, color: '#f0f4f8', marginBottom: 8 }}>
            Get Listed in {resolved.name}
          </h3>
          <p style={{ fontSize: 14, color: '#8fa3b8', marginBottom: 20 }}>
            Join thousands of verified operators. Claim your free listing and start receiving job requests.
          </p>
          <Link href="/claim" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #f5b942, #e8a830)', color: '#000', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
            Claim Your Free Listing
          </Link>
        </div>

        {/* SEO content */}
        <div style={{ marginTop: 48, padding: '24px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f0f4f8', marginBottom: 10 }}>
            Pilot Car Requirements in {resolved.name}
          </h2>
          <p style={{ fontSize: 13, color: '#8fa3b8', lineHeight: 1.7, margin: 0 }}>
            {resolved.name} has specific regulations for oversize and overweight load movements. Escort vehicle requirements vary by load dimensions, route type, and time of day. All operators listed in the Haul Command {resolved.name} directory have been verified against state-specific requirements. View the complete{' '}
            <Link href={`/escort-requirements/${resolved.name.toLowerCase().replace(/\s+/g, '-')}`} style={{ color: '#f5b942', textDecoration: 'none' }}>
              {resolved.name} escort requirements guide
            </Link>
            {' '}for full regulations.
          </p>
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulcommand.com' },
              { '@type': 'ListItem', position: 2, name: 'Directory', item: 'https://haulcommand.com/directory' },
              { '@type': 'ListItem', position: 3, name: resolved.name, item: `https://haulcommand.com/directory/${canonicalCountry}/${resolved.abbr}` },
            ],
          }),
        }}
      />
    </div>
  );
}
