'use client';

import React, { useState, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   AdGrid Geofence Trigger — Weigh Station Proximity Ads
   CLAUDE_UI_HANDOFF_TASKS.md §3
   Push notification 2mi from scale house with repair shop CTA
   ═══════════════════════════════════════════════════════════════════ */

interface GeofenceAd {
  id: string;
  station_name: string;
  distance_miles: number;
  sponsor: {
    name: string;
    service: string;
    rating: number;
    phone: string;
    distance_text: string;
    promo?: string;
  };
}

interface AdGridGeofenceTriggerProps {
  ad: GeofenceAd | null;
  onDismiss?: () => void;
  onClick?: (adId: string) => void;
  onCall?: (phone: string) => void;
}

export function AdGridGeofenceTrigger({ ad, onDismiss, onClick, onCall }: AdGridGeofenceTriggerProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (ad && !dismissed) {
      const t = setTimeout(() => setVisible(true), 200);
      return () => clearTimeout(t);
    }
  }, [ad, dismissed]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setDismissed(true);
      onDismiss?.();
    }, 300);
  }, [onDismiss]);

  if (!ad || dismissed) return null;

  return (
    <div className={`aggt ${visible ? 'aggt--visible' : ''}`}>
      {/* Proximity indicator */}
      <div className="aggt-proximity">
        <div className="aggt-proximity__ring" />
        <div className="aggt-proximity__ring aggt-proximity__ring--2" />
        <div className="aggt-proximity__dot" />
      </div>

      <div className="aggt-main">
        {/* Header */}
        <div className="aggt-header">
          <span className="aggt-beacon">⚖️</span>
          <div className="aggt-header-text">
            <div className="aggt-alert">WEIGH STATION AHEAD</div>
            <div className="aggt-station">{ad.station_name} — {ad.distance_miles.toFixed(1)} mi</div>
          </div>
          <button aria-label="Interactive Button" className="aggt-close" onClick={handleDismiss}>✕</button>
        </div>

        {/* Sponsor */}
        <div className="aggt-sponsor" onClick={() => onClick?.(ad.id)}>
          <div className="aggt-sponsor-badge">📍 Nearby</div>
          <div className="aggt-sponsor-info">
            <h4 className="aggt-sponsor-name">{ad.sponsor.name}</h4>
            <p className="aggt-sponsor-service">{ad.sponsor.service}</p>
            <div className="aggt-sponsor-meta">
              <span className="aggt-sponsor-rating">
                {'★'.repeat(Math.round(ad.sponsor.rating))} {ad.sponsor.rating.toFixed(1)}
              </span>
              <span className="aggt-sponsor-dist">{ad.sponsor.distance_text}</span>
            </div>
          </div>
          {ad.sponsor.promo && <div className="aggt-promo">{ad.sponsor.promo}</div>}
          <div className="aggt-actions">
            <button aria-label="Interactive Button"
              className="aggt-call"
              onClick={(e) => { e.stopPropagation(); onCall?.(ad.sponsor.phone); }}
            >
              📞 Call
            </button>
            <button aria-label="Interactive Button" className="aggt-navigate">🗺️ Navigate</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .aggt {
          position: fixed;
          bottom: calc(env(safe-area-inset-bottom, 34px) + 76px);
          left: 16px;
          right: 16px;
          z-index: 80;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1);
          pointer-events: none;
        }
        .aggt--visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .aggt-proximity {
          position: absolute;
          top: -8px;
          left: 20px;
          width: 24px;
          height: 24px;
        }
        .aggt-proximity__ring {
          position: absolute;
          inset: 0;
          border: 2px solid rgba(245,158,11,0.3);
          border-radius: 50%;
          animation: aggt-ping 2s ease infinite;
        }
        .aggt-proximity__ring--2 { animation-delay: 1s; }
        @keyframes aggt-ping {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .aggt-proximity__dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: #F59E0B;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(245,158,11,0.5);
        }
        .aggt-main {
          background: linear-gradient(135deg, #0E1019 0%, #111520 100%);
          border: 1px solid rgba(245,158,11,0.3);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(245,158,11,0.08);
        }
        .aggt-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(245,158,11,0.06);
          border-bottom: 1px solid rgba(245,158,11,0.1);
        }
        .aggt-beacon { font-size: 20px; }
        .aggt-header-text { flex: 1; }
        .aggt-alert {
          font-size: 10px;
          font-weight: 800;
          color: #F59E0B;
          letter-spacing: 0.06em;
        }
        .aggt-station {
          font-size: 13px;
          font-weight: 600;
          color: #F0F0F0;
        }
        .aggt-close {
          width: 28px;
          height: 28px;
          border: none;
          background: rgba(255,255,255,0.06);
          border-radius: 6px;
          color: #888;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .aggt-sponsor {
          padding: 14px;
          cursor: pointer;
        }
        .aggt-sponsor-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 700;
          color: #C6923A;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          padding: 2px 8px;
          background: rgba(198,146,58,0.08);
          border-radius: 4px;
        }
        .aggt-sponsor-info { margin-bottom: 10px; }
        .aggt-sponsor-name {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #F0F0F0;
        }
        .aggt-sponsor-service {
          margin: 2px 0 6px;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
        }
        .aggt-sponsor-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
        }
        .aggt-sponsor-rating { color: #C6923A; }
        .aggt-sponsor-dist { color: #555; }
        .aggt-promo {
          padding: 8px 12px;
          margin-bottom: 10px;
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.15);
          border-radius: 8px;
          font-size: 12px;
          color: #22C55E;
          font-weight: 600;
        }
        .aggt-actions {
          display: flex;
          gap: 10px;
        }
        .aggt-call, .aggt-navigate {
          flex: 1;
          height: 40px;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.15s;
        }
        .aggt-call {
          background: linear-gradient(135deg, #22C55E, #16A34A);
          color: #fff;
        }
        .aggt-navigate {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: #ccc;
        }
        .aggt-call:active, .aggt-navigate:active { transform: scale(0.97); }
      `}</style>
    </div>
  );
}
