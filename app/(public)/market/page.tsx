'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { MobileGate } from '@/components/mobile/MobileGate';
import { Search, MapPin, Shield, Zap, TrendingUp, Globe } from 'lucide-react';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
  CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',
  HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',
  KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',
  MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',
  MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',
  OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',
  VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
  DC:'Washington DC',
};

const HOT_STATES = ['TX','FL','GA','LA','CA','NC','OH','PA','IL','TN','AL','SC'];

const sortedStates = [
  ...HOT_STATES,
  ...US_STATES.filter(s => !HOT_STATES.includes(s)).sort(),
];

export default function MarketIndexPage() {
  const [query, setQuery] = useState('');

  const filtered = query
    ? sortedStates.filter(code =>
        code.toLowerCase().includes(query.toLowerCase()) ||
        STATE_NAMES[code]?.toLowerCase().includes(query.toLowerCase())
      )
    : sortedStates;

  const content = (
    <div style={{ minHeight: '100vh', background: '#060b12', color: '#f5f7fb' }}>
      {/* ── HERO ── */}
      <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0A0D14' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% -10%, rgba(198,146,58,0.08), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3.5rem 1.5rem 3rem', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.25)', color: '#C6923A' }}>📊 Market Intelligence</span>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>🔥 {HOT_STATES.length} Hot Markets</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.04em', lineHeight: 1.02, margin: '0 0 12px', fontStyle: 'italic' }}>
            Heavy haul markets, <span style={{ color: '#C6923A' }}>live.</span>
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.1rem)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, maxWidth: 600, margin: '0 0 28px' }}>
            Every state has its own escort regulations, operator density, and load activity.
            Tap a market to see live truth — active operators, escort rules, and your next move.
          </p>
          {/* Search */}
          <div style={{ display: 'flex', gap: 10, maxWidth: 520 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '0 14px', height: 48 }}>
              <Search style={{ width: 16, height: 16, color: '#64748b', flexShrink: 0 }} />
              <input
                id="market-search"
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search state…"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#e2e8f0' }}
              />
            </div>
            <Link href="/directory" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000', padding: '0 20px', height: 48, borderRadius: 12, fontSize: 13, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Find Escorts →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TOP SPONSOR ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 1.5rem 0' }}>
        <AdGridSlot zone="market_top" />
      </div>

      {/* ── CATEGORY ACTION BAR ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 1.5rem 0' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Find Escorts Now', href: '/directory', icon: '🔍', accent: true },
            { label: 'Available Now', href: '/available-now', icon: '🟢' },
            { label: 'State Regulations', href: '/escort-requirements', icon: '⚖️' },
            { label: 'Rate Benchmarks', href: '/tools/rate-advisor', icon: '💰' },
            { label: 'Claim Listing', href: '/claim', icon: '✓' },
            { label: 'Sponsor a Market', href: '/advertise', icon: '📣', sponsor: true },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, background: item.accent ? 'linear-gradient(135deg, #C6923A, #E0B05C)' : item.sponsor ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)', border: item.sponsor ? '1px dashed rgba(198,146,58,0.3)' : item.accent ? 'none' : '1px solid rgba(255,255,255,0.08)', color: item.accent ? '#000' : item.sponsor ? '#C6923A' : '#d1d5db', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── MAIN TWO-COLUMN ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 1.5rem 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 260px', gap: 32, alignItems: 'start' }}>

          {/* LEFT: State grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#f9fafb', margin: 0 }}>All Markets</h2>
              <span style={{ fontSize: 12, color: '#475569' }}>{filtered.length} state{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))', gap: 10 }}>
              {filtered.map(code => {
                const name = STATE_NAMES[code] || code;
                const isHot = HOT_STATES.includes(code);
                return (
                  <Link key={code} href={`/market/${code.toLowerCase()}`} style={{
                    display: 'block', padding: '16px 14px', borderRadius: 14, textDecoration: 'none',
                    border: `1px solid ${isHot ? 'rgba(241,169,27,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    background: isHot
                      ? 'linear-gradient(160deg, rgba(17,20,28,0.98), rgba(27,22,14,0.94))'
                      : 'rgba(255,255,255,0.02)',
                    transition: 'border-color 0.2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: isHot ? '#F1A91B' : '#fff' }}>{code}</span>
                      {isHot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{name}</div>
                  </Link>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <p style={{ color: '#475569', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>No markets match "{query}".</p>
            )}

            <div style={{ marginTop: 24 }}>
              <AdGridSlot zone="market_mid" />
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 80 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(198,146,58,0.1), rgba(198,146,58,0.03))', border: '1px solid rgba(198,146,58,0.22)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <MapPin style={{ width: 14, height: 14, color: '#C6923A' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#C6923A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Find Escorts</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>Verified pilot car operators sorted by market density and trust score.</p>
              <Link href="/directory" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0', borderRadius: 10, width: '100%', background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>
                Browse Directory
              </Link>
              <Link href="/available-now" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7px 0', borderRadius: 10, width: '100%', marginTop: 8, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', color: '#22c55e', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                🟢 Available Now
              </Link>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Shield style={{ width: 14, height: 14, color: '#22c55e' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Escort Operators</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>Claim your profile and appear in market searches. Free forever for operators.</p>
              <Link href="/claim" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderRadius: 10, width: '100%', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)', color: '#22c55e', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                Claim Listing — Free
              </Link>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TrendingUp style={{ width: 14, height: 14, color: '#34d399' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rate Benchmarks</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>See what escorts are charging per mile in each market. Live benchmarks.</p>
              <Link href="/tools/rate-advisor" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderRadius: 10, width: '100%', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)', color: '#34d399', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                View Rates →
              </Link>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Globe style={{ width: 14, height: 14, color: '#38bdf8' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Market Data</span>
              </div>
              <p style={{ fontSize: 12, color: '#475569', margin: '0 0 12px', lineHeight: 1.5 }}>Export operator density, demand score, and rate benchmarks per state.</p>
              <Link href="/data-products" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderRadius: 10, width: '100%', background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.15)', color: '#38bdf8', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                View Data Products →
              </Link>
            </div>

            <div style={{ background: 'rgba(198,146,58,0.04)', border: '1px dashed rgba(198,146,58,0.18)', borderRadius: 16, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>Sponsor a Market</p>
              <p style={{ fontSize: 11, color: '#475569', margin: '0 0 10px', lineHeight: 1.4 }}>Exclusive placement in hot state market pages.</p>
              <Link href="/advertise" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.22)', color: '#C6923A', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                View Packages →
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* ── NO DEAD END ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem 48px' }}>
        <NoDeadEndBlock
          heading="Next Move"
          moves={[
            { href: '/directory', icon: '🔍', title: 'Find Escorts', desc: 'Search verified operators', primary: true, color: '#D4A844' },
            { href: '/claim', icon: '✓', title: 'Claim Your Profile', desc: 'Get market visibility', primary: true, color: '#22C55E' },
            { href: '/available-now', icon: '🟢', title: 'Available Now', desc: 'Live operator feed' },
            { href: '/tools/rate-advisor', icon: '💰', title: 'Rate Benchmarks', desc: 'Current market rates' },
            { href: '/escort-requirements', icon: '⚖️', title: 'State Rules', desc: 'Escort requirements' },
            { href: '/regulations', icon: '🌍', title: 'Regulations', desc: '120 countries' },
            { href: '/corridors', icon: '🛣️', title: 'Corridors', desc: 'Route intelligence' },
            { href: '/advertise', icon: '📣', title: 'Sponsor', desc: 'Own a market page' },
          ]}
        />
      </div>
    </div>
  );

  return <MobileGate mobile={content} desktop={content} />;
}