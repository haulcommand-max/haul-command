// components/profile/OperatorTrustCard.tsx
// Displays trust score breakdown with visual meter
// Maps to hc_trust_score_breakdown columns
import Link from 'next/link';

interface TrustCardProps {
  trust: any;
  operator: any;
  tierColor: string;
}

const TIER_LABELS: Record<string, string> = {
  elite: '⬡ COMMAND ELITE',
  verified: '✓ VERIFIED',
  standard: '◎ STANDARD',
  provisional: '○ PROVISIONAL',
};

export function OperatorTrustCard({ trust, operator, tierColor }: TrustCardProps) {
  const score = trust?.trust_score ? Math.round(Number(trust.trust_score)) : null;
  const tier = trust?.trust_tier ?? operator.tier ?? 'standard';

  const components = trust ? [
    { label: 'Identity', value: trust.identity_score, max: 100, desc: 'Phone, docs, FMCSA verification' },
    { label: 'Profile', value: trust.profile_score, max: 100, desc: 'Completeness & accuracy' },
    { label: 'Responsiveness', value: trust.responsiveness_score, max: 100, desc: 'Response speed & rate' },
    { label: 'Completion', value: trust.completion_score, max: 100, desc: 'Job finish rate' },
    { label: 'Community', value: trust.community_score, max: 100, desc: 'Reviews, endorsements, signals' },
  ] : [];

  return (
    <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-[#f0f2f5]">Trust Score</h2>
        <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
          style={{ background: `${tierColor}20`, color: tierColor }}>
          {TIER_LABELS[tier] ?? tier.toUpperCase()}
        </span>
      </div>

      {/* Score meter */}
      {score !== null ? (
        <div className="mb-6">
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-extrabold tracking-tight" style={{ color: tierColor }}>
              {score}
            </span>
            <span className="text-sm text-[#566880] mb-1.5">/1000</span>
          </div>
          <div className="h-2 bg-[#0c1015] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((score / 1000) * 100, 100)}%`, background: tierColor }}
            />
          </div>
        </div>
      ) : (
        <div className="mb-6 text-sm text-[#566880]">
          Trust score not yet computed. Claim this profile to build your score.
        </div>
      )}

      {/* Score breakdown */}
      {components.length > 0 && (
        <div className="space-y-3">
          {components.map(comp => {
            const pct = comp.value ? Math.min(Math.round(Number(comp.value)), 100) : 0;
            return (
              <div key={comp.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#8a9ab0]">{comp.label}</span>
                  <span className="text-xs font-semibold text-[#d0dce8]">{pct}</span>
                </div>
                <div className="h-1.5 bg-[#0c1015] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 80 ? '#22c55e' : pct >= 50 ? '#d4950e' : '#566880',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Penalty flags */}
      {trust?.complaint_penalty_pts && Number(trust.complaint_penalty_pts) < 0 && (
        <div className="mt-4 text-xs text-[#e06060] bg-[#200808] border border-[#5a1818] rounded-lg px-3 py-2">
          ⚠ {Math.abs(Number(trust.complaint_penalty_pts))} penalty points applied
        </div>
      )}

      <Link href="/verify" className="mt-5 block text-xs text-[#566880] hover:text-[#d4950e] transition-colors">
        How is trust score calculated? →
      </Link>
    </div>
  );
}
