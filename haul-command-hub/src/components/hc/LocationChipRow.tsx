import type { HCLink } from '@/lib/hc-types';

interface LocationChipRowProps {
  chips: HCLink[];
}

export default function HCLocationChipRow({ chips }: LocationChipRowProps) {
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {chips.map((chip, i) => (
        <a
          key={i}
          href={chip.href}
          className="inline-flex items-center gap-1.5 bg-white/[0.04] hover:bg-accent/10 border border-white/[0.08] hover:border-accent/30 text-gray-300 hover:text-accent rounded-full px-4 py-1.5 text-xs font-medium transition-all"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
          {chip.label}
        </a>
      ))}
    </div>
  );
}
