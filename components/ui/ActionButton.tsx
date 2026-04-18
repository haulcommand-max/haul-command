'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';

/**
 * ActionButton — Unified button system for mobile-first CTAs
 *
 * Two variants:
 * - PrimaryActionButton: Gold, full-width on mobile, dominant
 * - SecondaryActionButton: Outlined, lighter emphasis
 *
 * Rules enforced:
 * - Minimum 48px height (touch target)
 * - Rounded-2xl
 * - Font-semibold minimum
 * - Full-width on mobile for primary buttons
 */

interface ActionButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
  disabled?: boolean;
  /** External link (opens new tab) */
  external?: boolean;
}

const SIZE_CLASSES = {
  sm: 'h-10 px-4 text-xs',
  md: 'h-12 px-5 text-sm',
  lg: 'h-14 px-6 text-base',
};

export function PrimaryActionButton({
  children,
  href,
  onClick,
  fullWidth = true,
  size = 'md',
  className = '',
  id,
  disabled,
  external,
}: ActionButtonProps) {
  const classes = `
    inline-flex items-center justify-center gap-2
    ${SIZE_CLASSES[size]}
    ${fullWidth ? 'w-full sm:w-auto' : ''}
    rounded-2xl font-bold
    bg-amber-500 hover:bg-amber-400 active:bg-amber-600
    text-black
    transition-all duration-200
    disabled:opacity-40 disabled:cursor-not-allowed
    ${className}
  `;

  if (href) {
    return (
      <Link
        href={href}
        id={id}
        className={classes}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} id={id} className={classes} disabled={disabled}>
      {children}
    </button>
  );
}

export function SecondaryActionButton({
  children,
  href,
  onClick,
  fullWidth = false,
  size = 'md',
  className = '',
  id,
  disabled,
  external,
}: ActionButtonProps) {
  const classes = `
    inline-flex items-center justify-center gap-2
    ${SIZE_CLASSES[size]}
    ${fullWidth ? 'w-full sm:w-auto' : ''}
    rounded-2xl font-semibold
    bg-transparent border border-white/[0.12] hover:border-white/[0.25]
    text-white/70 hover:text-white
    transition-all duration-200
    disabled:opacity-40 disabled:cursor-not-allowed
    ${className}
  `;

  if (href) {
    return (
      <Link
        href={href}
        id={id}
        className={classes}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} id={id} className={classes} disabled={disabled}>
      {children}
    </button>
  );
}

/**
 * ProofStrip — Mini trust/recent/live badges row
 * Shows trust signals beneath CTAs
 */
interface ProofItem {
  icon?: ReactNode;
  label: string;
}

interface ProofStripProps {
  items: ProofItem[];
  className?: string;
}

export function ProofStrip({ items, className = '' }: ProofStripProps) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 ${className}`}>
      {items.map((item, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 text-[11px] text-white/35 font-medium"
        >
          {item.icon && <span className="text-amber-400/60">{item.icon}</span>}
          {item.label}
        </span>
      ))}
    </div>
  );
}

/**
 * DataFreshnessTag — Display updated month/year or relative freshness
 */
interface DataFreshnessTagProps {
  date?: Date | string;
  label?: string;
  className?: string;
}

export function DataFreshnessTag({ date, label, className = '' }: DataFreshnessTagProps) {
  const displayDate = date
    ? new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] text-white/20 uppercase tracking-wider font-medium ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
      {label || (displayDate ? `Updated ${displayDate}` : 'Live data')}
    </span>
  );
}
