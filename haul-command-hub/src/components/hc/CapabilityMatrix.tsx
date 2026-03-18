export function HCCapabilityMatrix({ capabilities, title }: { capabilities: string[]; title?: string }) {
  if (!capabilities.length) return null;
  return (
    <section className="mb-8">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{title ?? 'Capabilities'}</h2>
      <div className="flex flex-wrap gap-2">
        {capabilities.map((cap, i) => (
          <span key={i} className="bg-white/[0.04] border border-white/[0.08] text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg">
            {cap}
          </span>
        ))}
      </div>
    </section>
  );
}
