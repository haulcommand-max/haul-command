'use client';

import React, { useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   AdGrid Classifieds Feed — Heavy Equipment Marketplace
   CLAUDE_UI_HANDOFF_TASKS.md §5
   $20 listing fee inside AdGrid for trucks/equipment for sale
   ═══════════════════════════════════════════════════════════════════ */

interface ClassifiedItem {
  id: string;
  title: string;
  price: number;
  location: string;
  images: string[];
  seller_name: string;
  seller_verified: boolean;
  posted_ago: string;
  category: 'pilot_truck' | 'height_pole' | 'beacon' | 'sign_kit' | 'other';
  condition: 'new' | 'like_new' | 'good' | 'fair';
  featured: boolean;
}

interface AdGridClassifiedsFeedProps {
  items: ClassifiedItem[];
  onItemClick?: (id: string) => void;
  onPostItem?: () => void;
  onFilter?: (category: string) => void;
}

const CATEGORIES = [
  { key: 'all', label: 'All', icon: '📦' },
  { key: 'pilot_truck', label: 'Pilot Trucks', icon: '🚗' },
  { key: 'height_pole', label: 'Height Poles', icon: '📏' },
  { key: 'beacon', label: 'Beacons & Lights', icon: '🔶' },
  { key: 'sign_kit', label: 'Sign Kits', icon: '⚠️' },
  { key: 'other', label: 'Other', icon: '🔧' },
];

const CONDITION_COLORS: Record<string, string> = {
  new: '#22C55E',
  like_new: '#3B82F6',
  good: '#F59E0B',
  fair: '#888',
};

export function AdGridClassifiedsFeed({ items, onItemClick, onPostItem, onFilter }: AdGridClassifiedsFeedProps) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = activeCategory === 'all' ? items : items.filter(i => i.category === activeCategory);

  return (
    <div className="agcf">
      {/* Header */}
      <div className="agcf-header">
        <div className="agcf-title-row">
          <h3 className="agcf-title">🛒 Equipment Market</h3>
          <span className="agcf-count">{items.length} listings</span>
        </div>
        <button aria-label="Interactive Button" className="agcf-post" onClick={onPostItem}>
          + Post Item <span className="agcf-price-badge">$20</span>
        </button>
      </div>

      {/* Category filter chips */}
      <div className="agcf-filters">
        {CATEGORIES.map(cat => (
          <button aria-label="Interactive Button"
            key={cat.key}
            className={`agcf-chip ${activeCategory === cat.key ? 'agcf-chip--active' : ''}`}
            onClick={() => { setActiveCategory(cat.key); onFilter?.(cat.key); }}
          >
            <span className="agcf-chip-icon">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="agcf-grid">
        {filtered.map(item => (
          <div
            key={item.id}
            className={`agcf-item ${item.featured ? 'agcf-item--featured' : ''}`}
            onClick={() => onItemClick?.(item.id)}
          >
            {/* Image */}
            <div className="agcf-item-img">
              {item.images[0] ? (
                <img src={item.images[0]} alt={item.title} />
              ) : (
                <div className="agcf-item-placeholder">📸</div>
              )}
              {item.featured && <span className="agcf-featured-badge">⚡ FEATURED</span>}
              <span className="agcf-condition" style={{ color: CONDITION_COLORS[item.condition] }}>
                {item.condition.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {/* Info */}
            <div className="agcf-item-info">
              <h4 className="agcf-item-title">{item.title}</h4>
              <div className="agcf-item-price">${item.price.toLocaleString()}</div>
              <div className="agcf-item-meta">
                <span className="agcf-item-location">📍 {item.location}</span>
                <span className="agcf-item-time">{item.posted_ago}</span>
              </div>
              <div className="agcf-item-seller">
                {item.seller_name}
                {item.seller_verified && <span className="agcf-item-verified"> ✓</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="agcf-empty">
          <span className="agcf-empty-icon">📦</span>
          <p>No items in this category</p>
          <button aria-label="Interactive Button" className="agcf-post-empty" onClick={onPostItem}>Be the first to list →</button>
        </div>
      )}

      <style jsx>{`
        .agcf {
          background: linear-gradient(180deg, #0E1019, #080A10);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
        }
        .agcf-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 16px 12px;
        }
        .agcf-title-row { display: flex; align-items: center; gap: 10px; }
        .agcf-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #F0F0F0;
        }
        .agcf-count {
          font-size: 11px;
          color: #888;
          padding: 2px 8px;
          background: rgba(255,255,255,0.04);
          border-radius: 20px;
        }
        .agcf-post {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: linear-gradient(135deg, #C6923A, #8A6428);
          border: none;
          border-radius: 10px;
          color: #000;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .agcf-post:hover { box-shadow: 0 4px 16px rgba(198,146,58,0.3); }
        .agcf-price-badge {
          padding: 1px 6px;
          background: rgba(0,0,0,0.2);
          border-radius: 4px;
          font-size: 10px;
        }
        .agcf-filters {
          display: flex;
          gap: 6px;
          padding: 0 16px 12px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .agcf-filters::-webkit-scrollbar { display: none; }
        .agcf-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #888;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .agcf-chip--active {
          background: rgba(198,146,58,0.12);
          border-color: rgba(198,146,58,0.4);
          color: #C6923A;
        }
        .agcf-chip-icon { font-size: 13px; }
        .agcf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
          padding: 0 16px 16px;
        }
        @media (max-width: 480px) {
          .agcf-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
        }
        .agcf-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.15s;
        }
        .agcf-item:hover {
          border-color: rgba(255,255,255,0.15);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        .agcf-item--featured {
          border-color: rgba(198,146,58,0.3);
          box-shadow: 0 0 16px rgba(198,146,58,0.08);
        }
        .agcf-item-img {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          background: rgba(255,255,255,0.02);
          overflow: hidden;
        }
        .agcf-item-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .agcf-item-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: #333;
        }
        .agcf-featured-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 3px 8px;
          background: linear-gradient(135deg, #C6923A, #8A6428);
          border-radius: 6px;
          font-size: 9px;
          font-weight: 700;
          color: #000;
        }
        .agcf-condition {
          position: absolute;
          bottom: 6px;
          right: 6px;
          padding: 2px 6px;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          border-radius: 4px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .agcf-item-info { padding: 10px; }
        .agcf-item-title {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: #F0F0F0;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .agcf-item-price {
          font-size: 16px;
          font-weight: 800;
          color: #C6923A;
          margin: 4px 0;
        }
        .agcf-item-meta {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #666;
        }
        .agcf-item-seller {
          font-size: 10px;
          color: #888;
          margin-top: 4px;
        }
        .agcf-item-verified { color: #22C55E; font-weight: 700; }
        .agcf-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          text-align: center;
        }
        .agcf-empty-icon { font-size: 36px; margin-bottom: 12px; }
        .agcf-empty p { color: #888; font-size: 13px; margin: 0 0 12px; }
        .agcf-post-empty {
          padding: 8px 16px;
          background: rgba(198,146,58,0.1);
          border: 1px solid rgba(198,146,58,0.3);
          border-radius: 8px;
          color: #C6923A;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
