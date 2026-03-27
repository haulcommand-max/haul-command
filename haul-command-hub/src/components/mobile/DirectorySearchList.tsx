'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface Operator {
  id: string;
  name: string;
  phone?: string;
  last_name?: string;
  locality: string;
  admin1_code: string;
  surface_category_key: string;
  claim_status: string;
  hc_trust_number?: string;
  lat?: number;
  lng?: number;
  // censorship flag injected by backend for unauthenticated users
  censored?: boolean;
}

interface SearchResult {
  operators: Operator[];
  total: number;
  censored: boolean;
  page: number;
}

interface DirectorySearchListProps {
  initialQuery?: string;
  initialLat?: number;
  initialLng?: number;
  isAuthenticated?: boolean;
  onLoginRequest?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  pilot_car: '🚗 Pilot Car / Escort',
  escort_vehicle: '🚙 Escort Vehicle',
  flagger: '🦺 Flagger / Traffic Control',
  height_pole: '📏 Height Pole / Specialized',
  witpac: '🛣️ WITPAC / Interstate',
  bucket_truck: '🚛 Bucket Truck (Utility)',
  permit_service: '📋 Permit Service / Expediter',
  route_survey: '📍 Route Survey (Engineering)',
  traffic_control_supervisor: '🚧 Traffic Control Supervisor',
  police_escort: '🚔 Police Escort',
  steer_car: '🏎️ Steer Car / Rear Escort',
  freight_broker: '🏢 Freight Broker / Carrier',
  mobile_mechanic: '🔧 Heavy-Duty Mobile Mechanics',
  tow_truck: '🚚 Heavy Towing & Rotators',
  truck_stop: '⛽ Truck Stops / Travel Plazas',
  staging_yard: '🅿️ Secure Staging / Layover Yards',
  hazmat_response: '☣️ HAZMAT & Spill Response',
  autonomous_fleet: '🤖 Autonomous Fleet Responders',
  crane_service: '🏗️ Crane Service',
  heavy_haul_carrier: '🏋️ Heavy Haul Carrier',
};

function BlurredPII({ value, onReveal }: { value?: string; onReveal: () => void }) {
  return (
    <button
      onClick={onReveal}
      className="blurred-pii"
      aria-label="Login to reveal contact info"
      style={{
        filter: 'blur(5px)',
        cursor: 'pointer',
        background: 'rgba(255,140,0,0.08)',
        border: '1px solid rgba(255,140,0,0.3)',
        borderRadius: '6px',
        padding: '2px 8px',
        color: '#ccc',
        fontSize: '13px',
        letterSpacing: '0.03em',
        userSelect: 'none',
      }}
    >
      {value || '••• •••-••••'}
    </button>
  );
}

function LoginModal({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(255,140,0,0.4)',
        borderRadius: '20px',
        padding: '36px 28px',
        width: '100%',
        maxWidth: '380px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '10px' }}>
          View 1.5M+ Operators
        </h2>
        <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6', marginBottom: '28px' }}>
          Contact details, phone numbers, and trust scores are available exclusively to verified Haul Command members.
        </p>
        <button
          onClick={onLogin}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #ff8c00, #ff6b00)',
            color: '#fff', fontWeight: 700, fontSize: '16px',
            border: 'none', cursor: 'pointer', marginBottom: '12px',
          }}
        >
          Login / Create Free Account
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '12px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.06)', color: '#888',
            fontWeight: 500, fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
          }}
        >
          Continue Browsing
        </button>
      </div>
    </div>
  );
}

function OperatorCard({
  operator,
  censored,
  onRevealPII,
}: {
  operator: Operator;
  censored: boolean;
  onRevealPII: () => void;
}) {
  const categoryLabel = CATEGORY_LABELS[operator.surface_category_key] || operator.surface_category_key;
  const isVerified = operator.claim_status === 'claimed' || operator.claim_status === 'verified';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '14px',
      padding: '16px',
      marginBottom: '12px',
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>{operator.name}</span>
            {isVerified && (
              <span style={{
                background: 'rgba(0,200,100,0.15)', color: '#00c864',
                fontSize: '10px', fontWeight: 700, padding: '2px 6px',
                borderRadius: '4px', border: '1px solid rgba(0,200,100,0.3)',
              }}>✓ VERIFIED</span>
            )}
          </div>
          <div style={{ color: '#888', fontSize: '12px' }}>
            {operator.locality}, {operator.admin1_code}
          </div>
        </div>
        <span style={{
          background: 'rgba(255,140,0,0.12)', color: '#ff8c00',
          fontSize: '11px', padding: '4px 8px', borderRadius: '6px',
          border: '1px solid rgba(255,140,0,0.25)',
        }}>
          {categoryLabel}
        </span>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>CONTACT</div>
        {censored ? (
          <BlurredPII value={operator.phone} onReveal={onRevealPII} />
        ) : (
          <a
            href={`tel:${operator.phone}`}
            style={{ color: '#ff8c00', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}
          >
            📞 {operator.phone}
          </a>
        )}
      </div>

      {operator.hc_trust_number && (
        <div style={{ marginTop: '8px', fontSize: '10px', color: '#555', fontFamily: 'monospace' }}>
          HC# {operator.hc_trust_number}
        </div>
      )}
    </div>
  );
}

export default function DirectorySearchList({
  initialQuery = '',
  initialLat,
  initialLng,
  isAuthenticated = false,
  onLoginRequest,
}: DirectorySearchListProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Operator[]>([]);
  const [total, setTotal] = useState(0);
  const [censored, setCensored] = useState(!isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchResults = useCallback(async (q: string, p: number, reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, page: String(p), limit: '20' });
      if (initialLat) params.set('lat', String(initialLat));
      if (initialLng) params.set('lng', String(initialLng));

      const res = await fetch(`/api/directory/search?${params}`);
      const data: SearchResult = await res.json();

      setResults(prev => reset ? data.operators : [...prev, ...data.operators]);
      setTotal(data.total);
      setCensored(data.censored);
      setHasMore(data.operators.length === 20);
    } catch (err) {
      console.error('[DirectorySearch] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [initialLat, initialLng]);

  // Initial + debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchResults(query, 1, true);
    }, 350);
    return () => clearTimeout(t);
  }, [query, fetchResults]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchResults(query, nextPage);
      }
    }, { threshold: 0.1 });
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, page, query, fetchResults]);

  const handleRevealPII = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
    }
  };

  const handleLogin = () => {
    setShowLoginModal(false);
    if (onLoginRequest) {
      onLoginRequest();
    } else {
      window.location.href = '/login?redirect=/directory';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0d1a 100%)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: '16px',
    }}>
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
            fontSize: '18px', pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Pilot car, escort vehicle, permits..."
            style={{
              width: '100%', padding: '14px 14px 14px 46px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px', color: '#fff', fontSize: '15px',
              boxSizing: 'border-box', outline: 'none',
            }}
          />
        </div>
        {censored && !isAuthenticated && (
          <div style={{
            marginTop: '10px', padding: '10px 14px',
            background: 'rgba(255,140,0,0.08)',
            border: '1px solid rgba(255,140,0,0.25)',
            borderRadius: '10px', display: 'flex',
            alignItems: 'center', gap: '10px',
          }}>
            <span>🔒</span>
            <span style={{ color: '#ff8c00', fontSize: '13px', fontWeight: 500 }}>
              Contact info is hidden.{' '}
              <button
                onClick={() => setShowLoginModal(true)}
                style={{ color: '#ff8c00', fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Login to view all {total?.toLocaleString()} operators
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div style={{ color: '#666', fontSize: '13px', marginBottom: '14px' }}>
        {total > 0 && `${total.toLocaleString()} operators found`}
      </div>

      {/* Results */}
      {results.map(op => (
        <OperatorCard
          key={op.id}
          operator={op}
          censored={censored}
          onRevealPII={handleRevealPII}
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} style={{ height: '1px' }} />

      {loading && (
        <div style={{ textAlign: 'center', padding: '24px', color: '#555' }}>
          <div style={{
            width: '28px', height: '28px', border: '3px solid rgba(255,140,0,0.2)',
            borderTopColor: '#ff8c00', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto',
          }} />
        </div>
      )}

      {!hasMore && results.length > 0 && (
        <div style={{ textAlign: 'center', color: '#444', fontSize: '13px', padding: '24px 0' }}>
          ✓ All {total.toLocaleString()} operators loaded
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #555; }
        input:focus { border-color: rgba(255,140,0,0.5) !important; }
      `}</style>
    </div>
  );
}
