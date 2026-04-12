"use client";

import Link from 'next/link';

type CatalogItem = {
  slug: string;
  title: string;
  summary: string;
  training_type: string;
  credential_level: string;
  module_count: number;
  hours_total: number;
  pricing_mode: string;
  requirement_fit: string;
  ranking_impact: string;
  sponsor_eligible: boolean;
};

type TierDisplay = {
  name: string;
  badge: string;
  color: string;
  glow: string;
};

export function TrainingCatalogGrid({
  catalog,
  tierDisplay,
}: {
  catalog: CatalogItem[];
  tierDisplay: Record<string, TierDisplay>;
}) {
  if (!catalog || catalog.length === 0) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', padding: '40px 0' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em', color: '#fff' }}>
          Training Programs
        </h2>
        <p style={{ color: '#6a6a7a', fontSize: 15 }}>
          Programs loading... Check back shortly.
        </p>
      </div>
    );
  }

  // Sort: required first, then by hours descending
  const sorted = [...catalog].sort((a, b) => {
    const fitOrder: Record<string, number> = { required: 0, useful: 1, optional: 2 };
    const aFit = fitOrder[a.requirement_fit] ?? 3;
    const bFit = fitOrder[b.requirement_fit] ?? 3;
    if (aFit !== bFit) return aFit - bFit;
    return (b.hours_total || 0) - (a.hours_total || 0);
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em', color: '#fff', textAlign: 'center' }}>
        {catalog.length} Training Programs
      </h2>
      <p style={{ color: '#6a6a7a', marginBottom: 40, fontSize: 15, textAlign: 'center' }}>
        Every program is backed by real regulatory standards. Your progress and badges sync to your operator profile.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {sorted.map((item) => {
          const tier = tierDisplay[item.credential_level as keyof typeof tierDisplay] || tierDisplay.certified;
          const isFree = item.pricing_mode === 'free';
          const isFreemium = item.pricing_mode === 'freemium';
          const isRequired = item.requirement_fit === 'required';

          return (
            <Link
              key={item.slug}
              href={`/training/${item.slug}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                style={{
                  background: '#111118',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  height: '100%',
                  transition: 'border-color 0.2s, transform 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = tier.color + '50';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.transform = '';
                }}
              >
                {/* Header badges */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{
                    background: `${tier.color}15`, color: tier.color,
                    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>
                    {tier.name}
                  </span>
                  {item.training_type === 'certification' && (
                    <span style={{
                      background: 'rgba(37,99,235,0.12)', color: '#3b82f6',
                      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                    }}>
                      CERTIFICATION
                    </span>
                  )}
                  {isFree && (
                    <span style={{
                      background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      letterSpacing: '0.06em',
                    }}>FREE</span>
                  )}
                  {isFreemium && (
                    <span style={{
                      background: 'rgba(34,197,94,0.08)', color: '#22c55e',
                      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      letterSpacing: '0.04em',
                    }}>FREEMIUM</span>
                  )}
                  {isRequired && (
                    <span style={{
                      background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      letterSpacing: '0.04em',
                    }}>REQUIRED</span>
                  )}
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.3, margin: 0 }}>
                  {item.title}
                </h3>

                {/* Summary */}
                <p style={{ fontSize: 13, color: '#7a7a8a', lineHeight: 1.5, margin: 0, flex: 1 }}>
                  {item.summary?.slice(0, 160)}{(item.summary?.length || 0) > 160 ? '…' : ''}
                </p>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6a6a7a', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12 }}>
                  <span>📚 {item.module_count} modules</span>
                  <span>⏱ {item.hours_total}h</span>
                  {item.sponsor_eligible && <span>💼 Sponsor eligible</span>}
                </div>

                {/* Ranking impact */}
                {item.ranking_impact && (
                  <div style={{ fontSize: 11, color: tier.color, fontWeight: 600, lineHeight: 1.4 }}>
                    ↗ {item.ranking_impact.slice(0, 80)}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
