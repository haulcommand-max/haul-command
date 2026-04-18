import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { AdGridSlot } from '@/components/home/AdGridSlot';

/* ────────────────────────────────────────────────────────────────
 * /report-card/[operatorId]
 *
 * Public Haul Command Operator Report Card.
 * Shows trust score, verification status, operating regions,
 * response metrics, and badges.
 *
 * Premium features (paywalled):
 * - Detailed compliance history
 * - Competitor comparison
 * - PDF export
 * ──────────────────────────────────────────────────────────────── */

interface ReportCardPageProps {
  params: Promise<{ operatorId: string }>;
}

async function getOperatorReport(operatorId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get operator profile
  const { data: operator } = await supabase
    .from('operators')
    .select('id, name, slug, company_name, location, state, trust_score, is_verified, is_certified, badges, equipment_tags, operating_regions, response_time_minutes, jobs_completed, created_at, avatar_url')
    .or(`id.eq.${operatorId},slug.eq.${operatorId}`)
    .maybeSingle();

  // Get driver-level report card data if view exists
  let reportCard = null;
  if (operator) {
    const { data } = await supabase
      .from('v_driver_report_card')
      .select('*')
      .eq('user_id', operator.id)
      .maybeSingle();
    reportCard = data;
  }

  return { operator, reportCard };
}

export async function generateMetadata({ params }: ReportCardPageProps): Promise<Metadata> {
  const { operatorId } = await params;
  const { operator } = await getOperatorReport(operatorId);
  
  const name = operator?.company_name || operator?.name || 'Operator';
  const score = operator?.trust_score || 0;
  const location = operator?.location || 'United States';

  return {
    title: `${name} Report Card | Trust Score: ${score}/100 | Haul Command`,
    description: `Haul Command Operator Report Card for ${name} in ${location}. Trust score: ${score}/100. Verification status, operating regions, response time, and compliance history.`,
    alternates: {
      canonical: `https://www.haulcommand.com/report-card/${operatorId}`,
    },
    openGraph: {
      title: `${name} — Trust Score ${score}/100`,
      description: `Verified operator report card on Haul Command. ${location}.`,
      type: 'profile',
    },
  };
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22C55E' : score >= 50 ? '#D4A844' : '#EF4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white">{score}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Trust</span>
      </div>
    </div>
  );
}

function Badge({ label, active, color }: { label: string; active: boolean; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
      active 
        ? `border-${color}-500/30 bg-${color}-500/10 text-${color}-400` 
        : 'border-white/8 bg-white/[0.02] text-white/30'
    }`}>
      <div className={`w-2 h-2 rounded-full ${active ? `bg-${color}-400` : 'bg-white/15'}`} />
      {label}
    </div>
  );
}

export default async function ReportCardPage({ params }: ReportCardPageProps) {
  const { operatorId } = await params;
  const { operator, reportCard } = await getOperatorReport(operatorId);

  if (!operator) return notFound();

  const score = operator.trust_score ?? 0;
  const badges = (operator.badges || {}) as Record<string, boolean>;
  const regions = (operator.operating_regions || []) as string[];
  const memberSince = operator.created_at ? new Date(operator.created_at).getFullYear() : 'N/A';
  const scoreColor = score >= 80 ? 'emerald' : score >= 50 ? 'amber' : 'rose';
  const scoreLabel = score >= 80 ? 'Verified Authority' : score >= 50 ? 'Claimed & Active' : 'Unverified';

  const reportCardSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: operator.company_name || operator.name,
    url: `https://www.haulcommand.com/report-card/${operatorId}`,
    ...(operator.avatar_url ? { logo: operator.avatar_url } : {}),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Math.min(score / 20, 5).toFixed(1),
      bestRating: '5',
      worstRating: '1',
      ratingCount: operator.jobs_completed || 1,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: operator.location,
      addressRegion: operator.state,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reportCardSchema) }} />

      <div className="min-h-screen bg-[#0B0B0C] text-white">
        {/* Hero */}
        <section className="border-b border-white/5 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-[10px] text-white/40 font-medium uppercase tracking-widest mb-6">
              <Link href="/directory" className="hover:text-amber-400 transition-colors">Directory</Link>
              <span>/</span>
              <Link href={`/directory/profile/${operator.slug || operator.id}`} className="hover:text-amber-400 transition-colors">{operator.company_name || operator.name}</Link>
              <span>/</span>
              <span className="text-amber-400">Report Card</span>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Score Ring */}
              <div className="shrink-0">
                <ScoreRing score={score} />
              </div>

              {/* Operator Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {operator.company_name || operator.name}
                  </h1>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border bg-${scoreColor}-500/10 text-${scoreColor}-400 border-${scoreColor}-500/30`}>
                    {scoreLabel}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  {operator.location || 'Location not set'} {operator.state ? `• ${operator.state}` : ''} • Member since {memberSince}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-white">{operator.jobs_completed ?? 0}</div>
                    <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Jobs</div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-white">{operator.response_time_minutes ? `${operator.response_time_minutes}m` : '—'}</div>
                    <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Avg Response</div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-white">{regions.length || 0}</div>
                    <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Regions</div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3 text-center">
                    <div className={`text-2xl font-black ${operator.is_verified ? 'text-emerald-400' : 'text-white/30'}`}>
                      {operator.is_verified ? '✓' : '—'}
                    </div>
                    <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Verified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Certifications & Badges */}
        <section className="max-w-4xl mx-auto px-4 py-10">
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">Certifications & Capabilities</h2>
          <div className="flex flex-wrap gap-2">
            <Badge label="Identity Verified" active={!!operator.is_verified} color="emerald" />
            <Badge label="HC Certified" active={!!operator.is_certified} color="amber" />
            <Badge label="TWIC Card" active={!!badges.twic} color="blue" />
            <Badge label="HazMat Endorsed" active={!!badges.hazmat} color="orange" />
            <Badge label="Height Pole" active={!!badges.highPole} color="purple" />
            <Badge label="Superload Rated" active={!!badges.superload} color="red" />
            <Badge label="AV-Ready" active={!!badges.avCertified} color="cyan" />
            <Badge label="GPS Tracked" active={!!badges.gpsTracked} color="green" />
          </div>
        </section>

        {/* Operating Regions */}
        {regions.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 pb-10">
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">Operating Regions</h2>
            <div className="flex flex-wrap gap-2">
              {regions.map((r: string) => (
                <span key={r} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/8 text-xs text-white/70 font-medium">
                  {r}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Premium Section — Paywalled */}
        <section className="border-t border-white/5 bg-gradient-to-b from-[#0f1115] to-[#0B0B0C]">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-white mb-2">Detailed Intelligence Report</h2>
              <p className="text-gray-400 text-sm">Compliance history, competitor comparison, route coverage analysis, and downloadable PDF.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { title: 'Compliance Timeline', desc: 'Insurance, permits, certifications with expiry tracking' },
                { title: 'Market Comparison', desc: 'How this operator ranks vs peers in their region' },
                { title: 'Route Coverage Map', desc: 'Corridors covered, response zones, availability patterns' },
              ].map(item => (
                <div key={item.title} className="bg-white/[0.02] border border-white/8 rounded-xl p-5 blur-[2px] select-none">
                  <div className="text-sm font-bold text-white/60 mb-1">{item.title}</div>
                  <div className="text-xs text-white/30">{item.desc}</div>
                  <div className="h-20 mt-3 bg-white/[0.02] rounded-lg" />
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link
                href={`/api/stripe/checkout`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#C6923A] text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-[#E0B05C] transition-all shadow-[0_0_20px_rgba(198,146,58,0.3)]"
              >
                Unlock Full Report — $9.99
              </Link>
              <p className="text-[10px] text-white/30 mt-3">One-time purchase. Includes PDF export and 30-day data access.</p>
            </div>
          </div>
        </section>

        {/* AdGrid Slot */}
        <section className="max-w-4xl mx-auto px-4 py-8">
          <AdGridSlot zone="directory_sponsor" />
        </section>

        {/* CTAs */}
        <section className="border-t border-white/5 text-center py-12 px-4">
          <h2 className="text-lg font-bold text-white mb-4">Ready to work with {operator.company_name || operator.name}?</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/directory/profile/${operator.slug || operator.id}`}
              className="px-6 py-3 bg-white/5 border border-white/15 text-white font-semibold text-sm rounded-xl hover:bg-white/10 transition-all">
              View Full Profile
            </Link>
            <Link href={`/loads/post?operator=${operator.id}`}
              className="px-6 py-3 bg-[#C6923A] text-black font-bold text-sm rounded-xl hover:bg-[#E0B05C] transition-all">
              Request Route Coverage
            </Link>
          </div>
        </section>

        {/* Internal Link Mesh */}
        <section className="border-t border-white/5 py-8 text-center">
          <div className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-4">Related</div>
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto px-4">
            <Link href="/directory" className="text-[10px] px-3 py-1.5 rounded-lg border border-white/8 text-white/40 hover:text-amber-400 hover:border-amber-500/25 transition-all">Browse Directory</Link>
            <Link href="/training" className="text-[10px] px-3 py-1.5 rounded-lg border border-white/8 text-white/40 hover:text-amber-400 hover:border-amber-500/25 transition-all">HC Training Academy</Link>
            <Link href="/pricing" className="text-[10px] px-3 py-1.5 rounded-lg border border-white/8 text-white/40 hover:text-amber-400 hover:border-amber-500/25 transition-all">Upgrade Plans</Link>
            <Link href="/tools/escort-calculator" className="text-[10px] px-3 py-1.5 rounded-lg border border-white/8 text-white/40 hover:text-amber-400 hover:border-amber-500/25 transition-all">Rate Calculator</Link>
            <Link href="/claim" className="text-[10px] px-3 py-1.5 rounded-lg border border-white/8 text-white/40 hover:text-amber-400 hover:border-amber-500/25 transition-all">Claim Your Profile</Link>
          </div>
        </section>
      </div>
    </>
  );
}
