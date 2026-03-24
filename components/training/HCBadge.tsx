import React, { CSSProperties } from 'react';

export type BadgeTier = 'silver' | 'gold' | 'platinum';

interface HCBadgeProps {
  tier: BadgeTier;
  size?: number;
  style?: CSSProperties;
  animated?: boolean;
  showTooltip?: boolean;
  verifyHref?: string;
}

const TIER_CONFIG = {
  silver: {
    primary: '#A8A8A8',
    secondary: '#C8C8C8',
    accent: '#e0e0e0',
    bg: '#404040',
    text: 'HC CERTIFIED',
    subtext: 'HAUL COMMAND',
    label: 'HC Certified',
    shadowColor: 'rgba(168,168,168,0.5)',
  },
  gold: {
    primary: '#F5A623',
    secondary: '#FFD700',
    accent: '#fff',
    bg: '#2a1a00',
    text: 'HC CERTIFIED',
    subtext: 'AV-READY',
    label: 'HC AV-Ready',
    shadowColor: 'rgba(245,166,35,0.6)',
  },
  platinum: {
    primary: '#E5E4E2',
    secondary: '#F8F8F8',
    accent: '#1A1A1A',
    bg: '#1a1a1a',
    text: 'HC ELITE',
    subtext: 'CERTIFIED',
    label: 'HC Elite',
    shadowColor: 'rgba(229,228,226,0.5)',
  },
};

export function HCBadge({
  tier,
  size = 64,
  style,
  animated = false,
  showTooltip = false,
  verifyHref,
}: HCBadgeProps) {
  const config = TIER_CONFIG[tier];
  const scale = size / 64;

  const badge = (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        cursor: verifyHref ? 'pointer' : 'default',
        ...style,
      }}
      title={showTooltip ? `Click to verify ${config.label} credential` : undefined}
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        style={{
          filter: animated && tier === 'gold'
            ? `drop-shadow(0 0 ${8 * scale}px ${config.shadowColor})`
            : `drop-shadow(0 ${2 * scale}px ${4 * scale}px rgba(0,0,0,0.4))`,
          transition: 'filter 0.3s',
        }}
        className={animated && tier === 'gold' ? 'hc-badge-glow' : ''}
      >
        {/* Shield shape */}
        <defs>
          <linearGradient id={`badge-grad-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={config.secondary} />
            <stop offset="100%" stopColor={config.primary} />
          </linearGradient>
          <linearGradient id={`badge-shine-${tier}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          {animated && tier === 'gold' && (
            <filter id="glow-gold">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Shield path */}
        <path
          d="M32 2 L58 12 L58 34 C58 48 46 58 32 62 C18 58 6 48 6 34 L6 12 Z"
          fill={`url(#badge-grad-${tier})`}
          stroke={config.primary}
          strokeWidth="0.5"
        />

        {/* Shine overlay */}
        <path
          d="M32 2 L58 12 L58 34 C58 48 46 58 32 62 C18 58 6 48 6 34 L6 12 Z"
          fill={`url(#badge-shine-${tier})`}
        />

        {/* Inner border */}
        <path
          d="M32 6 L54 15 L54 34 C54 46 43 55 32 58 C21 55 10 46 10 34 L10 15 Z"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1"
        />

        {/* Checkmark for silver, circuit for gold, star for platinum */}
        {tier === 'silver' && (
          <path
            d="M22 32 L28 38 L42 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {tier === 'gold' && (
          <g transform="translate(20, 18)">
            {/* Circuit/chip icon */}
            <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="white" strokeWidth="1.5" />
            <rect x="7" y="7" width="10" height="10" rx="1" fill="rgba(255,255,255,0.3)" />
            <line x1="0" y1="8" x2="4" y2="8" stroke="white" strokeWidth="1.5" />
            <line x1="0" y1="16" x2="4" y2="16" stroke="white" strokeWidth="1.5" />
            <line x1="20" y1="8" x2="24" y2="8" stroke="white" strokeWidth="1.5" />
            <line x1="20" y1="16" x2="24" y2="16" stroke="white" strokeWidth="1.5" />
            <line x1="8" y1="0" x2="8" y2="4" stroke="white" strokeWidth="1.5" />
            <line x1="16" y1="0" x2="16" y2="4" stroke="white" strokeWidth="1.5" />
            <line x1="8" y1="20" x2="8" y2="24" stroke="white" strokeWidth="1.5" />
            <line x1="16" y1="20" x2="16" y2="24" stroke="white" strokeWidth="1.5" />
          </g>
        )}

        {tier === 'platinum' && (
          <>
            {/* Star above */}
            <polygon
              points="32,12 33.8,17.6 39.7,17.6 34.9,21 36.8,26.6 32,23.2 27.2,26.6 29.1,21 24.3,17.6 30.2,17.6"
              fill="white"
            />
            {/* Small checkmark below */}
            <path
              d="M24 38 L29 43 L40 32"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Bottom bar for gold/platinum */}
        {(tier === 'gold' || tier === 'platinum') && (
          <rect
            x="12"
            y="50"
            width="40"
            height="8"
            rx="3"
            fill={`url(#badge-grad-${tier})`}
          />
        )}
      </svg>

      {animated && tier === 'gold' && (
        <style>{`
          @keyframes hc-badge-pulse {
            0%, 100% { filter: drop-shadow(0 0 6px rgba(245,166,35,0.5)); }
            50% { filter: drop-shadow(0 0 16px rgba(245,166,35,0.9)); }
          }
          .hc-badge-glow {
            animation: hc-badge-pulse 2.5s ease-in-out infinite;
          }
        `}</style>
      )}
    </div>
  );

  if (verifyHref) {
    return (
      <a href={verifyHref} target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-flex', textDecoration: 'none' }}>
        {badge}
      </a>
    );
  }

  return badge;
}

export function BadgeRow({ tiers, size = 32, gap = 8 }: { tiers: BadgeTier[], size?: number, gap?: number }) {
  return (
    <div style={{ display: 'flex', gap, alignItems: 'center' }}>
      {tiers.map(t => <HCBadge key={t} tier={t} size={size} animated={t === 'gold'} />)}
    </div>
  );
}
