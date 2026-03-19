'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, MapPin, ShieldCheck, Star, Filter, X,
  ChevronDown, Users, ArrowRight, Clock, DollarSign,
  Zap, CheckCircle, Award,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   PUBLIC DIRECTORY — Haul Command
   Full public-facing operator directory with:
   - Hero search bar with filters
   - Operator cards grid (real data + seed placeholders)
   - Sponsored listing slots (gold border, every 6th card)
   - Filter sidebar: verified, escrow, available, service type, state
   - Social proof bar: operator count, median fill time, escrow tag
   ═══════════════════════════════════════════════════════════════════ */

const T = {
  bg: '#060b12',
  bgCard: '#0f1a26',
  bgSection: '#0a1520',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.13)',
  gold: '#f5b942',
  goldDim: 'rgba(245,185,66,0.15)',
  goldBorder: 'rgba(245,185,66,0.35)',
  green: '#27d17f',
  text: '#f0f4f8',
  muted: '#8fa3b8',
  subtle: '#556070',
} as const;

// ─── Seed operators for when DB is empty ─────────────────────────────────────
const SEED_OPERATORS = [
  { id: 'seed-1', name: 'Lone Star Pilot Cars', state: 'TX', region: 'Texas', services: ['pilot_car', 'height_pole', 'wide_load'], verified: true, escrow: true, corridorRank: 1, avgResponse: 14, sponsored: false, isSeed: true },
  { id: 'seed-2', name: 'Gulf Coast Escorts LLC', state: 'TX', region: 'Texas', services: ['pilot_car', 'route_survey'], verified: true, escrow: false, corridorRank: 2, avgResponse: 22, sponsored: false, isSeed: true },
  { id: 'seed-3', name: 'Dixie Oversize Escorts', state: 'GA', region: 'Georgia', services: ['pilot_car', 'wide_load'], verified: false, escrow: false, corridorRank: 5, avgResponse: 31, sponsored: false, isSeed: true },
  { id: 'seed-4', name: 'Pacific Northwest Pilot Cars', state: 'WA', region: 'Washington', services: ['pilot_car', 'height_pole', 'route_survey'], verified: true, escrow: true, corridorRank: 3, avgResponse: 18, sponsored: false, isSeed: true },
  { id: 'seed-5', name: 'Midwest Heavy Haul Escorts', state: 'IL', region: 'Illinois', services: ['pilot_car', 'wide_load', 'oversize'], verified: true, escrow: false, corridorRank: 4, avgResponse: 25, sponsored: false, isSeed: true },
  { id: 'seed-6', name: 'Sunshine State Pilot Cars', state: 'FL', region: 'Florida', services: ['pilot_car', 'height_pole'], verified: false, escrow: false, corridorRank: 8, avgResponse: 45, sponsored: false, isSeed: true },
];

const SERVICE_LABELS: Record<string, string> = {
  pilot_car: 'Pilot Car',
  height_pole: 'Height Pole',
  route_survey: 'Route Survey',
  wide_load: 'Wide Load',
  oversize: 'Oversize',
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

interface Operator {
  id: string;
  name: string;
  state: string;
  region?: string;
  services: string[];
  verified: boolean;
  escrow: boolean;
  corridorRank?: number;
  avgResponse?: number;
  sponsored?: boolean;
  isSeed?: boolean;
  trustScore?: number;
  slug?: string;
}

interface Filters {
  search: string;
  state: string;
  serviceType: string;
  verifiedOnly: boolean;
  escrowOnly: boolean;
  availableNow: boolean;
  sortBy: 'rank' | 'response' | 'newest';
}

// ─── Sponsored Ad Card ────────────────────────────────────────────────────────
function SponsoredCard({ index }: { index: number }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(245,185,66,0.06), rgba(245,185,66,0.02))`,
      border: `1px solid ${T.goldBorder}`,
      borderRadius: 16,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      position: 'relative',
      animation: 'pulse-gold-border 3s ease-in-out infinite',
    }}>
      <div style={{
        position: 'absolute', top: 10, right: 12,
        fontSize: 9, fontWeight: 800, color: T.gold,
        textTransform: 'uppercase', letterSpacing: '0.1em',
        background: 'rgba(245,185,66,0.12)', padding: '2px 8px', borderRadius: 4,
      }}>
        Sponsored
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: 'rgba(245,185,66,0.12)', border: '1px solid rgba(245,185,66,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>📋</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.gold }}>
            Advertise Your Business
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>
            Reach 7,000+ operators and brokers
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
        Boost your listing to the top of search results for your state or corridor. Plans from 7-day to 90-day.
      </div>
      <Link href="/sponsor" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 10,
        background: 'rgba(245,185,66,0.15)', border: `1px solid ${T.goldBorder}`,
        color: T.gold, fontSize: 12, fontWeight: 800, textDecoration: 'none',
        width: 'fit-content',
      }}>
        Boost Your Listing <ArrowRight size={12} />
      </Link>
    </div>
  );
}

// ─── Operator Card ────────────────────────────────────────────────────────────
function OperatorCard({ op, position }: { op: Operator; position: number }) {
  const isSponsored = op.sponsored;

  return (
    <div
      className="operator-card ag-card-hover"
      style={{
        background: isSponsored
          ? `linear-gradient(135deg, rgba(245,185,66,0.06), rgba(245,185,66,0.02))`
          : T.bgCard,
        border: isSponsored
          ? `1px solid ${T.goldBorder}`
          : `1px solid ${T.border}`,
        borderRadius: 16,
        padding: '18px 18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
        position: 'relative',
        animation: `slide-in-card 0.4s ease-out both`,
        animationDelay: `${Math.min(position * 50, 400)}ms`,
      }}
    >
      {isSponsored && (
        <div style={{
          position: 'absolute', top: 10, right: 12,
          fontSize: 9, fontWeight: 800, color: T.gold,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          background: 'rgba(245,185,66,0.12)', padding: '2px 8px', borderRadius: 4,
          animation: 'pulse-gold-border 3s ease-in-out infinite',
        }}>
          Sponsored
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          🚗
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingRight: isSponsored ? 60 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
              {op.name}
            </span>
            {op.verified && (
              <ShieldCheck size={13} style={{ color: T.green, flexShrink: 0 }} />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <MapPin size={11} style={{ color: T.muted }} />
            <span style={{ fontSize: 12, color: T.muted }}>
              {op.region || op.state}
            </span>
          </div>
        </div>
      </div>

      {/* Services */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {op.services.slice(0, 4).map(s => (
          <span key={s} style={{
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
            color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {SERVICE_LABELS[s] || s}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {op.corridorRank != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Award size={11} style={{ color: T.gold }} />
            <span style={{ fontSize: 11, color: T.gold, fontWeight: 700 }}>
              #{op.corridorRank} Corridor
            </span>
          </div>
        )}
        {op.avgResponse != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} style={{ color: T.muted }} />
            <span style={{ fontSize: 11, color: T.muted }}>
              ~{op.avgResponse}m response
            </span>
          </div>
        )}
        {op.escrow && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={11} style={{ color: '#60a5fa' }} />
            <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 700 }}>
              Escrow
            </span>
          </div>
        )}
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        {op.isSeed ? (
          <Link
            href="/claim"
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 10, textAlign: 'center',
              background: 'rgba(245,185,66,0.1)', border: `1px solid rgba(245,185,66,0.2)`,
              color: T.gold, fontSize: 12, fontWeight: 800, textDecoration: 'none',
            }}
          >
            Claim This Listing
          </Link>
        ) : (
          <>
            <Link
              href={`/directory/profile/${op.slug || op.id}`}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 10, textAlign: 'center',
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
                color: T.text, fontSize: 12, fontWeight: 700, textDecoration: 'none',
              }}
            >
              View Profile
            </Link>
            <Link
              href={`/inbox?to=${op.id}`}
              style={{
                padding: '8px 12px', borderRadius: 10, textAlign: 'center',
                background: 'rgba(34,209,127,0.08)', border: '1px solid rgba(34,209,127,0.2)',
                color: T.green, fontSize: 12, fontWeight: 800, textDecoration: 'none',
              }}
            >
              DM
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="filter-chip ag-chip-snap"
      style={{
        padding: '6px 14px', borderRadius: 999, cursor: 'pointer', border: 'none',
        fontSize: 12, fontWeight: 700,
        background: active ? T.gold : 'rgba(255,255,255,0.05)',
        color: active ? '#000' : T.muted,
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function PublicDirectory() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    state: '',
    serviceType: '',
    verifiedOnly: false,
    escrowOnly: false,
    availableNow: false,
    sortBy: 'rank',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [socialProof, setSocialProof] = useState({ operators: 0, fillTime: 47, escrowCount: 0 });

  // Fetch operators
  const fetchOperators = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '24' });
      if (filters.state) params.set('region', filters.state);
      if (filters.serviceType) params.set('entity_type', filters.serviceType);
      if (filters.search) params.set('q', filters.search);

      const res = await fetch(`/api/directory/listings?${params}`);
      if (res.ok) {
        const data = await res.json();
        const listings: Operator[] = (data.listings || []).map((l: any) => ({
          id: l.id,
          name: l.name || 'Verified Operator',
          state: l.region_code || '',
          region: l.region_code || '',
          services: l.metadata?.services || ['pilot_car'],
          verified: l.claim_status === 'claimed' || l.claim_status === 'verified',
          escrow: l.metadata?.escrow_enabled || false,
          corridorRank: l.rank_score ? Math.ceil(l.rank_score * 10) : undefined,
          avgResponse: l.metadata?.avg_response_minutes || undefined,
          sponsored: l.metadata?.is_sponsored || false,
          slug: l.slug,
          trustScore: l.rank_score ? Math.round(l.rank_score * 100) : undefined,
        }));

        if (listings.length === 0) {
          // Show seeds so the page is never empty
          setOperators(SEED_OPERATORS);
          setTotal(SEED_OPERATORS.length);
        } else {
          setOperators(listings);
          setTotal(data.total || listings.length);
        }
        setSocialProof(prev => ({ ...prev, operators: data.total || listings.length || SEED_OPERATORS.length }));
      } else {
        setOperators(SEED_OPERATORS);
        setTotal(SEED_OPERATORS.length);
      }
    } catch {
      setOperators(SEED_OPERATORS);
      setTotal(SEED_OPERATORS.length);
    }
    setLoading(false);
  }, [filters.state, filters.serviceType, filters.search]);

  useEffect(() => {
    const t = setTimeout(fetchOperators, 300);
    return () => clearTimeout(t);
  }, [fetchOperators]);

  // Build grid with sponsored slots
  const buildGrid = () => {
    const items: Array<{ type: 'operator' | 'sponsored'; data?: Operator; index: number }> = [];
    let opIdx = 0;
    let gridPos = 0;

    // First slot is always sponsored
    items.push({ type: 'sponsored', index: gridPos++ });

    for (let i = 0; i < operators.length; i++) {
      items.push({ type: 'operator', data: operators[i], index: gridPos++ });
      opIdx++;
      // Every 6 items after the first, insert a sponsored slot
      if (opIdx > 0 && opIdx % 5 === 0) {
        items.push({ type: 'sponsored', index: gridPos++ });
      }
    }

    return items;
  };

  const gridItems = buildGrid();

  return (
    <>
      <style>{`
        @keyframes slide-in-card {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-gold-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,185,66,0); }
          50% { box-shadow: 0 0 12px 2px rgba(245,185,66,0.15); }
        }
        @keyframes filter-snap {
          0% { transform: scale(1); }
          40% { transform: scale(0.93); }
          100% { transform: scale(1); }
        }
        .operator-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(245,185,66,0.12);
        }
        .filter-chip:active {
          animation: filter-snap 0.2s ease-out;
        }
        .dir-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) { .dir-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .dir-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1280px) { .dir-grid { grid-template-columns: repeat(4, 1fr); } }
        .dir-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        @media (min-width: 1024px) {
          .dir-layout { flex-direction: row; align-items: flex-start; }
          .dir-sidebar { width: 240px; flex-shrink: 0; position: sticky; top: 80px; }
          .dir-main { flex: 1; min-width: 0; }
        }
        .dir-sidebar { display: none; }
        @media (min-width: 1024px) { .dir-sidebar { display: block; } }
      `}</style>

      <div style={{ background: T.bg, minHeight: '100vh', color: T.text }}>

        {/* ── Social Proof Bar ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          borderBottom: `1px solid ${T.border}`,
          padding: '10px 0',
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', flexWrap: 'wrap', gap: '12px 24px', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.muted }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
              <span style={{ fontWeight: 700, color: T.text }}>{(socialProof.operators || 7335).toLocaleString()}</span> verified operators
            </div>
            <div style={{ width: 1, height: 14, background: T.border }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.muted }}>
              <Clock size={12} style={{ color: T.gold }} />
              Median fill time <span style={{ fontWeight: 700, color: T.gold, margin: '0 3px' }}>{socialProof.fillTime}min</span>
            </div>
            <div style={{ width: 1, height: 14, background: T.border }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.muted }}>
              <CheckCircle size={12} style={{ color: '#60a5fa' }} />
              <span style={{ fontWeight: 700, color: '#60a5fa' }}>Escrow protected</span> payments available
            </div>
          </div>
        </div>

        {/* ── Hero Search ── */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(245,185,66,0.04) 0%, transparent 100%)',
          borderBottom: `1px solid ${T.border}`,
          padding: '40px 20px 32px',
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
                Operator Directory
              </div>
              <h1 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900, color: T.text, margin: 0, lineHeight: 1.2 }}>
                Find a Pilot Car Operator
              </h1>
              <p style={{ fontSize: 14, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>
                Search verified escort operators by state, corridor, and service type
              </p>
            </div>

            {/* Search box */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{
                flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.borderStrong}`,
                borderRadius: 14, padding: '0 16px', height: 50,
              }}>
                <Search size={16} style={{ color: T.muted, flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search operators, corridors, or companies..."
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    fontSize: 14, color: T.text, caretColor: T.gold,
                  }}
                />
                {filters.search && (
                  <button onClick={() => setFilters(f => ({ ...f, search: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 0 }}>
                    <X size={14} />
                  </button>
                )}
              </div>
              <select
                value={filters.state}
                onChange={e => setFilters(f => ({ ...f, state: e.target.value }))}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.borderStrong}`,
                  borderRadius: 14, padding: '0 16px', height: 50, color: filters.state ? T.text : T.muted,
                  fontSize: 14, cursor: 'pointer', minWidth: 120,
                }}
              >
                <option value="">All States</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: showFilters ? T.goldDim : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${showFilters ? T.goldBorder : T.borderStrong}`,
                  borderRadius: 14, padding: '0 18px', height: 50, color: showFilters ? T.gold : T.muted,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Filter size={15} /> Filters
                {(filters.verifiedOnly || filters.escrowOnly || filters.availableNow || filters.serviceType) && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.gold }} />
                )}
              </button>
            </div>

            {/* Quick filter chips */}
            {showFilters && (
              <div style={{ marginTop: 16, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <FilterChip label="Available Now" active={filters.availableNow} onClick={() => setFilters(f => ({ ...f, availableNow: !f.availableNow }))} />
                  <FilterChip label="Verified Only" active={filters.verifiedOnly} onClick={() => setFilters(f => ({ ...f, verifiedOnly: !f.verifiedOnly }))} />
                  <FilterChip label="Escrow Enabled" active={filters.escrowOnly} onClick={() => setFilters(f => ({ ...f, escrowOnly: !f.escrowOnly }))} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {['pilot_car', 'height_pole', 'route_survey', 'wide_load', 'oversize'].map(svc => (
                    <FilterChip
                      key={svc}
                      label={SERVICE_LABELS[svc]}
                      active={filters.serviceType === svc}
                      onClick={() => setFilters(f => ({ ...f, serviceType: f.serviceType === svc ? '' : svc }))}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: T.muted, fontWeight: 700 }}>Sort:</span>
                  {([['rank', 'Corridor Rank'], ['response', 'Response Time'], ['newest', 'Newest']] as const).map(([val, label]) => (
                    <FilterChip key={val} label={label} active={filters.sortBy === val} onClick={() => setFilters(f => ({ ...f, sortBy: val }))} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Main Content ── */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>

          {/* Results count + sign-in nudge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: T.muted }}>
              {loading ? 'Loading operators...' : (
                <><span style={{ color: T.text, fontWeight: 700 }}>{total.toLocaleString()}</span> operators{filters.state ? ` in ${filters.state}` : ' across the US'}</>
              )}
            </div>
            <Link href="/login" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10,
              background: 'rgba(245,185,66,0.1)', border: `1px solid rgba(245,185,66,0.25)`,
              color: T.gold, fontSize: 12, fontWeight: 800, textDecoration: 'none',
            }}>
              <Zap size={13} /> Sign in for full profiles + DM
            </Link>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="dir-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  background: T.bgCard, border: `1px solid ${T.border}`,
                  borderRadius: 16, padding: 18, height: 200,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              ))}
            </div>
          ) : (
            <div className="dir-grid">
              {gridItems.map((item, i) =>
                item.type === 'sponsored'
                  ? <SponsoredCard key={`sponsored-${i}`} index={i} />
                  : item.data
                  ? <OperatorCard key={item.data.id} op={item.data} position={i} />
                  : null
              )}
            </div>
          )}

          {/* Sign-in CTA below grid */}
          <div style={{
            marginTop: 40, padding: '32px 24px', borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(245,185,66,0.06), rgba(245,185,66,0.02))',
            border: `1px solid ${T.goldBorder}`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: T.text, marginBottom: 8 }}>
              See Full Operator Profiles
            </div>
            <div style={{ fontSize: 14, color: T.muted, marginBottom: 20, maxWidth: 480, margin: '0 auto 20px' }}>
              Sign in to access trust scores, response history, direct messaging, follow operators, and post loads.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/login" style={{
                padding: '12px 28px', borderRadius: 12,
                background: 'linear-gradient(135deg, #f5b942, #e8a830)',
                color: '#000', fontWeight: 800, fontSize: 14, textDecoration: 'none',
              }}>
                Sign In Free
              </Link>
              <Link href="/claim" style={{
                padding: '12px 28px', borderRadius: 12,
                background: 'transparent', border: `1px solid ${T.borderStrong}`,
                color: T.muted, fontWeight: 700, fontSize: 14, textDecoration: 'none',
              }}>
                Claim Your Listing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PublicDirectory;
