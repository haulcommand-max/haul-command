import type { HCMetric } from '@/lib/hc-types';

interface ProofBarProps {
  metrics: HCMetric[];
  hideIfEmpty?: boolean;
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
}

export default function HCProofBar({ metrics, hideIfEmpty = true }: ProofBarProps) {
  // TRUTH RULE: Never render placeholder or zero metrics without real basis
  const validMetrics = metrics.filter(
    (m) => m.value && m.value !== '0' && m.value !== '$0' && m.value.toLowerCase() !== 'initializing'
  );

  if (hideIfEmpty && validMetrics.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-10 py-3 sm:py-4 px-3 sm:px-4 bg-white/[0.02] rounded-2xl border border-white/[0.06] w-full max-w-full">
      {validMetrics.map((metric, i) => (
        <div key={i} className="text-center group relative min-w-0">
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-accent tabular-nums">
            {metric.value}
          </div>
          <div className="text-[9px] sm:text-[10px] md:text-xs text-[#8b95a5] uppercase tracking-wider mt-0.5 font-medium break-words">
            {metric.label}
          </div>
          {metric.freshness?.lastUpdatedAt && (
            <div className="text-[9px] text-gray-600 mt-1 flex items-center justify-center gap-1">
              <span className="w-1 h-1 rounded-full bg-green-500/60 inline-block" />
              {formatTimestamp(metric.freshness.lastUpdatedAt)}
            </div>
          )}
          {metric.geographyScope && (
            <div className="text-[9px] text-gray-600">
              {metric.geographyScope}
            </div>
          )}
          {/* Methodology tooltip */}
          {metric.methodologyUrl && (
            <a
              href={metric.methodologyUrl}
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-accent/50 hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
            >
              methodology
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
