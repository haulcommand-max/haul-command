import type { HCCorridorSummary, HCAction } from '@/lib/hc-types';

interface CorridorSnapshotProps {
  heading?: string;
  corridors: HCCorridorSummary[];
  cta?: HCAction;
}

export default function HCCorridorSnapshot({
  heading = 'Key Corridors',
  corridors,
  cta,
}: CorridorSnapshotProps) {
  if (!corridors.length) return null;

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {corridors.map((corridor) => (
          <a
            key={corridor.slug}
            href={`/corridors/${corridor.slug}`}
            className="group bg-white/[0.03] hover:bg-accent/[0.04] border border-white/[0.06] hover:border-accent/20 rounded-xl p-4 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white font-bold text-sm group-hover:text-accent transition-colors">
                {corridor.name}
              </span>
              {corridor.healthLabel && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-bold uppercase">
                  {corridor.healthLabel}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {corridor.regionLabels.join(' → ')}
            </div>
            {corridor.rateRangeLabel && (
              <div className="text-xs text-gray-400 mt-1">
                {corridor.rateRangeLabel}
              </div>
            )}
            {corridor.topServices.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {corridor.topServices.slice(0, 3).map((svc, i) => (
                  <span key={i} className="text-[9px] bg-white/[0.04] rounded px-1.5 py-0.5 text-gray-400">
                    {svc}
                  </span>
                ))}
              </div>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
