'use client';

import React, { useState } from 'react';
import { MobileAppNav } from '@/components/mobile/MobileAppNav';

/* ══════════════════════════════════════════════════════════════
   Mobile Route Calculator — Frame 10
   Escort requirement estimation tool.
   Origin/destination inputs → requirements + rate estimate
   ══════════════════════════════════════════════════════════════ */

const CalcIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--m-gold)"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <line x1="8" y1="6" x2="16" y2="6"/>
    <line x1="8" y1="10" x2="10" y2="10"/>
    <line x1="14" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="14" x2="10" y2="14"/>
    <line x1="14" y1="14" x2="16" y2="14"/>
    <line x1="8" y1="18" x2="16" y2="18"/>
  </svg>
);

interface CalcResult {
  escortCount: number;
  estimatedRate: string;
  permit: string;
  duration: string;
  requirements: string[];
}

function getEstimate(loadType: string, width: number, height: number): CalcResult {
  const isWide = width > 12;
  const isTall = height > 14;
  const isSuper = width > 16 || height > 16;

  let escortCount = 1;
  if (isWide) escortCount = 2;
  if (isSuper) escortCount = 3;

  const requirements: string[] = [];
  if (isWide) requirements.push('Wide load signage');
  if (isTall) requirements.push('Height pole required');
  if (isSuper) requirements.push('Police escort may be required');
  if (width > 14) requirements.push('Route survey recommended');
  requirements.push('Valid pilot car certification');
  requirements.push('Liability insurance ($1M minimum)');

  const baseRate = 450;
  const sizeMultiplier = 1 + (Math.max(width - 8.5, 0) * 0.1) + (Math.max(height - 13.5, 0) * 0.15);
  const rate = Math.round(baseRate * sizeMultiplier * escortCount);

  return {
    escortCount,
    estimatedRate: `$${rate.toLocaleString()}`,
    permit: isSuper ? 'Super Load Permit' : isWide ? 'Oversize Load Permit' : 'Standard Permit',
    duration: isSuper ? '2-3 days' : '1-2 days',
    requirements,
  };
}

export default function MobileRouteCalculator() {
  const [loadType, setLoadType] = useState('oversize');
  const [width, setWidth] = useState(12);
  const [height, setHeight] = useState(14);
  const [result, setResult] = useState<CalcResult | null>(null);

  const handleCalculate = () => {
    setResult(getEstimate(loadType, width, height));
  };

  return (
    <div className="m-shell-content" style={{ background: 'var(--m-bg)', minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--m-safe-top) var(--m-screen-pad) 0',
        paddingTop: 'calc(var(--m-safe-top) + var(--m-md))',
        display: 'flex', alignItems: 'center', gap: 'var(--m-md)',
      }}>
        <CalcIcon />
        <h1 style={{
          fontSize: 'var(--m-font-h1)', fontWeight: 900,
          color: 'var(--m-text-primary)', margin: 0,
        }}>Route Calculator</h1>
      </div>

      {/* Form */}
      <div style={{ padding: 'var(--m-lg) var(--m-screen-pad)' }}>
        {/* Load Type */}
        <label style={{
          fontSize: 'var(--m-font-body-sm)', fontWeight: 700,
          color: 'var(--m-text-secondary)', display: 'block', marginBottom: 'var(--m-xs)',
        }}>Load Type</label>
        <div style={{ display: 'flex', gap: 'var(--m-xs)', marginBottom: 'var(--m-lg)' }}>
          {['oversize', 'super_load', 'standard'].map(t => (
            <button key={t}
              onClick={() => setLoadType(t)}
              className={`m-chip ${loadType === t ? 'm-chip--gold' : 'm-chip--tag'}`}
              style={{ cursor: 'pointer', border: 'none', textTransform: 'capitalize' }}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Width slider */}
        <label style={{
          fontSize: 'var(--m-font-body-sm)', fontWeight: 700,
          color: 'var(--m-text-secondary)', display: 'block', marginBottom: 'var(--m-xs)',
        }}>Width: {width} ft</label>
        <input type="range" min={8} max={24} step={0.5} value={width}
          onChange={e => setWidth(Number(e.target.value))}
          style={{
            width: '100%', marginBottom: 'var(--m-lg)',
            accentColor: 'var(--m-gold)',
          }}
        />

        {/* Height slider */}
        <label style={{
          fontSize: 'var(--m-font-body-sm)', fontWeight: 700,
          color: 'var(--m-text-secondary)', display: 'block', marginBottom: 'var(--m-xs)',
        }}>Height: {height} ft</label>
        <input type="range" min={10} max={20} step={0.5} value={height}
          onChange={e => setHeight(Number(e.target.value))}
          style={{
            width: '100%', marginBottom: 'var(--m-lg)',
            accentColor: 'var(--m-gold)',
          }}
        />

        {/* Calculate button */}
        <button
          className="m-btn m-btn--primary"
          onClick={handleCalculate}
          style={{ width: '100%', height: 52, fontSize: 'var(--m-font-body)', fontWeight: 900 }}
        >
          Calculate Requirements
        </button>
      </div>

      {/* Results */}
      {result && (
        <div style={{ padding: '0 var(--m-screen-pad)' }} className="m-animate-slide-up">
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--m-sm)', marginBottom: 'var(--m-lg)' }}>
            <div className="m-card" style={{ textAlign: 'center', padding: 'var(--m-md)' }}>
              <div style={{ fontSize: 'var(--m-font-h1)', fontWeight: 900, color: 'var(--m-gold)' }}>
                {result.escortCount}
              </div>
              <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)', fontWeight: 600 }}>
                Escorts Required
              </div>
            </div>
            <div className="m-card" style={{ textAlign: 'center', padding: 'var(--m-md)' }}>
              <div style={{ fontSize: 'var(--m-font-h1)', fontWeight: 900, color: '#22C55E' }}>
                {result.estimatedRate}
              </div>
              <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)', fontWeight: 600 }}>
                Est. Rate
              </div>
            </div>
          </div>

          {/* Permit + Duration */}
          <div className="m-card" style={{ marginBottom: 'var(--m-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--m-sm)' }}>
              <div>
                <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)', fontWeight: 600 }}>Permit Type</div>
                <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 700, color: 'var(--m-text-primary)' }}>{result.permit}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)', fontWeight: 600 }}>Duration</div>
                <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 700, color: 'var(--m-text-primary)' }}>{result.duration}</div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <h3 style={{
            fontSize: 'var(--m-font-h3)', fontWeight: 800,
            color: 'var(--m-text-primary)', marginBottom: 'var(--m-sm)',
          }}>Requirements</h3>
          <div className="m-card">
            {result.requirements.map((req, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--m-sm)',
                padding: 'var(--m-sm) 0',
                borderBottom: i < result.requirements.length - 1 ? '1px solid var(--m-border-subtle)' : 'none',
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 'var(--m-radius-full)',
                  background: 'rgba(34,197,94,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, flexShrink: 0,
                }}>✓</span>
                <span style={{
                  fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-secondary)',
                }}>{req}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 'var(--m-3xl)' }} />
      <MobileAppNav />
    </div>
  );
}
