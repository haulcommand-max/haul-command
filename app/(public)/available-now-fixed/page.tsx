import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MapPin, Navigation, Radio, Shield, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { LiveActivityFeed } from '@/components/feed/LiveActivityFeed';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';
import { stateFullName } from '@/lib/geo/state-names';

export const revalidate = 10;

export const metadata: Metadata = {
  title: 'Pilot Cars Available Now — Live Escort Availability | Haul Command',
  description:
    'Find pilot car and escort vehicle operators surfaced for dispatch. Real-time availability broadcasts, directory fallback listings, trust scores, and instant load-board routing for oversize load escorts across 120 countries.',
  alternates: { canonical: 'https://www.haulcommand.com/available-now' },
  openGraph: {
    title: 'Available Now — Live Escort Availability | Haul Command',
    description: 'Find escort operators surfaced for dispatch with verified counts separated from live availability and directory fallback rows.',
    url: 'https://www.haulcommand.com/available-now',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

const AVAILABLE_NOW_JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://www.haulcommand.com/available-now',
      name: 'Pilot Cars Available Now — Live Escort Availability | Haul Command',
      description: 'Real-time pilot car and escort vehicle availability broadcasts with verified counts separated from directory fallback listings.',
      url: 'https://www.haulcommand.com/available-now',
      publisher: { '@type': 'Organization', name: 'Haul Command', url: 'https://www.haulcommand.com' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
        { '@type': 'ListItem', position: 2, name: 'Available Now', item: 'https://www.haulcommand.com/available-now' },
      ],
    },
    {
      '@type': 'Service',
      name: 'Pilot Car Available Now — Live Availability Feed',
      description: 'Real-time and directory fallback surface for pilot car and escort vehicle operators ready for oversize load dispatch.',
      url: 'https://www.haulcommand.com/available-now',
      provider: { '@type': 'Organization', name: 'Haul Command', url: 'https://www.haulcommand.com' },
      areaServed: { '@type': 'AdministrativeArea', name: '120 countries' },
    },
  ],
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

interface AvailableBroadcast {
  id: string;
  city: string;
  state_code: string;
  country_code: string;
  status: string;
  service_types: string[];
  equipment_notes: string | null;
  phone: string | null;
  contact_note: string | null;
  created_at: string;
  expires_at: string;
  operator_name: string | null;
  operator_slug: string | null;
  trust_score: number;
  claim_status: string | null;
  willing_to_deadhead_miles: number;
  is_verified?: boolean | null;
  identity_verified?: boolean | null;
  verified?: boolean | null;
}

function isVerifiedBroadcast(b: AvailableBroadcast) {
  return b.is_verified === true
    || b.identity_verified === true
    || b.verified === true
    || b.claim_status === 'verified';
}

function normalizeTrustScore(score: number | null | undefined) {
  const rawTrust = Number(score || 0);
  return Math.min(Math.round(rawTrust > 1 ? rawTrust : rawTrust * 100), 100);
}

async function getAvailabilityData() {
  const supabase = createClient();

  const { data: broadcasts, error: viewError } = await supabase
    .from('v_available_escorts')
    .select('*')
    .limit(50);

  if (!viewError && broadcasts && broadcasts.length > 0) {
    return { broadcasts: broadcasts as AvailableBroadcast[], source: 'broadcasts' as const };
  }

  const { data: operators } = await supabase
    .from('hc_global_operators')
    .select('id, name, city, admin1_code, country_code, confidence_score, is_claimed, role_primary, slug')
    .eq('country_code', 'US')
    .order('confidence_score', { ascending: false, nullsFirst: false })
    .limit(50);

  const fallbackBroadcasts: AvailableBroadcast[] = (operators || []).map((op: any) => ({
    id: op.id,
    city: op.city || '',
    state_code: op.admin1_code || '',
    country_code: op.country_code || 'US',
    status: 'directory_listing',
    service_types: [op.role_primary || 'escort'],
    equipment_notes: null,
    phone: null,
    contact_note: null,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    operator_name: op.name,
    operator_slug: op.slug,
    trust_score: Number(op.confidence_score || 0),
    claim_status: op.is_claimed ? 'claimed' : 'unclaimed',
    willing_to_deadhead_miles: 100,
  }));

  return { broadcasts: fallbackBroadcasts, source: 'directory' as const };
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'available_now':
      return { label: 'Available Now', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', pulse: true };
    case 'available_today':
      return { label: 'Available Today', color: '#84cc16', bg: 'rgba(132,204,22,0.1)', border: 'rgba(132,204,22,0.25)', pulse: false };
    case 'available_this_week':
      return { label: 'This Week', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', pulse: false };
    case 'directory_listing':
      return { label: 'Directory Listing', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.18)', pulse: false };
    default:
      return { label: status.replace(/_/g, ' '), color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', pulse: false };
  }
}

export default async function AvailableNowFixedPage() {
  const { broadcasts, source } = await getAvailabilityData();

  const stateGroups: Record<string, AvailableBroadcast[]> = {};
  for (const b of broadcasts) {
    const st = b.state_code || 'Unknown';
    if (!stateGroups[st]) stateGroups[st] = [];
    stateGroups[st].push(b);
  }

  const activeStates = Object.keys(stateGroups).sort();
  const totalAvailable = broadcasts.length;
  const verifiedAvailable = broadcasts.filter(isVerifiedBroadcast).length;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(AVAILABLE_NOW_JSONLD) }} />
      <ProofStrip variant="bar" />

      <div style={{ minHeight: '100vh', background: '#060b12', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
        <section style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,197,94,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1.5rem 3rem', position: 'relative' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
              <span style={{ color: '#334155' }}>›</span>
              <span style={{ color: '#22c55e' }}>Available Now</span>
            </nav>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', fontSize: 11, fontWeight: 800, color: '#22c55e', marginBottom: 16 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
              {source === 'broadcasts' ? 'LIVE AVAILABILITY FEED' : 'DIRECTORY FALLBACK'}
            </div>

            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Escort Operators<br />
              <span style={{ color: '#22c55e' }}>Available Now</span>
            </h1>

            <p style={{ margin: '0 0 2rem', fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.65, maxWidth: 620 }}>
              {totalAvailable} escort operators surfaced for dispatch. {verifiedAvailable} verified. Real-time availability, trust scores, and instant booking — no scrolling through groups.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Radio style={{ width: 16, height: 16, color: '#22c55e' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{totalAvailable}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Surfaced</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin style={{ width: 16, height: 16, color: '#3b82f6' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>{activeStates.length}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>States</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield style={{ width: 16, height: 16, color: '#f59e0b' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{verifiedAvailable}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Verified</span>
              </div>
            </div>
          </div>
        </section>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 1.5rem 0' }}>
          <AdGridSlot zone="available_now_top" />
        </div>

        <section style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 1.5rem 0' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Post Urgent Load', href: '/load-board/post', icon: '📋', accent: true },
              { label: 'Claim Your Profile', href: '/claim', icon: '✓' },
              { label: 'Escort Requirements', href: '/escort-requirements', icon: '⚖️' },
              { label: 'Rate Benchmarks', href: '/tools/rate-advisor', icon: '💰' },
              { label: 'Find by State', href: '/market', icon: '🗺️' },
              { label: 'Sponsor This Page', href: '/advertise', icon: '📣', sponsor: true },
            ].map((item) => (
              <a key={item.label} href={item.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, background: item.accent ? 'linear-gradient(135deg, #22c55e, #16a34a)' : item.sponsor ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)', border: item.sponsor ? '1px dashed rgba(198,146,58,0.3)' : item.accent ? 'none' : '1px solid rgba(255,255,255,0.08)', color: item.accent ? '#000' : item.sponsor ? '#C6923A' : '#d1d5db', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                <span>{item.icon}</span> {item.label}
              </a>
            ))}
          </div>
        </section>

        {source === 'directory' && (
          <section style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 1.5rem 0' }}>
            <div style={{ border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(148,163,184,0.08)', borderRadius: 14, padding: '12px 14px', color: '#cbd5e1', fontSize: 12, lineHeight: 1.5 }}>
              Directory listings are shown when live availability broadcasts are not available. These operators are not being represented as live available unless they have an active broadcast.
            </div>
          </section>
        )}

        <main style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
          {totalAvailable > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 48 }}>
              {broadcasts.map((b) => {
                const sc = getStatusConfig(b.status);
                const trustPct = normalizeTrustScore(b.trust_score);
                const trustColor = trustPct >= 80 ? '#10b981' : trustPct >= 50 ? '#f59e0b' : '#ef4444';
                const location = [b.city, stateFullName(b.state_code)].filter(Boolean).join(', ');
                const verified = isVerifiedBroadcast(b);

                return (
                  <article key={b.id} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb' }}>{b.operator_name || 'Operator'}</strong>
                          {verified && <span style={{ fontSize: 10, fontWeight: 800, color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', padding: '2px 6px', borderRadius: 999 }}>Verified</span>}
                          <FreshnessBadge lastSeenAt={b.created_at} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                          <MapPin style={{ width: 12, height: 12 }} />
                          {location || 'Location not set'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: sc.bg, border: `1px solid ${sc.border}`, fontSize: 10, fontWeight: 800, color: sc.color, whiteSpace: 'nowrap' }}>
                        {sc.pulse && <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color }} />}
                        {sc.label}
                      </div>
                    </div>

                    {b.service_types.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {b.service_types.map((s) => (
                          <span key={s || 'unknown'} style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'capitalize' }}>
                            {(s || '').replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ width: `${trustPct}%`, height: '100%', borderRadius: 2, background: trustColor }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: trustColor }}>{trustPct}% Trust</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#475569' }}>
                        <Navigation style={{ width: 10, height: 10 }} />
                        {b.willing_to_deadhead_miles}mi radius
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/load-board/post?operator=${b.operator_slug || b.id}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10, background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                        Request Direct
                      </Link>
                      {b.operator_slug ? (
                        <Link href={`/directory/profile/${b.operator_slug}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                          View Profile
                        </Link>
                      ) : (
                        <Link href="/directory" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                          In Directory
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <section style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '60px 24px', textAlign: 'center', marginBottom: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f9fafb', marginBottom: 8 }}>No Broadcasts Yet</h2>
              <p style={{ fontSize: 14, color: '#64748b', maxWidth: 400, margin: '0 auto 24px' }}>As operators set their availability, they'll appear here in real time. Browse the directory to see all operators.</p>
              <Link href="/directory" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                Browse Directory <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </section>
          )}

          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', marginBottom: 16 }}>Available by State</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
              {US_STATES.map((st) => {
                const count = stateGroups[st]?.length || 0;
                return (
                  <Link key={st} href={`/directory/us/${stateFullName(st).toLowerCase().replace(/\s+/g, '-')}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 8px', borderRadius: 12, background: count > 0 ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.015)', border: `1px solid ${count > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)'}`, textDecoration: 'none' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: count > 0 ? '#22c55e' : '#475569' }}>{st}</span>
                    {count > 0 && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, marginTop: 2 }}>{count}</span>}
                  </Link>
                );
              })}
            </div>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f9fafb', marginBottom: 20 }}>Sponsors</h2>
            <AdGridSlot zone="available_now_sponsor" />
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f9fafb', marginBottom: 20 }}>Live Network Updates</h2>
            <LiveActivityFeed maxItems={6} />
          </section>

          <NoDeadEndBlock
            heading="Need an Escort Operator Right Now?"
            moves={[
              { href: '/directory', icon: '🔍', title: 'Browse Full Directory', desc: 'All verified operators', primary: true, color: '#D4A844' },
              { href: '/claim', icon: '✓', title: 'Set Your Availability', desc: 'Operators — get found now', primary: true, color: '#22C55E' },
              { href: '/load-board', icon: '📋', title: 'Load Board', desc: 'Post an urgent load' },
              { href: '/corridor', icon: '🗺️', title: 'Corridors', desc: 'Route intelligence' },
              { href: '/escort-requirements', icon: '⚖️', title: 'Escort Requirements', desc: 'State rules & permits' },
              { href: '/pricing', icon: '💲', title: 'Claim Free Listing', desc: 'Free forever for operators' },
            ]}
          />
        </main>
      </div>
    </>
  );
}
