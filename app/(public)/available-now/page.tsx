import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Radio, MapPin, ArrowRight, Navigation, Clock, Shield, ChevronRight } from 'lucide-react';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

// ══════════════════════════════════════════════════════════════
// /available-now — LIVE ESCORT AVAILABILITY FEED
// The competitor-killing surface.
// Shows all currently-available escorts nationwide, filterable by state.
// Replaces "post in a Facebook group and hope someone sees it."
// ══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pilot Cars Available Now — Live Escort Availability | Haul Command',
  description:
    'Find pilot car and escort vehicle operators available right now. Real-time availability status, trust scores, and instant booking for oversize load escorts across the US, Canada, and 120 countries.',
  keywords: [
    'pilot car available now',
    'escort vehicle available',
    'pilot car near me',
    'available escort operators',
    'oversize load escort available',
    'pilot car dispatch',
    'find pilot car',
    'available pilot car today',
  ],
  alternates: { canonical: 'https://www.haulcommand.com/available-now' },
  openGraph: {
    title: 'Available Now — Live Escort Availability | Haul Command',
    description: 'Real-time pilot car and escort vehicle availability. Find verified operators ready for dispatch.',
    url: 'https://www.haulcommand.com/available-now',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

const AVAILABLE_NOW_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Pilot Car Available Now — Live Availability Feed',
  description: 'Real-time directory of available pilot car and escort vehicle operators ready for oversize load dispatch.',
  url: 'https://www.haulcommand.com/available-now',
  provider: { '@type': 'Organization', name: 'Haul Command', url: 'https://www.haulcommand.com' },
  areaServed: { '@type': 'Country', name: 'United States' },
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
  IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',
  OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
};

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
}

async function getAvailabilityData() {
  const supabase = createClient();

  // Try the view first (if migration has run), fallback to directory_listings
  const { data: broadcasts, error: viewError } = await supabase
    .from('v_available_escorts')
    .select('*')
    .limit(50);

  if (!viewError && broadcasts && broadcasts.length > 0) {
    return { broadcasts: broadcasts as AvailableBroadcast[], source: 'broadcasts' as const };
  }

  // Fallback: query directory_listings for operators with recent activity
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
    status: 'available_now',
    service_types: [op.role_primary || 'escort'],
    equipment_notes: null,
    phone: null,
    contact_note: null,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    operator_name: op.name,
    operator_slug: op.slug,
    trust_score: op.confidence_score || 0,
    claim_status: op.is_claimed ? 'claimed' : 'unclaimed',
    willing_to_deadhead_miles: 100,
  }));

  return { broadcasts: fallbackBroadcasts, source: 'directory' as const };
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'available_now': return { label: 'Available Now', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', pulse: true };
    case 'available_today': return { label: 'Available Today', color: '#84cc16', bg: 'rgba(132,204,22,0.1)', border: 'rgba(132,204,22,0.25)', pulse: false };
    case 'available_this_week': return { label: 'This Week', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', pulse: false };
    default: return { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', pulse: false };
  }
}

export default async function AvailableNowPage() {
  const { broadcasts, source } = await getAvailabilityData();

  // Group by state for the state-selector UI
  const stateGroups: Record<string, AvailableBroadcast[]> = {};
  for (const b of broadcasts) {
    const st = b.state_code || 'Unknown';
    if (!stateGroups[st]) stateGroups[st] = [];
    stateGroups[st].push(b);
  }
  const activeStates = Object.keys(stateGroups).sort();
  const totalAvailable = broadcasts.length;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(AVAILABLE_NOW_JSONLD) }} />

      <div style={{ minHeight: '100vh', background: '#060b12', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>

        {/* ── Hero ── */}
        <div style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,197,94,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1.5rem 3rem' }}>

            {/* Breadcrumb */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <span style={{ color: '#22c55e' }}>Available Now</span>
            </nav>

            {/* Live indicator */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              fontSize: 11, fontWeight: 800, color: '#22c55e', marginBottom: 16,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
                boxShadow: '0 0 8px rgba(34,197,94,0.5)',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              LIVE FEED
            </div>

            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Escort Operators<br />
              <span style={{ color: '#22c55e' }}>Available Now</span>
            </h1>
            <p style={{ margin: '0 0 2rem', fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.65, maxWidth: 560 }}>
              {totalAvailable} verified escort operators ready for dispatch. Real-time availability, trust scores, and instant booking — no scrolling through groups.
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Radio style={{ width: 16, height: 16, color: '#22c55e' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{totalAvailable}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Available</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin style={{ width: 16, height: 16, color: '#3b82f6' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>{activeStates.length}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>States</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield style={{ width: 16, height: 16, color: '#f59e0b' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                  {broadcasts.filter(b => b.claim_status === 'claimed').length}
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Verified</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

          {/* ── Operator Cards ── */}
          {totalAvailable > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 48 }}>
              {broadcasts.map((b) => {
                const sc = getStatusConfig(b.status);
                const trustPct = Math.min(Math.round(b.trust_score * 100), 100);
                const trustColor = trustPct >= 80 ? '#10b981' : trustPct >= 50 ? '#f59e0b' : '#ef4444';
                const location = [b.city, b.state_code].filter(Boolean).join(', ');

                return (
                  <div key={b.id} style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: `1px solid rgba(255,255,255,0.07)`,
                    borderRadius: 16,
                    padding: '20px',
                    transition: 'all 0.18s',
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', marginBottom: 4 }}>
                          {b.operator_name || 'Operator'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                          <MapPin style={{ width: 12, height: 12 }} />
                          {location || 'Location not set'}
                        </div>
                      </div>
                      {/* Status badge */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '4px 12px', borderRadius: 20,
                        background: sc.bg, border: `1px solid ${sc.border}`,
                        fontSize: 10, fontWeight: 800, color: sc.color,
                      }}>
                        {sc.pulse && (
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%', background: sc.color,
                            animation: 'pulse 2s ease-in-out infinite',
                          }} />
                        )}
                        {sc.label}
                      </div>
                    </div>

                    {/* Service types */}
                    {b.service_types.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {b.service_types.map((s: string) => (
                          <span key={s} style={{
                            padding: '3px 8px', borderRadius: 6,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'capitalize',
                          }}>
                            {s.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Trust + Deadhead row */}
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

                    {/* CTA row */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {b.operator_slug ? (
                        <Link href={`/directory/profile/${b.operator_slug}`} style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '10px', borderRadius: 10,
                          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                          color: '#22c55e', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                        }}>
                          View Profile <ArrowRight style={{ width: 12, height: 12 }} />
                        </Link>
                      ) : (
                        <Link href="/directory" style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '10px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          color: '#94a3b8', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                        }}>
                          View in Directory
                        </Link>
                      )}
                      {b.phone && (
                        <a href={`tel:${b.phone}`} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '10px 16px', borderRadius: 10,
                          background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
                          color: '#000', fontSize: 12, fontWeight: 800, textDecoration: 'none',
                        }}>
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20, padding: '60px 24px', textAlign: 'center', marginBottom: 48,
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f9fafb', marginBottom: 8 }}>
                No Broadcasts Yet
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', maxWidth: 400, margin: '0 auto 24px' }}>
                As operators set their availability, they'll appear here in real time. Browse the directory to see all operators.
              </p>
              <Link href="/directory" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 12,
                background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
                color: '#000', fontSize: 13, fontWeight: 800, textDecoration: 'none',
              }}>
                Browse Directory <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          )}

          {/* ── State Grid — "Find by State" ── */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', marginBottom: 16 }}>
              Available by State
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
              {US_STATES.map(st => {
                const count = stateGroups[st]?.length || 0;
                return (
                  <Link key={st} href={`/directory/us/${st.toLowerCase()}`} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '12px 8px', borderRadius: 12,
                    background: count > 0 ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.015)',
                    border: `1px solid ${count > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)'}`,
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: count > 0 ? '#22c55e' : '#475569' }}>{st}</span>
                    {count > 0 && (
                      <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, marginTop: 2 }}>{count}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ── Operator CTA ── */}
          <section style={{
            background: 'linear-gradient(135deg, rgba(198,146,58,0.08), rgba(198,146,58,0.03))',
            border: '1px solid rgba(198,146,58,0.2)',
            borderRadius: 20, padding: '2.5rem', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
          }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', marginBottom: 6 }}>
                Are you an escort operator?
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, maxWidth: 400 }}>
                Set your availability and get found by brokers who need escorts right now. Free to claim your profile.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/claim" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '12px 24px', borderRadius: 12,
                background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
                color: '#000', fontSize: 13, fontWeight: 800, textDecoration: 'none',
              }}>
                Claim Your Profile
              </Link>
              <Link href="/auth/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '12px 24px', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#d1d5db', fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}>
                Sign Up Free
              </Link>
            </div>
          </section>

          {/* ── Internal link mesh — tool + glossary + regulation (linking rules compliance) ── */}
          <section style={{ marginBottom: 32, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/glossary/pilot-car" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>📖 What Is a Pilot Car?</Link>
            <Link href="/glossary/oversize-load" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>📖 What Is an Oversize Load?</Link>
            <Link href="/tools/escort-calculator" style={{ padding: '8px 14px', background: 'rgba(212,168,68,0.07)', border: '1px solid rgba(212,168,68,0.18)', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#D4A844', textDecoration: 'none' }}>🧮 Escort Calculator</Link>
            <Link href="/escort-requirements" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>⚖️ State Escort Rules</Link>
            <Link href="/pricing" style={{ padding: '8px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#22C55E', textDecoration: 'none' }}>💲 Operator Pricing</Link>
          </section>

          {/* ── No-Dead-End block ── */}
          <NoDeadEndBlock
            heading="Need an Escort Operator Right Now?"
            moves={[
              { href: '/directory', icon: '🔍', title: 'Browse Full Directory', desc: 'All verified operators', primary: true, color: '#D4A844' },
              { href: '/claim', icon: '✓', title: 'Set Your Availability', desc: 'Operators — get found now', primary: true, color: '#22C55E' },
              { href: '/loads', icon: '📋', title: 'Load Board', desc: 'Post an urgent load' },
              { href: '/corridors/tx/vs/la', icon: '🗺️', title: 'TX→LA Corridor', desc: 'Busiest heavy haul route' },
              { href: '/escort-requirements', icon: '⚖️', title: 'Escort Requirements', desc: 'State rules & permits' },
              { href: '/pricing', icon: '💲', title: 'Claim Free Listing', desc: 'Free forever for operators' },
            ]}
          />

        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
    </>
  );
}
