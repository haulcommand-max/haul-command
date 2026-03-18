import Link from 'next/link';

export function HCUrgentFillModule({ count }: { count?: number }) {
  return (
    <section className="bg-red-500/[0.04] border border-red-500/10 rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider">Urgent Fill Needed</h2>
      </div>
      <p className="text-gray-400 text-sm mb-4">
        {count && count > 0
          ? `${count} load${count > 1 ? 's' : ''} need escort coverage now. Respond to earn priority placement.`
          : 'Operators who respond to urgent fills earn priority placement and fast-responder badges.'}
      </p>
      <Link href="/loads" className="inline-block bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-red-500 transition-colors">
        View Loads →
      </Link>
    </section>
  );
}
