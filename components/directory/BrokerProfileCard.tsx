'use client';

import React from 'react';

// ============================================================================
// HAUL COMMAND: Visual Profile Card (Broker UI)
// Renders the Enriched Data from hc_global_operators (Stars, Comments, Regs)
// ============================================================================

export interface OperatorProfile {
  id: string;
  companyName: string;
  phoneNumber: string;
  cityCounty: string;
  serviceArea: string;
  ecosystemPosition: string; // Pilot Car, Bucket Truck
  googleRating: number | null; // e.g. 4.8
  reviewCount: number | null;
  primaryTrustSource: string | null;
  topCommentSnippet: string | null;
  fmcsaVerified: boolean;
  claimStatus: string;
}

export default function BrokerProfileCard({ profile }: { profile: OperatorProfile }) {
  // Renders the 5-star visual math
  const renderStars = (rating: number | null) => {
    if (!rating) return <span style={{ color: 'var(--m-text-muted)' }}>No Rating</span>;
    const fullStars = Math.floor(rating);
    const fraction = rating - fullStars;
    const hasHalf = fraction >= 0.5;
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#FBBF24' }}>
        {[...Array(fullStars)].map((_, i) => <span key={`f-${i}`}>★</span>)}
        {hasHalf && <span>★</span>} {/* Simplified half star visualization */}
        <span style={{ fontSize: '0.85rem', color: 'var(--m-text-primary)', marginLeft: '4px', fontWeight: 700 }}>
          {rating}
        </span>
      </div>
    );
  };

  return (
    <div className="m-card m-animate-slide-up" style={{ 
      display: 'flex', flexDirection: 'column', gap: '12px',
      borderLeft: profile.fmcsaVerified ? '3px solid #10B981' : '3px solid var(--m-border-subtle)',
      padding: '16px', borderRadius: '12px', background: 'var(--m-bg)'
    }}>
      {/* Header Row: Company & Verified Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--m-text-primary)', margin: 0 }}>
            {profile.companyName}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--m-text-muted)', margin: '2px 0 0 0', fontWeight: 600 }}>
            {profile.cityCounty} • <span style={{ color: 'var(--m-gold)' }}>{profile.ecosystemPosition}</span>
          </p>
        </div>
        
        {/* Verification Pill */}
        {profile.fmcsaVerified && (
          <span style={{ 
            background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', 
            padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800
          }}>
            ✓ FMCSA VERIFIED
          </span>
        )}
      </div>

      {/* Trust Row: Stars & Trust Source */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--m-bg-muted)', padding: '8px', borderRadius: '8px' }}>
        <div style={{ flex: 1 }}>
          {renderStars(profile.googleRating)}
          <span style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)', fontWeight: 600 }}>
            {profile.reviewCount ? `${profile.reviewCount} Platform Reviews` : '0 Reviews'}
          </span>
        </div>
      </div>

      {/* Snippet Row: Proof of Concept Comment */}
      {profile.topCommentSnippet && (
        <div style={{ fontStyle: 'italic', fontSize: '0.875rem', color: 'var(--m-text-muted)', borderLeft: '2px solid var(--m-border-subtle)', paddingLeft: '8px' }}>
          "{profile.topCommentSnippet}"
        </div>
      )}

      {/* Action Row */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <a href={`tel:${profile.phoneNumber}`} 
           style={{ 
             flex: 1, textAlign: 'center', background: 'var(--m-gold)', color: '#000', 
             padding: '10px 0', borderRadius: '8px', fontWeight: 800, textDecoration: 'none'
           }}>
          CALL DISPATCH
        </a>
        <button style={{ 
            flex: 1, textAlign: 'center', background: 'transparent', color: 'var(--m-text-primary)', 
            border: '1px solid var(--m-border-subtle)', padding: '10px 0', borderRadius: '8px', fontWeight: 800 
          }}>
          VIEW CLAIM ID
        </button>
      </div>
    </div>
  );
}
