'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

/* ══════════════════════════════════════════════════════════════════════════
   DirectorySearchList — Mobile Directory with PII Censorship + Login Modal
   - Blurs phone/email for unauthenticated users (matches server-side censorship)
   - Search debounced at 300ms → /api/directory/listings
   - Infinite scroll (load more on scroll bottom)
   - State/country filter pills
   - Login CTA modal on blur tap
   ══════════════════════════════════════════════════════════════════════════ */

interface DirectoryListing {
  id: string;
  slug: string;
  full_name: string;
  city: string;
  state: string;
  country_code: string;
  rating?: number;
  review_count?: number;
  is_claimed: boolean;
  rank_score: number;
  services?: string[];
  phone?: string;     // only present if authed
  email?: string;     // only present if authed
}

interface DirectorySearchListProps {
  isAuthenticated?: boolean;
  initialState?: string;
}

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

function Initials({ name }: { name: string }) {
  const letters = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: 46, height: 46, borderRadius: '50%',
      background: 'rgba(212,168,68,0.1)',
      border: '1.5px solid rgba(212,168,68,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 800, color: '#D4A844', flexShrink: 0,
    }}>
      {letters || '?'}
    </div>
  );
}

function StarRating({ rating, count }: { rating?: number; count?: number }) {
  if (!rating) return null;
  const stars = Math.min(Math.round(rating), 5);
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <span style={{ color: '#F59E0B', fontSize: 11 }}>{'★'.repeat(stars)}</span>
      <span style={{ color: '#64748b', fontSize: 10 }}>{rating.toFixed(1)}</span>
      {count && <span style={{ color: '#475569', fontSize: 10 }}>({count})</span>}
    </span>
  );
}

// The core blur-censor overlay — tapping triggers login modal
function CensoredContact({ label, icon, isAuthenticated, onLoginPrompt }: {
  label: string;
  icon: string;
  isAuthenticated?: boolean;
  onLoginPrompt: () => void;
}) {
  if (isAuthenticated) {
    return (
      <a href={`tel:${label}`} style={{ color: '#34d399', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
        {icon} {label}
      </a>
    );
  }
  return (
    <button onClick={onLoginPrompt} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: '#64748b', fontSize: 11 }}>{icon}</span>
      <span style={{
        filter: 'blur(4px)',
        userSelect: 'none',
        color: '#94a3b8',
        fontSize: 12,
        fontFamily: 'monospace',
        letterSpacing: 1,
      }}>
        {label.replace(/./g, '•')}
      </span>
      <span style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 800, color: '#F59E0B',
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        Sign in →
      </span>
    </button>
  );
}

// Login prompt modal
function LoginModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(160deg, #0e1520 0%, #080c14 100%)',
        border: '1px solid rgba(212,168,68,0.2)',
        borderRadius: '24px 24px 0 0',
        padding: '28px 24px 40px',
        width: '100%', maxWidth: 480,
        animation: 'slide-up 0.3s cubic-bezier(0.32,0.72,0,1)',
      }} onClick={e => e.stopPropagation()}>
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '0 auto 20px' }} />
        
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #C6923A, #8A6428)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, boxShadow: '0 0 24px rgba(198,146,58,0.3)',
          }}>⬡</div>

          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 900, margin: '0 0 8px' }}>
            Unlock Contact Info
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
            Sign in to see phone numbers, emails, and direct booking links for all 1.5M+ verified operators.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link
            href="/auth/login"
            style={{
              display: 'block', textAlign: 'center',
              background: 'linear-gradient(135deg, #C6923A, #8A6428)',
              color: '#000', fontWeight: 800, fontSize: 15,
              borderRadius: 14, padding: '14px 20px', textDecoration: 'none',
            }}
          >
            Log In →
          </Link>
          <Link
            href="/auth/register"
            style={{
              display: 'block', textAlign: 'center',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              borderRadius: 14, padding: '13px 20px', textDecoration: 'none',
            }}
          >
            Create Free Account
          </Link>
        </div>

        <p style={{ color: '#334155', fontSize: 11, textAlign: 'center', marginTop: 16 }}>
          Free forever for browsing · No credit card required
        </p>
      </div>
    </div>
  );
}

export function DirectorySearchList({ isAuthenticated = false, initialState }: DirectorySearchListProps) {
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState(initialState ?? '');
  const [listings, setListings] = useState<DirectoryListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchListings = useCallback(async (q: string, state: string, pg: number, append: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20', page: String(pg) });
      if (q) params.set('q', q);
      if (state) params.set('state', state);

      const res = await fetch(`/api/directory/listings?${params}`);
      if (!res.ok) return;
      const data = await res.json();

      const next: DirectoryListing[] = data.listings ?? [];
      setListings(prev => append ? [...prev, ...next] : next);
      setTotal(data.total ?? null);
      setHasMore(next.length === 20);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchListings(search, stateFilter, 1, false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, stateFilter, fetchListings]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!bottomRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loading && hasMore) {
        const next = page + 1;
        setPage(next);
        fetchListings(search, stateFilter, next, true);
      }
    }, { threshold: 0.1 });
    obs.observe(bottomRef.current);
    return () => obs.disconnect();
  }, [loading, hasMore, page, search, stateFilter, fetchListings]);

  return (
    <div style={{ background: 'var(--m-bg, #070b12)', minHeight: '100dvh', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* Search Bar */}
      <div style={{ padding: '12px 16px 0', position: 'sticky', top: 0, background: 'var(--m-bg, #070b12)', zIndex: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '10px 14px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 15 }}
            placeholder="Search operators, city, state..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
          )}
        </div>

        {/* State filter pills */}
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, paddingTop: 10,
          scrollbarWidth: 'none',
        }}>
          <button
            style={pillStyle(stateFilter === '')}
            onClick={() => setStateFilter('')}
          >All States</button>
          {US_STATES.slice(0, 20).map(s => (
            <button
              key={s}
              style={pillStyle(stateFilter === s)}
              onClick={() => setStateFilter(stateFilter === s ? '' : s)}
            >{s}</button>
          ))}
        </div>

        {/* Count bar */}
        {total !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', flexShrink: 0, display: 'block' }} />
            <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>
              {total.toLocaleString()} operators{stateFilter ? ` in ${stateFilter}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Operator Cards */}
      <div style={{ padding: '4px 16px 80px' }}>
        {listings.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#475569' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <p style={{ margin: 0, fontWeight: 600 }}>No operators found</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#334155' }}>Try a different search or state</p>
          </div>
        )}

        {listings.map((op, i) => (
          <div key={op.id} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: 16, marginBottom: 10,
            animation: 'fade-in 0.25s ease',
            animationDelay: `${(i % 20) * 30}ms`,
            animationFillMode: 'both',
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Initials name={op.full_name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Link
                    href={`/directory/${op.slug ?? op.id}`}
                    style={{ color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
                  >
                    {op.full_name}
                  </Link>
                  {op.is_claimed && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#22C55E', background: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: 4, letterSpacing: '0.04em' }}>
                      ✓ CLAIMED
                    </span>
                  )}
                </div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                  {[op.city, op.state].filter(Boolean).join(', ')}
                </div>
                <div style={{ marginTop: 6 }}>
                  <StarRating rating={op.rating} count={op.review_count} />
                </div>
              </div>
            </div>

            {/* Services */}
            {op.services && op.services.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
                {op.services.slice(0, 3).map(s => (
                  <span key={s} style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.04)', color: '#64748b',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>{s}</span>
                ))}
              </div>
            )}

            {/* PII Contact — censored for unauthed */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <CensoredContact
                label={op.phone ?? '(555) 867-5309'}
                icon="📞"
                isAuthenticated={isAuthenticated}
                onLoginPrompt={() => setShowLogin(true)}
              />
              {op.email && (
                <CensoredContact
                  label={op.email}
                  icon="✉"
                  isAuthenticated={isAuthenticated}
                  onLoginPrompt={() => setShowLogin(true)}
                />
              )}
              {!op.is_claimed && (
                <Link
                  href={`/claim/${op.id}`}
                  style={{ marginLeft: 'auto', fontSize: 11, color: '#D4A844', textDecoration: 'none', fontWeight: 700 }}
                >
                  Claim →
                </Link>
              )}
            </div>
          </div>
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={bottomRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading && (
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#D4A844',
                  animation: `bounce 1s ease infinite ${i * 0.15}s`,
                }} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
    background: active ? 'rgba(212,168,68,0.12)' : 'rgba(255,255,255,0.04)',
    color: active ? '#D4A844' : '#64748b',
    border: `1px solid ${active ? 'rgba(212,168,68,0.3)' : 'rgba(255,255,255,0.06)'}`,
    transition: 'all 0.15s',
  };
}
