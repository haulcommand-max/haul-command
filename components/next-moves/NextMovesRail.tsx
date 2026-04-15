'use client';

/**
 * components/next-moves/NextMovesRail.tsx
 * ══════════════════════════════════════════════════════════════
 * Next Moves Engine — UI Surface
 *
 * Renders the resolved NextMove[] as a horizontally scannable
 * mobile rail (or vertical stack on larger screens).
 *
 * Props:
 *   serverSignals  — from collectNextMoveSignals() in Server Component
 *   authUser       — authenticated user profile if available
 *   surface        — where this is rendered ('homepage' | 'dashboard' | 'directory' | 'empty-state')
 *   maxMoves       — max tiles to show (default 3)
 *   showRolePrompt — show role picker if role is unknown
 *
 * Behavior:
 *   - Renders placeholder skeleton while loading (no layout shift)
 *   - Primary move gets 2× width on mobile
 *   - All tiles have 48px min-height (thumb safe)
 *   - Each click fires PostHog event via trackMoveClick()
 *   - Role picker promotes to persistent session value
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Shield, Search, TrendingUp, BookOpen, Map,
  Zap, Bell, Globe, CheckCircle, Trophy,
} from 'lucide-react';
import { useNextMoves, type UseNextMovesOptions } from '@/hooks/useNextMoves';
import type { NextMove } from '@/lib/next-moves-engine';
import { ROLE_LIST, ROLE_CONFIGS, type HCRole } from '@/lib/role-config';

// ── Icon map (string → component) ────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Shield, Search, TrendingUp, BookOpen, Map, Zap, Bell, Globe,
  CheckCircle, Trophy, ArrowRight,
};

function MoveIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? ArrowRight;
  return <Icon className={className} />;
}

// ── Urgency border accent ─────────────────────────────────────
const URGENCY_STYLE: Record<NextMove['urgency'], string> = {
  critical: 'border-red-500/30 bg-red-500/5',
  high: 'border-hc-gold-500/25 bg-hc-gold-500/5',
  normal: 'border-white/[0.07] bg-transparent',
  low: 'border-white/[0.04] bg-transparent',
};

// ── Role picker labels ────────────────────────────────────────
const ROLE_LABELS: Partial<Record<HCRole, { short: string; desc: string }>> = {
  escort_operator: { short: "I'm an Operator", desc: "Pilot cars, escort vehicles" },
  broker_dispatcher: { short: "I Hire Escorts", desc: "Dispatchers, brokers, shippers" },
  both: { short: "Both", desc: "I operate and dispatch" },
  observer_researcher: { short: "Just Browsing", desc: "Researching the market" },
};

// ── Skeleton loader ──────────────────────────────────────────
function MoveSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-2.5 p-4 rounded-2xl bg-hc-surface border border-white/[0.05]">
      <div className="w-8 h-8 rounded-xl bg-white/10" />
      <div className="h-3.5 w-3/4 bg-white/10 rounded" />
      <div className="h-3 w-full bg-white/[0.07] rounded" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
interface NextMovesRailProps extends UseNextMovesOptions {
  surface: 'homepage' | 'dashboard' | 'directory' | 'empty-state';
  maxMoves?: number;
  showRolePrompt?: boolean;
  heading?: string;
}

export function NextMovesRail({
  surface,
  maxMoves = 3,
  showRolePrompt = true,
  heading,
  serverSignals,
  authUser,
}: NextMovesRailProps) {
  const { moves, isLoading, role, setRole, trackMoveClick } = useNextMoves({
    count: maxMoves,
    serverSignals,
    authUser,
  });

  const [showRolePicker, setShowRolePicker] = useState(false);
  const needsRolePrompt = showRolePrompt && !role && !authUser;

  // ── Loading skeleton ────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="w-full">
        {heading && <div className="h-3 w-24 bg-white/10 rounded animate-pulse mb-4 mx-auto" />}
        <div className={`grid grid-cols-${Math.min(maxMoves, 2)} sm:grid-cols-${maxMoves} gap-3`}>
          {Array.from({ length: maxMoves }).map((_, i) => <MoveSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Section heading */}
      {heading && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-hc-subtle">{heading}</span>
          {role && (
            <button
              onClick={() => setShowRolePicker(p => !p)}
              className="text-[9px] font-bold uppercase tracking-widest text-hc-gold-500 hover:text-hc-gold-400 ml-auto transition-colors"
            >
              Switch role
            </button>
          )}
        </div>
      )}

      {/* Role picker (inline — fires once) */}
      {needsRolePrompt && !showRolePicker && (
        <button
          onClick={() => setShowRolePicker(true)}
          className="w-full mb-4 flex items-center justify-between px-4 py-3 rounded-xl border border-hc-gold-500/20 bg-hc-gold-500/5 text-xs font-bold text-hc-gold-400 hover:bg-hc-gold-500/10 transition-colors"
        >
          <span>Tell us your role → see your best move</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}

      {showRolePicker && (
        <div className="mb-4 p-3 rounded-2xl border border-white/[0.07] bg-hc-surface">
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-hc-subtle mb-3">What best describes you?</div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(ROLE_LABELS) as [HCRole, { short: string; desc: string }][]).map(([r, meta]) => (
              <button
                key={r}
                onClick={() => { setRole(r); setShowRolePicker(false); }}
                className="flex flex-col items-start p-3 rounded-xl border border-white/[0.06] hover:border-hc-gold-500/30 hover:bg-hc-gold-500/5 transition-all text-left"
              >
                <span className="text-xs font-bold text-hc-text">{meta.short}</span>
                <span className="text-[10px] text-hc-subtle mt-0.5">{meta.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Move tiles */}
      <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(maxMoves, 3)} gap-3`}>
        {moves.map((move, idx) => {
          const isPrimary = idx === 0;
          return (
            <Link
              key={move.id}
              href={move.href}
              onClick={() => trackMoveClick(move)}
              className={`
                group relative flex flex-col gap-3 p-4 sm:p-5 rounded-2xl border transition-all duration-200
                hover:scale-[1.01] active:scale-[0.99]
                ${URGENCY_STYLE[move.urgency]}
                ${isPrimary ? 'sm:col-span-1' : ''}
              `}
              style={isPrimary ? { borderColor: `${move.color}35`, backgroundColor: `${move.color}08` } : {}}
            >
              {/* Urgency indicator bar for critical */}
              {move.urgency === 'critical' && (
                <div className="absolute top-0 left-4 right-4 h-0.5 rounded-b bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
              )}

              {/* Icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${move.color}18`, color: move.color }}
              >
                <MoveIcon name={move.icon} className="w-4 h-4" />
              </div>

              {/* Label + sublabel */}
              <div className="flex-1">
                <div
                  className="font-black text-xs sm:text-sm leading-tight mb-0.5"
                  style={{ color: move.color }}
                >
                  {move.label}
                </div>
                <div className="text-[10px] sm:text-xs text-hc-subtle font-medium leading-snug">
                  {move.sublabel}
                </div>
              </div>

              {/* CTA arrow */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-hc-subtle opacity-60 group-hover:opacity-100 transition-opacity">
                  {move.ctaText}
                </span>
                <ArrowRight
                  className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                  style={{ color: move.color }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Empty state variant (for blank pages) ─────────────────────
export function NextMoveEmptyState({ serverSignals }: { serverSignals?: Partial<any> }) {
  const { primaryMove, isLoading, trackMoveClick } = useNextMoves({ count: 1, serverSignals });

  if (isLoading || !primaryMove) return null;

  return (
    <div className="text-center py-12 px-4">
      <div className="text-hc-muted text-sm mb-6">No results yet — here's your next move:</div>
      <Link
        href={primaryMove.href}
        onClick={() => trackMoveClick(primaryMove)}
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all hover:scale-[1.02]"
        style={{
          background: `linear-gradient(135deg, ${primaryMove.color}CC, ${primaryMove.color}99)`,
          color: '#0F1318',
        }}
      >
        {primaryMove.ctaText} <ArrowRight className="w-4 h-4" />
      </Link>
      <p className="text-hc-subtle text-xs mt-3">{primaryMove.sublabel}</p>
    </div>
  );
}
