'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MobileGate } from '@/components/mobile/MobileGate';
import { track } from '@/lib/telemetry';

const CATEGORIES = [
  { key: 'truck_stop', label: 'Truck Stops', icon: 'TS', color: '#F59E0B', desc: 'Fuel, parking, scales, showers, and repair signals' },
  { key: 'rest_area', label: 'Rest Areas', icon: 'RA', color: '#3B82F6', desc: 'Restrooms, lighting, safety, and pull-off notes' },
  { key: 'weigh_station', label: 'Weigh Stations', icon: 'WS', color: '#22C55E', desc: 'Scale and compliance checkpoint context' },
  { key: 'truck_parking', label: 'Parking & Staging', icon: 'PK', color: '#8B5CF6', desc: 'Truck parking, staging yards, and drop yards' },
  { key: 'port', label: 'Ports', icon: 'PT', color: '#14B8A6', desc: 'Port and cargo gateway access points' },
  { key: 'rail_intermodal', label: 'Rail Intermodal', icon: 'RI', color: '#EC4899', desc: 'Rail and intermodal transfer facilities' },
  { key: 'border_crossing', label: 'Border Crossings', icon: 'BC', color: '#EF4444', desc: 'Customs and cross-border support points' },
  { key: 'tunnel', label: 'Tunnels', icon: 'TN', color: '#6366F1', desc: 'Tunnel assets and authority-controlled restrictions' },
  { key: 'truck_repair', label: 'Repair Support', icon: 'RS', color: '#F97316', desc: 'Repair, tires, towing, and service support' },
];

interface InfraLocation {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  country_code?: string;
  services: string[];
  oversize_friendly: boolean;
  readiness_state?: string;
  steward_claim_route?: string;
  hazard_notes?: string | null;
  oversized_access_notes?: string | null;
}

export default function InfrastructureIndexPage() {
  const [locations, setLocations] = useState<InfraLocation[]>([]);
  const [categorySummary, setCategorySummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    params.set('limit', '30');
    setLoading(true);

    fetch(`/api/infrastructure?${params}`)
      .then((response) => response.ok ? response.json() : { locations: [], category_summary: {} })
      .then((data) => {
        setLocations(data.locations || []);
        setCategorySummary(data.category_summary || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedCategory]);

  useEffect(() => {
    track('infrastructure_page_seen' as any, { metadata: { category: selectedCategory || 'all' } });
  }, [selectedCategory]);

  const totalLocations = Object.values(categorySummary).reduce((sum, count) => sum + count, 0);

  const content = (
    <div style={{ minHeight: '100vh', background: '#060b12', color: '#f5f7fb' }}>
      <div style={{ padding: '48px 16px 24px', maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, marginBottom: 16, background: 'rgba(241,169,27,0.08)', border: '1px solid rgba(241,169,27,0.15)' }}>
          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', color: '#F1A91B', textTransform: 'uppercase' }}>
            Route-Support Infrastructure
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 12px' }}>
          Heavy Haul Infrastructure Network
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.58)', maxWidth: 720, lineHeight: 1.6, margin: 0 }}>
          Find truck stops, rest areas, weigh stations, parking, ports, rail intermodal terminals, border crossings, tunnels, and repair support from the directory infrastructure graph.
        </p>
        {totalLocations > 0 && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.34)' }}>
            {totalLocations} route-support records in this view
          </div>
        )}
      </div>

      <div style={{ padding: '0 16px 24px', maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {CATEGORIES.map((cat) => {
            const count = categorySummary[cat.key] || 0;
            const isActive = selectedCategory === cat.key;
            return (
              <button
                aria-label={`Filter ${cat.label}`}
                key={cat.key}
                onClick={() => setSelectedCategory(isActive ? null : cat.key)}
                style={{ padding: '14px 12px', borderRadius: 12, textAlign: 'left', background: isActive ? `${cat.color}12` : 'rgba(255,255,255,0.02)', border: `1px solid ${isActive ? `${cat.color}40` : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', transition: 'all 0.15s ease' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `${cat.color}14`, color: cat.color, fontSize: 10, fontWeight: 900 }}>{cat.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: isActive ? cat.color : '#fff' }}>{cat.label}</span>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.4 }}>{cat.desc}</div>
                {count > 0 && (
                  <div style={{ fontSize: 9, color: cat.color, fontWeight: 800, marginTop: 8 }}>
                    {count} shown
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 16px 80px', maxWidth: 980, margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map((item) => (
              <div key={item} style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', height: 80 }} />
            ))}
          </div>
        ) : locations.length === 0 ? (
          <div style={{ padding: '40px 20px', borderRadius: 18, textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>
              {selectedCategory ? `No ${CATEGORIES.find((category) => category.key === selectedCategory)?.label || 'locations'} yet` : 'Infrastructure data loading'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', maxWidth: 460, margin: '0 auto', lineHeight: 1.5 }}>
              Know a route-support asset that should be listed? Submit it for steward review instead of creating a duplicate directory.
            </div>
            <Link href="/partner/apply" style={{ display: 'inline-flex', marginTop: 16, padding: '10px 20px', borderRadius: 12, background: 'rgba(241,169,27,0.1)', border: '1px solid rgba(241,169,27,0.2)', color: '#F1A91B', fontWeight: 800, fontSize: 12, textDecoration: 'none' }}>
              Suggest a Location
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {locations.map((loc) => {
              const cat = CATEGORIES.find((category) => category.key === loc.category);
              const claimHref = loc.steward_claim_route || `/claim?entity=${loc.id}&intent=steward-condition-update`;
              return (
                <div key={loc.id} style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${cat?.color || '#888'}08`, border: `1px solid ${cat?.color || '#888'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: cat?.color || '#888', flexShrink: 0 }}>
                    {cat?.icon || 'IN'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {loc.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                      {[loc.city, loc.state, loc.country_code].filter(Boolean).join(', ')}
                    </div>
                    {loc.services.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                        {loc.services.slice(0, 4).map((service) => (
                          <span key={service} style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', color: '#9aa7b7' }}>{service}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {loc.oversize_friendly && (
                    <span style={{ fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', color: '#22C55E', whiteSpace: 'nowrap' }}>OS notes</span>
                  )}
                  <Link href={claimHref} style={{ fontSize: 10, fontWeight: 900, color: '#F1A91B', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Steward
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 24, padding: '20px', borderRadius: 16, textAlign: 'center', background: 'rgba(241,169,27,0.04)', border: '1px solid rgba(241,169,27,0.12)' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
            Own or maintain a support location?
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.48)', marginBottom: 12, lineHeight: 1.5 }}>
            Claim a public asset as an owner, operator, agency staffer, contractor, or maintenance steward. Verified claims require evidence and review.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/partner/apply" style={{ padding: '10px 20px', borderRadius: 10, background: '#F1A91B', color: '#000', fontWeight: 900, fontSize: 12, textDecoration: 'none' }}>
              Become a Partner
            </Link>
            <Link href="/claim" style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 800, fontSize: 12, textDecoration: 'none' }}>
              Claim Location
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return <MobileGate mobile={content} desktop={content} />;
}
