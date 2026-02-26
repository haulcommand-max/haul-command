import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  variant?: 'full' | 'shieldOnly' | 'textOnly';
  theme?: 'dark' | 'light' | 'gold';
}

/**
 * Haul Command HQ Logo - Pure SVG implementation.
 * mathematically perfect, perfectly scalable.
 *
 * Usage:
 * <Logo className="w-32 h-32" variant="full" theme="gold" />
 */
export const Logo: React.FC<LogoProps> = ({
  className = 'w-16 h-16',
  variant = 'full',
  theme = 'gold',
  ...props
}) => {
  // Theme colors
  const colors = {
    dark: {
      primary: '#1A1A1A',     // Charcoal Shield background
      accent1: '#FFFFFF',     // White Elements
      accent2: '#E5E7EB',     // Gray Text
      border: '#374151',      // Dark border
    },
    light: {
      primary: '#FFFFFF',     // White Shield
      accent1: '#111827',     // Dark Elements
      accent2: '#374151',     // Dark Gray Text
      border: '#E5E7EB',      // Light border
    },
    gold: {
      primary: '#111111',               // Deepest black for contrast
      accent1: 'url(#goldGradient1)',   // Metallic Gold Star & Chevrons
      accent2: 'url(#goldGradient2)',   // Slightly lighter Metallic Gold for Text
      border: 'url(#goldGradient3)',    // Gold Border
    }
  };

  const currentColors = colors[theme];

  const showShield = variant === 'full' || variant === 'shieldOnly';
  const showText = variant === 'full' || variant === 'textOnly';

  return (
    <svg
      viewBox="0 0 500 500"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Gradients for the Signature Gold Look */}
        <linearGradient id="goldGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C99846" />
          <stop offset="50%" stopColor="#FDE08B" />
          <stop offset="100%" stopColor="#A87B2E" />
        </linearGradient>

        <linearGradient id="goldGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#EDC987" />
          <stop offset="50%" stopColor="#FFF2C8" />
          <stop offset="100%" stopColor="#C69E55" />
        </linearGradient>

        <linearGradient id="goldGradient3" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#B38133" />
          <stop offset="50%" stopColor="#E6C174" />
          <stop offset="100%" stopColor="#7E5616" />
        </linearGradient>

        {/* Drop shadow for depth */}
        <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.4" />
        </filter>
      </defs>

      {showShield && (
        <g transform="translate(125, 40)" filter="url(#dropShadow)">
          {/* Outer Hexagon Shield Border */}
          <path
            d="M125 0 L250 50 L250 200 L125 250 L0 200 L0 50 Z"
            fill="none"
            stroke={currentColors.border}
            strokeWidth="12"
            strokeLinejoin="miter"
          />

          {/* Inner Shield Background */}
          <path
            d="M125 10 L240 56 L240 196 L125 242 L10 196 L10 56 Z"
            fill={currentColors.primary}
          />

          {/* Inner Hexagon Outline */}
          <path
            d="M125 16 L234 60 L234 192 L125 236 L16 192 L16 60 Z"
            fill="none"
            stroke={currentColors.accent2}
            strokeWidth="4"
          />

          {/* 5-Point Star */}
          <polygon
            points="125,25 137,60 175,60 145,82 156,118 125,95 94,118 105,82 75,60 113,60"
            fill={currentColors.accent1}
            transform="scale(0.85) translate(22, 10)"
          />

          {/* Three Command Chevrons */}
          {/* Top Chevron */}
          <path
            d="M40 100 L125 135 L210 100 L210 120 L125 155 L40 120 Z"
            fill={currentColors.accent1}
          />
          {/* Middle Chevron */}
          <path
            d="M40 135 L125 170 L210 135 L210 155 L125 190 L40 155 Z"
            fill={currentColors.accent1}
          />
          {/* Bottom Chevron */}
          <path
            d="M40 170 L125 205 L210 170 L210 190 L125 225 L40 190 Z"
            fill={currentColors.accent1}
          />
        </g>
      )}

      {showText && (
        <g transform="translate(250, 360)">
          {/* HAUL */}
          <text
            x="0"
            y="0"
            fontFamily="'Impact', 'Arial Black', sans-serif"
            fontSize="72"
            fontWeight="bold"
            textAnchor="middle"
            fill={currentColors.accent1}
            letterSpacing="2"
            filter="url(#dropShadow)"
          >
            HAUL
          </text>
          
          {/* COMMAND */}
          <text
            x="0"
            y="65"
            fontFamily="'Impact', 'Arial Black', sans-serif"
            fontSize="64"
            fontWeight="bold"
            textAnchor="middle"
            fill={currentColors.accent2}
            letterSpacing="4"
            filter="url(#dropShadow)"
          >
            COMMAND
          </text>

          {/* Bottom decorative underline/chevron pointer */}
          <g transform="translate(-140, 90)">
            <path 
              d="M0 5 L120 5 L140 15 L160 5 L280 5" 
              fill="none" 
              stroke={currentColors.border} 
              strokeWidth="4" 
            />
            {/* Small double chevron at the bottom center */}
            <path d="M130 15 L140 25 L150 15" fill="none" stroke={currentColors.accent1} strokeWidth="4" />
            <path d="M130 22 L140 32 L150 22" fill="none" stroke={currentColors.accent1} strokeWidth="4" />
          </g>
        </g>
      )}
    </svg>
  );
};
