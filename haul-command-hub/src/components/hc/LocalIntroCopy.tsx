export function HCLocalIntroCopy({ h1, intro, badge }: { h1: string; intro: string; badge?: string }) {
  return (
    <header className="mb-8">
      {badge && (
        <span className="inline-block bg-accent/10 text-accent text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider mb-3">
          {badge}
        </span>
      )}
      <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight">{h1}</h1>
      <p className="text-gray-400 text-base md:text-lg mt-3 max-w-3xl leading-relaxed">{intro}</p>
    </header>
  );
}
