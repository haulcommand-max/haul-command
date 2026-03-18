import Link from 'next/link';
import type { HCResultCard } from '@/lib/hc-types';

export function HCResultsList({ results, emptyMessage }: { results: HCResultCard[]; emptyMessage?: string }) {
  if (!results.length) {
    return (
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center">
        <p className="text-gray-500 text-sm">{emptyMessage ?? 'No results found in this market yet.'}</p>
        <Link href="/claim" className="inline-block mt-4 bg-accent text-black px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-yellow-400 transition-colors">
          Be the First — Add Your Business
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {results.map((r) => (
        <Link key={r.id} href={r.href} className="group block bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-accent/30 hover:bg-white/[0.04] transition-all">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-sm font-bold text-white group-hover:text-accent transition-colors line-clamp-2">{r.title}</h3>
          </div>
          {r.subtitle && <p className="text-xs text-gray-500 mb-2">{r.subtitle}</p>}
          <p className="text-xs text-gray-600 mb-3">📍 {r.locationLabel}</p>
          {r.badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {r.badges.map((b, i) => (
                <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  b.tone === 'success' ? 'bg-green-500/10 text-green-400' :
                  b.tone === 'premium' ? 'bg-accent/10 text-accent' :
                  b.tone === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-white/5 text-gray-400'
                }`}>
                  {b.icon && <span className="mr-0.5">{b.icon}</span>}{b.label}
                </span>
              ))}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
