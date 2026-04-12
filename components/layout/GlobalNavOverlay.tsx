'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function GlobalNavOverlay() {
  const pathname = usePathname();
  
  // Don't show on the very root homepage
  if (pathname === '/') return null;

  return (
    <div style={{
      position: 'fixed',
      top: 24,
      left: 24,
      zIndex: 99999,
    }}>
      <Link href="/" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 16px',
        background: 'rgba(10, 10, 14, 0.85)',
        border: '1px solid rgba(245, 166, 35, 0.3)',
        borderRadius: '50px',
        color: '#F5A623',
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: '0.05em',
        textDecoration: 'none',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(245, 166, 35, 0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 166, 35, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(10, 10, 14, 0.85)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
      }}
      >
        <span style={{ marginRight: 8 }}>←</span> HAUL COMMAND
      </Link>
    </div>
  );
}
