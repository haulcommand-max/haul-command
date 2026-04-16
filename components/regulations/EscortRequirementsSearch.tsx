'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';

export interface JurisdictionItem {
  jurisdiction_code: string;
  jurisdiction_name: string;
  country_code: string;
  country_name: string;
  jurisdiction_type: string;
  rule_count: number;
}

interface Props {
  items: JurisdictionItem[];
  /** emoji flag map */
  flags: Record<string, string>;
  /** full country name map */
  names: Record<string, string>;
  /** tier A country codes — shown as top markets */
  tierA: string[];
}

export function EscortRequirementsSearch({ items, flags, names, tierA }: Props) {
  const [query, setQuery] = useState('');
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  // Group by country
  const byCountry = useMemo(() => {
    const groups: Record<string, JurisdictionItem[]> = {};
    for (const j of items) {
      if (!groups[j.country_code]) groups[j.country_code] = [];
      groups[j.country_code].push(j);
    }
    return groups;
  }, [items]);

  const countryOrder = useMemo(() => {
    return Object.keys(byCountry).sort((a, b) => {
      const ai = tierA.indexOf(a), bi = tierA.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return (names[a] || a).localeCompare(names[b] || b);
    });
  }, [byCountry, tierA, names]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q && !activeCountry) return countryOrder;

    return countryOrder.filter(cc => {
      if (activeCountry && cc !== activeCountry) return false;
      if (!q) return true;
      // Match country name/code
      if ((names[cc] || cc).toLowerCase().includes(q)) return true;
      if (cc.toLowerCase().includes(q)) return true;
      // Match any jurisdiction in this country
      return byCountry[cc]?.some(j =>
        j.jurisdiction_name.toLowerCase().includes(q) ||
        j.jurisdiction_type.toLowerCase().includes(q)
      );
    });
  }, [query, activeCountry, countryOrder, names, byCountry]);

  const totalFiltered = filtered.reduce((s, cc) => s + (byCountry[cc]?.length || 0), 0);

  return (
    <div>
      {/* ── Search + country quick-filter ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        {/* Search input */}
        <div style={{
          flex: '1 1 260px',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: '0 14px', height: 44,
        }}>
          <Search style={{ width: 15, height: 15, color: '#64748b', flexShrink: 0 }} />
          <input
            id="escort-requirements-search"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search country, state, or province…"
            aria-label="Search escort requirements by country or jurisdiction"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 13, color: '#e2e8f0',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748b' }}
              aria-label="Clear search"
            >
              <X style={{ width: 13, height: 13 }} />
            </button>
          )}
        </div>

        {/* Country pills — top countries only */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveCountry(null)}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              background: !activeCountry ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${!activeCountry ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'}`,
              color: !activeCountry ? '#f9fafb' : '#64748b',
            }}
          >
            All
          </button>
          {tierA.filter(cc => byCountry[cc]).map(cc => (
            <button
              key={cc}
              onClick={() => setActiveCountry(activeCountry === cc ? null : cc)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                background: activeCountry === cc ? 'rgba(198,146,58,0.14)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeCountry === cc ? 'rgba(198,146,58,0.35)' : 'rgba(255,255,255,0.06)'}`,
                color: activeCountry === cc ? '#C6923A' : '#64748b',
              }}
            >
              {flags[cc] || cc} {cc}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      {(query || activeCountry) && (
        <p style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>
          Showing {totalFiltered} jurisdiction{totalFiltered !== 1 ? 's' : ''} in {filtered.length} countr{filtered.length !== 1 ? 'ies' : 'y'}
          {query ? ` matching "${query}"` : ''}
        </p>
      )}

      {/* Jurisdiction grid — grouped by country */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
          <p style={{ fontSize: 14 }}>No jurisdictions match your search.</p>
          <button
            onClick={() => { setQuery(''); setActiveCountry(null); }}
            style={{
              marginTop: 10, padding: '7px 18px', borderRadius: 10, fontSize: 12,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', cursor: 'pointer',
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {filtered.map(cc => (
            <section key={cc} aria-label={`${names[cc] || cc} escort requirements`}>
              {/* Country header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{flags[cc] || '🌍'}</span>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', margin: 0 }}>
                    {names[cc] || cc}
                  </h3>
                  <span style={{ fontSize: 10, color: '#475569', fontWeight: 700, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 10 }}>
                    {byCountry[cc].length} jurisdiction{byCountry[cc].length !== 1 ? 's' : ''}
                  </span>
                </div>
                <Link href={`/regulations/${cc.toLowerCase()}`} style={{ fontSize: 11, color: '#C6923A', fontWeight: 700, textDecoration: 'none' }}>
                  Full regulations →
                </Link>
              </div>

              {/* Jurisdiction cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                {byCountry[cc].map(j => (
                  <Link
                    key={j.jurisdiction_code}
                    href={`/escort-requirements/${j.jurisdiction_code.toLowerCase()}`}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      padding: '12px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                      textDecoration: 'none', transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
                      {j.jurisdiction_name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>
                        {j.jurisdiction_type}
                      </span>
                      <span style={{ fontSize: 10, color: '#C6923A', fontWeight: 700 }}>
                        {j.rule_count} rules
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
