'use client';
/**
 * HCSurface — Canonical Haul Command Surface System
 * 
 * Three modes:
 *   a = Command Surface (heroes, major sections) — cinematic dark + gold sweep
 *   b = Premium Panel (tools, cards, modules) — dark graphite + hover glow  
 *   c = Tactical Contrast (blog, regulations, content) — dark reading surface
 * 
 * Usage:
 *   <HCSurface mode="a" className="py-20">...</HCSurface>
 *   <HCSurface mode="b" rounded="xl">...</HCSurface>
 *   <HCSurface mode="c">...</HCSurface>
 */

import React from 'react';

interface HCSurfaceProps {
  mode: 'a' | 'b' | 'c';
  children: React.ReactNode;
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  as?: keyof React.JSX.IntrinsicElements;
  style?: React.CSSProperties;
}

export function HCSurface({
  mode,
  children,
  className = '',
  rounded = 'none',
  as: Tag = 'div',
  style,
}: HCSurfaceProps) {
  const modeClass = `hc-surface-${mode}`;
  const roundedClass = rounded !== 'none' ? `rounded-${rounded}` : '';
  
  return (
    // @ts-ignore — dynamic tag
    <Tag
      className={`${modeClass} ${roundedClass} ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
}

/** Shorthand for Mode A — Command Surface */
export const CommandSurface = ({ children, className = '', ...props }: Omit<HCSurfaceProps, 'mode'>) => (
  <HCSurface mode="a" className={className} {...props}>{children}</HCSurface>
);

/** Shorthand for Mode B — Premium Panel */
export const PremiumPanel = ({ children, className = '', ...props }: Omit<HCSurfaceProps, 'mode'>) => (
  <HCSurface mode="b" className={className} {...props}>{children}</HCSurface>
);

/** Shorthand for Mode C — Tactical Contrast */
export const TacticalSurface = ({ children, className = '', ...props }: Omit<HCSurfaceProps, 'mode'>) => (
  <HCSurface mode="c" className={className} {...props}>{children}</HCSurface>
);
