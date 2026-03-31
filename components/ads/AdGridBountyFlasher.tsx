'use client';

import React, { useState, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════════
   AdGrid Bounty Flasher — Urgent Load "Flash Red"
   CLAUDE_UI_HANDOFF_TASKS.md §8
   Broker pays $100 to make load flash red on top of Load Board
   ═══════════════════════════════════════════════════════════════ */

interface BountyLoad {
  id: string;
  origin: string;
  destination: string;
  payout_cents: number;
  deadline_hours: number;
  weight_lbs?: number;
  escort_count: number;
  broker_name: string;
  broker_verified: boolean;
  boost_tier: 'flash' | 'priority' | 'standard';
}

interface Props {
  load: BountyLoad;
  onAccept?: (id: string) => void;
  onDetails?: (id: string) => void;
}

export function AdGridBountyFlasher({ load, onAccept, onDetails }: Props) {
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    if (load.boost_tier === 'flash') {
      const i = setInterval(() => setPulse(p => !p), 800);
      return () => clearInterval(i);
    }
  }, [load.boost_tier]);

  const isFlash = load.boost_tier === 'flash';
  const payout = (load.payout_cents / 100).toLocaleString();

  return (
    <div className={`agbf ${isFlash ? 'agbf--flash' : ''} ${pulse && isFlash ? 'agbf--pulse' : ''}`}>
      {isFlash && <div className="agbf-flash-bar" />}
      <div className="agbf-row">
        <div className="agbf-urgency">
          <span className="agbf-bolt">⚡</span>
          <span className="agbf-time">{load.deadline_hours}hr</span>
        </div>
        <div className="agbf-route">
          <div className="agbf-from">{load.origin}</div>
          <span className="agbf-arrow">→</span>
          <div className="agbf-to">{load.destination}</div>
        </div>
        <div className="agbf-pay">
          <div className="agbf-pay-val">${payout}</div>
          <div className="agbf-escorts">{load.escort_count} escort{load.escort_count > 1 ? 's' : ''}</div>
        </div>
      </div>
      <div className="agbf-footer">
        <div className="agbf-broker">
          {load.broker_name} {load.broker_verified && <span className="agbf-v">✓</span>}
          {isFlash && <span className="agbf-boost">BOUNTY BOOST</span>}
        </div>
        <div className="agbf-actions">
          <button aria-label="Interactive Button" className="agbf-details" onClick={() => onDetails?.(load.id)}>Details</button>
          <button aria-label="Interactive Button" className="agbf-accept" onClick={() => onAccept?.(load.id)}>Accept Load</button>
        </div>
      </div>

      <style jsx>{`
        .agbf {
          background: rgba(255,255,255,0.03);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 14px;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        .agbf--flash {
          border-color: rgba(239,68,68,0.5);
          background: linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02));
          box-shadow: 0 0 20px rgba(239,68,68,0.1);
        }
        .agbf--pulse { box-shadow: 0 0 30px rgba(239,68,68,0.2); }
        .agbf-flash-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #EF4444, #F59E0B, #EF4444);
          background-size: 200% 100%;
          animation: agbf-slide 1.5s linear infinite;
        }
        @keyframes agbf-slide { to { background-position: -200% 0; } }
        .agbf-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .agbf-urgency {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }
        .agbf-bolt { font-size: 18px; }
        .agbf-time {
          font-size: 12px;
          font-weight: 800;
          color: #EF4444;
        }
        .agbf-route {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .agbf-from, .agbf-to {
          font-size: 14px;
          font-weight: 700;
          color: #F0F0F0;
        }
        .agbf-arrow { color: #555; }
        .agbf-pay { text-align: right; flex-shrink: 0; }
        .agbf-pay-val { font-size: 20px; font-weight: 900; color: #22C55E; }
        .agbf-escorts { font-size: 10px; color: #888; }
        .agbf-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .agbf-broker { font-size: 11px; color: #888; display: flex; align-items: center; gap: 6px; }
        .agbf-v { color: #22C55E; font-weight: 800; }
        .agbf-boost {
          font-size: 8px;
          font-weight: 800;
          color: #EF4444;
          padding: 2px 6px;
          background: rgba(239,68,68,0.1);
          border-radius: 4px;
          letter-spacing: 0.05em;
          animation: blink 1.5s infinite;
        }
        @keyframes blink { 50% { opacity: 0.5; } }
        .agbf-actions { display: flex; gap: 8px; }
        .agbf-details {
          padding: 6px 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 8px;
          color: #ccc;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .agbf-accept {
          padding: 6px 14px;
          background: linear-gradient(135deg, #22C55E, #16A34A);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .agbf-accept:hover { box-shadow: 0 4px 12px rgba(34,197,94,0.3); }
      `}</style>
    </div>
  );
}
