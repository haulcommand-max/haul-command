'use client';

import React, { useState, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   AdGrid Weather Banner — Dynamic I-80 Storm Takeover
   CLAUDE_UI_HANDOFF_TASKS.md §2
   Red notification banner for weather-triggered AdGrid ads
   ═══════════════════════════════════════════════════════════════════ */

interface WeatherAlert {
  id: string;
  type: 'snow' | 'ice' | 'wind' | 'flood' | 'fog';
  corridor: string;
  severity: 'warning' | 'severe' | 'extreme';
  message: string;
  sponsor?: {
    name: string;
    cta: string;
    url: string;
    phone?: string;
  };
}

interface AdGridWeatherBannerProps {
  alert: WeatherAlert | null;
  onDismiss?: () => void;
  onSponsorClick?: (alertId: string) => void;
}

const WEATHER_ICONS: Record<string, string> = {
  snow: '❄️', ice: '🧊', wind: '💨', flood: '🌊', fog: '🌫️',
};

const SEVERITY_COLORS: Record<string, string> = {
  warning: '#F59E0B',
  severe: '#EF4444',
  extreme: '#DC2626',
};

export function AdGridWeatherBanner({ alert, onDismiss, onSponsorClick }: AdGridWeatherBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [alert]);

  if (!alert) return null;

  const color = SEVERITY_COLORS[alert.severity] || '#EF4444';
  const icon = WEATHER_ICONS[alert.type] || '⚠️';

  return (
    <div
      className={`agwb ${visible ? 'agwb--visible' : ''}`}
      style={{ '--alert-color': color } as React.CSSProperties}
    >
      {/* Pulsing edge */}
      <div className="agwb-pulse" />

      <div className="agwb-main" onClick={() => setExpanded(!expanded)}>
        <div className="agwb-icon">{icon}</div>
        <div className="agwb-content">
          <div className="agwb-severity">{alert.severity.toUpperCase()} WEATHER</div>
          <div className="agwb-message">
            {alert.type === 'snow' && `Heavy Snow on ${alert.corridor}.`}
            {alert.type === 'ice' && `Black Ice Warning — ${alert.corridor}.`}
            {alert.type === 'wind' && `High Wind Advisory — ${alert.corridor}.`}
            {alert.type === 'flood' && `Flash Flood Warning — ${alert.corridor}.`}
            {alert.type === 'fog' && `Dense Fog Advisory — ${alert.corridor}.`}
            {' '}{alert.message}
          </div>
        </div>
        {onDismiss && (
          <button aria-label="Interactive Button" className="agwb-dismiss" onClick={(e) => { e.stopPropagation(); onDismiss(); }}>✕</button>
        )}
      </div>

      {/* Sponsor CTA */}
      {alert.sponsor && (
        <div className={`agwb-sponsor ${expanded ? 'agwb-sponsor--open' : ''}`}>
          <div className="agwb-sponsor-inner">
            <span className="agwb-sponsor-label">Sponsored</span>
            <p className="agwb-sponsor-text">
              {alert.sponsor.cta}
            </p>
            <div className="agwb-sponsor-actions">
              <button aria-label="Interactive Button"
                className="agwb-sponsor-btn"
                onClick={() => onSponsorClick?.(alert.id)}
              >
                {alert.sponsor.name} →
              </button>
              {alert.sponsor.phone && (
                <a href={`tel:${alert.sponsor.phone}`} className="agwb-sponsor-call">
                  📞 Call Now
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .agwb {
          position: relative;
          background: linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 100%);
          border: 1px solid rgba(239,68,68,0.3);
          border-left: 4px solid var(--alert-color);
          border-radius: 12px;
          overflow: hidden;
          opacity: 0;
          transform: translateY(-6px);
          transition: all 0.3s ease;
          margin-bottom: 12px;
        }
        .agwb--visible {
          opacity: 1;
          transform: translateY(0);
        }
        .agwb-pulse {
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: var(--alert-color);
          animation: agwb-glow 2s ease-in-out infinite;
        }
        @keyframes agwb-glow {
          0%, 100% { box-shadow: 0 0 8px var(--alert-color); opacity: 1; }
          50% { box-shadow: 0 0 20px var(--alert-color); opacity: 0.7; }
        }
        .agwb-main {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          cursor: pointer;
        }
        .agwb-icon {
          font-size: 24px;
          flex-shrink: 0;
          animation: agwb-shake 3s ease infinite;
        }
        @keyframes agwb-shake {
          0%, 90%, 100% { transform: rotate(0); }
          92% { transform: rotate(-8deg); }
          94% { transform: rotate(8deg); }
          96% { transform: rotate(-6deg); }
          98% { transform: rotate(4deg); }
        }
        .agwb-content { flex: 1; min-width: 0; }
        .agwb-severity {
          font-size: 10px;
          font-weight: 800;
          color: var(--alert-color);
          letter-spacing: 0.08em;
          margin-bottom: 2px;
        }
        .agwb-message {
          font-size: 14px;
          font-weight: 600;
          color: #F0F0F0;
          line-height: 1.4;
        }
        .agwb-dismiss {
          width: 28px;
          height: 28px;
          border: none;
          background: rgba(255,255,255,0.06);
          border-radius: 6px;
          color: #888;
          font-size: 12px;
          cursor: pointer;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .agwb-sponsor {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }
        .agwb-sponsor--open { max-height: 200px; }
        .agwb-sponsor-inner {
          padding: 0 16px 14px;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 12px;
        }
        .agwb-sponsor-label {
          font-size: 9px;
          font-weight: 700;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .agwb-sponsor-text {
          margin: 6px 0 10px;
          font-size: 13px;
          color: #ccc;
          line-height: 1.4;
        }
        .agwb-sponsor-actions {
          display: flex;
          gap: 10px;
        }
        .agwb-sponsor-btn {
          padding: 8px 16px;
          background: var(--alert-color);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .agwb-sponsor-btn:hover { filter: brightness(1.1); }
        .agwb-sponsor-call {
          padding: 8px 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          color: #ccc;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
