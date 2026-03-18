import type { HCFreshness } from '@/lib/hc-types';

export function HCSourceFreshnessPanel({ freshness, sources }: { freshness: HCFreshness; sources?: string[] }) {
  return (
    <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-8">
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Data Freshness</h3>
      <div className="flex items-center gap-3 mb-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-sm text-gray-300">{freshness.updateLabel}</span>
      </div>
      {freshness.sourceCount && (
        <p className="text-xs text-gray-600">{freshness.sourceCount} source{freshness.sourceCount > 1 ? 's' : ''} contributing</p>
      )}
      {sources && sources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {sources.map((s, i) => (
            <span key={i} className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded">{s}</span>
          ))}
        </div>
      )}
    </section>
  );
}
