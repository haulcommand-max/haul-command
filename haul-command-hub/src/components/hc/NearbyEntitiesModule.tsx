import Link from 'next/link';
import type { HCLink } from '@/lib/hc-types';

export function HCNearbyEntitiesModule({ entities, title }: { entities: HCLink[]; title?: string }) {
  if (!entities.length) return null;
  return (
    <section className="mb-8">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{title ?? 'Nearby'}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {entities.map((e, i) => (
          <Link key={i} href={e.href} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-xs text-gray-300 hover:text-accent hover:border-accent/20 transition-all truncate">
            {e.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
