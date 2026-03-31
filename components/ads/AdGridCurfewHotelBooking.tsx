'use client';

import React, { useState, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   AdGrid Curfew Hotel Booking — "Sleep Here" Widget
   CLAUDE_UI_HANDOFF_TASKS.md §4
   45 min before sunset auto-push for partnered hotels/staging yards
   ═══════════════════════════════════════════════════════════════════ */

interface HotelOffer {
  id: string;
  name: string;
  type: 'hotel' | 'staging_yard' | 'truck_stop';
  distance_miles: number;
  price_night: number;
  rating: number;
  amenities: string[];
  accepts_crypto: boolean;
  image_url?: string;
  book_url: string;
}

interface AdGridCurfewHotelBookingProps {
  sunset_time: string; // ISO time e.g. "18:45"
  minutes_to_sunset: number;
  offers: HotelOffer[];
  location: string;
  onBook?: (offerId: string, method: 'stripe' | 'crypto') => void;
  onDismiss?: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  hotel: '🏨',
  staging_yard: '🅿️',
  truck_stop: '⛽',
};

export function AdGridCurfewHotelBooking({
  sunset_time,
  minutes_to_sunset,
  offers,
  location,
  onBook,
  onDismiss,
}: AdGridCurfewHotelBookingProps) {
  const [visible, setVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<string>(offers[0]?.id || '');
  const [payMethod, setPayMethod] = useState<'stripe' | 'crypto'>('stripe');

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  const urgency = minutes_to_sunset <= 15 ? 'critical' : minutes_to_sunset <= 30 ? 'urgent' : 'warning';

  return (
    <div className={`agch ${visible ? 'agch--visible' : ''} agch--${urgency}`}>
      {/* Sunset gradient bar */}
      <div className="agch-gradient-bar" />

      {/* Header */}
      <div className="agch-header">
        <div className="agch-sunset-icon">
          <span className="agch-sun">🌅</span>
          <div className="agch-timer">
            <span className="agch-timer-value">{minutes_to_sunset}</span>
            <span className="agch-timer-unit">min</span>
          </div>
        </div>
        <div className="agch-header-text">
          <div className="agch-alert">CURFEW APPROACHING</div>
          <div className="agch-subtitle">
            Sunset at {sunset_time} • {location}
          </div>
          <div className="agch-rule">Oversize loads cannot move after dark</div>
        </div>
        {onDismiss && (
          <button aria-label="Interactive Button" className="agch-dismiss" onClick={onDismiss}>✕</button>
        )}
      </div>

      {/* Offers */}
      <div className="agch-offers">
        {offers.map(offer => (
          <div
            key={offer.id}
            className={`agch-offer ${selectedOffer === offer.id ? 'agch-offer--selected' : ''}`}
            onClick={() => setSelectedOffer(offer.id)}
          >
            <div className="agch-offer-type">{TYPE_ICONS[offer.type] || '🏨'}</div>
            <div className="agch-offer-info">
              <div className="agch-offer-name">{offer.name}</div>
              <div className="agch-offer-meta">
                <span className="agch-offer-dist">{offer.distance_miles.toFixed(1)} mi</span>
                <span className="agch-offer-rating">{'★'.repeat(Math.round(offer.rating))} {offer.rating.toFixed(1)}</span>
              </div>
              {offer.amenities.length > 0 && (
                <div className="agch-offer-amenities">
                  {offer.amenities.slice(0, 3).map((a, i) => (
                    <span key={i} className="agch-amenity">{a}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="agch-offer-price">
              <div className="agch-price">${offer.price_night}</div>
              <div className="agch-price-unit">/night</div>
              {offer.accepts_crypto && <div className="agch-crypto-badge">₳</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Payment toggle + Book */}
      <div className="agch-footer">
        <div className="agch-pay-toggle">
          <button aria-label="Interactive Button"
            className={`agch-pay-btn ${payMethod === 'stripe' ? 'agch-pay-btn--active' : ''}`}
            onClick={() => setPayMethod('stripe')}
          >
            💳 Card
          </button>
          <button aria-label="Interactive Button"
            className={`agch-pay-btn ${payMethod === 'crypto' ? 'agch-pay-btn--active agch-pay-btn--crypto' : ''}`}
            onClick={() => setPayMethod('crypto')}
          >
            ₳ Crypto
          </button>
        </div>
        <button aria-label="Interactive Button"
          className="agch-book"
          onClick={() => onBook?.(selectedOffer, payMethod)}
          disabled={!selectedOffer}
        >
          Book Now{payMethod === 'crypto' ? ' with ADA' : ''} →
        </button>
      </div>

      <div className="agch-sponsor-label">Sponsored • AdGrid</div>

      <style jsx>{`
        .agch {
          background: linear-gradient(180deg, #0E1019 0%, #080A10 100%);
          border: 1px solid rgba(245,158,11,0.2);
          border-radius: 16px;
          overflow: hidden;
          opacity: 0;
          transform: translateY(12px);
          transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1);
        }
        .agch--visible {
          opacity: 1;
          transform: translateY(0);
        }
        .agch-gradient-bar {
          height: 3px;
          background: linear-gradient(90deg, #F59E0B, #EF4444, #7C2D12);
          animation: agch-sunset 3s ease infinite;
        }
        @keyframes agch-sunset {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .agch--critical .agch-gradient-bar {
          animation-duration: 1s;
          background: linear-gradient(90deg, #EF4444, #DC2626, #991B1B);
        }
        .agch-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
        }
        .agch-sunset-icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .agch-sun { font-size: 28px; }
        .agch-timer {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .agch-timer-value {
          font-size: 20px;
          font-weight: 900;
          color: #F59E0B;
          line-height: 1;
        }
        .agch--critical .agch-timer-value { color: #EF4444; animation: agch-blink 1s infinite; }
        @keyframes agch-blink {
          50% { opacity: 0.4; }
        }
        .agch-timer-unit { font-size: 9px; color: #888; text-transform: uppercase; }
        .agch-header-text { flex: 1; }
        .agch-alert {
          font-size: 10px;
          font-weight: 800;
          color: #F59E0B;
          letter-spacing: 0.06em;
        }
        .agch--critical .agch-alert { color: #EF4444; }
        .agch-subtitle {
          font-size: 14px;
          font-weight: 600;
          color: #F0F0F0;
          margin: 2px 0;
        }
        .agch-rule {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
        }
        .agch-dismiss {
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
        .agch-offers {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 0 16px;
          max-height: 240px;
          overflow-y: auto;
        }
        .agch-offer {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border: 1.5px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .agch-offer:hover {
          background: rgba(255,255,255,0.05);
        }
        .agch-offer--selected {
          border-color: rgba(198,146,58,0.5);
          background: rgba(198,146,58,0.06);
        }
        .agch-offer-type { font-size: 22px; flex-shrink: 0; }
        .agch-offer-info { flex: 1; min-width: 0; }
        .agch-offer-name {
          font-size: 14px;
          font-weight: 700;
          color: #F0F0F0;
        }
        .agch-offer-meta {
          display: flex;
          gap: 10px;
          font-size: 11px;
          margin-top: 2px;
        }
        .agch-offer-dist { color: #888; }
        .agch-offer-rating { color: #C6923A; }
        .agch-offer-amenities {
          display: flex;
          gap: 4px;
          margin-top: 6px;
          flex-wrap: wrap;
        }
        .agch-amenity {
          font-size: 9px;
          font-weight: 600;
          color: #888;
          padding: 2px 6px;
          background: rgba(255,255,255,0.04);
          border-radius: 4px;
        }
        .agch-offer-price {
          flex-shrink: 0;
          text-align: right;
        }
        .agch-price {
          font-size: 18px;
          font-weight: 800;
          color: #F0F0F0;
        }
        .agch-price-unit { font-size: 10px; color: #666; }
        .agch-crypto-badge {
          display: inline-block;
          font-size: 10px;
          color: #0033AD;
          font-weight: 700;
          margin-top: 4px;
          padding: 1px 6px;
          background: rgba(0,51,173,0.1);
          border-radius: 4px;
        }
        .agch-footer {
          display: flex;
          gap: 10px;
          padding: 16px;
        }
        .agch-pay-toggle {
          display: flex;
          gap: 4px;
          background: rgba(255,255,255,0.04);
          border-radius: 8px;
          padding: 3px;
        }
        .agch-pay-btn {
          padding: 8px 12px;
          border: none;
          background: none;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #888;
          cursor: pointer;
          transition: all 0.15s;
        }
        .agch-pay-btn--active {
          background: rgba(198,146,58,0.2);
          color: #C6923A;
        }
        .agch-pay-btn--crypto {
          background: rgba(0,51,173,0.15);
          color: #5B8DEF;
        }
        .agch-book {
          flex: 1;
          height: 44px;
          background: linear-gradient(135deg, #C6923A, #8A6428);
          border: none;
          border-radius: 10px;
          color: #000;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .agch-book:hover { box-shadow: 0 4px 16px rgba(198,146,58,0.3); }
        .agch-book:active { transform: scale(0.98); }
        .agch-book:disabled { opacity: 0.4; cursor: not-allowed; }
        .agch-sponsor-label {
          text-align: center;
          padding: 8px;
          font-size: 9px;
          color: #444;
          letter-spacing: 0.04em;
        }
      `}</style>
    </div>
  );
}
