'use client';

import React from 'react';
import Link from 'next/link';
import {
  getCorridorData,
  type CorridorData,
  type StateRequirements,
} from '@/lib/data/corridors';
import { CorridorSponsorCard } from './CorridorSponsorCard';

/* ══════════════════════════════════════════════════════════════
   MobileCorridorDetail — Specific corridor detail screen.
   Shows shortage signal, state requirements, operator stats,
   sponsor slot, and action paths (post load, browse directory,
   claim profile). Uses real static corridor data from
   lib/data/corridors.ts — NOT a mock placeholder.
   ══════════════════════════════════════════════════════════════ */

interface Props {
  corridorSlug: string;
}

/* ── Supply band helper ── */
function getSupplyBand(pct: number) {
  if (pct < 30) return { label: 'Critical Shortage', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' };
  if (pct < 45) return { label: 'Tight Supply', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
  return { label: 'Balanced', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' };
}

/* ── Night movement icon ── */
function NightBadge({ rule }: { rule: string }) {
  const config: Record<string, { icon: string; color: string }> = {
    allowed: { icon: '🌙', color: '#22C55E' },
    restricted: { icon: '⚠️', color: '#F59E0B' },
    prohibited: { icon: '🚫', color: '#EF4444' },
  };
  const c = config[rule] || config.restricted;
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, color: c.color,
      padding: '2px 6px', borderRadius: 6,
      background: `${c.color}15`,
    }}>
      {c.icon} Night {rule}
    </span>
  );
}

/* ── State requirement row ── */
function StateRow({ req }: { req: StateRequirements }) {
  return (
    <div style={{
      padding: '14px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 900, color: 'var(--m-gold, #D4A844)',
          }}>
            {req.stateCode}
          </span>
          <div>
            <div style={{ fontSize: 'var(--m-font-body-sm, 13px)', fontWeight: 700, color: 'var(--m-text-primary, #f5f7fb)' }}>
              {req.state}
            </div>
            <div style={{ fontSize: 'var(--m-font-caption, 11px)', color: 'var(--m-text-muted, #6a7181)', marginTop: 1 }}>
              {req.escortsRequired} · Width ≥{req.widthTriggerFt}ft
            </div>
          </div>
        </div>
        <NightBadge rule={req.nightMovement} />
      </div>
      {req.permitNotes && (
        <div style={{
          fontSize: 'var(--m-font-caption, 11px)', color: 'var(--m-text-secondary, #c7ccd7)',
          marginTop: 6, marginLeft: 36, lineHeight: 1.4,
        }}>
          {req.permitNotes}
        </div>
      )}
    </div>
  );
}

export default function MobileCorridorDetail({ corridorSlug }: Props) {
  const corridor = getCorridorData(corridorSlug);

  if (!corridor) {
    return (
      <div style={{
        background: 'var(--m-bg, #060b12)', minHeight: '100dvh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--m-screen-pad, 16px)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛣</div>
        <div style={{ fontSize: 'var(--m-font-body, 15px)', fontWeight: 700, color: 'var(--m-text-primary, #f5f7fb)', textAlign: 'center' }}>
          Corridor not found
        </div>
        <div style={{ fontSize: 'var(--m-font-body-sm, 13px)', color: 'var(--m-text-muted, #6a7181)', marginTop: 8, textAlign: 'center' }}>
          This corridor may not be active yet.
        </div>
        <Link aria-label="Navigation Link" href="/corridor" style={{
          marginTop: 16, padding: '10px 20px', borderRadius: 12,
          background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.2)',
          color: 'var(--m-gold, #D4A844)', fontSize: 13, fontWeight: 800, textDecoration: 'none',
        }}>
          Browse All Corridors
        </Link>
      </div>
    );
  }

  const supplyBand = getSupplyBand(corridor.supplyPct);
  const shortagePct = 100 - corridor.supplyPct;

  return (
    <div style={{ background: 'var(--m-bg, #060b12)', minHeight: '100dvh' }}>

      {/* ── Top nav ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px var(--m-screen-pad, 16px) 0',
      }}>
        <Link aria-label="Navigation Link" href="/corridor" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--m-text-secondary, #c7ccd7)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span style={{ fontSize: 'var(--m-font-body-sm, 13px)', fontWeight: 700, color: 'var(--m-text-secondary, #c7ccd7)' }}>Corridors</span>
        </Link>
      </div>

      {/* ── Corridor header ── */}
      <div style={{ padding: 'var(--m-md, 16px) var(--m-screen-pad, 16px) var(--m-sm, 8px)' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 10px', borderRadius: 999,
          background: supplyBand.bg, marginBottom: 10,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 999,
            background: supplyBand.color,
          }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: supplyBand.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {supplyBand.label}
          </span>
        </div>
        <h1 style={{
          fontSize: 'var(--m-font-display, 26px)', fontWeight: 900,
          color: 'var(--m-text-primary, #f5f7fb)', margin: 0, lineHeight: 1.15,
        }}>
          {corridor.displayName}
        </h1>
        <div style={{
          fontSize: 'var(--m-font-body-sm, 13px)', color: 'var(--m-text-muted, #6a7181)',
          marginTop: 6,
        }}>
          {corridor.endpoints} · {corridor.totalMiles.toLocaleString()} mi
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
        padding: '0 var(--m-screen-pad, 16px)', marginTop: 'var(--m-sm, 8px)',
      }}>
        {[
          { value: `${shortagePct}%`, label: 'Shortage', color: shortagePct > 60 ? '#EF4444' : '#F59E0B' },
          { value: String(corridor.demandScore), label: 'Demand', color: 'var(--m-gold, #D4A844)' },
          { value: String(corridor.operatorCount), label: 'Operators', color: '#22C55E' },
        ].map(s => (
          <div key={s.label} style={{
            padding: 14, borderRadius: 14,
            background: 'var(--m-surface, rgba(255,255,255,0.04))',
            border: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--m-text-muted, #6a7181)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Intel note ── */}
      <div style={{ padding: '0 var(--m-screen-pad, 16px)', marginTop: 'var(--m-md, 16px)' }}>
        <div style={{
          padding: 16, borderRadius: 14,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            🔴 Operator Intel
          </div>
          <div style={{ fontSize: 'var(--m-font-body-sm, 13px)', color: 'var(--m-text-secondary, #c7ccd7)', lineHeight: 1.5 }}>
            {corridor.escortIntelNote}
          </div>
        </div>
      </div>

      {/* ── Action paths ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
        padding: '0 var(--m-screen-pad, 16px)', marginTop: 'var(--m-md, 16px)',
      }}>
        <Link aria-label="Navigation Link" href="/loads/post" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '14px 8px', borderRadius: 14, textAlign: 'center',
            background: 'var(--m-surface, rgba(255,255,255,0.04))',
            border: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>📋</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--m-gold, #D4A844)' }}>Post Load</div>
          </div>
        </Link>
        <Link aria-label="Navigation Link" href="/directory" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '14px 8px', borderRadius: 14, textAlign: 'center',
            background: 'var(--m-surface, rgba(255,255,255,0.04))',
            border: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>🔍</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--m-text-primary, #f5f7fb)' }}>Directory</div>
          </div>
        </Link>
        <Link aria-label="Navigation Link" href="/claim" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '14px 8px', borderRadius: 14, textAlign: 'center',
            background: 'var(--m-surface, rgba(255,255,255,0.04))',
            border: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>✓</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--m-text-primary, #f5f7fb)' }}>Claim</div>
          </div>
        </Link>
      </div>

      {/* ── Key regulations ── */}
      {corridor.keyRegulations.length > 0 && (
        <div style={{ padding: '0 var(--m-screen-pad, 16px)', marginTop: 'var(--m-lg, 24px)' }}>
          <div style={{
            fontSize: 'var(--m-font-overline, 10px)', fontWeight: 800,
            color: 'var(--m-text-muted, #6a7181)', textTransform: 'uppercase',
            letterSpacing: '0.1em', marginBottom: 10,
          }}>
            Key Regulations
          </div>
          {corridor.keyRegulations.map((reg, i) => (
            <div key={i} style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              padding: '8px 0',
            }}>
              <span style={{ color: '#F59E0B', fontSize: 12, lineHeight: 1.5, flexShrink: 0 }}>⚡</span>
              <span style={{ fontSize: 'var(--m-font-body-sm, 13px)', color: 'var(--m-text-secondary, #c7ccd7)', lineHeight: 1.5 }}>
                {reg}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── State-by-state requirements ── */}
      {corridor.stateRequirements.length > 0 && (
        <div style={{ padding: '0 var(--m-screen-pad, 16px)', marginTop: 'var(--m-lg, 24px)' }}>
          <div style={{
            fontSize: 'var(--m-font-overline, 10px)', fontWeight: 800,
            color: 'var(--m-text-muted, #6a7181)', textTransform: 'uppercase',
            letterSpacing: '0.1em', marginBottom: 4,
          }}>
            State-by-State Requirements
          </div>
          <div style={{
            borderRadius: 16, overflow: 'hidden',
            background: 'var(--m-surface, rgba(255,255,255,0.04))',
            border: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
            padding: '0 14px',
          }}>
            {corridor.stateRequirements.map(req => (
              <StateRow key={req.stateCode} req={req} />
            ))}
          </div>
        </div>
      )}

      {/* ── Corridor sponsor card ── */}
      <div style={{ padding: '0 var(--m-screen-pad, 16px)', marginTop: 'var(--m-lg, 24px)' }}>
        <CorridorSponsorCard
          corridorName={corridor.displayName}
          corridorSlug={corridor.slug}
          operatorCount={corridor.operatorCount}
        />
      </div>

      {/* ── States along route ── */}
      <div style={{ padding: '0 var(--m-screen-pad, 16px)', marginTop: 'var(--m-lg, 24px)' }}>
        <div style={{
          fontSize: 'var(--m-font-overline, 10px)', fontWeight: 800,
          color: 'var(--m-text-muted, #6a7181)', textTransform: 'uppercase',
          letterSpacing: '0.1em', marginBottom: 10,
        }}>
          Route States
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {corridor.primaryStates.map(code => (
            <Link aria-label="Navigation Link" key={code} href={`/escort-requirements/${code.toLowerCase()}`} style={{
              padding: '6px 12px', borderRadius: 10,
              background: 'var(--m-surface, rgba(255,255,255,0.04))',
              border: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
              color: 'var(--m-text-primary, #f5f7fb)', fontSize: 12, fontWeight: 700,
              textDecoration: 'none',
            }}>
              {code}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ height: 'var(--m-3xl, 48px)' }} />
    </div>
  );
}
