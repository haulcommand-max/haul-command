import React from 'react';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import {
  Globe, MapPin, Users, TrendingUp, Shield, ArrowRight,
  ShieldCheck, Zap, CheckCircle, Flag,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   /directory/[country] — Country-level Directory Landing Pages
   High-value SEO targets for Tier A countries
   ═══════════════════════════════════════════════════════════════════ */

interface Props {
  params: Promise<{ country: string }>;
}

interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  tier: 'A' | 'B' | 'C';
  states: { abbr: string; name: string }[];
  compliance: string;
  corridors: string[];
  seedOperators: number;
}

const TIER_A_COUNTRIES: Record<string, CountryConfig> = {
  us: {
    code: 'US', name: 'United States', flag: '🇺🇸', tier: 'A',
    states: [
      { abbr: 'TX', name: 'Texas' }, { abbr: 'CA', name: 'California' }, { abbr: 'FL', name: 'Florida' },
      { abbr: 'OH', name: 'Ohio' }, { abbr: 'PA', name: 'Pennsylvania' }, { abbr: 'IL', name: 'Illinois' },
      { abbr: 'GA', name: 'Georgia' }, { abbr: 'NC', name: 'North Carolina' }, { abbr: 'MI', name: 'Michigan' },
      { abbr: 'NY', name: 'New York' }, { abbr: 'AZ', name: 'Arizona' }, { abbr: 'WA', name: 'Washington' },
      { abbr: 'IN', name: 'Indiana' }, { abbr: 'TN', name: 'Tennessee' }, { abbr: 'MO', name: 'Missouri' },
      { abbr: 'LA', name: 'Louisiana' }, { abbr: 'OK', name: 'Oklahoma' }, { abbr: 'AL', name: 'Alabama' },
    ],
    compliance: 'FHWA requires pilot car escorts for loads exceeding 12ft wide in most states. Night movement restrictions apply broadly. State DOTs issue OS/OW permits.',
    corridors: ['I-10 Gulf Coast', 'I-35 Central', 'I-40 Cross-Country', 'I-75 Southeast', 'I-20 Southern', 'I-95 East Coast'],
    seedOperators: 4200,
  },
  ca: {
    code: 'CA', name: 'Canada', flag: '🇨🇦', tier: 'A',
    states: [
      { abbr: 'ON', name: 'Ontario' }, { abbr: 'AB', name: 'Alberta' }, { abbr: 'BC', name: 'British Columbia' },
      { abbr: 'QC', name: 'Quebec' }, { abbr: 'SK', name: 'Saskatchewan' }, { abbr: 'MB', name: 'Manitoba' },
    ],
    compliance: 'Transport Canada oversees heavy load regulations. Provincial permits required for oversize loads. Pilot car requirements vary by province.',
    corridors: ['Trans-Canada Highway', 'Highway 401', 'Highway 2 Alberta'],
    seedOperators: 820,
  },
  au: {
    code: 'AU', name: 'Australia', flag: '🇦🇺', tier: 'A',
    states: [
      { abbr: 'NSW', name: 'New South Wales' }, { abbr: 'VIC', name: 'Victoria' }, { abbr: 'QLD', name: 'Queensland' },
      { abbr: 'WA', name: 'Western Australia' }, { abbr: 'SA', name: 'South Australia' },
    ],
    compliance: 'NHVR manages oversize vehicle permits nationally. State-specific pilot vehicle requirements. Class 1 and Class 2 OSOM frameworks.',
    corridors: ['Pacific Highway', 'Hume Highway', 'Stuart Highway'],
    seedOperators: 450,
  },
  gb: {
    code: 'GB', name: 'United Kingdom', flag: '🇬🇧', tier: 'A',
    states: [
      { abbr: 'ENG', name: 'England' }, { abbr: 'SCT', name: 'Scotland' }, { abbr: 'WLS', name: 'Wales' },
    ],
    compliance: 'DVSA regulates abnormal loads. ESDAL notification system required. Police escort for largest category movements.',
    corridors: ['M1 Corridor', 'M6 Corridor', 'A1 North'],
    seedOperators: 210,
  },
  nz: {
    code: 'NZ', name: 'New Zealand', flag: '🇳🇿', tier: 'A',
    states: [
      { abbr: 'AKL', name: 'Auckland Region' }, { abbr: 'WGN', name: 'Wellington Region' }, { abbr: 'CAN', name: 'Canterbury' },
    ],
    compliance: 'Waka Kotahi NZ Transport Agency issues overlength and overweight permits. Pilot vehicle requirements for loads over-dimension.',
    corridors: ['State Highway 1', 'State Highway 2'],
    seedOperators: 85,
  },
  za: {
    code: 'ZA', name: 'South Africa', flag: '🇿🇦', tier: 'A',
    states: [
      { abbr: 'GP', name: 'Gauteng' }, { abbr: 'WC', name: 'Western Cape' }, { abbr: 'KZN', name: 'KwaZulu-Natal' },
    ],
    compliance: 'National Road Traffic Act governs abnormal load permits. Provincial road authorities issue specific routes. Escort requirements based on load dimensions.',
    corridors: ['N1 Johannesburg-Cape Town', 'N3 Durban Corridor', 'N4 Maputo Corridor'],
    seedOperators: 120,
  },
  de: {
    code: 'DE', name: 'Germany', flag: '🇩🇪', tier: 'A',
    states: [
      { abbr: 'NRW', name: 'North Rhine-Westphalia' }, { abbr: 'BAV', name: 'Bavaria' }, { abbr: 'BW', name: 'Baden-Württemberg' },
    ],
    compliance: 'StVO regulations govern Schwertransport permits. BF3/BF4 escort categories. Federal highway authority (BASt) coordinates oversized loads.',
    corridors: ['A1 Hamburg-Cologne', 'A7 North-South', 'A3 Rhine Corridor'],
    seedOperators: 180,
  },
  nl: {
    code: 'NL', name: 'Netherlands', flag: '🇳🇱', tier: 'A',
    states: [
      { abbr: 'NH', name: 'North Holland' }, { abbr: 'ZH', name: 'South Holland' }, { abbr: 'NB', name: 'North Brabant' },
    ],
    compliance: 'RDW manages exceptioneel transport permits. CROW guidelines for escort vehicles. Rotterdam port corridor is highest volume.',
    corridors: ['A15 Rotterdam Corridor', 'A2 Amsterdam-Maastricht'],
    seedOperators: 95,
  },
  ae: {
    code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', tier: 'A',
    states: [
      { abbr: 'DXB', name: 'Dubai' }, { abbr: 'AUH', name: 'Abu Dhabi' }, { abbr: 'SHJ', name: 'Sharjah' },
    ],
    compliance: 'RTA and DOT manage heavy vehicle permits by emirate. Escort vehicle requirements for loads exceeding 3.5m width. Night movement preferred.',
    corridors: ['E11 Sheikh Zayed Road', 'E311 Emirates Road'],
    seedOperators: 60,
  },
  br: {
    code: 'BR', name: 'Brazil', flag: '🇧🇷', tier: 'A',
    states: [
      { abbr: 'SP', name: 'São Paulo' }, { abbr: 'RJ', name: 'Rio de Janeiro' }, { abbr: 'MG', name: 'Minas Gerais' },
    ],
    compliance: 'DNIT and ANTT regulate AET (Autorização Especial de Trânsito) for oversize loads. Escort vehicle (batedor) requirements vary by state.',
    corridors: ['BR-101 Coastal', 'BR-116 Rio-Bahia', 'SP-348 Anhanguera'],
    seedOperators: 340,
  },
};

// Normalize country code
function resolveCountry(slug: string): CountryConfig | null {
  const lower = slug.toLowerCase();
  // Direct match
  if (TIER_A_COUNTRIES[lower]) return TIER_A_COUNTRIES[lower];
  // Alternate codes/names
  const aliases: Record<string, string> = {
    'united-states': 'us', 'usa': 'us', 'canada': 'ca', 'australia': 'au',
    'united-kingdom': 'gb', 'uk': 'gb', 'new-zealand': 'nz', 'south-africa': 'za',
    'germany': 'de', 'deutschland': 'de', 'netherlands': 'nl', 'holland': 'nl',
    'uae': 'ae', 'brazil': 'br', 'brasil': 'br',
  };
  if (aliases[lower]) return TIER_A_COUNTRIES[aliases[lower]] ?? null;
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const cfg = resolveCountry(country);
  if (!cfg) return { title: 'Directory | Haul Command' };
  return {
    title: `${cfg.flag} ${cfg.name} Pilot Car & Escort Operators | Haul Command`,
    description: `Find verified pilot car, escort, and heavy haul operators across ${cfg.name}. ${cfg.seedOperators}+ operators, top corridors, compliance guides.`,
  };
}

const T = {
  bg: '#060b12', bgCard: '#0f1a26', border: 'rgba(255,255,255,0.07)',
  gold: '#f5b942', green: '#27d17f', blue: '#3ba4ff', purple: '#a78bfa',
  text: '#f0f4f8', muted: '#8fa3b8', subtle: '#556070',
} as const;

export default async function CountryDirectoryPage({ params }: Props) {
  const { country } = await params;
  const cfg = resolveCountry(country);

  // Redirect alternate slugs to canonical
  if (cfg && country.toLowerCase() !== cfg.code.toLowerCase()) {
    redirect(`/directory/${cfg.code.toLowerCase()}`);
  }

  if (!cfg) {
    // Non-Tier-A country — show waitlist
    return (
      <main style={{ background: T.bg, minHeight: '100vh', color: T.text }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '100px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>
            Coming Soon to {country.charAt(0).toUpperCase() + country.slice(1)}
          </h1>
          <p style={{ fontSize: 14, color: T.muted, marginBottom: 24, lineHeight: 1.6 }}>
            We're expanding Haul Command to new countries. Join the waitlist and be first to know.
          </p>
          <Link href="/login" className="ag-press" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '12px 24px', borderRadius: 12,
            background: 'linear-gradient(135deg, #f5b942, #e8a830)',
            color: '#000', fontWeight: 800, fontSize: 14, textDecoration: 'none',
          }}>
            <Flag size={14} /> Join Waitlist
          </Link>
        </div>
      </main>
    );
  }

  // Fetch real operator count from Supabase
  let realCount = 0;
  try {
    const sb = supabaseServer();
    const { count } = await sb
      .from('directory_listings')
      .select('*', { count: 'exact', head: true })
      .eq('country_code', cfg.code);
    realCount = count || 0;
  } catch { /* use seed */ }

  const displayCount = realCount > 0 ? realCount : cfg.seedOperators;

  return (
    <main style={{ background: T.bg, minHeight: '100vh', color: T.text }}>
      {/* Hero */}
      <div style={{
        padding: '64px 20px 48px', textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(245,185,66,0.04), transparent)',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{cfg.flag}</div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.2 }}>
          {cfg.name} <span style={{ color: T.gold }}>Directory</span>
        </h1>
        <p style={{ fontSize: 15, color: T.muted, maxWidth: 500, margin: '0 auto 20px', lineHeight: 1.6 }}>
          Pilot car operators, escort vehicles, and heavy haul support across {cfg.name}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div className="ag-tick" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: T.gold }}>{displayCount.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Operators</div>
          </div>
          <div className="ag-tick" style={{ textAlign: 'center', animationDelay: '100ms' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: T.green }}>{cfg.corridors.length}</div>
            <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Top Corridors</div>
          </div>
          <div className="ag-tick" style={{ textAlign: 'center', animationDelay: '200ms' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: T.blue }}>{cfg.states.length}</div>
            <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Regions</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 20px' }}>
        {/* Compliance Summary */}
        <section className="ag-section-enter" style={{ marginBottom: 40 }}>
          <div style={{
            background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 18,
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Shield size={16} style={{ color: T.gold }} />
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Compliance Overview</h2>
            </div>
            <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7 }}>{cfg.compliance}</p>
          </div>
        </section>

        {/* Top Corridors */}
        <section className="ag-section-enter" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>
            <TrendingUp size={18} style={{ color: T.gold, marginRight: 8, verticalAlign: 'middle' }} />
            Top Corridors in {cfg.name}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {cfg.corridors.map(corridor => (
              <div key={corridor} className="ag-card-hover" style={{
                background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14,
                padding: '16px', cursor: 'pointer',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>🛣 {corridor}</div>
                <div style={{ fontSize: 11, color: T.muted }}>View escorts & rates →</div>
              </div>
            ))}
          </div>
        </section>

        {/* Browse by Region */}
        <section className="ag-section-enter" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>
            <MapPin size={18} style={{ color: T.gold, marginRight: 8, verticalAlign: 'middle' }} />
            Browse by Region
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {cfg.states.map(state => (
              <Link
                key={state.abbr}
                href={`/directory/${cfg.code.toLowerCase()}/${state.abbr.toLowerCase()}`}
                className="ag-card-hover"
                style={{
                  display: 'block', background: T.bgCard, border: `1px solid ${T.border}`,
                  borderRadius: 14, padding: '16px', textDecoration: 'none',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                  {state.name}
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>{state.abbr} →</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Get Listed CTA */}
        <section className="ag-section-enter" style={{ marginBottom: 40 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,185,66,0.05), rgba(245,185,66,0.02))',
            border: '1px solid rgba(245,185,66,0.2)', borderRadius: 20,
            padding: '32px 24px', textAlign: 'center',
          }}>
            <Zap size={24} style={{ color: T.gold, margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
              Get Listed in {cfg.name}
            </h2>
            <p style={{ fontSize: 14, color: T.muted, marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
              Join {displayCount.toLocaleString()} operators already on Haul Command. Free listing, verified badge available.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/login" className="ag-press" style={{
                padding: '12px 24px', borderRadius: 12,
                background: 'linear-gradient(135deg, #f5b942, #e8a830)',
                color: '#000', fontWeight: 800, fontSize: 14, textDecoration: 'none',
              }}>
                Create Free Profile
              </Link>
              <Link href="/boost" className="ag-press" style={{
                padding: '12px 24px', borderRadius: 12,
                background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`,
                color: T.text, fontWeight: 700, fontSize: 14, textDecoration: 'none',
              }}>
                Boost Listing →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
