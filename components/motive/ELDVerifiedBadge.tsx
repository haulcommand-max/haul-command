// components/motive/ELDVerifiedBadge.tsx
// ELD Verified badge for directory cards

'use client';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ELDVerifiedBadge({ size = 'sm', showLabel = true }: Props) {
  const sizes = {
    sm: { badge: 10, font: 9, padding: '1px 6px', gap: 3 },
    md: { badge: 12, font: 11, padding: '2px 8px', gap: 4 },
    lg: { badge: 14, font: 13, padding: '3px 10px', gap: 5 },
  };
  const s = sizes[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.padding,
        borderRadius: 4,
        background: 'linear-gradient(90deg, #22c55e15, #16a34a15)',
        border: '1px solid #22c55e30',
        color: '#22c55e',
        fontSize: s.font,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        whiteSpace: 'nowrap',
      }}
      title="ELD Verified — Real-time location and availability data verified through connected Motive ELD"
    >
      <svg width={s.badge} height={s.badge} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="#22c55e" strokeWidth="1.5" />
        <path d="M5 8l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showLabel && 'ELD Verified'}
    </span>
  );
}
