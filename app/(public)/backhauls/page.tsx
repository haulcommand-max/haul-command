import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { MapPin, ArrowRight, Route, Shield, ChevronRight, CalendarClock, ArrowLeftRight } from 'lucide-react';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { ProofStrip } from '@/components/ui/ProofStrip';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// /backhauls — REPOSITIONING & BACKHAUL BROADCAST
// The surface for finding operators trying to get a load on their way back home.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Backhaul & Repositioning Broadcasts | Haul Command',
  description:
    'Find pilot car and escort operators deadheading or repositioning across the country. Book partials or return-trip loads with verified operators.',
  keywords: [
    'pilot car backhaul',
    'escort vehicle repositioning',
    'partial load escort',
    'deadhead pilot car',
    'find backhaul pilot car',
  ],
  alternates: { canonical: 'https://www.haulcommand.com/backhauls' },
  openGraph: {
    title: 'Backhauls & Repositioning | Haul Command',
    description: 'Find verified escort operators repositioning and available for return-trip loads.',
    url: 'https://www.haulcommand.com/backhauls',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

interface RepositionBroadcast {
  id: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  route_corridor: string | null;
  available_from: string;
  available_to: string;
  equipment_notes: string | null;
  status: string;
  created_at: string;
  operator_name: string | null;
  operator_slug: string | null;
  trust_score: number;
  claim_status: string | null;
  service_types: string[];
}

export default async function BackhaulsPage() {
  const supabase = createClient();

  const { data: broadcasts, error } = await supabase
    .from('v_reposition_broadcasts')
    .select('*')
    .order('available_from', { ascending: true })
    .limit(50);

  const activeBroadcasts = (broadcasts || []) as RepositionBroadcast[];

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <>
      <ProofStrip variant="bar" />

      <div style={{ minHeight: '100vh', background: '#060b12', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
        {/* â”€â”€ Hero â”€â”€ */}
        <div style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,92,246,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1.5rem 3rem' }}>
            {/* Breadcrumb */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <span style={{ color: '#8b5cf6' }}>Backhauls & Repositioning</span>
            </nav>

            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Backhaul &amp; Route<br />
              <span style={{ color: '#8b5cf6' }}>Repositioning Feed</span>
            </h1>
            <p style={{ margin: '0 0 2rem', fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.65, maxWidth: 560 }}>
              {activeBroadcasts.length} verified operators currently deadheading or repositioning. Book partials or escort teams along their return paths to lower costs and ensure coverage without paying premium mileage.
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Route style={{ width: 16, height: 16, color: '#8b5cf6' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#8b5cf6' }}>{activeBroadcasts.length}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Active Routes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield style={{ width: 16, height: 16, color: '#f59e0b' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                  {activeBroadcasts.filter(b => b.claim_status === 'claimed').length}
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Verified Operators</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

          {/* â”€â”€ Broadcast Cards â”€â”€ */}
          {activeBroadcasts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16, marginBottom: 48 }}>
              {activeBroadcasts.map((b) => {
                const trustPct = Math.min(Math.round(b.trust_score * 100), 100);
                const trustColor = trustPct >= 80 ? '#10b981' : trustPct >= 50 ? '#f59e0b' : '#ef4444';

                return (
                  <div key={b.id} style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16,
                    padding: '24px',
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', marginBottom: 4 }}>
                          {b.operator_name || 'Operator'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ display: 'inline-flex', padding: '2px 6px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                            Repositioning
                          </span>
                        </div>
                      </div>
                      {/* Trust badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: trustColor }}>{trustPct}% Trust</div>
                        <Shield style={{ width: 14, height: 14, color: trustColor }} />
                      </div>
                    </div>

                    {/* Route Graphic */}
                    <div style={{ 
                        background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 12, 
                        border: '1px solid rgba(255,255,255,0.03)', marginBottom: 16 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Origin</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#f9fafb' }}>{b.origin_city}, {b.origin_state}</div>
                            </div>
                            <div style={{ padding: '0 16px', color: '#475569' }}>
                                <ArrowRight style={{ width: 16, height: 16 }} />
                            </div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Destination</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#f9fafb' }}>{b.destination_city}, {b.destination_state}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 10 }}>
                           <Route style={{ width: 12, height: 12 }} />
                           <span style={{ fontWeight: 600 }}>Corridor:</span> {b.route_corridor || 'Direct Route'}
                        </div>
                    </div>

                    {/* Trip Details */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <CalendarClock style={{ width: 14, height: 14, color: '#94a3b8', marginTop: 2 }} />
                            <div>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Available Window</div>
                                <div style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>{formatDate(b.available_from)} - {formatDate(b.available_to)}</div>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {b.operator_slug ? (
                        <Link href={`/directory/profile/${b.operator_slug}`} style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '12px', borderRadius: 10,
                          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
                          color: '#a78bfa', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                        }}>
                          View Operator &amp; Book
                        </Link>
                      ) : (
                        <Link href="/directory" style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '12px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          color: '#94a3b8', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                        }}>
                          Operator in Directory
                        </Link>
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
              <div style={{ fontSize: 48, marginBottom: 16 }}>ðŸ›£ï¸</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f9fafb', marginBottom: 8 }}>
                No Active Backhauls
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', maxWidth: 400, margin: '0 auto 24px' }}>
                There are currently no operators actively repositioning. Check the Live Availability feed for escorts nearby.
              </p>
            </div>
          )}

          {/* â”€â”€ Internal link mesh â”€â”€ */}
          <section style={{ marginBottom: 32, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/available-now" style={{ padding: '8px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#22C55E', textDecoration: 'none' }}>ðŸŸ¢ Live Availability Feed</Link>
            <Link href="/loads" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>ðŸ“‹ Load Board</Link>
            <Link href="/glossary/deadhead" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>ðŸ“– What is Deadheading?</Link>
          </section>

          {/* â”€â”€ No-Dead-End block â”€â”€ */}
          <NoDeadEndBlock
            heading="Plan a Complete Route"
            moves={[
              { href: '/available-now', icon: 'ðŸŸ¢', title: 'Live Availability', desc: 'Find escorts near you instantly', primary: true, color: '#22C55E' },
              { href: '/tools/escort-calculator', icon: 'ðŸ§®', title: 'Route Calculator', desc: 'Factor empty miles and deadhead costs', primary: true, color: '#8B5CF6' },
              { href: '/claim', icon: 'âœ“', title: 'Post a Backhaul', desc: 'Get paid on your return trip' },
              { href: '/directory', icon: 'ðŸ”', title: 'Operator Search', desc: 'Search by Home Base' },
            ]}
          />

        </div>
      </div>
    </>
  );
}