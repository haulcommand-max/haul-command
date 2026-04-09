import Link from 'next/link';

const BADGE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  elite: {
    label: 'Elite',
    color: 'text-purple-300',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  'elite-escort': {
    label: 'Elite',
    color: 'text-purple-300',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  av_ready: {
    label: 'AV-Ready',
    color: 'text-blue-300',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  certified: {
    label: 'Certified',
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  'certified-operator': {
    label: 'Certified',
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  road_ready: {
    label: 'Road Ready',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/25',
  },
};

interface TrainingBadgeChipProps {
  badgeSlug: string;
  linkable?: boolean;
  size?: 'xs' | 'sm';
}

export default function TrainingBadgeChip({
  badgeSlug,
  linkable = true,
  size = 'xs',
}: TrainingBadgeChipProps) {
  const cfg = BADGE_CONFIG[badgeSlug];
  if (!cfg) return null;

  const textSize = size === 'xs' ? 'text-[9px]' : 'text-xs';
  const px = size === 'xs' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  const chip = (
    <span
      className={`inline-flex items-center gap-0.5 ${px} rounded-full border font-bold uppercase tracking-wide ${textSize} ${cfg.color} ${cfg.bg} ${cfg.border}`}
      title={`HC ${cfg.label} Training Badge`}
    >
      🎓 {cfg.label}
    </span>
  );

  if (linkable) {
    return (
      <Link
        href={`/training/levels/${badgeSlug.replace(/_/g, '-').replace('-operator', '').replace('-escort', '')}`}
        className="hover:opacity-80 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {chip}
      </Link>
    );
  }

  return chip;
}
