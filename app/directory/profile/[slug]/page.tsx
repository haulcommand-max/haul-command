import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const revalidate = 3600;

const gold = '#C6923A';
const T = {
  bg: '#0B0B0C', bgCard: '#111114', bgSurface: '#161619', bgElevated: '#1A1A1E',
  border: 'rgba(255,255,255,0.06)', borderMid: 'rgba(255,255,255,0.10)',
  gold, goldLight: '#E4B872', goldDim: 'rgba(198,146,58,0.12)', goldBorder: 'rgba(198,146,58,0.30)',
  green: '#22c55e', greenDim: 'rgba(34,197,94,0.10)',
  blue: '#3b82f6', blueDim: 'rgba(59,130,246,0.10)',
  text: '#F0F0F2', textSecondary: '#A0A0A8', muted: '#6B6B75',
};

const SERVICE_LABELS: Record<string, { label: string; icon: string }> = {
  lead_car: { label: 'Lead Car', icon: '🚗' },
  chase_car: { label: 'Chase Car', icon: '🚙' },
  pilot_car: { label: 'Pilot Car', icon: '🚘' },
  height_pole: { label: 'Height Pole', icon: '📏' },
  route_survey: { label: 'Route Survey', icon: '🗺️' },
  wide_load: { label: 'Wide Load', icon: '🚛' },
  oversize: { label: 'OS/OW Escort', icon: '⚠️' },
  superload_cert: { label: 'Superload Cert', icon: '🏗️' },
  av_escort: { label: 'AV Escort', icon: '🤖' },
  night_escort: { label: 'Night Moves', icon: '🌙' },
  bucket_truck: { label: 'Bucket Truck', icon: '🪣' },
};

async function getOperator(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('directory_listings')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

async function getSimilar(state: string, excludeId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('directory_listings')
    .select('id, name, slug, region_code, claim_status, trust_score, metadata')
    .eq('region_code', state)
    .neq('id', excludeId)
    .limit(3);
  return data || [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const op = await getOperator(slug);
  if (!op) return { title: 'Operator Not Found | Haul Command' };
  const name = op.name || 'Operator';
  const region = op.city ? `${op.city}, ${op.region_code}` : op.region_code || 'US';
  return {
    title: `${name} — Pilot Car & Escort Operator in ${region} | Haul Command`,
    description: `View the verified profile, trust score, services, and contact info for ${name}. Request a quote for escort services in ${region}.`,
    alternates: { canonical: `https://www.haulcommand.com/directory/profile/${slug}` },
  };
}

function TrustGauge({ score }: { score: number }) {
  const pct = Math.min(score, 100);
  const color = pct >= 80 ? T.green : pct >= 50 ? gold : '#ef4444';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto' }}>
        <svg viewBox="0 0 100 100" width="100" height="100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${pct * 2.64} 264`} strokeLinecap="round"
            transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color }}>{pct}</div>
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6 }}>Trust Score</div>
    </div>
  );
}

export default async function OperatorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const op = await getOperator(slug);
  if (!op) notFound();

  const name = op.name || 'Operator';
  const region = op.city ? `${op.city}, ${op.region_code}` : op.region_code || '';
  const verified = op.claim_status === 'claimed' || op.claim_status === 'verified';
  const trustScore = op.trust_score ?? op.metadata?.trust_score ?? 0;
  const services: string[] = op.metadata?.services || ['pilot_car'];
  const corridors: string[] = op.metadata?.corridors || [];
  const rate = op.metadata?.hourly_rate;
  const avgResponse = op.metadata?.avg_response_minutes;
  const jobCount = op.metadata?.total_jobs;
  const avReady = op.metadata?.av_certified || false;
  const escrow = op.metadata?.escrow_enabled || false;
  const reviewCount = op.metadata?.review_count || 0;
  const avgRating = op.metadata?.avg_rating || 0;
  const reliabilityScore = op.metadata?.reliability_score || 0;
  const completionRate = op.metadata?.completion_rate || 0;
  const phone = op.metadata?.phone;
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const similar = await getSimilar(op.region_code || '', op.id);

  return (
    <main style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter', system-ui" }}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 20px 0', fontSize: 11, color: T.muted, display: 'flex', gap: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        <Link href="/" style={{ color: T.muted, textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <Link href="/directory" style={{ color: T.muted, textDecoration: 'none' }}>Directory</Link>
        <span>›</span>
        <span style={{ color: gold }}>{name}</span>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,168,68,0.08), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(2rem,4vw,3rem) 20px' }}>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* Avatar + Info */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flex: 1, minWidth: 300 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 20, flexShrink: 0,
                background: `linear-gradient(135deg, ${T.goldDim}, ${T.bgElevated})`,
                border: `2px solid ${verified ? T.green : T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 900, color: gold,
              }}>
                {initials}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <h1 style={{ margin: 0, fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 900 }}>{name}</h1>
                  {verified && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: T.greenDim, border: '1px solid rgba(34,197,94,0.25)', color: T.green, textTransform: 'uppercase' }}>✓ Verified</span>
                  )}
                  {avReady && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.25)', color: '#a855f7', textTransform: 'uppercase' }}>🤖 AV Ready</span>
                  )}
                  {escrow && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: T.blueDim, border: '1px solid rgba(59,130,246,0.25)', color: T.blue, textTransform: 'uppercase' }}>🛡️ Escrow</span>
                  )}
                </div>
                {region && <div style={{ fontSize: 14, color: T.textSecondary, marginBottom: 8 }}>📍 {region}</div>}
                {reviewCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <span style={{ color: '#fbbf24' }}>{'★'.repeat(Math.floor(avgRating))}</span>
                    <span style={{ fontWeight: 800 }}>{avgRating.toFixed(1)}</span>
                    <span style={{ color: T.muted }}>({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Trust Gauge */}
            {trustScore > 0 && <TrustGauge score={trustScore} />}
          </div>

          {/* CTA Row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
            <Link href={`/claim?operator=${slug}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 12,
              background: `linear-gradient(135deg, ${gold}, ${T.goldLight})`,
              color: '#000', fontSize: 14, fontWeight: 900, textDecoration: 'none',
            }}>📨 Request Quote</Link>
            {phone && (
              <a href={`tel:${phone}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px', borderRadius: 12,
                background: T.greenDim, border: '1px solid rgba(34,197,94,0.25)',
                color: T.green, fontSize: 14, fontWeight: 800, textDecoration: 'none',
              }}>📞 Call Now</a>
            )}
            <Link href="/claim" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 20px', borderRadius: 12,
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
              color: T.textSecondary, fontSize: 14, fontWeight: 700, textDecoration: 'none',
            }}>Is this your listing? Claim it</Link>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 3rem', display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <style>{`@media (min-width: 768px) { .profile-grid { grid-template-columns: 2fr 1fr !important; } }`}</style>
        <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Services */}
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.06em', color: T.muted }}>Services Offered</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {services.map((s: string) => {
                  const svc = SERVICE_LABELS[s] || { label: s, icon: '🚗' };
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: T.bgSurface, border: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 18 }}>{svc.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{svc.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Corridors */}
            {corridors.length > 0 && (
              <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.06em', color: T.muted }}>Active Corridors</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {corridors.map((c: string) => (
                    <span key={c} style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, background: T.goldDim, border: `1px solid ${T.goldBorder}`, color: T.goldLight }}>{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column — Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.06em', color: T.muted }}>Performance</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { value: avgResponse ? `${avgResponse}m` : '—', label: 'Avg Response', color: T.text },
                  { value: rate ? `$${rate}/hr` : '—', label: 'Rate', color: gold },
                  { value: jobCount ? jobCount.toLocaleString() : '—', label: 'Jobs Done', color: T.text },
                  { value: reliabilityScore > 0 ? `${reliabilityScore}%` : '—', label: 'Reliability', color: reliabilityScore >= 90 ? T.green : gold },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', padding: '14px 8px', borderRadius: 12, background: T.bgSurface, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {completionRate > 0 && (
                <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: T.greenDim, border: '1px solid rgba(34,197,94,0.15)', textAlign: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.green }}>{(completionRate * 100).toFixed(0)}% Job Completion Rate</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Similar Operators */}
        {similar.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 14px' }}>Similar Operators in {op.region_code}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {similar.map((s: any) => (
                <Link key={s.id} href={`/directory/profile/${s.slug || s.id}`} style={{
                  display: 'block', padding: 18, borderRadius: 14, textDecoration: 'none',
                  background: T.bgCard, border: `1px solid ${T.border}`,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: T.textSecondary }}>📍 {s.region_code}</div>
                  {s.trust_score > 0 && <div style={{ fontSize: 11, color: gold, marginTop: 6, fontWeight: 700 }}>Trust: {s.trust_score}</div>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <NoDeadEndBlock
        heading="What Would You Like to Do?"
        moves={[
          { href: '/directory', icon: '🔍', title: 'Browse Directory', desc: 'Find more operators', primary: true, color: gold },
          { href: '/loads', icon: '📦', title: 'Post a Load', desc: 'Get quotes from operators', primary: true, color: '#22C55E' },
          { href: '/claim', icon: '🚛', title: 'Claim Your Listing', desc: 'Get your profile verified' },
          { href: '/tools/escort-calculator', icon: '🧮', title: 'Escort Calculator', desc: 'How many pilot cars?' },
        ]}
      />
    </main>
  );
}
