import type { HCProfile } from '@/lib/hc-types';

const VERIFICATION_BADGES: Record<string, { label: string; color: string }> = {
  partner_verified: { label: '✅ Partner Verified', color: 'bg-green-500/10 text-green-400' },
  document_verified: { label: '📋 Document Verified', color: 'bg-blue-500/10 text-blue-400' },
  phone_verified: { label: '📞 Phone Verified', color: 'bg-cyan-500/10 text-cyan-400' },
  claimed: { label: '🏷️ Claimed', color: 'bg-accent/10 text-accent' },
  unverified: { label: 'Unclaimed', color: 'bg-white/5 text-gray-500' },
};

export function HCProfileHeader({ profile }: { profile: HCProfile }) {
  const vBadge = VERIFICATION_BADGES[profile.verificationState] ?? VERIFICATION_BADGES.unverified;

  return (
    <div className="border-b border-white/5 pb-8 mb-8">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl flex-shrink-0">
          {profile.entityType === 'broker' ? '🏢' : '🚛'}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">{profile.displayName}</h1>
          {profile.tagline && <p className="text-gray-400 text-sm mt-1">{profile.tagline}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Verification badge */}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${vBadge.color}`}>{vBadge.label}</span>

            {/* Availability badge */}
            {profile.availability?.available && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-500/15 text-green-400 border border-green-500/20 animate-pulse">
                🟢 {profile.availability.label}
              </span>
            )}

            {/* Fast Responder badge */}
            {profile.fastResponder?.eligible && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/20">
                ⚡ {profile.fastResponder.label}
              </span>
            )}

            {/* Other badges */}
            {profile.badges.map((b, i) => (
              <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                b.tone === 'success' ? 'bg-green-500/10 text-green-400' :
                b.tone === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                b.tone === 'danger' ? 'bg-red-500/10 text-red-400' :
                b.tone === 'premium' ? 'bg-accent/10 text-accent' :
                'bg-white/5 text-gray-400'
              }`}>
                {b.icon && <span className="mr-0.5">{b.icon}</span>}{b.label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 mt-4 md:mt-0">
          {(profile.primaryActions || []).map(a => (
            <a key={a.id} href={a.href} className="px-5 py-2.5 bg-accent text-black font-bold text-sm rounded-xl hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2">
              {a.icon && <span>{a.icon}</span>} {a.label}
            </a>
          ))}
          {(profile.secondaryActions || []).map(a => (
            <a key={a.id} href={a.href} className="px-5 py-2.5 bg-white/5 border border-white/10 font-semibold text-white text-sm rounded-xl hover:bg-white/10 hover:border-white/30 transition-all flex items-center justify-center gap-2">
              {a.icon && <span>{a.icon}</span>} {a.label}
            </a>
          ))}
        </div>
      </div>
      {profile.serviceAreaLabels.length > 0 && (
        <p className="text-xs text-gray-500">📍 {profile.serviceAreaLabels.join(' · ')}</p>
      )}

      {/* Claim pressure indicator */}
      {profile.claimPressure?.elevated && (
        <div className="mt-4 bg-accent/[0.06] border border-accent/15 rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="text-sm">🔥</span>
          <p className="text-xs text-accent font-medium">
            This listing is getting attention — {profile.claimPressure.unclaimedViews30d} views in the last 30 days. Claim it to take control.
          </p>
        </div>
      )}
    </div>
  );
}
