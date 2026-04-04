import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Props { params: { slug: string } }

const BADGE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  identity_verified:  { label: 'Identity Verified',    icon: '🏦', color: 'text-blue-300 border-blue-500/30 bg-blue-500/10' },
  insurance_verified: { label: 'Insurance Verified',   icon: '🛡️', color: 'text-green-300 border-green-500/30 bg-green-500/10' },
  license_verified:   { label: 'License Verified',     icon: '📝', color: 'text-green-300 border-green-500/30 bg-green-500/10' },
  background_check:   { label: 'Background Checked',   icon: '✓',   color: 'text-teal-300 border-teal-500/30 bg-teal-500/10' },
  safety_record:      { label: 'Safety Record',        icon: '⚠️', color: 'text-amber-300 border-amber-500/30 bg-amber-500/10' },
  route_completed:    { label: 'Verified Routes',      icon: '🛣️', color: 'text-amber-300 border-amber-500/30 bg-amber-500/10' },
  peer_endorsed:      { label: 'Peer Endorsed',        icon: '👍', color: 'text-purple-300 border-purple-500/30 bg-purple-500/10' },
  long_standing:      { label: 'Long Standing',        icon: '⏳', color: 'text-white/50 border-white/10 bg-white/5' },
  rapid_responder:    { label: 'Rapid Responder',      icon: '⚡', color: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10' },
};

function TrustRing({ score }: { score: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#6b7280';

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="56" cy="56" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-black text-white leading-none">{score}</p>
        <p className="text-[10px] uppercase tracking-widest text-white/30">Trust</p>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  return { title: `Trust Report Card — ${params.slug} | Haul Command` };
}

export default async function TrustReportCardPage({ params }: Props) {
  const supabase = createServerComponentClient({ cookies });

  const { data: trust } = await supabase
    .from('hc_trust_profiles')
    .select('*')
    .eq('listing_slug', params.slug)
    .maybeSingle();

  if (!trust) notFound();

  const score = trust.trust_score ?? 0;
  const scoreLabel = score >= 80 ? 'High Trust' : score >= 60 ? 'Good Standing' : score >= 40 ? 'Building' : 'Needs Work';
  const scoreColor = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-amber-400' : 'text-white/40';

  const subScores = [
    { label: 'Identity', value: trust.identity_score ?? 0, max: 25 },
    { label: 'Compliance', value: trust.compliance_score ?? 0, max: 20 },
    { label: 'Activity', value: trust.activity_score ?? 0, max: 25 },
    { label: 'Reviews', value: trust.review_score ?? 0, max: 20 },
    { label: 'Claimed', value: trust.claimed ? 10 : 0, max: 10 },
  ];

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <div className="mx-auto max-w-2xl px-4 py-12">

        {/* Back */}
        <Link href={`/directory/${params.slug}`} className="mb-6 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
          ← Back to profile
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-center gap-6">
          <TrustRing score={score} />
          <div>
            <h1 className="text-2xl font-black text-white">Trust Report Card</h1>
            <p className={`text-lg font-semibold ${scoreColor}`}>{scoreLabel}</p>
            <p className="mt-1 text-xs text-white/30">Computed from real verified signals only</p>
          </div>
        </div>

        {/* Verification flags */}
        <section className="mb-6 rounded-2xl border border-white/8 bg-white/4 p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-white/30">Verification Status</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { key: 'identity_verified',  label: 'Identity',   value: trust.identity_verified },
              { key: 'license_verified',   label: 'License',    value: trust.license_verified },
              { key: 'insurance_verified', label: 'Insurance',  value: trust.insurance_verified },
              { key: 'background_checked', label: 'Background', value: trust.background_checked },
              { key: 'claimed',            label: 'Claimed',    value: trust.claimed },
            ].map(v => (
              <div key={v.key} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                v.value ? 'border-green-500/25 bg-green-500/8' : 'border-white/8 bg-white/3 opacity-50'
              }`}>
                <span className={v.value ? 'text-green-400' : 'text-white/20'}>
                  {v.value ? '✓' : '●'}
                </span>
                <span className="text-sm text-white/70">{v.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Sub-score breakdown */}
        <section className="mb-6 rounded-2xl border border-white/8 bg-white/4 p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-white/30">Score Breakdown</h2>
          <div className="space-y-3">
            {subScores.map(s => (
              <div key={s.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-white/60">{s.label}</span>
                  <span className="font-semibold text-white">{s.value}/{s.max}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${(s.value / s.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Activity signals */}
        <section className="mb-6 rounded-2xl border border-white/8 bg-white/4 p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-white/30">Activity Signals</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Verified routes', value: trust.verified_jobs_count ?? 0 },
              { label: 'Verified km', value: trust.verified_km_total ? `${(trust.verified_km_total / 1000).toFixed(1)}k` : '—' },
              { label: 'Avg response', value: trust.avg_response_min ? `${trust.avg_response_min}m` : '—' },
              { label: 'Reviews', value: trust.review_count ? `${trust.review_avg?.toFixed(1)} ★ (${trust.review_count})` : '—' },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-white/4 p-3">
                <p className="text-lg font-black text-white">{s.value}</p>
                <p className="text-xs text-white/35">{s.label}</p>
              </div>
            ))}
          </div>
          {trust.verified_jobs_count === 0 && (
            <p className="mt-3 text-xs text-white/30">Activity signals are recorded from verified completed routes only — no estimates or self-reported data.</p>
          )}
        </section>

        {/* Badges */}
        {trust.badges && trust.badges.length > 0 && (
          <section className="mb-6 rounded-2xl border border-white/8 bg-white/4 p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-white/30">Earned Badges</h2>
            <div className="flex flex-wrap gap-2">
              {trust.badges.map((b: string) => {
                const badge = BADGE_LABELS[b];
                return badge ? (
                  <span key={b} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badge.color}`}>
                    {badge.icon} {badge.label}
                  </span>
                ) : null;
              })}
            </div>
          </section>
        )}

        {/* Truth-first disclaimer */}
        <p className="text-center text-xs text-white/20">
          Trust scores are computed from verified signals only. No estimated or self-reported data.
          Last computed: {trust.score_computed_at ? new Date(trust.score_computed_at).toLocaleDateString() : '—'}
        </p>
      </div>
    </main>
  );
}
