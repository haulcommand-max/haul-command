import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Navigation, MapPin, Clock, ArrowRight, ChevronRight, Truck, Shield, Calendar } from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// /reposition — REPOSITIONING FEED
// "I'm finishing a job in Dallas, heading to Houston, available along the way"
// Deadhead reduction surface — the #2 competitor function.
// ══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pilot Car Repositioning — Reduce Deadhead Miles | Haul Command',
  description:
    'Escort operators posting their repositioning routes. Find available pilot cars heading your direction. Reduce deadhead miles and save on escort costs.',
  keywords: [
    'pilot car repositioning', 'escort vehicle backhaul', 'reduce deadhead miles',
    'pilot car heading to', 'available escort along route', 'deadhead reduction',
  ],
  alternates: { canonical: 'https://haulcommand.com/reposition' },
  openGraph: {
    title: 'Pilot Car Repositioning Feed | Haul Command',
    description: 'Find escort operators heading your direction. Reduce deadhead costs by matching with operators already in transit.',
    url: 'https://haulcommand.com/reposition',
  },
};

interface RepoPost {
  id: string;
  origin_city: string;
  origin_state: string;
  dest_city: string | null;
  dest_state: string | null;
  depart_date: string;
  depart_time_approx: string | null;
  service_types: string[];
  rate_note: string | null;
  willing_to_detour_miles: number;
  phone: string | null;
  contact_note: string | null;
  created_at: string;
  operator_name: string | null;
  operator_slug: string | null;
  trust_score: number;
}

export default async function RepositionPage() {
  const supabase = createClient();

  // Try the view first, fallback gracefully
  const { data: posts, error } = await supabase
    .from('v_repositioning_feed')
    .select('*')
    .limit(30);

  const repoPosts: RepoPost[] = (!error && posts) ? posts : [];
  const totalPosts = repoPosts.length;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Pilot Car Repositioning Feed',
        description: 'Escort operators posting their repositioning routes for deadhead reduction.',
        url: 'https://haulcommand.com/reposition',
        provider: { '@type': 'Organization', name: 'Haul Command' },
      }) }} />

      <div style={{ minHeight: '100vh', background: '#060b12', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>

        {/* Hero */}
        <div style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1.5rem 3rem' }}>

            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <span style={{ color: '#3b82f6' }}>Repositioning</span>
            </nav>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
              fontSize: 11, fontWeight: 800, color: '#3b82f6', marginBottom: 16,
            }}>
              <Navigation style={{ width: 12, height: 12 }} />
              DEADHEAD REDUCTION
            </div>

            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Escort Operators<br />
              <span style={{ color: '#3b82f6' }}>Heading Your Direction</span>
            </h1>
            <p style={{ margin: '0 0 2rem', fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.65, maxWidth: 580 }}>
              Operators finishing jobs and repositioning. Book them along their route for lower rates and zero deadhead wait.{' '}
              {totalPosts > 0 ? `${totalPosts} active repositioning posts.` : 'Post your availability today.'}
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Navigation style={{ width: 16, height: 16, color: '#3b82f6' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>{totalPosts}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Active Routes</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

          {/* Repositioning Posts */}
          {totalPosts > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16, marginBottom: 48 }}>
              {repoPosts.map((post) => {
                const trustPct = Math.min(Math.round(post.trust_score * 100), 100);
                const trustColor = trustPct >= 80 ? '#10b981' : trustPct >= 50 ? '#f59e0b' : '#94a3b8';

                return (
                  <div key={post.id} style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16, padding: '20px',
                  }}>
                    {/* Route header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Navigation style={{ width: 18, height: 18, color: '#3b82f6' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb' }}>
                          {post.origin_city}, {post.origin_state}
                          {post.dest_city && ` → ${post.dest_city}, ${post.dest_state}`}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {post.operator_name || 'Operator'}
                        </div>
                      </div>
                      {trustPct > 0 && (
                        <span style={{
                          padding: '3px 10px', borderRadius: 8,
                          background: `${trustColor}10`, border: `1px solid ${trustColor}25`,
                          fontSize: 10, fontWeight: 800, color: trustColor,
                        }}>
                          {trustPct}%
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}>
                        <Calendar style={{ width: 11, height: 11 }} />
                        {new Date(post.depart_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {post.depart_time_approx && ` (${post.depart_time_approx})`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}>
                        <MapPin style={{ width: 11, height: 11 }} />
                        {post.willing_to_detour_miles}mi detour OK
                      </div>
                    </div>

                    {/* Services */}
                    {post.service_types.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                        {post.service_types.map((s: string) => (
                          <span key={s} style={{
                            padding: '2px 8px', borderRadius: 6,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'capitalize',
                          }}>
                            {s.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Rate note */}
                    {post.rate_note && (
                      <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700, marginBottom: 12 }}>
                        💰 {post.rate_note}
                      </div>
                    )}

                    {/* CTA */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {post.operator_slug ? (
                        <a href={`/api/telemetry/repo-click?id=${post.id}&action=directory&url=${encodeURIComponent('/directory/profile/'+post.operator_slug)}`} style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '10px', borderRadius: 10,
                          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
                          color: '#3b82f6', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                        }}>
                          View Profile <ArrowRight style={{ width: 12, height: 12 }} />
                        </a>
                      ) : (
                        <Link href="/directory" style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '10px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          color: '#94a3b8', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                        }}>
                          View in Directory
                        </Link>
                      )}
                      {post.phone && (
                        <a href={`/api/telemetry/repo-click?id=${post.id}&action=call&url=${encodeURIComponent('tel:'+post.phone)}`} style={{
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
            /* Empty state */
            <div style={{
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20, padding: '60px 24px', textAlign: 'center', marginBottom: 48,
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🛣️</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f9fafb', marginBottom: 8 }}>
                No Repositioning Posts Yet
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', maxWidth: 440, margin: '0 auto 24px' }}>
                Finishing a job and heading somewhere? Post your repositioning route and get booked along the way. Less deadhead, more earnings.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/claim" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none',
                }}>
                  <Truck style={{ width: 14, height: 14 }} /> Claim Profile to Post
                </Link>
                <Link href="/available-now" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', borderRadius: 12,
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                  color: '#22c55e', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                }}>
                  View Available Now
                </Link>
              </div>
            </div>
          )}

          {/* How it works */}
          <section style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20, padding: '2rem', marginBottom: 48,
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', marginBottom: 20 }}>
              How Repositioning Works
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              {[
                { step: '1', title: 'Post Your Route', desc: 'Tell brokers where you\'re heading and when.', color: '#3b82f6' },
                { step: '2', title: 'Get Matched', desc: 'Brokers with loads along your route see your post.', color: '#22c55e' },
                { step: '3', title: 'Zero Deadhead', desc: 'Get booked along the way instead of driving empty.', color: '#f59e0b' },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', gap: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: `${item.color}10`, border: `1px solid ${item.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 900, color: item.color,
                  }}>
                    {item.step}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Cross-links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { href: '/available-now', icon: Clock, label: 'Available Now', desc: 'Live availability feed', color: '#22c55e' },
              { href: '/directory', icon: Truck, label: 'Directory', desc: 'All verified operators', color: '#C6923A' },
              { href: '/loads', icon: MapPin, label: 'Load Board', desc: 'Active oversize loads', color: '#a78bfa' },
              { href: '/claim', icon: Shield, label: 'Claim Profile', desc: 'Get found by brokers', color: '#3b82f6' },
            ].map(card => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '1rem',
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12, textDecoration: 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${card.color}10`, border: `1px solid ${card.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon style={{ width: 16, height: 16, color: card.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>{card.label}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{card.desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
