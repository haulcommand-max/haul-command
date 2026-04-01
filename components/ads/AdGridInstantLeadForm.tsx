'use client';

import React, { useState, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   AdGrid Instant Lead Form — One-Click Data Share
   CLAUDE_UI_HANDOFF_TASKS.md §6: Lead Generation Checkboxes
   Operator clicks "Request Quote" → instantly sends info to advertiser
   ═══════════════════════════════════════════════════════════════════ */

interface AdGridInstantLeadFormProps {
  adId: string;
  advertiserName: string;
  serviceName: string;
  operatorData?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    state?: string;
  };
  onSubmit?: (adId: string, sharedFields: string[]) => void;
  onCancel?: () => void;
  variant?: 'modal' | 'inline';
}

const SHARE_FIELDS = [
  { key: 'name', label: 'Name', icon: '👤', default: true },
  { key: 'email', label: 'Email', icon: '📧', default: true },
  { key: 'phone', label: 'Phone', icon: '📱', default: true },
  { key: 'company', label: 'Company', icon: '🏢', default: false },
  { key: 'state', label: 'Service Area', icon: '📍', default: false },
];

export function AdGridInstantLeadForm({
  adId,
  advertiserName,
  serviceName,
  operatorData,
  onSubmit,
  onCancel,
  variant = 'inline',
}: AdGridInstantLeadFormProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(SHARE_FIELDS.map(f => [f.key, f.default]))
  );
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleField = useCallback((key: string) => {
    setSelected(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSubmit = async () => {
    const sharedFields = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);

    if (sharedFields.length === 0) return;

    setLoading(true);
    try {
      await fetch('/api/ads/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_id: adId, shared_fields: sharedFields }),
      });
      setSubmitted(true);
      onSubmit?.(adId, sharedFields);
    } catch {
      // swallow
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="agilf agilf--success">
        <div className="agilf-success-icon">✓</div>
        <h4>Quote Requested!</h4>
        <p>{advertiserName} will contact you shortly.</p>
        <style jsx>{`
          .agilf--success {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 24px;
            text-align: center;
            background: rgba(34,197,94,0.06);
            border: 1px solid rgba(34,197,94,0.2);
            border-radius: 14px;
          }
          .agilf-success-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #22C55E, #16A34A);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 18px;
            font-weight: 800;
            margin-bottom: 8px;
          }
          .agilf--success h4 {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            color: #22C55E;
          }
          .agilf--success p {
            margin: 4px 0 0;
            font-size: 12px;
            color: #888;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`agilf agilf--${variant}`}>
      <div className="agilf-header">
        <span className="agilf-shield">⚡</span>
        <div>
          <div className="agilf-title">Request Quote</div>
          <div className="agilf-sub">from {advertiserName} • {serviceName}</div>
        </div>
      </div>

      <div className="agilf-description">
        Select what to share — one tap sends your info instantly.
      </div>

      <div className="agilf-fields">
        {SHARE_FIELDS.map(field => {
          const value = operatorData?.[field.key as keyof typeof operatorData];
          return (
            <label key={field.key} className={`agilf-field ${selected[field.key] ? 'agilf-field--active' : ''}`}>
              <div className="agilf-checkbox">
                {selected[field.key] && <span className="agilf-check">✓</span>}
              </div>
              <input
                type="checkbox"
                checked={selected[field.key]}
                onChange={() => toggleField(field.key)}
                className="agilf-hidden"
              />
              <span className="agilf-field-icon">{field.icon}</span>
              <div className="agilf-field-info">
                <span className="agilf-field-label">{field.label}</span>
                {value && <span className="agilf-field-value">{value}</span>}
              </div>
            </label>
          );
        })}
      </div>

      <div className="agilf-actions">
        <button className="agilf-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <span className="agilf-spinner" />
          ) : (
            <>📩 Send My Info</>
          )}
        </button>
        {onCancel && (
          <button className="agilf-cancel" onClick={onCancel}>No thanks</button>
        )}
      </div>

      <div className="agilf-privacy">
        🔒 Your data is shared only with {advertiserName}. Never sold.
      </div>

      <style jsx>{`
        .agilf {
          background: linear-gradient(180deg, #0E1019, #0A0C12);
          border: 1px solid rgba(198,146,58,0.2);
          border-radius: 14px;
          padding: 16px;
          color: #F0F0F0;
        }
        .agilf-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .agilf-shield {
          font-size: 20px;
          width: 36px;
          height: 36px;
          background: rgba(198,146,58,0.10);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .agilf-title {
          font-size: 15px;
          font-weight: 700;
        }
        .agilf-sub {
          font-size: 11px;
          color: #888;
        }
        .agilf-description {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 12px;
        }
        .agilf-fields {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }
        .agilf-field {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.03);
          border: 1.5px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .agilf-field:hover {
          background: rgba(255,255,255,0.05);
        }
        .agilf-field--active {
          border-color: rgba(198,146,58,0.4);
          background: rgba(198,146,58,0.06);
        }
        .agilf-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.15);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .agilf-field--active .agilf-checkbox {
          background: #C6923A;
          border-color: #C6923A;
        }
        .agilf-check {
          color: #000;
          font-size: 11px;
          font-weight: 800;
        }
        .agilf-hidden {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }
        .agilf-field-icon { font-size: 16px; }
        .agilf-field-info {
          display: flex;
          flex-direction: column;
        }
        .agilf-field-label {
          font-size: 13px;
          font-weight: 600;
        }
        .agilf-field-value {
          font-size: 11px;
          color: #888;
        }
        .agilf-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .agilf-submit {
          width: 100%;
          height: 44px;
          background: linear-gradient(135deg, #C6923A, #8A6428);
          border: none;
          border-radius: 10px;
          color: #000;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .agilf-submit:hover { box-shadow: 0 4px 16px rgba(198,146,58,0.3); }
        .agilf-submit:disabled { opacity: 0.5; }
        .agilf-cancel {
          width: 100%;
          height: 36px;
          background: none;
          border: none;
          color: #666;
          font-size: 12px;
          cursor: pointer;
        }
        .agilf-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #000;
          border-radius: 50%;
          animation: agilf-spin 0.6s linear infinite;
        }
        @keyframes agilf-spin { to { transform: rotate(360deg); } }
        .agilf-privacy {
          text-align: center;
          font-size: 10px;
          color: #444;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}
