'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, MapPin, ShieldCheck, Star, Filter, X,
  ChevronDown, Users, ArrowRight, Clock, DollarSign,
  Zap, CheckCircle, Award, Truck, Globe, Shield,
  TrendingUp, Bot, Phone, Navigation, AlertTriangle,
} from 'lucide-react';
import { getEscortTerm, getCountry, COUNTRIES } from '@/lib/countries';
import { SponsoredBadge } from '@/components/directory/SponsoredBadge';
import DirectorySponsorCard from '@/components/directory/DirectorySponsorCard';
import TrustBadge from '@/components/trust/TrustBadge';

/* ═══════════════════════════════════════════════════════════════════
   PUBLIC DIRECTORY — Haul Command v2
   Full public-facing operator directory with:
   - Command Black #0B0B0C background, Gold #C6923A accent
   - HOT / WARM / COOL corridor badge system
   - Metrics row: corridor rank, response time, rate, job count
   - Filter sidebar with toggles
   - AdGrid slot at position 7
   - AG card hover animation
   - Wired to /api/directory/listings
   ═══════════════════════════════════════════════════════════════════ */

// ── Design Tokens (Command Black + Gold system) ──────────────────
const T = {
  bg: '#0B0B0C',
  bgCard: '#111114',
  bgSurface: '#161619',
  bgElevated: '#1A1A1E',
  border: 'rgba(255,255,255,0.06)',
  borderMid: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.14)',
  gold: '#C6923A',
  goldLight: '#E4B872',
  goldDim: 'rgba(198,146,58,0.12)',
  goldBorder: 'rgba(198,146,58,0.30)',
  green: '#22c55e',
  greenDim: 'rgba(34,197,94,0.10)',
  blue: '#3b82f6',
  blueDim: 'rgba(59,130,246,0.10)',
  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.10)',
  orange: '#f59e0b',
  orangeDim: 'rgba(245,158,11,0.10)',
  text: '#F0F0F2',
  textSecondary: '#A0A0A8',
  muted: '#6B6B75',
  subtle: '#45454D',
} as const;

// ── Corridor status config ──────────────────────────────────────
const CORRIDOR_STATUS = {
  HOT:  { label: 'HOT', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', cls: 'ag-badge-hot' },
  WARM: { label: 'WARM', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', cls: 'ag-badge-warm' },
  COOL: { label: 'COOL', color: '#6b7280', bg: 'rgba(107,114,128,0.10)', border: 'rgba(107,114,128,0.20)', cls: 'ag-badge-cool' },
} as const;

type CorridorHeat = 'HOT' | 'WARM' | 'COOL';

// ── No seed operators -- show honest empty state when DB is empty ──
const EMPTY_STATE_OPERATORS: Operator[] = [];

const SERVICE_LABELS: Record<string, string> = {
  lead_car: 'Lead Car', chase_car: 'Chase Car', pilot_car: 'Pilot Car',
  height_pole: 'Height Pole', route_survey: 'Route Survey',
  wide_load: 'Wide Load', oversize: 'OS/OW',
  superload_cert: 'Superload Cert', av_escort: 'AV Escort',
  night_escort: 'Night Moves', bucket_truck: 'Bucket Truck',
};

interface Operator {
  id: string; name: string; state: string; region?: string;
  services: string[]; verified: boolean; escrow: boolean; avReady: boolean;
  corridorRank?: number; avgResponse?: number; rate?: number; jobCount?: number;
  corridorHeat?: CorridorHeat; corridors?: string[];
  sponsored?: boolean; isSeed?: boolean; trustScore?: number; slug?: string;
  // Reputation engine fields
  reviewCount?: number; avgRating?: number; reliabilityScore?: number; completionRate?: number;
}

interface Filters {
  search: string; state: string; serviceType: string;
  verifiedOnly: boolean; escrowOnly: boolean; availableNow: boolean; avCertified: boolean;
  corridorHeat: CorridorHeat | '';
  sortBy: 'rank' | 'response' | 'rate' | 'newest';
}

// ═══════════════════════════════════════════════════════════════
// CORRIDOR HEAT BADGE
// ═══════════════════════════════════════════════════════════════
function CorridorBadge({ heat }: { heat: CorridorHeat }) {
  const cfg = CORRIDOR_STATUS[heat];
  return (
    <span className={cfg.cls} style={{display: 'inline-flex',alignItems: 'center',gap: 4,padding: '2px 8px',borderRadius: 6,fontSize: 9,fontWeight: 800,background: cfg.bg,border: `1px solid ${cfg.border}`,color: cfg.color,textTransform: 'uppercase',letterSpacing: '0.08em'}}>
      <span style={{width: 5,height: 5,borderRadius: '50%',background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADGRID SLOT — Position 7 in the grid
// ═══════════════════════════════════════════════════════════════
function AdGridSlot() {
  return (
    <div className="ag-sponsored-glow ag-slide-up" style={{background: `linear-gradient(135deg, rgba(198,146,58,0.06), rgba(198,146,58,0.02))`,border: `1px solid ${T.goldBorder}`,borderRadius: 16,padding: '20px',display: 'flex',flexDirection: 'column',gap: 14,position: 'relative',overflow: 'hidden'}}>
      {/* Gold top accent bar */}
      <div style={{position: 'absolute',top: 0,left: 0,right: 0,height: 3,background: `linear-gradient(90deg, ${T.gold}, ${T.goldLight}, ${T.gold})`}} />
      <div style={{position: 'absolute',top: 10,right: 12,fontSize: 8,fontWeight: 800,color: T.gold,textTransform: 'uppercase',letterSpacing: '0.12em',background: T.goldDim,padding: '2px 8px',borderRadius: 4}}>Sponsored</div>
      <div style={{display: 'flex',gap: 12,alignItems: 'flex-start',paddingTop: 6 }}>
        <div style={{width: 44,height: 44,borderRadius: 10,background: T.goldDim,border: `1px solid ${T.goldBorder}`,display: 'flex',alignItems: 'center',justifyContent: 'center',fontSize: 20,flexShrink: 0}}>🛡️</div>
        <div style={{flex: 1,minWidth: 0 }}>
          <div style={{fontSize: 14,fontWeight: 800,color: T.gold }}>
            Fleet Insurance Solutions
          </div>
          <div style={{fontSize: 12,color: T.textSecondary,marginTop: 3 }}>
            Specialized oversize load coverage starting at $89/mo
          </div>
        </div>
      </div>
      <div style={{fontSize: 11,color: T.muted,lineHeight: 1.6 }}>
        Get instant quotes for pilot car liability, cargo coverage, and fleet policies. Trusted by operators nationwide.
      </div>
      <Link aria-label="Navigation Link" href="/sponsor" style={{display: 'inline-flex',alignItems: 'center',gap: 6,padding: '10px 18px',borderRadius: 10,background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,color: '#000',fontSize: 12,fontWeight: 800,textDecoration: 'none',width: 'fit-content',transition: 'transform 0.15s ease'}} className="ag-press">
        Get Quote <ArrowRight size={12} />
      </Link>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OPERATOR CARD — Full design with metrics row + badges
// ═══════════════════════════════════════════════════════════════
function OperatorCard({ op, position }: { op: Operator; position: number }) {
  return (
    <div className="ag-card-hover ag-slide-up" data-directory-result style={{background: op.sponsored
        ? `linear-gradient(135deg, rgba(198,146,58,0.05), rgba(198,146,58,0.02))`
        : T.bgCard,border: `1px solid ${op.sponsored ? T.goldBorder : T.border}`,borderRadius: 16,padding: '18px',display: 'flex',flexDirection: 'column',gap: 12,position: 'relative',cursor: 'pointer',animationDelay: `${Math.min(position * 60, 480)}ms`}}>
      {op.sponsored && (
        <div style={{position: 'absolute',top: 0,left: 0,right: 0,height: 2,background: `linear-gradient(90deg, ${T.gold}, transparent)`}} />
      )}

      {/* Header: Avatar + Name + Location */}
      <div style={{display: 'flex',gap: 12,alignItems: 'flex-start' }}>
        <div style={{width: 44,height: 44,borderRadius: 10,flexShrink: 0,background: T.bgElevated,border: `1px solid ${T.border}`,display: 'flex',alignItems: 'center',justifyContent: 'center',fontSize: 18}}>🚗</div>
        <div style={{flex: 1,minWidth: 0 }}>
          <div style={{display: 'flex',alignItems: 'center',gap: 5,flexWrap: 'wrap' }}>
            <span style={{fontSize: 14,fontWeight: 800,color: T.text }}>{op.name}</span>
            {op.verified && <ShieldCheck size={13} style={{color: T.green,flexShrink: 0 }} />}
            {op.sponsored && <SponsoredBadge type="boost" />}
          </div>
          <div style={{display: 'flex',alignItems: 'center',gap: 4,marginTop: 3 }}>
            <MapPin size={11} style={{color: T.muted }} />
            <span style={{fontSize: 12,color: T.textSecondary }}>{op.region || op.state}</span>
          </div>
        </div>
        {/* Corridor Rank Badge */}
        {op.corridorRank != null && op.corridorRank <= 10 && (
          <div style={{display: 'flex',flexDirection: 'column',alignItems: 'center',gap: 1,flexShrink: 0}}>
            <div className="ag-rank-glow" style={{fontSize: 18,fontWeight: 900,color: op.corridorRank <= 3 ? T.gold : T.textSecondary,fontVariantNumeric: 'tabular-nums',lineHeight: 1}}>#{op.corridorRank}</div>
            <div style={{fontSize: 8,fontWeight: 700,color: T.muted,textTransform: 'uppercase',letterSpacing: '0.1em' }}>Rank</div>
          </div>
        )}
      </div>

      {/* Badge Row: Trust Score, Verified, Escrow, AV Ready, Corridor Heat */}
      <div style={{display: 'flex',flexWrap: 'wrap',gap: 5 }}>
        <TrustBadge trustScore={op.trustScore ?? null} isVerified={op.verified} slug={op.slug || op.id} compact />
        {op.verified && (
          <span style={{display: 'inline-flex',alignItems: 'center',gap: 3,fontSize: 9,fontWeight: 700,padding: '3px 8px',borderRadius: 6,background: T.greenDim,border: '1px solid rgba(34,197,94,0.20)',color: T.green,textTransform: 'uppercase',letterSpacing: '0.05em'}}><ShieldCheck size={9} /> Verified</span>
        )}
        {op.escrow && (
          <span style={{display: 'inline-flex',alignItems: 'center',gap: 3,fontSize: 9,fontWeight: 700,padding: '3px 8px',borderRadius: 6,background: T.blueDim,border: '1px solid rgba(59,130,246,0.20)',color: T.blue,textTransform: 'uppercase',letterSpacing: '0.05em'}}><Shield size={9} /> Escrow</span>
        )}
        {op.avReady && (
          <span style={{display: 'inline-flex',alignItems: 'center',gap: 3,fontSize: 9,fontWeight: 700,padding: '3px 8px',borderRadius: 6,background: 'rgba(168,85,247,0.10)',border: '1px solid rgba(168,85,247,0.20)',color: '#a855f7',textTransform: 'uppercase',letterSpacing: '0.05em'}}><Bot size={9} /> AV Ready</span>
        )}
        {op.corridorHeat && <CorridorBadge heat={op.corridorHeat} />}
      </div>

      {/* Services */}
      <div style={{display: 'flex',flexWrap: 'wrap',gap: 4 }}>
        {op.services.slice(0, 4).map(s => (
          <span key={s} style={{fontSize: 10,fontWeight: 600,padding: '3px 7px',borderRadius: 5,background: 'rgba(255,255,255,0.03)',border: `1px solid ${T.border}`,color: T.muted}}>{SERVICE_LABELS[s] || s}</span>
        ))}
      </div>

      {/* Reputation Row — Star rating + review count + reliability */}
      {(op.reviewCount != null && op.reviewCount > 0) && (
        <div style={{display: 'flex',alignItems: 'center',gap: 10,flexWrap: 'wrap' }}>
          {op.avgRating != null && (
            <div style={{display: 'flex',alignItems: 'center',gap: 3 }}>
              <span style={{fontSize: 13,color: '#fbbf24' }}>{'★'.repeat(Math.floor(op.avgRating))}{op.avgRating % 1 >= 0.5 ? '½' : ''}</span>
              <span style={{fontSize: 11,fontWeight: 800,color: T.text }}>{op.avgRating.toFixed(1)}</span>
            </div>
          )}
          <span style={{fontSize: 10,color: T.muted }}>({op.reviewCount} review{op.reviewCount !== 1 ? 's' : ''})</span>
          {op.reliabilityScore != null && op.reliabilityScore >= 70 && (
            <span style={{fontSize: 9,fontWeight: 700,padding: '2px 6px',borderRadius: 4,background: op.reliabilityScore >= 90 ? T.greenDim : T.goldDim,border: `1px solid ${op.reliabilityScore >= 90 ? 'rgba(34,197,94,0.20)' : T.goldBorder}`,color: op.reliabilityScore >= 90 ? T.green : T.gold,textTransform: 'uppercase',letterSpacing: '0.05em'}}>{op.reliabilityScore}% Reliable</span>
          )}
        </div>
      )}

      {/* Metrics Row */}
      <div style={{display: 'grid',gridTemplateColumns: 'repeat(3, 1fr)',gap: 8,padding: '10px 0',borderTop: `1px solid ${T.border}`,borderBottom: `1px solid ${T.border}`}}>
        <div style={{textAlign: 'center' }}>
          <div style={{fontSize: 15,fontWeight: 800,color: T.text,fontVariantNumeric: 'tabular-nums' }}>
            {op.avgResponse != null ? `${op.avgResponse}m` : '—'}
          </div>
          <div style={{fontSize: 9,fontWeight: 600,color: T.muted,textTransform: 'uppercase',letterSpacing: '0.08em',marginTop: 2 }}>Response</div>
        </div>
        <div style={{textAlign: 'center',borderLeft: `1px solid ${T.border}`,borderRight: `1px solid ${T.border}` }}>
          <div style={{fontSize: 15,fontWeight: 800,color: T.gold,fontVariantNumeric: 'tabular-nums' }}>
            {op.rate != null ? `$${op.rate}` : '—'}
          </div>
          <div style={{fontSize: 9,fontWeight: 600,color: T.muted,textTransform: 'uppercase',letterSpacing: '0.08em',marginTop: 2 }}>Per Hour</div>
        </div>
        <div style={{textAlign: 'center' }}>
          <div style={{fontSize: 15,fontWeight: 800,color: T.text,fontVariantNumeric: 'tabular-nums' }}>
            {op.jobCount != null ? op.jobCount.toLocaleString() : '—'}
          </div>
          <div style={{fontSize: 9,fontWeight: 600,color: T.muted,textTransform: 'uppercase',letterSpacing: '0.08em',marginTop: 2 }}>Jobs</div>
        </div>
      </div>

      {/* Corridor Tags */}
      {op.corridors && op.corridors.length > 0 && (
        <div style={{display: 'flex',flexWrap: 'wrap',gap: 4 }}>
          {op.corridors.map(c => (
            <span key={c} style={{fontSize: 9,fontWeight: 600,padding: '2px 7px',borderRadius: 4,background: 'rgba(198,146,58,0.06)',border: `1px solid rgba(198,146,58,0.15)`,color: T.goldLight}}>{c}</span>
          ))}
        </div>
      )}

      {/* Action Row */}
      <div style={{display: 'flex',gap: 8 }}>
        {op.isSeed ? (
          <Link aria-label="Navigation Link" href="/claim" style={{flex: 1,padding: '10px 14px',borderRadius: 10,textAlign: 'center',background: T.goldDim,border: `1px solid ${T.goldBorder}`,color: T.gold,fontSize: 12,fontWeight: 800,textDecoration: 'none'}} className="ag-press">Claim This Listing</Link>
        ) : (
          <>
            <Link aria-label="Navigation Link" href={`/directory/profile/${op.slug || op.id}`} style={{flex: 1,padding: '10px 14px',borderRadius: 10,textAlign: 'center',background: T.bgElevated,border: `1px solid ${T.borderMid}`,color: T.text,fontSize: 12,fontWeight: 700,textDecoration: 'none'}} className="ag-press">View Profile</Link>
            <button aria-label="Interactive Button" style={{padding: '10px 16px',borderRadius: 10,background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,border: 'none',color: '#000',fontSize: 12,fontWeight: 800,cursor: 'pointer'}} className="ag-press">Request</button>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FILTER TOGGLE SWITCH
// ═══════════════════════════════════════════════════════════════
function ToggleSwitch({ label, active, onChange, icon }: {
  label: string; active: boolean; onChange: () => void; icon: React.ReactNode;
}) {
  return (
    <button aria-label="Interactive Button" onClick={onChange} data-filter-control style={{display: 'flex',alignItems: 'center',gap: 10,width: '100%',padding: '10px 12px',borderRadius: 10,cursor: 'pointer',border: 'none',background: active ? T.goldDim : 'transparent',transition: 'all 0.15s ease'}}>
      <span style={{color: active ? T.gold : T.muted,flexShrink: 0 }}>{icon}</span>
      <span style={{flex: 1,textAlign: 'left',fontSize: 12,fontWeight: 600,color: active ? T.text : T.textSecondary }}>{label}</span>
      <div style={{width: 32,height: 18,borderRadius: 9,position: 'relative',background: active ? T.gold : T.subtle,transition: 'background 0.2s ease'}}>
        <div style={{width: 14,height: 14,borderRadius: '50%',background: '#fff',position: 'absolute',top: 2,left: active ? 16 : 2,transition: 'left 0.2s cubic-bezier(0.34,1.56,0.64,1)',boxShadow: '0 1px 3px rgba(0,0,0,0.3)'}} />
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// FILTER CHIP
// ═══════════════════════════════════════════════════════════════
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button aria-label="Interactive Button" onClick={onClick} data-filter-control className="ag-chip-snap" style={{padding: '6px 14px',borderRadius: 999,cursor: 'pointer',fontSize: 11,fontWeight: 700,border: 'none',background: active ? T.gold : 'rgba(255,255,255,0.04)',color: active ? '#000' : T.muted,transition: 'all 0.15s ease'}}>{label}</button>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export function PublicDirectory() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: '', state: '', serviceType: '',
    verifiedOnly: false, escrowOnly: false, availableNow: false, avCertified: false,
    corridorHeat: '', sortBy: 'rank',
  });

  // Fetch operators from API
  const fetchOperators = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (filters.state) params.set('region', filters.state);
      if (filters.serviceType) params.set('entity_type', filters.serviceType);
      if (filters.search) params.set('q', filters.search);

      const res = await fetch(`/api/directory/listings?${params}`);
      if (res.ok) {
        const data = await res.json();
        const listings: Operator[] = (data.listings || []).map((l: any) => ({
          id: l.id, name: l.name || 'Verified Operator',
          state: l.region_code || '', region: l.city ? `${l.city}, ${l.region_code}` : l.region_code,
          services: l.metadata?.services || ['pilot_car'],
          verified: l.claim_status === 'claimed' || l.claim_status === 'verified',
          escrow: l.metadata?.escrow_enabled || false,
          avReady: l.metadata?.av_certified || false,
          corridorRank: l.rank_score ? Math.ceil(l.rank_score * 10) : undefined,
          trustScore: l.trust_score ?? l.metadata?.trust_score ?? undefined,
          avgResponse: l.metadata?.avg_response_minutes || undefined,
          rate: l.metadata?.hourly_rate || undefined,
          jobCount: l.metadata?.total_jobs || undefined,
          corridorHeat: getHeatFromScore(l.rank_score),
          corridors: l.metadata?.corridors || [],
          sponsored: l.metadata?.is_sponsored || false,
          slug: l.slug,
        }));
        if (listings.length === 0) { setOperators([]); setTotal(0); }
        else { setOperators(listings); setTotal(data.total || listings.length); }
      } else { setOperators([]); setTotal(0); }
    } catch { setOperators([]); setTotal(0); }
    setLoading(false);
  }, [filters.state, filters.serviceType, filters.search]);

  useEffect(() => { const t = setTimeout(fetchOperators, 300); return () => clearTimeout(t); }, [fetchOperators]);

  // Client-side filtering + sorting
  const filteredOps = useMemo(() => {
    let ops = [...operators];
    if (filters.verifiedOnly) ops = ops.filter(o => o.verified);
    if (filters.escrowOnly) ops = ops.filter(o => o.escrow);
    if (filters.avCertified) ops = ops.filter(o => o.avReady);
    if (filters.corridorHeat) ops = ops.filter(o => o.corridorHeat === filters.corridorHeat);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      ops = ops.filter(o =>
        o.name.toLowerCase().includes(q) ||
        (o.region || '').toLowerCase().includes(q) ||
        o.services.some(s => (SERVICE_LABELS[s] || s).toLowerCase().includes(q))
      );
    }
    // Sort
    switch (filters.sortBy) {
      case 'response': ops.sort((a, b) => (a.avgResponse ?? 999) - (b.avgResponse ?? 999)); break;
      case 'rate': ops.sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0)); break;
      case 'newest': ops.reverse(); break;
      default: ops.sort((a, b) => (a.corridorRank ?? 999) - (b.corridorRank ?? 999));
    }
    return ops;
  }, [operators, filters]);

  // Build grid with AdGrid slot at position 7, sponsor slots at 3 and 10
  const gridItems = useMemo(() => {
    const items: Array<{ type: 'operator' | 'ad' | 'sponsor-upper' | 'sponsor-lower'; data?: Operator; idx: number }> = [];
    filteredOps.forEach((op, i) => {
      if (i === 3) items.push({ type: 'sponsor-upper', idx: items.length });
      if (i === 6) items.push({ type: 'ad', idx: items.length });
      if (i === 10) items.push({ type: 'sponsor-lower', idx: items.length });
      items.push({ type: 'operator', data: op, idx: items.length });
    });
    if (filteredOps.length < 7) items.push({ type: 'ad', idx: items.length });
    return items;
  }, [filteredOps]);

  const activeFilterCount = [
    filters.verifiedOnly, filters.escrowOnly, filters.availableNow,
    filters.avCertified, !!filters.corridorHeat, !!filters.serviceType,
  ].filter(Boolean).length;

  return (
    <>
      <style>{`
        .dir-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 640px) { .dir-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .dir-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1400px) { .dir-grid { grid-template-columns: repeat(4, 1fr); } }
        .dir-sidebar { display: none; }
        @media (min-width: 1024px) { .dir-sidebar { display: block; width: 260px; flex-shrink: 0; position: sticky; top: 80px; } }
      `}</style>

      <div style={{background: T.bg,minHeight: '100vh',color: T.text }}>

        {/* ── Social Proof Bar — Industry-Native ── */}
        <div style={{background: 'rgba(255,255,255,0.02)',borderBottom: `1px solid ${T.border}`,padding: '10px 0' }}>
          <div style={{maxWidth: 1400,margin: '0 auto',padding: '0 20px',display: 'flex',flexWrap: 'wrap',gap: '10px 24px',justifyContent: 'center',alignItems: 'center' }}>
            <div style={{display: 'flex',alignItems: 'center',gap: 6,fontSize: 12,color: T.muted }}>
              <span style={{width: 7,height: 7,borderRadius: '50%',background: T.green,boxShadow: `0 0 6px ${T.green}`,animation: 'pulse-gold 2s infinite' }} />
              <span style={{fontWeight: 700,color: T.text }}>{total > 0 ? total.toLocaleString() : '—'}</span> escort vehicles staged
            </div>
            <div style={{width: 1,height: 14,background: T.border }} />
            <div style={{display: 'flex',alignItems: 'center',gap: 5,fontSize: 12,color: T.muted }}>
              <Clock size={12} style={{color: T.gold }} />
              Avg dispatch <span style={{fontWeight: 700,color: T.gold,margin: '0 2px' }}>—</span>
            </div>
            <div style={{width: 1,height: 14,background: T.border }} />
            <div style={{display: 'flex',alignItems: 'center',gap: 5,fontSize: 12,color: T.muted }}>
              <Globe size={12} style={{color: T.blue }} />
              <span style={{fontWeight: 700,color: T.blue }}>US coverage</span>
            </div>
            <div style={{width: 1,height: 14,background: T.border }} />
            <div style={{display: 'flex',alignItems: 'center',gap: 5,fontSize: 12,color: T.muted }}>
              <Shield size={12} style={{color: '#a855f7' }} />
              <span style={{fontWeight: 700,color: '#a855f7' }}>Escrow protected</span>
            </div>
          </div>
        </div>

        {/* ── Hero Search Section ── */}
        <div style={{background: `linear-gradient(180deg, rgba(198,146,58,0.03) 0%, transparent 100%)`,borderBottom: `1px solid ${T.border}`,padding: '36px 20px 28px'}}>
          <div style={{maxWidth: 800,margin: '0 auto',textAlign: 'center' }}>
            <div style={{fontSize: 10,fontWeight: 800,color: T.gold,textTransform: 'uppercase',letterSpacing: '0.15em',marginBottom: 8 }}>Pilot Car Directory</div>
            <h1 style={{fontSize: 'clamp(24px, 4vw, 36px)',fontWeight: 900,color: T.text,margin: '0 0 6px',lineHeight: 1.2 }}>
              Find a Pilot Car Near Your Route
            </h1>
            <p style={{fontSize: 13,color: T.textSecondary,margin: '0 0 24px' }}>
              Search by city, state, corridor, or interstate — lead cars, chase cars, height poles, and route survey operators across the US
            </p>

            {/* Search + State + Filters */}
            <div style={{display: 'flex',gap: 10,flexWrap: 'wrap' }}>
              <div style={{flex: 1,minWidth: 220,display: 'flex',alignItems: 'center',gap: 10,background: T.bgSurface,border: `1px solid ${T.borderMid}`,borderRadius: 12,padding: '0 14px',height: 48}}>
                <Search size={15} style={{color: T.muted,flexShrink: 0 }} />
                <input type="text" placeholder="Search by city, state, corridor, or interstate..."
                  value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  id="directory-search-input"
                  data-search-input
                  style={{flex: 1,background: 'none',border: 'none',outline: 'none',fontSize: 13,color: T.text,caretColor: T.gold }}
                />
                {filters.search && (
                  <button aria-label="Interactive Button" onClick={() => setFilters(f => ({ ...f, search: '' }))} style={{background: 'none',border: 'none',cursor: 'pointer',color: T.muted,padding: 0 }}><X size={14} /></button>
                )}
              </div>

              {/* Sort dropdown */}
              <select value={filters.sortBy} onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value as any }))}
                id="directory-sort-dropdown"
                data-filter-control
                style={{background: T.bgSurface,border: `1px solid ${T.borderMid}`,borderRadius: 12,padding: '0 14px',height: 48,color: T.text,fontSize: 12,fontWeight: 600,cursor: 'pointer',minWidth: 140}}>
                <option value="rank">Route Rank</option>
                <option value="response">Fastest Response</option>
                <option value="rate">Highest Rate</option>
                <option value="newest">Recently Active</option>
              </select>
            </div>

            {/* Filter chips row */}
            <div style={{display: 'flex',flexWrap: 'wrap',gap: 6,marginTop: 14,justifyContent: 'center' }}>
              <FilterChip label="Wheels Ready" active={filters.availableNow} onClick={() => setFilters(f => ({ ...f, availableNow: !f.availableNow }))} />
              <FilterChip label="DOT Verified" active={filters.verifiedOnly} onClick={() => setFilters(f => ({ ...f, verifiedOnly: !f.verifiedOnly }))} />
              <FilterChip label="Escrow" active={filters.escrowOnly} onClick={() => setFilters(f => ({ ...f, escrowOnly: !f.escrowOnly }))} />
              <FilterChip label="Lead Car" active={filters.serviceType === 'lead_car'} onClick={() => setFilters(f => ({ ...f, serviceType: f.serviceType === 'lead_car' ? '' : 'lead_car' }))} />
              <FilterChip label="Chase Car" active={filters.serviceType === 'chase_car'} onClick={() => setFilters(f => ({ ...f, serviceType: f.serviceType === 'chase_car' ? '' : 'chase_car' }))} />
              <FilterChip label="Height Pole" active={filters.serviceType === 'height_pole'} onClick={() => setFilters(f => ({ ...f, serviceType: f.serviceType === 'height_pole' ? '' : 'height_pole' }))} />
              <FilterChip label="Superload Cert" active={filters.serviceType === 'superload_cert'} onClick={() => setFilters(f => ({ ...f, serviceType: f.serviceType === 'superload_cert' ? '' : 'superload_cert' }))} />
              {(['HOT', 'WARM', 'COOL'] as CorridorHeat[]).map(h => (
                <FilterChip key={h} label={h} active={filters.corridorHeat === h}
                  onClick={() => setFilters(f => ({ ...f, corridorHeat: f.corridorHeat === h ? '' : h }))} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div style={{maxWidth: 1400,margin: '0 auto',padding: '28px 20px' }}>
          <div style={{display: 'flex',gap: 24,alignItems: 'flex-start' }}>

            {/* Sidebar */}
            <div className="dir-sidebar">
              <div style={{background: T.bgCard,border: `1px solid ${T.border}`,borderRadius: 16,padding: '16px',display: 'flex',flexDirection: 'column',gap: 2}}>
                <div style={{fontSize: 11,fontWeight: 800,color: T.muted,textTransform: 'uppercase',letterSpacing: '0.1em',padding: '0 12px 8px' }}>Filters</div>
                <ToggleSwitch label="Wheels Ready" active={filters.availableNow} onChange={() => setFilters(f => ({ ...f, availableNow: !f.availableNow }))} icon={<Zap size={14} />} />
                <ToggleSwitch label="DOT Verified" active={filters.verifiedOnly} onChange={() => setFilters(f => ({ ...f, verifiedOnly: !f.verifiedOnly }))} icon={<ShieldCheck size={14} />} />
                <ToggleSwitch label="Escrow Ready" active={filters.escrowOnly} onChange={() => setFilters(f => ({ ...f, escrowOnly: !f.escrowOnly }))} icon={<Shield size={14} />} />
                <ToggleSwitch label="Superload Cert" active={filters.avCertified} onChange={() => setFilters(f => ({ ...f, avCertified: !f.avCertified }))} icon={<Award size={14} />} />

                <div style={{height: 1,background: T.border,margin: '8px 0' }} />
                <div style={{fontSize: 10,fontWeight: 700,color: T.muted,textTransform: 'uppercase',padding: '4px 12px' }}>Corridor Status</div>
                {(['HOT', 'WARM', 'COOL'] as CorridorHeat[]).map(h => {
                  const cfg = CORRIDOR_STATUS[h];
                  return (
                    <button aria-label="Interactive Button" key={h} onClick={() => setFilters(f => ({ ...f, corridorHeat: f.corridorHeat === h ? '' : h }))}
                      style={{display: 'flex',alignItems: 'center',gap: 8,width: '100%',padding: '8px 12px',borderRadius: 8,cursor: 'pointer',border: 'none',background: filters.corridorHeat === h ? cfg.bg : 'transparent',transition: 'background 0.15s ease'}}>
                      <span style={{width: 6,height: 6,borderRadius: '50%',background: cfg.color }} />
                      <span style={{fontSize: 11,fontWeight: 700,color: filters.corridorHeat === h ? cfg.color : T.muted }}>{h}</span>
                    </button>
                  );
                })}

                <div style={{height: 1,background: T.border,margin: '8px 0' }} />
                <div style={{fontSize: 10,fontWeight: 700,color: T.muted,textTransform: 'uppercase',padding: '4px 12px' }}>Services</div>
                {Object.entries(SERVICE_LABELS).map(([key, label]) => (
                  <button aria-label="Interactive Button" key={key} onClick={() => setFilters(f => ({ ...f, serviceType: f.serviceType === key ? '' : key }))}
                    style={{display: 'flex',alignItems: 'center',gap: 8,width: '100%',padding: '8px 12px',borderRadius: 8,cursor: 'pointer',border: 'none',background: filters.serviceType === key ? T.goldDim : 'transparent',color: filters.serviceType === key ? T.gold : T.textSecondary,fontSize: 11,fontWeight: 600,textAlign: 'left',transition: 'all 0.15s ease'}}>
                    <Truck size={12} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div style={{flex: 1,minWidth: 0 }}>
              <div style={{display: 'flex',alignItems: 'center',justifyContent: 'space-between',marginBottom: 16 }}>
                <div style={{fontSize: 13,color: T.muted }}>
                  {loading ? 'Loading...' : <>
                    <span style={{color: T.text,fontWeight: 700 }}>{filteredOps.length.toLocaleString()}</span> operators
                    {activeFilterCount > 0 && <span style={{color: T.gold,marginLeft: 6 }}>({activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''})</span>}
                  </>}
                </div>
              </div>

              {loading ? (
                <div className="dir-grid">{Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="ag-skeleton" style={{background: T.bgCard,border: `1px solid ${T.border}`,borderRadius: 16,height: 280 }} />
                ))}</div>
              ) : (
                <div className="dir-grid ag-stagger">
                  {gridItems.map((item, i) => {
                    if (item.type === 'ad') return <AdGridSlot key={`ad-${i}`} />;
                    if (item.type === 'sponsor-upper') return (
                      <div key="sponsor-upper" style={{gridColumn: '1 / -1' }}>
                        <DirectorySponsorCard position="upper" stateCode={filters.state || undefined} />
                      </div>
                    );
                    if (item.type === 'sponsor-lower') return (
                      <div key="sponsor-lower" style={{gridColumn: '1 / -1' }}>
                        <DirectorySponsorCard position="lower" />
                      </div>
                    );
                    return item.data ? <OperatorCard key={item.data.id} op={item.data} position={i} /> : null;
                  })}
                </div>
              )}

              {/* Empty state when no operators */}
              {!loading && filteredOps.length === 0 && (
                <div style={{textAlign: 'center',padding: '60px 20px',background: T.bgCard,border: `1px solid ${T.border}`,borderRadius: 20}}>
                  <div style={{fontSize: 48,marginBottom: 16}}>🚗</div>
                  <div style={{fontSize: 22,fontWeight: 900,color: T.text,marginBottom: 8}}>No Operators Listed Yet</div>
                  <div style={{fontSize: 14,color: T.textSecondary,maxWidth: 420,margin: '0 auto 24px',lineHeight: 1.6}}>
                    Be the first pilot car operator in this area to claim your free listing and start receiving job requests.
                  </div>
                  <Link aria-label="Claim Your Listing" href="/claim" style={{display: 'inline-flex',alignItems: 'center',gap: 8,padding: '14px 28px',borderRadius: 12,background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,color: '#000',fontSize: 14,fontWeight: 900,textDecoration: 'none'}}>
                    🚛 Get Listed Free
                  </Link>
                </div>
              )}

              {/* CTA Banner */}
              <div style={{marginTop: 40,padding: '32px 24px',borderRadius: 20,background: `linear-gradient(135deg, rgba(198,146,58,0.06), rgba(198,146,58,0.02))`,border: `1px solid ${T.goldBorder}`,textAlign: 'center'}}>
                <div style={{fontSize: 22,fontWeight: 900,color: T.text,marginBottom: 8 }}>
                  Need a Pilot Car? Post Your Load.
                </div>
                <div style={{fontSize: 14,color: T.textSecondary,marginBottom: 20,maxWidth: 480,margin: '0 auto 20px' }}>
                  Sign in to see trust scores, dispatch history, and request operators directly. Free for escorts.
                </div>
                <div style={{display: 'flex',gap: 12,justifyContent: 'center',flexWrap: 'wrap' }}>
                  <Link aria-label="Navigation Link" href="/login" className="ag-press" style={{padding: '12px 28px',borderRadius: 12,background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,color: '#000',fontWeight: 800,fontSize: 14,textDecoration: 'none'}}>Sign In Free</Link>
                  <Link aria-label="Navigation Link" href="/claim" style={{padding: '12px 28px',borderRadius: 12,background: 'transparent',border: `1px solid ${T.borderStrong}`,color: T.textSecondary,fontWeight: 700,fontSize: 14,textDecoration: 'none'}}>Claim Your Listing</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function getHeatFromScore(score: number | null): CorridorHeat {
  if (!score) return 'COOL';
  if (score > 0.7) return 'HOT';
  if (score > 0.4) return 'WARM';
  return 'COOL';
}

export default PublicDirectory;
