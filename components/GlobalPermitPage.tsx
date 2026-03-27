import React from 'react';
import Link from 'next/link';

interface CountryPermitData {
  countryCode: string;
  name: string;
  region: string;
  requiresEscort: boolean;
  maxWeightTons: number;
  maxWidthMeters: number;
  permitLink?: string;
}

export default function GlobalPermitPage({ countries }: { countries: CountryPermitData[] }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff', padding: '60px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(0,212,255,0.12)', color: '#00d4ff', fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
            Global Operations
          </span>
          <h1 style={{ fontSize: 48, fontWeight: 800, margin: '0 0 16px' }}>57-Country <span style={{ background: 'linear-gradient(90deg, #00ff88, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Permit Database</span></h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 600, margin: '0 auto' }}>
            Instant access to oversize/overweight permit regulations, escort requirements, and direct filing portals for 120 countries.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {countries.map((country) => (
            <div key={country.countryCode} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, transition: 'transform 0.2s', cursor: 'pointer' }} className="hover:scale-105 hover:bg-white/5">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{country.name}</h3>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{country.region}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Escort Required</span>
                  <span style={{ color: country.requiresEscort ? '#ffc800' : '#00ff88', fontWeight: 600, fontSize: 14 }}>
                    {country.requiresEscort ? 'Yes' : 'No'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Max Weight (Tons)</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{country.maxWeightTons}t</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Max Width (Meters)</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{country.maxWidthMeters}m</span>
                </div>
              </div>

              {country.permitLink ? (
                <Link href={country.permitLink} style={{ display: 'block', width: '100%', padding: '12px 0', textAlign: 'center', background: 'rgba(0,255,136,0.1)', color: '#00ff88', textDecoration: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
                  Start Filing Process
                </Link>
              ) : (
                <div style={{ width: '100%', padding: '12px 0', textAlign: 'center', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
                  Connect Agent
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
