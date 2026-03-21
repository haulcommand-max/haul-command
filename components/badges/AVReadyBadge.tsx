'use client';

type BadgeType = 'av_ready' | 'drone_survey' | 'superload' | 'night_certified';

const BADGE_CONFIG: Record<BadgeType, { label: string; icon: string; color: string; bg: string }> = {
  av_ready: { label: 'AV Ready', icon: '🤖', color: '#00ff88', bg: 'rgba(0,255,136,0.12)' },
  drone_survey: { label: 'Drone Survey', icon: '🛸', color: '#00d4ff', bg: 'rgba(0,212,255,0.12)' },
  superload: { label: 'Superload Certified', icon: '🏗️', color: '#ffc800', bg: 'rgba(255,200,0,0.12)' },
  night_certified: { label: 'Night Certified', icon: '🌙', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
};

export function AVReadyBadge({ type, size = 'md' }: { type: BadgeType; size?: 'sm' | 'md' | 'lg' }) {
  const config = BADGE_CONFIG[type];
  const sizes = { sm: { padding: '2px 8px', fontSize: 11 }, md: { padding: '4px 12px', fontSize: 13 }, lg: { padding: '6px 16px', fontSize: 15 } };
  const s = sizes[size];

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: s.padding, borderRadius: 20, background: config.bg, color: config.color, fontSize: s.fontSize, fontWeight: 600, border: `1px solid ${config.color}33`, whiteSpace: 'nowrap' }}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

export function BadgeRow({ badges, size = 'sm' }: { badges: BadgeType[]; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {badges.map(b => <AVReadyBadge key={b} type={b} size={size} />)}
    </div>
  );
}
