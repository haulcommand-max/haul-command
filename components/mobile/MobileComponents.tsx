'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

/* ══════════════════════════════════════════════════════════════
   MobileScreenHeader — Mobile screen header with back/title/actions
   From design system: sticky, blur background, 52px min-height
   ══════════════════════════════════════════════════════════════ */

const BackArrow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function MobileScreenHeader({ title, showBack, onBack, rightAction }: ScreenHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <header className="m-screen-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--m-sm)' }}>
        {showBack && (
          <button
            className="m-screen-header__back"
            onClick={handleBack}
            aria-label="Go back"
          >
            <BackArrow />
          </button>
        )}
        <h1 className="m-screen-header__title">{title}</h1>
      </div>
      {rightAction && (
        <div className="m-screen-header__actions">
          {rightAction}
        </div>
      )}
    </header>
  );
}

/* ══════════════════════════════════════════════════════════════
   MobileCard — Standard surface card (Frame specs)
   ══════════════════════════════════════════════════════════════ */

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'gold-border' | 'unread';
  onClick?: () => void;
  className?: string;
}

export function MobileCard({ children, variant = 'default', onClick, className }: CardProps) {
  const variantClass =
    variant === 'gold-border' ? 'm-card--gold-border' :
    variant === 'unread' ? 'm-card--unread' : '';

  return (
    <div
      className={`m-card ${variantClass} ${className || ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MobileStatCard — Quick stats (Frame 3 — Command Center)
   ══════════════════════════════════════════════════════════════ */

interface StatCardProps {
  value: string | number;
  label: string;
  dotColor?: 'success' | 'gold' | 'info';
}

export function MobileStatCard({ value, label, dotColor }: StatCardProps) {
  return (
    <div className="m-stat-card">
      <div className="m-stat-card__value">{value}</div>
      <div className="m-stat-card__label">
        {dotColor && <span className={`m-stat-card__dot m-stat-card__dot--${dotColor}`} />}
        {label}
      </div>
    </div>
  );
}

export function MobileStatRow({ children }: { children: React.ReactNode }) {
  return <div className="m-stat-row">{children}</div>;
}

/* ══════════════════════════════════════════════════════════════
   MobileChip — Filter chip / tag chip
   ══════════════════════════════════════════════════════════════ */

interface ChipProps {
  label: string;
  active?: boolean;
  variant?: 'filter' | 'tag' | 'gold' | 'success' | 'warning';
  onClick?: () => void;
}

export function MobileChip({ label, active, variant = 'filter', onClick }: ChipProps) {
  let cls = 'm-chip';
  if (active) cls += ' m-chip--active';
  if (variant === 'tag') cls += ' m-chip--tag';
  if (variant === 'gold') cls += ' m-chip--tag m-chip--gold';
  if (variant === 'success') cls += ' m-chip--tag m-chip--success';
  if (variant === 'warning') cls += ' m-chip--tag m-chip--warning';

  return (
    <button className={cls} onClick={onClick} type="button">
      {label}
    </button>
  );
}

export function MobileChipScroll({ children }: { children: React.ReactNode }) {
  return <div className="m-chip-scroll">{children}</div>;
}

/* ══════════════════════════════════════════════════════════════
   MobileButton — Standard mobile button (48px, 10px radius)
   ══════════════════════════════════════════════════════════════ */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outlined-gold' | 'icon';
  size?: 'default' | 'small';
  children: React.ReactNode;
}

export function MobileButton({ variant = 'primary', size = 'default', children, className, ...props }: ButtonProps) {
  const cls = `m-btn m-btn--${variant} ${size === 'small' ? 'm-btn--small' : ''} ${className || ''}`;
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   MobileInput — Standard mobile input (48px, 10px radius)
   ══════════════════════════════════════════════════════════════ */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function MobileInput({ label, className, ...props }: InputProps) {
  return (
    <div>
      {label && <label className="m-input-label">{label}</label>}
      <input className={`m-input ${className || ''}`} {...props} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MobileSectionHeader — Section title + action link
   ══════════════════════════════════════════════════════════════ */

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function MobileSectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <div className="m-section-header">
      <h2 className="m-section-header__title">{title}</h2>
      {action && (
        <button className="m-section-header__action" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MobileList — Vertical list with gap spacing
   ══════════════════════════════════════════════════════════════ */

export function MobileList({ children, tight }: { children: React.ReactNode; tight?: boolean }) {
  return <div className={`m-list ${tight ? 'm-list--tight' : ''}`}>{children}</div>;
}

/* ══════════════════════════════════════════════════════════════
   MobileSearch — Search bar with icon
   ══════════════════════════════════════════════════════════════ */

interface SearchProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export function MobileSearch({ placeholder = 'Search...', value, onChange }: SearchProps) {
  return (
    <div className="m-search" style={{ position: 'relative' }}>
      <span className="m-search__icon" style={{
        position: 'absolute', left: 'calc(var(--m-screen-pad) + 12px)', top: '50%',
        transform: 'translateY(-50%)', display: 'flex',
      }}>
        <SearchIcon />
      </span>
      <input
        className="m-search__input"
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MobileSegments — Horizontal segment tabs (Frame 11)
   ══════════════════════════════════════════════════════════════ */

interface SegmentsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export function MobileSegments({ tabs, active, onChange }: SegmentsProps) {
  return (
    <div className="m-segments">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`m-segment ${active === tab ? 'm-segment--active' : ''}`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MobileEmpty — Empty state component
   ══════════════════════════════════════════════════════════════ */

interface EmptyProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function MobileEmpty({ icon, title, description, action }: EmptyProps) {
  return (
    <div className="m-empty m-animate-fade">
      {icon && <div className="m-empty__icon">{icon}</div>}
      <div className="m-empty__title">{title}</div>
      {description && <div className="m-empty__description">{description}</div>}
      {action && <div style={{ marginTop: 'var(--m-2xl)' }}>{action}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MobileBottomSheet — Bottom sheet with drag handle
   ══════════════════════════════════════════════════════════════ */

interface BottomSheetProps {
  children: React.ReactNode;
  visible: boolean;
  onClose?: () => void;
  height?: string;
}

export function MobileBottomSheet({ children, visible, onClose, height = '50%' }: BottomSheetProps) {
  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 89,
          background: 'rgba(0,0,0,0.5)',
        }}
        className="m-animate-fade"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="m-bottom-sheet m-animate-sheet" style={{ height }}>
        <div className="m-bottom-sheet__handle" />
        <div className="m-bottom-sheet__content">
          {children}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   MobileSkeleton — Loading skeleton variants
   ══════════════════════════════════════════════════════════════ */

export function MobileCardSkeleton() {
  return (
    <div className="m-card" style={{ padding: 'var(--m-lg)' }}>
      <div className="m-skeleton m-skeleton--title" style={{ marginBottom: 'var(--m-md)' }} />
      <div className="m-skeleton m-skeleton--text" style={{ marginBottom: 'var(--m-sm)' }} />
      <div className="m-skeleton m-skeleton--text" style={{ width: '80%' }} />
    </div>
  );
}

export function MobileListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="m-list">
      {Array.from({ length: count }).map((_, i) => (
        <MobileCardSkeleton key={i} />
      ))}
    </div>
  );
}
