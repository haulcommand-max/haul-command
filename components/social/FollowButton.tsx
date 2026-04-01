'use client';

import React, { useState, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   FollowButton — Social layer follow/unfollow toggle
   Shows filled heart when following, outline when not
   Triggers ag-follow-beat animation on toggle
   ═══════════════════════════════════════════════════════════════════ */

interface FollowButtonProps {
  operatorId: string;
  compact?: boolean;
  className?: string;
}

export function FollowButton({ operatorId, compact = false, className = '' }: FollowButtonProps) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [beat, setBeat] = useState(false);

  // Check initial follow status
  useEffect(() => {
    fetch(`/api/social/follow?following_id=${operatorId}`)
      .then(r => r.json())
      .then(d => setFollowing(d.following))
      .catch(() => {});
  }, [operatorId]);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: operatorId }),
      });
      const data = await res.json();
      if (data.error) {
        // Not logged in — redirect
        window.location.href = '/login';
        return;
      }
      setFollowing(data.following);
      if (data.following) {
        setBeat(true);
        setTimeout(() => setBeat(false), 1200);
      }
    } catch {
      window.location.href = '/login';
    }
    setLoading(false);
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={`ag-press ${beat ? 'ag-follow-beat' : ''} ${className}`}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: following ? '#f87171' : '#8fa3b8',
          fontSize: 18, padding: '4px',
          transition: 'color 0.2s ease',
        }}
        aria-label={following ? 'Unfollow' : 'Follow'}
        title={following ? 'Unfollow' : 'Follow'}
      >
        {following ? '♥' : '♡'}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`ag-press ${beat ? 'ag-follow-beat' : ''} ${className}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 10, cursor: 'pointer',
        border: `1px solid ${following ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.1)'}`,
        background: following ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.04)',
        color: following ? '#f87171' : '#8fa3b8',
        fontSize: 12, fontWeight: 700,
        transition: 'all 0.2s ease',
      }}
    >
      <span style={{ fontSize: 14 }}>{following ? '♥' : '♡'}</span>
      {following ? 'Following' : 'Follow'}
    </button>
  );
}

export default FollowButton;
