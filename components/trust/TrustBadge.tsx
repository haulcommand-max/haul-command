import Link from 'next/link';

interface Props {
  trustScore: number | null;
  isVerified: boolean;
  slug: string;
  badges?: string[];
  compact?: boolean;
}

const SCORE_CONFIG = [
  { min: 80, label: 'High Trust',    color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30' },
  { min: 60, label: 'Good Standing', color: 'text-amber-400',  bg: 'bg-amber-500/15 border-amber-500/30' },
  { min: 40, label: 'Building',      color: 'text-white/50',   bg: 'bg-white/5 border-white/10' },
  { min: 0,  label: 'New',           color: 'text-white/30',   bg: 'bg-white/4 border-white/8' },
];

function getConfig(score: number | null) {
  if (score == null) return SCORE_CONFIG[3];
  return SCORE_CONFIG.find(c => score >= c.min) ?? SCORE_CONFIG[3];
}

export function TrustBadge({ trustScore, isVerified, slug, badges = [], compact = false }: Props) {
  const cfg = getConfig(trustScore);

  if (compact) {
    return (
      <Link
        href={`/trust/${slug}`}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-80 ${cfg.bg} ${cfg.color}`}
      >
        {isVerified && <span>✓</span>}
        <span>{trustScore != null ? trustScore : 'New'}</span>
        <span className="text-[10px] opacity-60">trust</span>
      </Link>
    );
  }

  return (
    <Link
      href={`/trust/${slug}`}
      className={`group flex items-center gap-3 rounded-xl border p-3 transition-all hover:opacity-90 ${cfg.bg}`}
    >
      {/* Score */}
      <div className="shrink-0 text-center">
        <p className={`text-2xl font-black leading-none ${cfg.color}`}>
          {trustScore != null ? trustScore : '—'}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-white/30">trust</p>
      </div>
      {/* Label + badges */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {isVerified && (
            <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">✓ Verified</span>
          )}
          <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
        </div>
        {badges.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {badges.slice(0, 3).map(b => (
              <span key={b} className="rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] text-white/40">
                {b.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="shrink-0 text-xs text-white/20 group-hover:text-white/40">→</span>
    </Link>
  );
}

export default TrustBadge;
