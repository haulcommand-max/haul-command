import Link from 'next/link';
import type { HCCorridorSummary } from '@/lib/hc-types';

export function HCRelatedCorridorsModule({ corridors, title }: { corridors: HCCorridorSummary[]; title?: string }) {
  if (!corridors.length) return null;
  return (
    <section className="mb-8">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{title ?? 'Related Corridors'}</h2>
      <div className="space-y-3">
        {corridors.map((c) => (
          <Link key={c.slug} href={`/corridors/${c.slug}`} className="block bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-accent/20 transition-all">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-white">{c.name}</h3>
              {c.healthLabel && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  c.healthLabel === 'active' ? 'bg-green-500/10 text-green-400' :
                  c.healthLabel === 'growing' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-white/5 text-gray-500'
                }`}>{c.healthLabel}</span>
              )}
            </div>
            <p className="text-[10px] text-gray-600">{c.regionLabels.join(' → ')}</p>
            {c.rateRangeLabel && <p className="text-xs text-accent mt-1">{c.rateRangeLabel}</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}
