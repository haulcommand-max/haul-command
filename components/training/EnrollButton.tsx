"use client";

import { useState } from 'react';

export function EnrollButton({ 
  tierKey, 
  cta, 
  color, 
  glow, 
  isHighlight 
}: { 
  tierKey: string, 
  cta: string, 
  color: string, 
  glow: string, 
  isHighlight?: boolean 
}) {
  const [enrolling, setEnrolling] = useState<boolean>(false);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await fetch('/api/training/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certification_tier: tierKey }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.enrolled || data.already_enrolled) {
        window.location.href = '/training/platform-fundamentals';
      } else if (res.status === 401) {
        window.location.href = '/login?return=/training';
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <button aria-label="Enroll Button"
      onClick={handleEnroll}
      disabled={enrolling}
      style={{
        width: '100%',
        background: isHighlight
          ? 'linear-gradient(135deg, #F5A623, #e08820)'
          : `rgba(${tierKey === 'elite' ? '229,228,226' : '168,168,168'},0.1)`,
        color: isHighlight ? '#000' : color,
        border: `1px solid ${color}40`,
        borderRadius: 10,
        padding: '13px 20px',
        fontSize: 15, fontWeight: 800,
        cursor: enrolling ? 'wait' : 'pointer',
        letterSpacing: '0.02em',
        transition: 'all 0.2s',
        opacity: enrolling ? 0.7 : 1,
      }}
      onMouseEnter={e => {
        if (!enrolling) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = `0 6px 20px ${glow}`;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {enrolling ? 'Processing...' : cta}
    </button>
  );
}
