export function HCMethodologyPanel({ title, methodology, lastUpdated }: { title?: string; methodology: string; lastUpdated?: string }) {
  return (
    <section className="bg-yellow-500/[0.03] border border-yellow-500/10 rounded-2xl p-5 mb-8">
      <h3 className="text-[10px] font-bold text-yellow-500/80 uppercase tracking-widest mb-2">{title ?? 'Methodology'}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{methodology}</p>
      {lastUpdated && (
        <p className="text-[10px] text-gray-600 mt-3">Last updated: {lastUpdated}</p>
      )}
    </section>
  );
}
