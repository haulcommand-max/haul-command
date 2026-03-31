'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  MapPin,
  Star,
  Shield,
  Lock,
  ChevronRight,
  Users,
  Phone,
  Mail,
  CheckCircle2,
  Loader2,
  Filter,
  X,
} from 'lucide-react';
import { LiveKitDispatchButton } from '../dispatch/LiveKitDispatchButton';
import { VAPIDispatchButton } from '../dispatch/VAPIDispatchButton';

// ── Types ────────────────────────────────────────────────────────────────────
interface Operator {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  country_code: string;
  services: string[];
  is_claimed: boolean;
  rating: number;
  review_count: number;
  rank_score: number;
  is_featured: boolean;
  profile_completeness: number;
  metadata?: {
    phone?: string;
    email?: string;
    exact_address?: string;
    is_censored?: boolean;
  };
}

interface SearchResponse {
  operators: Operator[];
  total: number;
  page: number;
  total_pages: number;
  has_more: boolean;
}

interface Props {
  initialQ?: string;
  initialState?: string;
  isAuthenticated?: boolean;
}

// ── Login Gate Modal ─────────────────────────────────────────────────────────
function LoginGateModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md"
        style={{
          background: 'linear-gradient(160deg, #0d1320, #06080f)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 24,
          padding: '36px 32px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Lock size={28} color="#F59E0B" />
        </div>

        <h2 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          Login to View All 1.5M Operators
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          Full phone numbers, emails, and addresses are hidden for anonymous visitors. Create a free account to unlock the complete Haul Command network.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {['Direct phone + email for every operator', '1.5M+ verified pilots, carriers, brokers', 'Real-time availability + compliance scores', 'Post loads, get instant match alerts'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#94a3b8' }}>
              <CheckCircle2 size={14} color="#34d399" />
              {f}
            </div>
          ))}
        </div>

        <a
          href="/auth/signup"
          style={{ display: 'block', width: '100%', background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', borderRadius: 14, padding: '15px 20px', color: '#000', fontSize: 15, fontWeight: 800, textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
        >
          Create Free Account →
        </a>
        <a
          href="/auth/login"
          style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 13, color: '#64748b', textDecoration: 'none' }}
        >
          Already have an account? <span style={{ color: '#94a3b8', fontWeight: 600 }}>Log in</span>
        </a>
      </div>
    </div>
  );
}

// ── Operator Card ─────────────────────────────────────────────────────────────
function OperatorCard({ op, isAuthenticated, onUnlockClick }: { op: Operator; isAuthenticated: boolean; onUnlockClick: () => void }) {
  const censored = op.metadata?.is_censored;
  const phone = op.metadata?.phone;
  const email = op.metadata?.email;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        border: op.is_featured ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18,
        padding: '20px 22px',
        position: 'relative',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Featured badge */}
      {op.is_featured && (
        <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '2px 8px', fontSize: 10, fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Featured
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        {/* Avatar */}
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#475569', flexShrink: 0 }}>
          {op.name.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {op.name}
            </h3>
            {op.is_claimed && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700, color: '#34d399' }}>
                <Shield size={9} /> Claimed
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: '#64748b', fontSize: 12 }}>
            <MapPin size={11} />
            {op.city}, {op.state} · {op.country_code}
          </div>
        </div>
      </div>

      {/* Services */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {(op.services || []).slice(0, 3).map(s => (
          <span key={s} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '3px 9px', fontSize: 11, color: '#818cf8', fontWeight: 600 }}>
            {s.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {/* Contact info — censored or real */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, position: 'relative' }}>
            <Phone size={13} color="#64748b" />
            {censored ? (
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ filter: 'blur(5px)', color: '#94a3b8', userSelect: 'none', pointerEvents: 'none' }}>
                  +1 (555) 000-0000
                </span>
                <button
                  onClick={onUnlockClick}
                  style={{ position: 'absolute', inset: 0, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#F59E0B' }}
                >
                  <Lock size={10} /> Login to view
                </button>
              </div>
            ) : (
              <a href={`tel:${phone}`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{phone}</a>
            )}
          </div>
        )}
        {email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, position: 'relative' }}>
            <Mail size={13} color="#64748b" />
            {censored ? (
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ filter: 'blur(5px)', color: '#94a3b8', userSelect: 'none', pointerEvents: 'none' }}>
                  operator@example.com
                </span>
                <button
                  onClick={onUnlockClick}
                  style={{ position: 'absolute', inset: 0, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#F59E0B' }}
                >
                  <Lock size={10} /> Login to view
                </button>
              </div>
            ) : (
              <a href={`mailto:${email}`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{email}</a>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}>
          <Star size={12} color="#F59E0B" />
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>{op.rating.toFixed(1)}</span>
          {op.review_count > 0 && <span>({op.review_count})</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAuthenticated && (
            <>
              <VAPIDispatchButton 
                compact 
                operatorId={op.id} 
                operatorName={op.name} 
                operatorPhone={phone} 
              />
              {/* 
                When VAPI credits burn out, uncomment this to swap to LiveKit 
                <LiveKitDispatchButton 
                  compact 
                  operatorId={op.id} 
                  operatorName={op.name} 
                  operatorPhone={phone} 
                  operatorLocation={op.country_code === 'US' ? op.state : op.country_code} 
                />
              */}
            </>
          )}
          <a
            href={`/providers/${op.slug}`}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}
          >
            View Profile <ChevronRight size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function DirectorySearchList({ initialQ = '', initialState = '', isAuthenticated = false }: Props) {
  const [q, setQ] = useState(initialQ);
  const [stateFilter, setStateFilter] = useState(initialState);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [page, setPage] = useState(1);

  const search = useCallback(async (searchQ: string, searchState: string, searchPage: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: searchQ, page: String(searchPage), limit: '24' });
      if (searchState) params.set('state', searchState);
      const res = await fetch(`/api/directory/search?${params}`);
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error('Directory search error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(q, stateFilter, page);
  }, [page]); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    search(q, stateFilter, 1);
  };

  const hasCensored = results?.operators.some(o => o.metadata?.is_censored);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#e2e8f0' }}>
      {showLoginModal && <LoginGateModal onClose={() => setShowLoginModal(false)} />}

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 280px', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '0 14px', gap: 10 }}>
          <Search size={16} color="#475569" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search pilot car operators, escorts, brokers..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 14, padding: '13px 0' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '0 14px', gap: 10 }}>
          <Filter size={14} color="#475569" />
          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: '#94a3b8', fontSize: 13, padding: '13px 0', cursor: 'pointer' }}
          >
            <option value="">All States</option>
            {['TX','FL','CA','GA','LA','OK','MS','AL','TN','AR','NY','OH','PA','IL','MI'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: 14, padding: '0 24px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Search
        </button>
      </form>

      {/* Censored banner */}
      {hasCensored && !isAuthenticated && (
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '14px 18px', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Lock size={16} color="#F59E0B" />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>
                Phone & email hidden for your protection
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#78716c' }}>
                Login to unlock direct contact details for all 1.5M+ operators
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLoginModal(true)}
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', borderRadius: 10, padding: '9px 18px', color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Login to View All 1.5M Operators →
          </button>
        </div>
      )}

      {/* Stats bar */}
      {results && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, fontSize: 13, color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={13} />
            <span><span style={{ color: '#f1f5f9', fontWeight: 700 }}>{results.total.toLocaleString()}</span> operators found</span>
          </div>
          <span>·</span>
          <span>Page {results.page} of {results.total_pages}</span>
          {loading && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
        </div>
      )}

      {/* Grid */}
      {loading && !results ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 size={32} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {results?.operators.map(op => (
            <OperatorCard
              key={op.id}
              op={op}
              isAuthenticated={isAuthenticated}
              onUnlockClick={() => setShowLoginModal(true)}
            />
          ))}
          {results?.operators.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#475569' }}>
              No operators found. Try a broader search.
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {results && results.total_pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: page <= 1 ? '#334155' : '#94a3b8', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            ← Prev
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 13, color: '#64748b' }}>
            {page} / {results.total_pages}
          </span>
          <button
            disabled={!results.has_more}
            onClick={() => setPage(p => p + 1)}
            style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: !results.has_more ? '#334155' : '#94a3b8', cursor: !results.has_more ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            Next →
          </button>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
