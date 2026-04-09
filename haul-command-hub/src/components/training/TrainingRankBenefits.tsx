import { TrendingUp, Eye, Filter, Star } from 'lucide-react';
import type { TrainingBadgeSlug } from '@/lib/training/types';
import { BADGE_META, TRAINING_RANK_WEIGHTS } from '@/lib/training/ranking';

// Re-export from ranking to keep import path clean in component
export { TRAINING_RANK_WEIGHTS };

interface TrainingRankBenefitsProps {
  currentBadge?: TrainingBadgeSlug | null;
}

const RANK_SURFACES = [
  { icon: <TrendingUp size={15} />, label: 'Directory Search', description: 'Higher position in search results' },
  { icon: <Eye size={15} />,       label: 'Local Results',    description: 'Better near-me and city results' },
  { icon: <Filter size={15} />,    label: 'Broker Filters',   description: 'Eligible for certified-only filters' },
  { icon: <Star size={15} />,      label: 'Leaderboards',     description: 'Access higher leaderboard brackets' },
];

export default function TrainingRankBenefits({ currentBadge }: TrainingRankBenefitsProps) {
  return (
    <div className="border border-white/10 rounded-xl p-6 bg-white/[0.02]">
      <h3 className="text-lg font-bold text-white mb-1">How Training Improves Your Rank</h3>
      <p className="text-sm text-gray-400 mb-5">
        Training earns you a badge that contributes directly to your profile rank across these surfaces.
        Higher tiers contribute more weight.
      </p>

      {/* Rank weight comparison */}
      <div className="space-y-3 mb-6">
        {(['road_ready', 'certified', 'elite', 'av_ready'] as TrainingBadgeSlug[]).map((slug) => {
          const meta = BADGE_META[slug];
          const weight = TRAINING_RANK_WEIGHTS[slug];
          const isActive = currentBadge === slug;
          return (
            <div key={slug} className={`flex items-center gap-3 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
              <div className="w-24 text-xs font-medium text-gray-300 shrink-0">{meta?.label}</div>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    slug === 'elite' ? 'bg-yellow-400' :
                    slug === 'certified' ? 'bg-yellow-300' :
                    slug === 'av_ready' ? 'bg-blue-400' : 'bg-gray-400'
                  }`}
                  style={{ width: `${weight * 100}%` }}
                />
              </div>
              <div className="w-10 text-right text-xs font-bold text-gray-300">{(weight * 100).toFixed(0)}%</div>
              {isActive && (
                <span className="text-[10px] text-green-400 font-bold shrink-0">YOURS</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Affected surfaces */}
      <div className="grid grid-cols-2 gap-3">
        {RANK_SURFACES.map((s) => (
          <div key={s.label} className="flex items-start gap-2.5 p-3 bg-white/[0.02] rounded-lg border border-white/5">
            <div className="text-yellow-400 mt-0.5 shrink-0">{s.icon}</div>
            <div>
              <div className="text-xs font-semibold text-white">{s.label}</div>
              <div className="text-[11px] text-gray-500">{s.description}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[10px] text-gray-600 leading-relaxed">
        Training contributes one component to overall rank. Proof, freshness, trust, and response signals also apply.
        Training alone does not override stronger proof signals.
      </p>
    </div>
  );
}
