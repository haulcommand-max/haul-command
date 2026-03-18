import type { HCRequirementsSummary, HCAction } from '@/lib/hc-types';

interface RequirementsSnapshotProps {
  heading?: string;
  summary: HCRequirementsSummary;
  cta?: HCAction;
}

export default function HCRequirementsSnapshot({
  heading = 'Escort Requirements',
  summary,
  cta,
}: RequirementsSnapshotProps) {
  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">{heading}</h3>
        {cta && (
          <a href={cta.href} className="text-accent text-xs font-bold hover:underline">
            {cta.label} →
          </a>
        )}
      </div>
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📋</span>
          <span className="text-white font-semibold text-sm">{summary.jurisdictionLabel}</span>
        </div>
        {summary.escortThresholds.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {summary.escortThresholds.map((threshold, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                <span className="text-accent mt-0.5">›</span>
                <span>{threshold}</span>
              </div>
            ))}
          </div>
        )}
        {summary.permitLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
            {summary.permitLinks.map((link, i) => (
              <a
                key={i}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className="text-[10px] text-accent/70 hover:text-accent font-medium transition-colors"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        )}
        {summary.disclaimer && (
          <p className="text-[10px] text-gray-600 mt-3 italic">{summary.disclaimer}</p>
        )}
        {summary.lastReviewedAt && (
          <div className="text-[9px] text-gray-600 mt-2">
            Last reviewed: {new Date(summary.lastReviewedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </section>
  );
}
