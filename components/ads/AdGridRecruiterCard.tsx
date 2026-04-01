'use client';

import React from 'react';

/* ═══════════════════════════════════════════════════════════════
   AdGrid Recruiter Card — Mega-Carrier Job Board
   CLAUDE_UI_HANDOFF_TASKS.md §7
   ═══════════════════════════════════════════════════════════════ */

interface RecruiterOffer {
  id: string;
  carrier_name: string;
  carrier_logo?: string;
  pitch: string;
  pay_range: string;
  region: string;
  requirements: string[];
  perks: string[];
  trust_score_min: number;
  apply_url: string;
  urgent: boolean;
}

interface Props {
  offer: RecruiterOffer;
  operatorTrustScore: number;
  onApply?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export function AdGridRecruiterCard({ offer, operatorTrustScore, onApply, onDismiss }: Props) {
  if (operatorTrustScore < offer.trust_score_min) return null;

  return (
    <div className={`agrc ${offer.urgent ? 'agrc--urgent' : ''}`}>
      <div className="agrc-top">
        <span className="agrc-badge">🎯 Recruiting</span>
        {offer.urgent && <span className="agrc-urgent-tag">URGENT</span>}
        {onDismiss && <button className="agrc-x" onClick={() => onDismiss(offer.id)}>✕</button>}
      </div>
      <div className="agrc-carrier">
        <div className="agrc-logo">
          {offer.carrier_logo ? <img src={offer.carrier_logo} alt="" /> : <span>{offer.carrier_name[0]}</span>}
        </div>
        <div className="agrc-info">
          <h4>{offer.carrier_name}</h4>
          <span className="agrc-region">{offer.region}</span>
        </div>
        <div className="agrc-pay">
          <div className="agrc-pay-lbl">Pay Range</div>
          <div className="agrc-pay-val">{offer.pay_range}</div>
        </div>
      </div>
      <p className="agrc-pitch">{offer.pitch}</p>
      {offer.requirements.length > 0 && (
        <div className="agrc-reqs">{offer.requirements.map((r, i) => <div key={i} className="agrc-req"><span className="agrc-chk">✓</span> {r}</div>)}</div>
      )}
      {offer.perks.length > 0 && (
        <div className="agrc-perks">{offer.perks.map((p, i) => <span key={i} className="agrc-perk">{p}</span>)}</div>
      )}
      <div className="agrc-trust">
        <div className="agrc-ts"><span className="agrc-tsv">{operatorTrustScore}%</span><span className="agrc-tsl">Trust</span></div>
        <div className="agrc-tt">You qualify — score above {offer.trust_score_min}%</div>
      </div>
      <button className="agrc-apply" onClick={() => onApply?.(offer.id)}>Apply Now →</button>

      <style jsx>{`
        .agrc { background: linear-gradient(180deg,#0E1019,#080A10); border:1px solid rgba(66,153,225,0.2); border-radius:16px; padding:16px; }
        .agrc--urgent { border-color:rgba(245,158,11,0.3); }
        .agrc-top { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
        .agrc-badge { font-size:10px; font-weight:700; color:#4299E1; text-transform:uppercase; padding:3px 8px; background:rgba(66,153,225,0.1); border-radius:6px; }
        .agrc-urgent-tag { font-size:9px; font-weight:800; color:#EF4444; padding:3px 8px; background:rgba(239,68,68,0.1); border-radius:6px; animation:blink 1.5s infinite; }
        @keyframes blink { 50% { opacity:0.5; } }
        .agrc-x { margin-left:auto; width:24px; height:24px; border:none; background:rgba(255,255,255,0.06); border-radius:6px; color:#888; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .agrc-carrier { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
        .agrc-logo { width:44px; height:44px; border-radius:12px; background:rgba(66,153,225,0.1); border:1.5px solid rgba(66,153,225,0.25); display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; }
        .agrc-logo img { width:100%; height:100%; object-fit:cover; }
        .agrc-logo span { font-size:20px; font-weight:800; color:#4299E1; }
        .agrc-info { flex:1; }
        .agrc-info h4 { margin:0; font-size:16px; font-weight:700; color:#F0F0F0; }
        .agrc-region { font-size:11px; color:#888; }
        .agrc-pay { text-align:right; }
        .agrc-pay-lbl { font-size:9px; color:#666; text-transform:uppercase; }
        .agrc-pay-val { font-size:16px; font-weight:800; color:#22C55E; }
        .agrc-pitch { font-size:13px; color:rgba(255,255,255,0.6); line-height:1.5; margin:0 0 12px; }
        .agrc-reqs { display:flex; flex-direction:column; gap:4px; margin-bottom:10px; }
        .agrc-req { font-size:12px; color:#ccc; display:flex; align-items:center; gap:6px; }
        .agrc-chk { color:#22C55E; font-weight:800; font-size:11px; }
        .agrc-perks { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
        .agrc-perk { font-size:10px; font-weight:600; color:#C6923A; padding:3px 8px; background:rgba(198,146,58,0.08); border-radius:6px; border:1px solid rgba(198,146,58,0.15); }
        .agrc-trust { display:flex; align-items:center; gap:12px; padding:10px 12px; background:rgba(34,197,94,0.06); border:1px solid rgba(34,197,94,0.15); border-radius:10px; margin-bottom:14px; }
        .agrc-ts { display:flex; flex-direction:column; align-items:center; }
        .agrc-tsv { font-size:20px; font-weight:900; color:#22C55E; line-height:1; }
        .agrc-tsl { font-size:8px; color:#888; text-transform:uppercase; }
        .agrc-tt { font-size:12px; color:#22C55E; font-weight:600; }
        .agrc-apply { width:100%; height:44px; background:linear-gradient(135deg,#4299E1,#2B6CB0); border:none; border-radius:10px; color:#fff; font-size:14px; font-weight:700; cursor:pointer; transition:all 0.15s; }
        .agrc-apply:hover { box-shadow:0 4px 16px rgba(66,153,225,0.3); transform:translateY(-1px); }
        .agrc-apply:active { transform:scale(0.98); }
      `}</style>
    </div>
  );
}
