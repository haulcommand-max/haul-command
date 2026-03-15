'use client';

import React, { useState } from 'react';
import { MobileAppNav } from '@/components/mobile/MobileAppNav';

/* ══════════════════════════════════════════════════════════════
   Mobile Load Board Map — Frame 5
   Fullscreen map with list toggle and load pins.
   390px, native app feel, dark map theme.
   ══════════════════════════════════════════════════════════════ */

const PinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--m-gold)" stroke="none">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
    <circle cx="12" cy="10" r="3" fill="#000"/>
  </svg>
);

const ListIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const MapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);

const MOCK_PINS = [
  { id: 'p1', lat: 29.76, lon: -95.37, city: 'Houston, TX', type: 'Oversize', rate: '$450', urgency: 'high' },
  { id: 'p2', lat: 32.78, lon: -96.80, city: 'Dallas, TX', type: 'Super Load', rate: '$680', urgency: 'normal' },
  { id: 'p3', lat: 30.27, lon: -97.74, city: 'Austin, TX', type: 'Route Survey', rate: '$320', urgency: 'low' },
  { id: 'p4', lat: 29.42, lon: -98.49, city: 'San Antonio, TX', type: 'Height Pole', rate: '$280', urgency: 'normal' },
  { id: 'p5', lat: 33.45, lon: -112.07, city: 'Phoenix, AZ', type: 'Oversize', rate: '$520', urgency: 'high' },
];

function MapPlaceholder() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: 'linear-gradient(rgba(212,168,68,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,68,0.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Mock pins */}
      {MOCK_PINS.map((pin, i) => (
        <div key={pin.id} style={{
          position: 'absolute',
          left: `${20 + (i * 15)}%`,
          top: `${25 + ((i * 37) % 50)}%`,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          animation: `m-pin-pulse ${1.5 + i * 0.2}s ease-in-out infinite`,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            background: pin.urgency === 'high'
              ? 'linear-gradient(135deg, #F1A91B, #D4A844)'
              : 'var(--m-surface-raised)',
            border: `2px solid ${pin.urgency === 'high' ? 'var(--m-gold)' : 'var(--m-border-subtle)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: pin.urgency === 'high' ? '0 0 12px rgba(241,169,27,0.3)' : 'none',
          }}>
            <span style={{ transform: 'rotate(45deg)', fontSize: 12, fontWeight: 900, color: pin.urgency === 'high' ? '#000' : 'var(--m-text-secondary)' }}>
              🚛
            </span>
          </div>
          <span style={{
            marginTop: 4, fontSize: 9, fontWeight: 700,
            color: 'var(--m-text-muted)', whiteSpace: 'nowrap',
            background: 'rgba(6,11,18,0.8)', padding: '1px 6px',
            borderRadius: 4,
          }}>
            {pin.rate}
          </span>
        </div>
      ))}

      <span style={{ fontSize: 14, color: 'var(--m-text-muted)', zIndex: 1 }}>
        Map loads here (HERE Maps / Mapbox)
      </span>
    </div>
  );
}

function LoadPeekCard({ pin }: { pin: typeof MOCK_PINS[0] }) {
  const urgencyColor = pin.urgency === 'high' ? '#EF4444' : pin.urgency === 'normal' ? 'var(--m-gold)' : '#22C55E';
  return (
    <div style={{
      background: 'var(--m-surface)',
      border: '1px solid var(--m-border-subtle)',
      borderRadius: 'var(--m-radius-lg)',
      padding: 'var(--m-md)',
      minWidth: 200, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--m-xs)' }}>
        <span style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 700, color: 'var(--m-text-primary)' }}>{pin.city}</span>
        <span style={{
          fontSize: 'var(--m-font-overline)', fontWeight: 800, color: urgencyColor,
          textTransform: 'uppercase',
        }}>{pin.urgency}</span>
      </div>
      <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)', marginBottom: 'var(--m-sm)' }}>{pin.type}</div>
      <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 900, color: 'var(--m-gold)' }}>{pin.rate}</div>
    </div>
  );
}

export default function MobileMapView() {
  const [showList, setShowList] = useState(false);

  return (
    <div style={{ position: 'relative', height: '100dvh', background: 'var(--m-bg)', overflow: 'hidden' }}>
      {/* Map */}
      <MapPlaceholder />

      {/* Top controls */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        paddingTop: 'calc(var(--m-safe-top, 0px) + var(--m-md))',
        padding: 'calc(var(--m-safe-top, 0px) + var(--m-md)) var(--m-screen-pad) var(--m-sm)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(180deg, rgba(6,11,18,0.9) 0%, transparent 100%)',
        zIndex: 10,
      }}>
        <h1 style={{
          fontSize: 'var(--m-font-h2)', fontWeight: 900,
          color: 'var(--m-text-primary)', margin: 0,
        }}>Load Map</h1>
        <button
          onClick={() => setShowList(!showList)}
          style={{
            background: 'var(--m-surface-raised)', border: '1px solid var(--m-border-subtle)',
            borderRadius: 'var(--m-radius-md)', padding: '8px 12px',
            color: 'var(--m-text-primary)', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 'var(--m-font-body-sm)', fontWeight: 700, cursor: 'pointer',
          }}
        >
          {showList ? <MapIcon /> : <ListIcon />}
          {showList ? 'Map' : 'List'}
        </button>
      </div>

      {/* Bottom peek cards */}
      {!showList && (
        <div style={{
          position: 'absolute', bottom: 'calc(var(--m-nav-height, 56px) + var(--m-safe-bottom, 0px) + var(--m-md))',
          left: 0, right: 0,
          display: 'flex', gap: 'var(--m-sm)',
          overflowX: 'auto', padding: '0 var(--m-screen-pad)',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          zIndex: 10,
        }}>
          {MOCK_PINS.map(pin => <LoadPeekCard key={pin.id} pin={pin} />)}
        </div>
      )}

      {/* List mode overlay */}
      {showList && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          paddingTop: 'calc(var(--m-safe-top, 0px) + 60px)',
          background: 'var(--m-bg)',
          overflowY: 'auto',
        }}>
          <div style={{ padding: 'var(--m-md) var(--m-screen-pad)' }}>
            {MOCK_PINS.map(pin => (
              <div key={pin.id} className="m-card" style={{ marginBottom: 'var(--m-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 700, color: 'var(--m-text-primary)' }}>{pin.city}</div>
                    <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)' }}>{pin.type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 900, color: 'var(--m-gold)' }}>{pin.rate}</div>
                    <div style={{
                      fontSize: 'var(--m-font-overline)', fontWeight: 700,
                      color: pin.urgency === 'high' ? '#EF4444' : pin.urgency === 'normal' ? 'var(--m-gold)' : '#22C55E',
                      textTransform: 'uppercase',
                    }}>{pin.urgency}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ height: 'var(--m-3xl)' }} />
        </div>
      )}

      <MobileAppNav />
    </div>
  );
}
