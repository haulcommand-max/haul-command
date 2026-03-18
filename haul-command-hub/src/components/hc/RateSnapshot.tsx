import type { HCRateSummary } from '@/lib/hc-types';

export function HCRateSnapshot({ rates }: { rates: HCRateSummary[] }) {
  if (!rates.length) return null;

  return (
    <section className="mb-8">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Rate Intelligence</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rates.map((r, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <p className="text-[10px] text-gray-600 font-bold uppercase mb-1">{r.geographyLabel}</p>
            <p className="text-lg font-black text-accent">{r.rateRangeLabel}</p>
            <div className="flex gap-3 mt-2 text-[10px]">
              {r.changeVs7dLabel && <span className="text-gray-500">7d: {r.changeVs7dLabel}</span>}
              {r.changeVs30dLabel && <span className="text-gray-500">30d: {r.changeVs30dLabel}</span>}
            </div>
            {r.freshness && (
              <p className="text-[9px] text-gray-700 mt-2">{r.freshness.updateLabel}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
